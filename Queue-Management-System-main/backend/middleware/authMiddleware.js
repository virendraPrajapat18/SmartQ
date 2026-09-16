/**
 * ============================================================================
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * ============================================================================
 * This file contains middleware functions to secure API routes.
 * It ensures that only authenticated users with valid JWTs can access certain
 * routes, and enforces Role-Based Access Control (RBAC).
 */

const jwt = require('jsonwebtoken');

/**
 * Protect Middleware
 * Ensures the user is logged in by verifying the JSON Web Token (JWT) sent
 * in the Authorization header. If valid, attaches the user object to `req.user`.
 */
const protect = async (req, res, next) => {
    let token;

    // Check if the Authorization header exists and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract token from the header (Format: "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the user from the database (excluding the password field)
            // and attach it to the request object for use in the next controller
            const User = require('../models/User');
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }
            
            // Proceed to the next middleware or controller
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // If no token was found at all
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

/**
 * Authorize Middleware
 * Enforces Role-Based Access Control (RBAC).
 * Takes a list of allowed roles and checks if the currently logged-in user 
 * (from the `protect` middleware) has permission to access the route.
 * 
 * @param {...String} roles - Array of allowed roles (e.g., 'admin', 'super_admin')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
