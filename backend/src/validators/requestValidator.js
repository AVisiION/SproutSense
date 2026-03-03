import { body, query, param, validationResult } from 'express-validator';
import { HTTP_STATUS, VALIDATION } from '../config/constants.js';

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

// Sensor reading validation
export const validateSensorReading = [
  body('soilMoisture')
    .isFloat({ min: VALIDATION.SOIL_MOISTURE.MIN, max: VALIDATION.SOIL_MOISTURE.MAX })
    .withMessage(`Soil moisture must be between ${VALIDATION.SOIL_MOISTURE.MIN} and ${VALIDATION.SOIL_MOISTURE.MAX}`),
  
  body('temperature')
    .isFloat({ min: VALIDATION.TEMPERATURE.MIN, max: VALIDATION.TEMPERATURE.MAX })
    .withMessage(`Temperature must be between ${VALIDATION.TEMPERATURE.MIN}°C and ${VALIDATION.TEMPERATURE.MAX}°C`),
  
  body('humidity')
    .isFloat({ min: VALIDATION.HUMIDITY.MIN, max: VALIDATION.HUMIDITY.MAX })
    .withMessage(`Humidity must be between ${VALIDATION.HUMIDITY.MIN} and ${VALIDATION.HUMIDITY.MAX}`),
  
  body('light')
    .isFloat({ min: VALIDATION.LIGHT.MIN, max: VALIDATION.LIGHT.MAX })
    .withMessage(`Light must be between ${VALIDATION.LIGHT.MIN} and ${VALIDATION.LIGHT.MAX} lux`),
  
  body('pH')
    .optional()
    .isFloat({ min: VALIDATION.PH.MIN, max: VALIDATION.PH.MAX })
    .withMessage(`pH must be between ${VALIDATION.PH.MIN} and ${VALIDATION.PH.MAX}`),
  
  body('deviceId')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Device ID must be between 3 and 50 characters'),
  
  validate
];

// Watering request validation
export const validateWateringRequest = [
  body('deviceId')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Device ID must be between 3 and 50 characters'),
  
  body('triggerType')
    .optional()
    .isIn(['auto', 'manual', 'scheduled', 'ai'])
    .withMessage('Trigger type must be one of: auto, manual, scheduled, ai'),
  
  validate
];

// Config update validation
export const validateConfigUpdate = [
  body('moistureThreshold')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Moisture threshold must be between 0 and 100'),
  
  body('autoMode')
    .optional()
    .isBoolean()
    .withMessage('Auto mode must be a boolean'),
  
  body('wateringDurationMs')
    .optional()
    .isInt({ min: 1000, max: 60000 })
    .withMessage('Watering duration must be between 1000ms and 60000ms'),
  
  body('maxWateringCyclesPerDay')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Max watering cycles must be between 1 and 20'),
  
  body('sensorReadInterval')
    .optional()
    .isInt({ min: 1000, max: 3600000 })
    .withMessage('Sensor read interval must be between 1000ms and 3600000ms'),
  
  validate
];

// Query parameter validation for history
export const validateHistoryQuery = [
  query('deviceId')
    .optional()
    .isString()
    .trim(),
  
  query('hours')
    .optional()
    .isInt({ min: 1, max: 720 })
    .withMessage('Hours must be between 1 and 720 (30 days)')
    .toInt(),
  
  query('days')
    .optional()
    .isInt({ min: 1, max: 90 })
    .withMessage('Days must be between 1 and 90')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000')
    .toInt(),
  
  validate
];

// Device status validation
export const validateDeviceStatus = [
  body('deviceId')
    .optional()
    .isString()
    .trim(),
  
  body('online')
    .optional()
    .isBoolean(),
  
  body('pumpActive')
    .optional()
    .isBoolean(),
  
  body('currentState')
    .optional()
    .isIn(['IDLE', 'WATERING', 'COOLDOWN', 'ERROR'])
    .withMessage('Current state must be one of: IDLE, WATERING, COOLDOWN, ERROR'),
  
  body('ipAddress')
    .optional()
    .isIP()
    .withMessage('Invalid IP address'),
  
  body('uptime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Uptime must be a positive integer'),
  
  validate
];

// MongoDB ObjectId validation
export const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  validate
];

export default {
  validate,
  validateSensorReading,
  validateWateringRequest,
  validateConfigUpdate,
  validateHistoryQuery,
  validateDeviceStatus,
  validateObjectId
};
