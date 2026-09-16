/**
 * ============================================================================
 * NOTE ON UNIQUE FIELDS:
 * - `email` is unique (can be updated, but checked for conflicts)
 * - `phone` is unique and CANNOT be changed (used as immutable identifier)
 * ============================================================================
 */

/**
 * ============================================================================
 * AUTHENTICATION CONTROLLER
 * ============================================================================
 * Handles user registration, login, and profile retrieval.
 * Uses bcrypt for password hashing (via User model) and jsonwebtoken (JWT) 
 * for secure session management.
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const { USER_ROLES } = require('../utils/constants');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
    const { name, phone, email, password, role } = req.body;

    // 1. Check if user already exists based on unique fields (email or phone)
    const userExists = await User.findOne({
        $or: [{ email }, { phone }]
    }).lean();

    if (userExists) {
        return res.status(400).json({ message: 'User already exists with this Email or Phone Number' });
    }

    // 2. Validate role if provided, otherwise default to 'customer'
    // This prevents malicious users from registering as super_admins
    const userRole = (role && Object.values(USER_ROLES).includes(role)) ? role : USER_ROLES.CUSTOMER;

    // 3. Create the new user in the database
    // The pre-save hook in the User model will automatically hash the password
    const user = await User.create({
        name,
        phone,
        email,
        password,
        role: userRole
    });

    if (user) {
        // 4. Return user data and a new JWT token for immediate login
        res.status(201).json({
            _id: user._id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });
    }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1. Find the user by their email address
    const user = await User.findOne({ email });

    // 2. Check if the user exists AND the password matches the hashed password
    if (user && (await user.matchPassword(password))) {
        // 3. Send back user data and a fresh JWT token
        res.json({
            _id: user._id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role,
            token: generateToken(user._id)
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).lean();

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            role: user.role
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// @desc    Update user profile (name, email, password)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
    const { name, email, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // --- Update Name ---
    if (name && name.trim()) {
        user.name = name.trim();
    }

    // --- Update Email (unique check) ---
    if (email && email.trim() && email !== user.email) {
        const emailExists = await User.findOne({ email: email.trim(), _id: { $ne: user._id } }).lean();
        if (emailExists) {
            return res.status(400).json({ message: 'Email is already in use by another account' });
        }
        user.email = email.trim();
    }

    // --- Update Password ---
    if (newPassword) {
        if (!currentPassword) {
            return res.status(400).json({ message: 'Please provide your current password to set a new one' });
        }
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        user.password = newPassword; // pre-save hook will hash it
    }

    const updatedUser = await user.save();

    res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        role: updatedUser.role
    });
});

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};
