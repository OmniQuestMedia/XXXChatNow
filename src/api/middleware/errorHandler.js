/**
 * Global error handling middleware
 */

const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Send error response
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    path: req.path,
    timestamp: new Date().toISOString(),
    // Only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
