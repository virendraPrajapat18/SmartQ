const Ticket = require('../models/Ticket');
const Counter = require('../models/Counter');
const Service = require('../models/Service');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const asyncHandler = require('../utils/asyncHandler');
const { emitQueueUpdate, emitCounterStatusChanged, createAndEmitNotification } = require('../utils/socketUtils');
const { TICKET_STATUS, USER_ROLES } = require('../utils/constants');

/**
 * ============================================================================
 * ADMIN CONTROLLER
 * ============================================================================
 * Handles administrative and staff actions, such as counter operations
 * (calling tickets, serving, holding, completing), managing users, 
 * services, and generating analytical reports.
 */

// @desc    Call next ticket for a counter
// @route   PUT /api/admin/counter/:id/call-next
// @access  Private/Admin
// @logic   Finds the oldest waiting ticket for the services assigned to this counter.
exports.callNext = asyncHandler(async (req, res) => {
    const counter = await Counter.findById(req.params.id).populate('servicesHandled');
    if (!counter) {
        return res.status(404).json({ message: 'Counter not found' });
    }

    // -------------------------------------------------------------------------
    // GUARD: Reject if this counter already has an active (calling/serving) ticket.
    // This is the primary backend enforcement that prevents duplicate active tickets,
    // even when Admin and Super Admin click Call Next at nearly the same time.
    // -------------------------------------------------------------------------
    if (counter.currentTicket) {
        const activeTicket = await Ticket.findById(counter.currentTicket);
        if (activeTicket && [TICKET_STATUS.CALLING, TICKET_STATUS.SERVING].includes(activeTicket.status)) {
            return res.status(409).json({
                message: `Counter already has an active ticket (${activeTicket.ticketNumber}). Complete or hold it first.`
            });
        }
        // currentTicket reference is stale — clear it before proceeding
        counter.currentTicket = null;
    }

    let nextTicket = null;
    let queueChanged = false;

    // 1. Clean up stale/invalid tickets in the queue
    // Ensures we don't accidentally call a ticket that was cancelled or already served
    while (counter.queue && counter.queue.length > 0) {
        const ticketId = counter.queue[0];
        nextTicket = await Ticket.findById(ticketId);
        
        if (!nextTicket || nextTicket.status !== TICKET_STATUS.WAITING) {
            counter.queue.shift();
            queueChanged = true;
            nextTicket = null;
            continue;
        }
        break;
    }

    // 2. Fallback: find ANY waiting ticket for this counter's services
    // If the counter's assigned queue is empty, look for any global waiting ticket 
    // that needs a service handled by this counter.
    if (!nextTicket) {
        nextTicket = await Ticket.findOne({
            service: { $in: counter.servicesHandled },
            status: TICKET_STATUS.WAITING,
            $or: [
                { counter: counter._id },
                { counter: null }
            ]
        }).sort({ checkInTime: 1 }); // Sort by oldest first (FIFO)
    }

    if (queueChanged) {
        await counter.save();
    }

    if (!nextTicket) {
        return res.status(404).json({ message: 'No tickets in waiting for this counter' });
    }

    // 3. Update ticket status to CALLING
    // Remove the ticket from the waiting queue and set it as active on the counter
    counter.queue = counter.queue.filter(id => id.toString() !== nextTicket._id.toString());
    nextTicket.status = TICKET_STATUS.CALLING;
    nextTicket.counter = counter._id;
    await nextTicket.save();

    // 4. Trigger Real-time notifications
    const io = req.app.get('socketio');
    if (nextTicket.user) {
        await createAndEmitNotification(
            io,
            nextTicket.user,
            'Ticket Called',
            `Your ticket ${nextTicket.ticketNumber} is now being called at Counter ${counter.number}.`,
            'queue'
        );
    }

    counter.currentTicket = nextTicket._id;
    await counter.save();

    // Emit socket events
    io.emit('ticket_called', {
        ticketNumber: nextTicket.ticketNumber,
        counter: counter.number
    });
    emitQueueUpdate(io, { counterId: counter._id, serviceId: nextTicket.service });
    // Notify all dashboards that this counter is now busy
    emitCounterStatusChanged(io, counter._id, true, {
        ticketNumber: nextTicket.ticketNumber,
        status: nextTicket.status
    });

    res.json(nextTicket);
});

