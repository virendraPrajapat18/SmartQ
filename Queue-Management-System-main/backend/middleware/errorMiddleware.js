/**
 * ============================================================================
 * ERROR HANDLING MIDDLEWARE
 * ============================================================================
 * Centralized error handling to ensure uniform error responses across the API.
 */

/**
 * Global Error Handler
 * Catches all unhandled errors in the application. Returns a JSON response
 * instead of an HTML stack trace.
 */
const errorHandler = (err, req, res, next) => {
    // If the status code is still 200 despite an error, set it to 500 (Internal Server Error)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    // Log the error for server-side debugging
    console.error(`[Error] ${req.method} ${req.url}:`, err.stack);

    // Send the error message to the client, including the stack trace ONLY in development
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

/**
 * 404 Not Found Middleware
 * Catch-all for API routes that do not exist.
 * Triggers the global errorHandler.
 */
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error); // Pass the error to the errorHandler above
};

module.exports = { errorHandler, notFound };
