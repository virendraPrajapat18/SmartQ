/**
 * ============================================================================
 * AUTHENTICATION ROUTES
 * ============================================================================
 * Defines endpoints for user registration, login, and fetching user profiles.
 */

const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register a new user (Customer)
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', login);

// @route   GET /api/auth/profile
// @desc    Get logged in user profile
// @access  Private (Requires valid JWT token)
router.get('/profile', protect, getProfile);

// @route   PUT /api/auth/profile
// @desc    Update logged in user's profile (name, email, password)
// @access  Private (Requires valid JWT token)
router.put('/profile', protect, updateProfile);

module.exports = router;