// @desc    Start service for the current ticket
// @route   PUT /api/admin/counter/:id/start
// @access  Private/Admin
exports.startService = asyncHandler(async (req, res) => {
    const ticketId = (req.body?.ticketId) || req.query.ticketId;
    const counter = await Counter.findById(req.params.id);
    if (!counter) {
        return res.status(404).json({ message: 'Counter not found' });
    }

    let ticket;
    if (ticketId) {
        // GUARD: Reject if counter is already busy with a DIFFERENT active ticket
        if (counter.currentTicket && counter.currentTicket.toString() !== ticketId) {
            const activeTicket = await Ticket.findById(counter.currentTicket);
            if (activeTicket && [TICKET_STATUS.CALLING, TICKET_STATUS.SERVING].includes(activeTicket.status)) {
                return res.status(409).json({
                    message: `Counter already has an active ticket (${activeTicket.ticketNumber}). Complete or hold it first.`
                });
            }
        }

        ticket = await Ticket.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        
        if (ticket.counter && ticket.counter.toString() !== counter._id.toString()) {
            await Counter.findByIdAndUpdate(ticket.counter, { $pull: { queue: ticket._id } });
        }
        
        counter.queue = counter.queue.filter(id => id.toString() !== ticket._id.toString());
        ticket.counter = counter._id;
        counter.currentTicket = ticket._id;
        await counter.save();
    } else {
        // If no specific ticketId is passed, default to the counter's current ticket
        if (!counter.currentTicket) {
            return res.status(400).json({ message: 'No active ticket on this counter' });
        }
        ticket = await Ticket.findById(counter.currentTicket);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    }

    // 3. Update the ticket status to SERVING
    // This logs the time the service actually began for analytics
    ticket.status = TICKET_STATUS.SERVING;
    ticket.startTime = Date.now();
    await ticket.save();

    const io = req.app.get('socketio');
    if (ticket.user) {
        await createAndEmitNotification(
            io,
            ticket.user,
            'Service Started',
            `Your service for ticket ${ticket.ticketNumber} has started.`,
            'queue'
        );
    }

    await ticket.populate('user service');
    emitQueueUpdate(io, { counterId: counter._id, serviceId: ticket.service?._id || ticket.service });
    res.json(ticket);
});

// @desc    Put current ticket on hold
// @route   PUT /api/admin/counter/:id/hold
// @access  Private/Admin
exports.putOnHold = asyncHandler(async (req, res) => {
    const ticketId = (req.body?.ticketId) || req.query.ticketId;
    const counter = await Counter.findById(req.params.id);
    if (!counter) {
        return res.status(404).json({ message: 'Counter not found' });
    }

    let ticket;
    if (ticketId) {
        ticket = await Ticket.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        
        if (ticket.counter && ticket.counter.toString() !== counter._id.toString()) {
            await Counter.findByIdAndUpdate(ticket.counter, { $pull: { queue: ticket._id } });
        }
        
        counter.queue = counter.queue.filter(id => id.toString() !== ticket._id.toString());
        ticket.counter = counter._id;
        
        if (counter.currentTicket && counter.currentTicket.toString() === ticket._id.toString()) {
            counter.currentTicket = null;
        }
        await counter.save();
    } else {
        if (!counter.currentTicket) {
            return res.status(400).json({ message: 'No active ticket on this counter' });
        }
        ticket = await Ticket.findById(counter.currentTicket);
        if (!ticket) {
            counter.currentTicket = null;
            await counter.save();
            return res.status(404).json({ message: 'Active ticket not found' });
        }
        counter.currentTicket = null;
        await counter.save();
    }

    ticket.status = TICKET_STATUS.ON_HOLD;
    await ticket.save();

    const io = req.app.get('socketio');
    if (ticket.user) {
        await createAndEmitNotification(
            io,
            ticket.user,
            'Ticket On Hold',
            `Your ticket ${ticket.ticketNumber} has been put on hold. Please contact the counter.`,
            'queue'
        );
    }

    await ticket.populate('user service');
    emitQueueUpdate(io, { counterId: counter._id, serviceId: ticket.service?._id || ticket.service });
    // Notify all dashboards that this counter is now idle
    emitCounterStatusChanged(io, counter._id, false);
    res.json(ticket);
});

