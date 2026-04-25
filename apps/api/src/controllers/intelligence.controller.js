import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import SensorReading from '../models/SensorReading.js';
import { successResponse, errorResponse } from '../utils/helpers.js';
import { HTTP_STATUS } from '../config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON_PATH = process.platform === 'win32' ? 'python' : 'python3';
const SERVICES_DIR = path.join(__dirname, '../services/intelligence');

export const getAdvancedAnalysis = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR', days = 7 } = req.query;
    
    // 1. Fetch sensor data
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const readings = await SensorReading.find({
      deviceId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 }).lean();

    if (readings.length < 5) {
      return errorResponse(res, 'Insufficient sensor data for advanced analysis', HTTP_STATUS.BAD_REQUEST);
    }

    // 2. Prepare data for Python
    const inputJson = JSON.stringify(readings);

    // 3. Spawn Python process
    const pythonProcess = spawn(PYTHON_PATH, [path.join(SERVICES_DIR, 'analysis_engine.py')]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdin.write(inputJson);
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python error (code ${code}):`, errorOutput);
        return errorResponse(res, 'Analysis engine failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }

      try {
        const result = JSON.parse(output);
        successResponse(res, result);
      } catch (e) {
        errorResponse(res, 'Failed to parse analysis result', HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }
    });

  } catch (error) {
    next(error);
  }
};

export const getTrendChart = async (req, res, next) => {
  try {
    const { deviceId = 'ESP32-SENSOR', days = 3 } = req.query;
    
    // 1. Fetch data
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const readings = await SensorReading.find({
      deviceId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 }).lean();

    if (readings.length < 5) {
      return errorResponse(res, 'Insufficient data for chart', HTTP_STATUS.BAD_REQUEST);
    }

    // 2. Save temporary JSON for Python visualizer
    const tempInputPath = path.join(__dirname, '../../../../temp_data.json');
    const outputPath = path.join(__dirname, '../../../../apps/web/public/assets/intelligence/trend.png');
    
    await fs.writeFile(tempInputPath, JSON.stringify(readings));

    // 3. Spawn Python visualizer
    const pythonProcess = spawn(PYTHON_PATH, [
      path.join(SERVICES_DIR, 'visualizer.py'),
      tempInputPath,
      outputPath
    ]);

    pythonProcess.on('close', async (code) => {
      // Clean up temp file
      await fs.unlink(tempInputPath).catch(() => {});

      if (code !== 0) {
        return errorResponse(res, 'Visualization failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
      }

      successResponse(res, { 
        chartUrl: '/assets/intelligence/trend.png',
        timestamp: new Date()
      });
    });

  } catch (error) {
    next(error);
  }
};
