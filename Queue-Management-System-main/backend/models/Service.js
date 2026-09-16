/**
 * ============================================================================
 * SERVICE MODEL (Database Schema)
 * ============================================================================
 * Defines a specific service offered by the organization (e.g., Vehicle Registration).
 * Tracks the prefix for tickets (e.g., "VR") and the sequential number generation.
 */

const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String
    },
    averageServiceTime: {
        type: Number, // in minutes
        default: 15
    },
    isActive: {
        type: Boolean,
        default: true
    },
    prefix: {
        type: String,
        required: true,
        unique: true
    },
    lastTicketNumber: {
        type: Number,
        default: 0
    },
    serviceHours: {
        monFri: {
            type: String,
            default: '8:30 AM - 4:30 PM'
        },
        sat: {
            type: String,
            default: '9:00 AM - 1:00 PM'
        },
        sun: {
            type: String,
            default: 'Closed'
        }
    }
});

module.exports = mongoose.model('Service', ServiceSchema);