// @desc    Complete current ticket
// @route   PUT /api/admin/counter/:id/complete
// @access  Private/Admin
exports.completeService = asyncHandler(async (req, res) => {
    const counter = await Counter.findById(req.params.id);
    if (!counter || !counter.currentTicket) {
        return res.status(400).json({ message: 'No active ticket on this counter' });
    }

    const ticket = await Ticket.findById(counter.currentTicket);
    if (!ticket) {
        counter.currentTicket = null;
        await counter.save();
        return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = TICKET_STATUS.COMPLETED;
    ticket.endTime = Date.now();
    await ticket.save();

    const io = req.app.get('socketio');
    if (ticket.user) {
        await createAndEmitNotification(
            io,
            ticket.user,
            'Service Completed',
            `Your service for ticket ${ticket.ticketNumber} is complete. Thank you!`,
            'queue'
        );
    }

    counter.currentTicket = null;
    counter.queue = counter.queue.filter(id => id.toString() !== ticket._id.toString());
    await counter.save();

    emitQueueUpdate(io, { counterId: counter._id, serviceId: ticket.service });
    // Notify all dashboards that this counter is now idle
    emitCounterStatusChanged(io, counter._id, false);
    res.json({ message: 'Service completed' });
});

// @desc    Cancel a ticket
// @route   PUT /api/admin/counter/:id/cancel
// @access  Private/Admin
exports.cancelTicket = asyncHandler(async (req, res) => {
    const { ticketId } = req.body;
    const counter = await Counter.findById(req.params.id);
    if (!counter) {
        return res.status(404).json({ message: 'Counter not found' });
    }

    let ticket;
    if (ticketId) {
        ticket = await Ticket.findById(ticketId);
    } else {
        if (!counter.currentTicket) {
            return res.status(400).json({ message: 'No active ticket to cancel' });
        }
        ticket = await Ticket.findById(counter.currentTicket);
    }

    if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = TICKET_STATUS.CANCELLED;
    ticket.endTime = Date.now();
    await ticket.save();

    const wasActiveTicket = counter.currentTicket &&
        counter.currentTicket.toString() === ticket._id.toString();

    if (wasActiveTicket) {
        counter.currentTicket = null;
    }

    counter.queue = counter.queue.filter(id => id.toString() !== ticket._id.toString());
    await counter.save();

    const io = req.app.get('socketio');
    emitQueueUpdate(io, { counterId: counter._id, serviceId: ticket.service });
    // If the cancelled ticket was the active one, counter is now idle
    if (wasActiveTicket) {
        emitCounterStatusChanged(io, counter._id, false);
    }
    res.json({ message: 'Ticket cancelled', ticket });
});

// @desc    Get tickets for today for a counter's services
// @route   GET /api/admin/counter/:id/queue
// @access  Private/Admin
exports.getCounterQueue = asyncHandler(async (req, res) => {
    const counter = await Counter.findById(req.params.id).lean();
    if (!counter) {
        return res.status(404).json({ message: 'Counter not found' });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const tickets = await Ticket.find({
        counter: counter._id,
        checkInTime: { $gte: startOfDay }
    }).populate('user service').sort({ checkInTime: -1, _id: -1 }).lean();

    res.json(tickets);
});

// @desc    Get ticket details by ID (for scanning)
// @route   GET /api/admin/ticket/:ticketId
// @access  Private/Admin
exports.getTicketDetails = asyncHandler(async (req, res) => {
    const ticket = await Ticket.findById(req.params.ticketId).populate('user service').lean();
    if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
    }
    res.json(ticket);
});

// @desc    Get Analytics Dashboard stats
// @route   GET /api/admin/analytics
// @access  Private/Admin
exports.getAnalytics = asyncHandler(async (req, res) => {
    const { counterId } = req.query;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const matchQuery = { checkInTime: { $gte: startOfDay } };
    if (counterId) {
        matchQuery.counter = counterId;
    }

    // Optimization: Run core stats in a single aggregation
    const stats = await Ticket.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: null,
                totalTickets: { $sum: 1 },
                completedCount: {
                    $sum: { $cond: [{ $eq: ["$status", TICKET_STATUS.COMPLETED] }, 1, 0] }
                },
                activeCount: {
                    $sum: {
                        $cond: [
                            { $in: ["$status", [TICKET_STATUS.WAITING, TICKET_STATUS.CALLING, TICKET_STATUS.SERVING]] },
                            1,
                            0
                        ]
                    }
                },
                totalWaitTime: {
                    $sum: {
                        $cond: [
                            { $and: ["$startTime", "$checkInTime", { $eq: ["$status", TICKET_STATUS.COMPLETED] }] },
                            { $divide: [{ $subtract: ["$startTime", "$checkInTime"] }, 60000] },
                            0
                        ]
                    }
                }
            }
        }
    ]);

    const baseStats = stats[0] || { totalTickets: 0, completedCount: 0, activeCount: 0, totalWaitTime: 0 };
    const avgWaitTime = baseStats.completedCount > 0 ? (baseStats.totalWaitTime / baseStats.completedCount).toFixed(1) : 0;

    // Hourly Traffic (Aggregation)
    const hourlyTrafficData = await Ticket.aggregate([
        { $match: matchQuery },
        {
            $project: {
                hour: { $hour: "$checkInTime" }
            }
        },
        {
            $group: {
                _id: { $subtract: ["$hour", { $mod: ["$hour", 2] }] },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    const hourlyTraffic = Array(12).fill(0);
    const hourlyLabels = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
        const time = new Date(now.getTime() - (i * 2 * 60 * 60 * 1000));
        let h = time.getHours();
        h = h - (h % 2);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        hourlyLabels.push(`${displayH}${ampm}`);
        
        const hourData = hourlyTrafficData.find(d => d._id === h);
        hourlyTraffic[11 - i] = hourData ? hourData.count : 0;
    }

    // Service Distribution
    const services = await Service.find().select('name').lean();
    const serviceIds = services.map(s => s._id);

    const distributionToday = await Ticket.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$service", count: { $sum: 1 } } }
    ]);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyMatch = { checkInTime: { $gte: oneWeekAgo } };
    if (counterId) weeklyMatch.counter = counterId;

    const distributionWeekly = await Ticket.aggregate([
        { $match: weeklyMatch },
        { $group: { _id: "$service", count: { $sum: 1 } } }
    ]);

    const serviceLabels = services.map(s => s.name);
    const serviceDistributionToday = services.map(s => {
        const d = distributionToday.find(dt => dt._id.toString() === s._id.toString());
        return d ? d.count : 0;
    });
    const serviceDistributionWeekly = services.map(s => {
        const d = distributionWeekly.find(dt => dt._id.toString() === s._id.toString());
        return d ? d.count : 0;
    });

    // Recent Activity
    const recentTickets = await Ticket.find(matchQuery)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('service', 'name prefix')
        .populate('counter', 'number')
        .lean();

    // Satisfaction
    const feedbackStats = await Feedback.aggregate([
        { $match: { createdAt: { $gte: startOfDay } } },
        { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);

    let averageSatisfaction = feedbackStats[0] ? feedbackStats[0].avgRating.toFixed(1) : 0;
    if (averageSatisfaction === 0) {
        const allFeedbackStats = await Feedback.aggregate([
            { $group: { _id: null, avgRating: { $avg: "$rating" } } }
        ]);
        averageSatisfaction = allFeedbackStats[0] ? allFeedbackStats[0].avgRating.toFixed(1) : 0;
    }

    res.json({
        totalTickets: baseStats.totalTickets,
        completedTickets: baseStats.completedCount,
        avgWaitTime,
        averageWaitTime: avgWaitTime,
        activeTickets: baseStats.activeCount,
        activeQueues: baseStats.activeCount,
        completedServices: baseStats.completedCount,
        hourlyTraffic,
        hourlyLabels,
        serviceDistributionToday,
        serviceDistributionWeekly,
        serviceLabels,
        recentTickets,
        averageSatisfaction
    });
});

// @desc    Get all counters
// @route   GET /api/admin/counters
// @access  Private/Admin
exports.getCounters = asyncHandler(async (req, res) => {
    const counters = await Counter.find().populate('servicesHandled').lean();
    res.json(counters);
});

// @desc    Toggle counter active status
// @route   PUT /api/admin/counter/:id/toggle-status
// @access  Private/Admin
exports.toggleCounterStatus = asyncHandler(async (req, res) => {
    const counter = await Counter.findById(req.params.id);
    if (!counter) {
        return res.status(404).json({ message: 'Counter not found' });
    }
    
    counter.isActive = !counter.isActive;
    await counter.save();
    
    const io = req.app.get('socketio');
    emitQueueUpdate(io);
    
    res.json(counter);
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/SuperAdmin
exports.getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
    res.json(users);
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/SuperAdmin
exports.updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!Object.values(USER_ROLES).includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'Role updated', user: { _id: user._id, name: user.name, role: user.role } });
});

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/SuperAdmin
exports.deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
});

