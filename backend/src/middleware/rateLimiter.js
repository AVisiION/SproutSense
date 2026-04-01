import rateLimit from 'express-rate-limit';
import config from '../config/config.js';
import { HTTP_STATUS } from '../config/constants.js';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT.WINDOW_MS,
  max: config.RATE_LIMIT.MAX_REQUESTS,
  message: {
    success: false,
    message: config.RATE_LIMIT.MESSAGE
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Too many requests from this IP, please try again later',
      retryAfter: Math.ceil(config.RATE_LIMIT.WINDOW_MS / 1000)
    });
  }
});

// Strict rate limiter for watering control (prevent spam)
export const wateringLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 watering commands per minute
  message: {
    success: false,
    message: 'Too many watering commands, please wait'
  },
  skipSuccessfulRequests: false
});

// Strict rate limiter for sensor data posting (ESP32)
export const sensorPostLimiter = rateLimit({
  windowMs: 5 * 1000, // 5 seconds
  max: 5, // Max 5 sensor readings per 5 seconds
  message: {
    success: false,
    message: 'Sensor data submission rate exceeded'
  },
  skipSuccessfulRequests: false
});

// Lenient rate limiter for read operations
export const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute for reads
  skipSuccessfulRequests: true
});

// AI recommendation rate limiter (computationally expensive)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Max 30 AI requests per minute
  message: {
    success: false,
    message: 'AI recommendation request limit exceeded'
  }
});

// Auth: registration limiter
export const authRegisterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8,
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth: login limiter
export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 12,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Auth: forgot password limiter
export const authForgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Auth: reset password limiter
export const authResetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Auth: refresh limiter
export const authRefreshLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 60,
  message: {
    success: false,
    message: 'Too many session refresh requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export default {
  apiLimiter,
  wateringLimiter,
  sensorPostLimiter,
  readLimiter,
  aiLimiter,
  authRegisterLimiter,
  authLoginLimiter,
  authForgotPasswordLimiter,
  authResetPasswordLimiter,
  authRefreshLimiter
};
