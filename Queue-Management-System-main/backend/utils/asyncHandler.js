/**
 * asyncHandler wrapper to avoid try-catch blocks in controllers.
 * It catches any errors and passes them to the next middleware (error handler).
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