// @desc    Get all services
// @route   GET /api/admin/services
// @access  Private/SuperAdmin
exports.getAllServices = asyncHandler(async (req, res) => {
    const services = await Service.find().sort({ name: 1 }).lean();
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const servicesWithStats = await Promise.all(services.map(async (s) => {
        const [todayTickets, waitingCount, countersCount] = await Promise.all([
            Ticket.countDocuments({ service: s._id, checkInTime: { $gte: startOfDay } }),
            Ticket.countDocuments({ service: s._id, status: TICKET_STATUS.WAITING }),
            Counter.countDocuments({ servicesHandled: s._id })
        ]);
        
        return {
            ...s,
            todayTickets,
            waitingCount,
            countersCount
        };
    }));
    
    res.json(servicesWithStats);
});

// @desc    Create a service
// @route   POST /api/admin/services
// @access  Private/SuperAdmin
exports.createService = asyncHandler(async (req, res) => {
    const { name, description, averageServiceTime, prefix, serviceHours } = req.body;
    
    const existing = await Service.findOne({ $or: [{ name }, { prefix }] }).lean();
    if (existing) {
        return res.status(400).json({ message: 'Service name or prefix already exists' });
    }

    const newServiceData = { name, description, averageServiceTime, prefix };
    if (serviceHours) {
        newServiceData.serviceHours = serviceHours;
    }

    const service = await Service.create(newServiceData);
    res.status(201).json(service);
});

