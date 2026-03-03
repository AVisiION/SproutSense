import config from '../config/config.js';

// Log request details (development only)
export const requestLogger = (req, res, next) => {
  if (config.NODE_ENV === 'development') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    
    if (Object.keys(req.body).length > 0) {
      console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    
    if (Object.keys(req.query).length > 0) {
      console.log('Query:', JSON.stringify(req.query, null, 2));
    }
  }
  
  next();
};

// Check if device is online (optional middleware)
export const checkDeviceOnline = async (req, res, next) => {
  try {
    // This can be implemented if you want to enforce device online status
    // For now, we'll just pass through
    next();
  } catch (error) {
    next(error);
  }
};

// Async handler wrapper to catch errors in async route handlers
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler for undefined routes
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export default {
  requestLogger,
  checkDeviceOnline,
  asyncHandler,
  notFound
};
