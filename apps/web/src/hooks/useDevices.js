/**
 * useDevices.js
 *
 * Fetches the devices linked to the current authenticated user and exposes
 * convenience derivations:
 *   - sensorDeviceId  — the deviceId of the first sensor device (non-CAM)
 *   - camDeviceId     — the deviceId of the first camera device
 *
 * Falls back to the legacy string constants if no matching device is found so
 * that existing code that relies on the defaults does not break.
 */
import { useState, useEffect, useCallback } from 'react';
import { deviceAPI } from '../utils/api';

const FALLBACK_SENSOR_ID = 'ESP32-SENSOR';
const FALLBACK_CAM_ID    = 'ESP32-CAM';

export function useDevices({ enabled = true } = {}) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchDevices = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    try {
      setLoading(true);
      const res = await deviceAPI.listMine();
      setDevices(Array.isArray(res?.devices) ? res.devices : []);
      setError(null);
    } catch (err) {
      setError(err);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Derive the device IDs from the linked devices list
  const camDevice    = devices.find(d => String(d.deviceId).toUpperCase().includes('CAM'));
  const sensorDevice = devices.find(d => !String(d.deviceId).toUpperCase().includes('CAM'));

  const sensorDeviceId = sensorDevice?.deviceId || FALLBACK_SENSOR_ID;
  const camDeviceId    = camDevice?.deviceId    || FALLBACK_CAM_ID;

  return {
    devices,
    loading,
    error,
    sensorDeviceId,
    camDeviceId,
    refetch: fetchDevices,
    hasDevices: devices.length > 0,
  };
}