// @desc    Update a service
// @route   PUT /api/admin/services/:id
// @access  Private/SuperAdmin
exports.updateService = asyncHandler(async (req, res) => {
    const { name, description, averageServiceTime, prefix, isActive, serviceHours } = req.body;
    const service = await Service.findById(req.params.id);
    if (!service) {
        return res.status(404).json({ message: 'Service not found' });
    }

    if (name) service.name = name;
    if (description !== undefined) service.description = description;
    if (averageServiceTime) service.averageServiceTime = averageServiceTime;
    if (prefix) service.prefix = prefix;
    if (isActive !== undefined) service.isActive = isActive;
    if (serviceHours) {
        service.serviceHours = {
            monFri: serviceHours.monFri !== undefined ? serviceHours.monFri : (service.serviceHours?.monFri || '8:30 AM - 4:30 PM'),
            sat: serviceHours.sat !== undefined ? serviceHours.sat : (service.serviceHours?.sat || '9:00 AM - 1:00 PM'),
            sun: serviceHours.sun !== undefined ? serviceHours.sun : (service.serviceHours?.sun || 'Closed')
        };
    }

    await service.save();
    res.json(service);
});

// @desc    Delete a service
// @route   DELETE /api/admin/services/:id
// @access  Private/SuperAdmin
exports.deleteService = asyncHandler(async (req, res) => {
    const service = await Service.findById(req.params.id);
    if (!service) {
        return res.status(404).json({ message: 'Service not found' });
    }

    await Counter.updateMany(
        { servicesHandled: service._id },
        { $pull: { servicesHandled: service._id } }
    );

    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted successfully' });
});

