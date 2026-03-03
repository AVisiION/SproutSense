import { HTTP_STATUS } from '../config/constants.js';

// Success response helper
export const successResponse = (res, data, message = 'Success', statusCode = HTTP_STATUS.OK) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

// Error response helper
export const errorResponse = (res, message = 'Error', statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};

// Pagination helper
export const paginate = (query, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

// Calculate pagination metadata
export const getPaginationMetadata = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

// Format date range for queries
export const getDateRange = (days) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return { startDate, endDate };
};

// Sanitize user input
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim();
  }
  return input;
};

// Calculate percentage change
export const calculatePercentageChange = (current, previous) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Round to decimal places
export const roundTo = (number, decimals = 2) => {
  return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export default {
  successResponse,
  errorResponse,
  paginate,
  getPaginationMetadata,
  getDateRange,
  sanitizeInput,
  calculatePercentageChange,
  roundTo
};
