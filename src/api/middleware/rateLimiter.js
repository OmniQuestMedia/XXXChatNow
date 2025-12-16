/**
 * Rate limiting middleware for API endpoints
 * Prevents abuse and ensures fair usage
 */

const rateLimit = require('express-rate-limit');

// Rate limiter for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for deletion operations
const deletionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 deletion requests per hour
  message: {
    error: 'Too many deletion requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  deletionLimiter,
};
