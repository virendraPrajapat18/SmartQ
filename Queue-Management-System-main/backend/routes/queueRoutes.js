/**
 * ============================================================================
 * QUEUE ROUTES
 * ============================================================================
 * Defines endpoints for queue management from the customer's perspective.
 */

const express = require('express');
const router = express.Router();
const { joinQueue, getTicketStatus, cancelTicket, removeTicket, getServices, getHistory } = require('../controllers/queueController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/queue/services
// @desc    Get all available services and current queue lengths
router.get('/services', getServices);

// @route   POST /api/queue/join
// @desc    Join a queue for a specific service (Generates a ticket)
router.post('/join', protect, joinQueue);

// @route   GET /api/queue/status
// @desc    Get the current active ticket status for the logged-in user
router.get('/status', protect, getTicketStatus);

// @route   GET /api/queue/history
// @desc    Get past ticket history for the logged-in user
router.get('/history', protect, getHistory);

// @route   PUT /api/queue/cancel/:id
// @desc    Cancel a ticket (Leaves it in history as cancelled)
router.put('/cancel/:id', protect, cancelTicket);

// @route   DELETE /api/queue/remove/:id
// @desc    Completely remove a ticket from the database
router.delete('/remove/:id', protect, removeTicket);

module.exports = router;
