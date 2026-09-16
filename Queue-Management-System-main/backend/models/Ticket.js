/**
 * ============================================================================
 * TICKET MODEL (Database Schema)
 * ============================================================================
 * Represents a single queue entry for a customer.
 * Tracks the status, assigned counter, wait times, and timestamps for analytics.
 */

const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    // Formatted ticket number (e.g., VR-001)
    ticketNumber: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    status: {
        type: String,
        enum: ['waiting', 'calling', 'serving', 'on-hold', 'completed', 'cancelled'],
        default: 'waiting'
    },
    counter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Counter'
    },
    estimatedWaitTime: {
        type: Number // in minutes
    },
    initialPeopleAhead: {
        type: Number,
        default: 0
    },
    checkInTime: {
        type: Date,
        default: Date.now
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    }

});

module.exports = mongoose.model('Ticket', TicketSchema);
