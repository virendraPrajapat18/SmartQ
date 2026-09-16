/**
 * ============================================================================
 * ADMIN ROUTES
 * ============================================================================
 * Defines endpoints for Administrative and Super Admin operations.
 * Protect and Authorize middleware ensure that only users with the correct 
 * roles can access these routes.
 */

const express = require('express');
const router = express.Router();
const { 
    callNext, 
    startService,
    putOnHold,
    completeService, 
    getAnalytics, 
    getCounters,
    getCounterQueue,
    getTicketDetails,
    cancelTicket,
    toggleCounterStatus,
    getAllUsers,
    updateUserRole,
    deleteUser,
    getAllServices,
    createService,
    updateService,
    deleteService,
    getAllFeedbacks,
    submitFeedback,
    replyToFeedback,
    createCounter,
    updateCounter,
    deleteCounter,
    clearAllFeedbacks,
    getUnrepliedFeedbackCount,
    markAllFeedbacksRead
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// ----------------------------------------------------------------------------
// COUNTER OPERATIONS (Admins & Super Admins)
// ----------------------------------------------------------------------------
router.get('/counters', protect, authorize('admin', 'super_admin'), getCounters);
router.get('/counter/:id/queue', protect, authorize('admin', 'super_admin'), getCounterQueue);
router.get('/ticket/:ticketId', protect, authorize('admin', 'super_admin'), getTicketDetails);

// Core queue management actions
router.put('/counter/:id/call-next', protect, authorize('admin', 'super_admin'), callNext);
router.put('/counter/:id/start', protect, authorize('admin', 'super_admin'), startService);
router.put('/counter/:id/hold', protect, authorize('admin', 'super_admin'), putOnHold);
router.put('/counter/:id/cancel', protect, authorize('admin', 'super_admin'), cancelTicket);
router.put('/counter/:id/complete', protect, authorize('admin', 'super_admin'), completeService);
router.put('/counter/:id/toggle-status', protect, authorize('admin', 'super_admin'), toggleCounterStatus);

// ----------------------------------------------------------------------------
// COUNTER MANAGEMENT (Super Admin Only)
// ----------------------------------------------------------------------------
router.post('/counters', protect, authorize('super_admin'), createCounter);
router.put('/counters/:id', protect, authorize('super_admin'), updateCounter);
router.delete('/counters/:id', protect, authorize('super_admin'), deleteCounter);

// ----------------------------------------------------------------------------
// ANALYTICS & REPORTS
// ----------------------------------------------------------------------------
router.get('/analytics', protect, authorize('admin', 'super_admin'), getAnalytics);

// ----------------------------------------------------------------------------
// USER MANAGEMENT (Super Admin Only)
// ----------------------------------------------------------------------------
router.get('/users', protect, authorize('super_admin'), getAllUsers);
router.put('/users/:id/role', protect, authorize('super_admin'), updateUserRole);
router.delete('/users/:id', protect, authorize('super_admin'), deleteUser);

// ----------------------------------------------------------------------------
// SERVICE MANAGEMENT (Super Admin Only)
// ----------------------------------------------------------------------------
router.get('/services', protect, authorize('super_admin'), getAllServices);
router.post('/services', protect, authorize('super_admin'), createService);
router.put('/services/:id', protect, authorize('super_admin'), updateService);
router.delete('/services/:id', protect, authorize('super_admin'), deleteService);

// Feedbacks
router.get('/feedbacks/unread-count', protect, authorize('admin', 'super_admin'), getUnrepliedFeedbackCount);
router.put('/feedbacks/mark-read', protect, authorize('admin', 'super_admin'), markAllFeedbacksRead);
router.get('/feedbacks', protect, authorize('admin', 'super_admin'), getAllFeedbacks);
router.post('/feedback', protect, submitFeedback);
router.put('/feedback/:id/reply', protect, authorize('admin', 'super_admin'), replyToFeedback);
router.delete('/feedbacks', protect, authorize('super_admin'), clearAllFeedbacks);

module.exports = router;
