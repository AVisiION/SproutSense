# MERN Architecture (Current)

## Stack

- MongoDB
- Express (Node.js backend)
- React (web frontend)
- Node.js runtime

## Backend Role

- Receives sensor and AI events
- Stores data in MongoDB
- Provides REST API
- Emits real-time updates for frontend

## Frontend Role

- Shows live sensor cards and status
- Starts/stops watering
- Shows configuration and history
- Displays AI-related outputs

## Data Collections (Typical)

- SensorReading
- WateringLog
- DiseaseDetection
- SystemConfig
- DeviceStatus

## Current Constraints

- Mobile app channel (Blynk) removed
- Web dashboard is the main UI
