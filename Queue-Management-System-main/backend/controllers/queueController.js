const Ticket = require('../models/Ticket');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const asyncHandler = require('../utils/asyncHandler');
const { emitQueueUpdate } = require('../utils/socketUtils');
const { TICKET_STATUS } = require('../utils/constants');

/**
 * ============================================================================
 * QUEUE CONTROLLER
 * ============================================================================
 * Handles all customer-facing queue logic including joining a queue, fetching
 * the current status, and calculating estimated wait times dynamically.
 */

// @desc    Get all available services and calculate how many people are currently waiting
// @route   GET /api/queue/services
// @access  Public
exports.getServices = asyncHandler(async (req, res) => {
    const services = await Service.find().lean();
    const servicesWithStats = await Promise.all(services.map(async (service) => {
        const waitingCount = await Ticket.countDocuments({
            service: service._id,
            status: TICKET_STATUS.WAITING
        });
        return {
            ...service,
            waitingCount
        };
    }));
    res.json(servicesWithStats);
});

// @desc    Join a queue (Create a ticket)
// @route   POST /api/queue/join
// @access  Private
// @logic   Prevents joining multiple queues, finds an eligible open counter,
//          picks the shortest queue, assigns ticket, and notifies clients via socket.
exports.joinQueue = asyncHandler(async (req, res) => {
    const { serviceId } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
        return res.status(404).json({ message: 'Service not found' });
    }

    // 1. Prevent joining multiple active queues
    // A user can only be waiting, calling, or serving for one ticket at a time
    const activeTicket = await Ticket.findOne({
        user: req.user._id,
        status: { $in: [TICKET_STATUS.WAITING, TICKET_STATUS.CALLING, TICKET_STATUS.SERVING] }
    }).lean();
    
    if (activeTicket) {
        return res.status(400).json({ message: 'You are already in a queue' });
    }

    // 2. Find all active (open) counters that handle the requested service
    const eligibleCounters = await Counter.find({
        isActive: true,
        servicesHandled: serviceId
    });

    if (!eligibleCounters || eligibleCounters.length === 0) {
        return res.status(400).json({
            message: 'No open counter is currently available for this service. Please try again later.'
        });
    }

    // 3. Load Balancing (Queue Assignment Logic)
    // Pick the eligible counter with the shortest queue array
    const bestCounter = eligibleCounters.reduce((best, c) =>
        c.queue.length < best.queue.length ? c : best
    , eligibleCounters[0]);

    // 4. Generate unique Ticket Number based on service prefix (e.g., "VR-001")
    service.lastTicketNumber += 1;
    await service.save();

    const ticketNumber = `${service.prefix}-${service.lastTicketNumber.toString().padStart(3, '0')}`;
    
    // 5. Calculate Estimated Wait Time
    // Wait Time = (Number of people ahead + 1) * Average Service Time
    const initialPeopleAhead = bestCounter.queue.length;
    const estimatedWaitTime = (initialPeopleAhead + 1) * service.averageServiceTime;

    // 6. Create the Ticket in the database
    const ticket = await Ticket.create({
        ticketNumber,
        user: req.user._id,
        service: serviceId,
        counter: bestCounter._id,
        estimatedWaitTime,
        initialPeopleAhead
    });

    // 7. Add ticket to the counter's assigned queue and save
    bestCounter.queue.push(ticket._id);
    await bestCounter.save();

    // Populate references for the API response
    await ticket.populate('service');
    await ticket.populate('counter');

    // 8. Real-time broadcast: notify clients that the queue has changed
    const io = req.app.get('socketio');
    emitQueueUpdate(io, { counterId: bestCounter._id, serviceId });

    res.status(201).json({
        ticket,
        peopleAhead: initialPeopleAhead,
        estimatedWait: estimatedWaitTime,
        counterNumber: bestCounter.number
    });
});