// @desc    Get all feedbacks
// @route   GET /api/admin/feedbacks
// @access  Private/Admin
exports.getAllFeedbacks = asyncHandler(async (req, res) => {
    const feedbacks = await Feedback.find().populate('user', 'name email').sort({ createdAt: -1 }).lean();
    res.json(feedbacks);
});

// @desc    Submit feedback
// @route   POST /api/admin/feedback
// @access  Private
exports.submitFeedback = asyncHandler(async (req, res) => {
    const { rating, comments, ticketId } = req.body;
    const feedback = await Feedback.create({
        user: req.user._id,
        rating,
        comments,
        ticket: ticketId || null
    });
    res.status(201).json(feedback);
});

// @desc    Reply to feedback
// @route   PUT /api/admin/feedback/:id/reply
// @access  Private/Admin
exports.replyToFeedback = asyncHandler(async (req, res) => {
    const { reply } = req.body;
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
        return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.reply = reply;
    await feedback.save();

    const io = req.app.get('socketio');
    await createAndEmitNotification(
        io,
        feedback.user,
        'Feedback Reply',
        `Admin has replied to your feedback: "${reply}"`,
        'feedback'
    );

    res.json(feedback);
});

// @desc    Create a counter
// @route   POST /api/admin/counters
// @access  Private/SuperAdmin
exports.createCounter = asyncHandler(async (req, res) => {
    const { number, servicesHandled } = req.body;
    
    const existing = await Counter.findOne({ number }).lean();
    if (existing) {
        return res.status(400).json({ message: `Counter number ${number} already exists` });
    }

    const counter = await Counter.create({ 
        number, 
        servicesHandled: servicesHandled || [],
        isActive: false 
    });
    
    await counter.populate('servicesHandled');
    res.status(201).json(counter);
});

// @desc    Update a counter
// @route   PUT /api/admin/counters/:id
// @access  Private/SuperAdmin
exports.updateCounter = asyncHandler(async (req, res) => {
    const { number, servicesHandled, isActive } = req.body;
    const counter = await Counter.findById(req.params.id);
    if (!counter) {
        return res.status(404).json({ message: 'Counter not found' });
    }

    if (number) counter.number = number;
    if (servicesHandled) counter.servicesHandled = servicesHandled;
    if (isActive !== undefined) counter.isActive = isActive;

    await counter.save();
    await counter.populate('servicesHandled');
    res.json(counter);
});

// @desc    Delete a counter
// @route   DELETE /api/admin/counters/:id
// @access  Private/SuperAdmin
exports.deleteCounter = asyncHandler(async (req, res) => {
    const counter = await Counter.findById(req.params.id).lean();
    if (!counter) {
        return res.status(404).json({ message: 'Counter not found' });
    }

    await Counter.findByIdAndDelete(req.params.id);
    res.json({ message: 'Counter removed successfully' });
});

// @desc    Get count of unreplied feedbacks
// @route   GET /api/admin/feedbacks/unread-count
// @access  Private/Admin
exports.getUnrepliedFeedbackCount = asyncHandler(async (req, res) => {
    const count = await Feedback.countDocuments({ readByAdmin: { $ne: true } });
    res.json({ count });
});

// @desc    Mark all feedbacks as read by admin
// @route   PUT /api/admin/feedbacks/mark-read
// @access  Private/Admin
exports.markAllFeedbacksRead = asyncHandler(async (req, res) => {
    await Feedback.updateMany({ readByAdmin: { $ne: true } }, { readByAdmin: true });
    res.json({ message: 'All feedbacks marked as read' });
});

// @desc    Clear all feedbacks
// @route   DELETE /api/admin/feedbacks
// @access  Private/SuperAdmin
exports.clearAllFeedbacks = asyncHandler(async (req, res) => {
    await Feedback.deleteMany({});
    res.json({ message: 'All feedbacks cleared' });
});
