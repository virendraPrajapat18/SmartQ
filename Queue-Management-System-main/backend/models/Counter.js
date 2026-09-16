/**
 * ============================================================================
 * COUNTER MODEL (Database Schema)
 * ============================================================================
 * Represents a physical or virtual service desk.
 * Keeps track of which services it can handle, its current status,
 * the ticket it is currently serving, and the queue of tickets assigned to it.
 */

const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
    // The physical counter number (e.g., Counter 1)
    number: {
        type: Number,
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    currentTicket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    },
    assignedStaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    servicesHandled: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
    }],
    // Ordered list of waiting ticket IDs at this counter
    queue: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }]
});

module.exports = mongoose.model('Counter', CounterSchema);