// @desc    Get current active ticket status for user
// @route   GET /api/queue/status
// @access  Private
exports.getTicketStatus = asyncHandler(async (req, res) => {
    const ticket = await Ticket.findOne({
        user: req.user._id,
        status: { $in: [TICKET_STATUS.WAITING, TICKET_STATUS.CALLING, TICKET_STATUS.SERVING] }
    }).populate('service').populate('counter');

    if (!ticket) {
        return res.status(404).json({ message: 'No active ticket found' });
    }

    // Auto-assign counter for legacy tickets that have none
    if (!ticket.counter && ticket.status === TICKET_STATUS.WAITING) {
        const eligibleCounters = await Counter.find({
            isActive: true,
            servicesHandled: ticket.service._id
        });

        if (eligibleCounters && eligibleCounters.length > 0) {
            const bestCounter = eligibleCounters.reduce((best, c) =>
                c.queue.length < best.queue.length ? c : best
            , eligibleCounters[0]);

            const alreadyInQueue = bestCounter.queue.some(
                id => id.toString() === ticket._id.toString()
            );
            if (!alreadyInQueue) {
                bestCounter.queue.push(ticket._id);
                await bestCounter.save();
            }

            ticket.counter = bestCounter._id;
            ticket.initialPeopleAhead = bestCounter.queue.length - 1;
            await ticket.save();
            await ticket.populate('counter');

            const io = req.app.get('socketio');
            emitQueueUpdate(io, { counterId: bestCounter._id });
        }
    }

    let peopleAhead = 0;
    let estimatedWait = 0;

    if (ticket.counter) {
        const counter = await Counter.findById(ticket.counter._id || ticket.counter).lean();
        if (counter) {
            const pos = counter.queue.findIndex(
                id => id.toString() === ticket._id.toString()
            );
            peopleAhead = pos >= 0 ? pos : 0;
            estimatedWait = peopleAhead * (ticket.service?.averageServiceTime || 15);
        }
    } else {
        peopleAhead = await Ticket.countDocuments({
            service: ticket.service._id,
            status: TICKET_STATUS.WAITING,
            checkInTime: { $lt: ticket.checkInTime }
        });
        estimatedWait = peopleAhead * (ticket.service?.averageServiceTime || 15);
    }

    res.json({
        ticket,
        peopleAhead,
        estimatedWait,
        counterNumber: ticket.counter?.number || null,
        currentlyServing: await getCurrentlyServing(ticket.service._id, ticket.counter?._id)
    });
});

// Helper: Get the ticket currently being served
const getCurrentlyServing = async (serviceId, counterId) => {
    if (counterId) {
        const counter = await Counter.findById(counterId).populate('currentTicket').lean();
        if (counter && counter.currentTicket) {
            return counter.currentTicket.ticketNumber;
        }
    }
    
    const servingTicket = await Ticket.findOne({
        service: serviceId,
        status: { $in: [TICKET_STATUS.CALLING, TICKET_STATUS.SERVING] }
    }).sort({ startTime: -1, updatedAt: -1 }).lean();

    return servingTicket ? servingTicket.ticketNumber : 'None';
};

// @desc    Get ticket history for current user
// @route   GET /api/queue/history
// @access  Private
exports.getHistory = asyncHandler(async (req, res) => {
    const tickets = await Ticket.find({ user: req.user._id })
        .populate('service', 'name prefix')
        .populate('counter', 'number')
        .sort({ createdAt: -1 })
        .lean();
    res.json(tickets);
});

// @desc    Cancel a ticket
// @route   PUT /api/queue/cancel/:id
// @access  Private
exports.cancelTicket = asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'User not authorized' });
    }

    ticket.status = TICKET_STATUS.CANCELLED;
    ticket.endTime = Date.now();
    await ticket.save();

    if (ticket.counter) {
        await Counter.findByIdAndUpdate(ticket.counter, {
            $pull: { queue: ticket._id }
        });
    }

    const io = req.app.get('socketio');
    emitQueueUpdate(io, { counterId: ticket.counter, serviceId: ticket.service });

    res.json({ message: 'Ticket cancelled successfully' });
});

// @desc    Remove a ticket completely from database
// @route   DELETE /api/queue/remove/:id
// @access  Private
exports.removeTicket = asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.user.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'User not authorized' });
    }

    if (ticket.counter) {
        await Counter.findByIdAndUpdate(ticket.counter, {
            $pull: { queue: ticket._id }
        });
    }

    await Ticket.findByIdAndDelete(req.params.id);

    const io = req.app.get('socketio');
    emitQueueUpdate(io, { counterId: ticket.counter, serviceId: ticket.service });

    res.json({ message: 'Ticket removed successfully' });
});
