/**
 * ============================================================================
 * SOCKET.IO UTILITIES
 * ============================================================================
 * Helper functions to handle real-time WebSocket communication.
 * These functions are called by various controllers (e.g., adminController, 
 * queueController) to broadcast changes instantly to connected clients.
 */

const Notification = require('../models/Notification');

/**
 * Emit queue update events to specific rooms and globally
 * @param {Object} io - Socket.io instance
 * @param {Object} data - Object containing counterId or serviceId
 */
const emitQueueUpdate = (io, { counterId, serviceId } = {}) => {
    if (!io) return;

    if (counterId) {
        io.to(`counter_${counterId}`).emit('queue_updated', { counterId });
    }

    if (serviceId) {
        io.to(serviceId.toString()).emit('queue_updated', { serviceId });
    }

    // Broadcast globally for admin panels
    io.emit('queue_updated');
};

/**
 * Broadcast counter busy/idle state change to ALL connected clients.
 * Used so that when Admin calls a ticket on Counter X, Super Admin's tab
 * instantly knows Counter X is busy (and vice-versa).
 *
 * @param {Object} io         - Socket.io instance
 * @param {string} counterId  - Counter _id (ObjectId string)
 * @param {boolean} isBusy    - true = counter has an active ticket, false = idle
 * @param {Object} [ticketInfo] - Optional: { ticketNumber, status } for the active ticket
 */
const emitCounterStatusChanged = (io, counterId, isBusy, ticketInfo = null) => {
    if (!io) return;
    io.emit('counter_status_changed', { counterId: counterId.toString(), isBusy, ticketInfo });
};

/**
 * Create a notification in DB and emit via socket
 * @param {Object} io - Socket.io instance
 * @param {string} userId - User ID to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 */
const createAndEmitNotification = async (io, userId, title, message, type) => {
    try {
        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type
        });

        if (io && userId) {
            io.to(`user_${userId.toString()}`).emit('new_notification', notification);
        }
        return notification;
    } catch (err) {
        console.error('Notification creation/emission error:', err);
    }
};

module.exports = {
    emitQueueUpdate,
    emitCounterStatusChanged,
    createAndEmitNotification
};
