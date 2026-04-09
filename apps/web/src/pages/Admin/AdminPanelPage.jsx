/**
 * AdminPanelPage.jsx
 * Professional glass-morphism admin dashboard.
 * Sections: Overview, Devices, Config, Raw Data, Logs, Mock Data
 * Features: Font Awesome icons, animated cards, live log feed, interactive controls
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { aiAPI, configAPI, sensorAPI, wateringAPI, usersAPI, deviceAPI } from '../../utils/api';
import { getSensorRegistry, upsertSensor, removeSensor } from '../../utils/sensorRegistry';
import { ROLE, PERMISSION } from '../../auth/permissions';
import OverviewSection from './sections/overview/OverviewSection';
import ConnectionsSection from './sections/devices/ConnectionsSection';
import DeviceKeysSection from './sections/device-keys/DeviceKeysSection';
import UISection from './sections/ui/UISection';
import LimitsSection from './sections/limits/LimitsSection';
import ConfigSection from './sections/config/ConfigSection';
import RawDataSection from './sections/raw-data/RawDataSection';
import LogsSection from './sections/LogsSection';
import UsersSection from './sections/users/UsersSection';
import SensorsSection from './sections/sensors/SensorsSection';
import MockSection from './sections/mock/MockSection';
import AdminSidebarSection from './layout/AdminSidebarSection';
import AdminNavbarSection from './layout/AdminNavbarSection';
import {
  SECTIONS,
  PLANT_OPTIONS,
  DEVICE_KEY_PRESETS,
  LOG_TYPES,
  DEFAULT_SENSOR_FORM,
  DEFAULT_USER_FORM,
  DEFAULT_UI_PREFERENCES,
  buildSensorThresholdPreset,
  buildDefaultPlantSensorConfig,
  buildDefaultPlantWateringConfig,
} from './utils/constants';
import {
  validateEmail,
  validatePassword,
  validateSensorForm,
  validateUserForm,
} from './utils/validators';
import './Admin.css';
import { setMockEnabled, isMockEnabled } from '../../services/mockDataService';

export default function AdminPanelPage() {
  const { logout, user, role, hasPermission, startImpersonation } = useAuth();
  const adminUser = user?.fullName || user?.email || 'admin';
  const isViewerReadOnly = role === ROLE.VIEWER;
  const navigate = useNavigate();
  const logEndRef = useRef(null);

  // Permission checks
  const canManageUsers = hasPermission(PERMISSION.USERS_UPDATE);
  const canCreateUsers = hasPermission(PERMISSION.USERS_CREATE);
  const canDisableUsers = hasPermission(PERMISSION.USERS_DISABLE);
  const canUpdateConfig = hasPermission(PERMISSION.CONFIG_UPDATE);
  const canReadConfig = hasPermission(PERMISSION.CONFIG_READ);

  const [activeSection, setActiveSection]   = useState('overview');
  const [systemInfo,    setSystemInfo]      = useState(null);
  const [sensorData,    setSensorData]      = useState(null);
  const [configData,    setConfigData]      = useState(null);
  const [waterStatus,   setWaterStatus]      = useState(null);
  const [aiUsageData,   setAIUsageData]     = useState(null);
  const [limitsForm,    setLimitsForm]      = useState({
    moistureThreshold: 30,
    maxWateringCyclesPerDay: 3,
    maxCyclesPerHour: 4,
    maxCyclesPerDay: 6,
    aiDailyAnalysisLimit: 2,
  });
  const [limitErrors,   setLimitErrors]     = useState({});
  const [savingLimits,  setSavingLimits]    = useState(false);
  const [logSearch,     setLogSearch]       = useState('');
  const [logLevel,      setLogLevel]        = useState('all');
  const [loading,       setLoading]          = useState(true);
  const [refreshing,    setRefreshing]       = useState(false);
  const [actionLog,     setActionLog]        = useState([]);
  const [uptime,        setUptime]           = useState(0);
  const [sidebarOpen,   setSidebarOpen]      = useState(typeof window !== 'undefined' && window.innerWidth >= 768);
  const [sensorRegistry, setSensorRegistry] = useState([]);
  const [sensorForm, setSensorForm] = useState(DEFAULT_SENSOR_FORM);
  const [sensorFormErrors, setSensorFormErrors] = useState({});
  const [editingSensorId, setEditingSensorId] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersQuery, setUsersQuery] = useState('');
  const [userForm, setUserForm] = useState(DEFAULT_USER_FORM);
  const [userFormErrors, setUserFormErrors] = useState({});
  const [creatingUser, setCreatingUser] = useState(false);
  const [uiPreferences, setUiPreferences] = useState(DEFAULT_UI_PREFERENCES);
  const [savingUiPreferences, setSavingUiPreferences] = useState(false);
  const [selectedPlantKey, setSelectedPlantKey] = useState('tomato');
  const [plantSensorConfig, setPlantSensorConfig] = useState({ tomato: {} });
  const [plantWateringConfig, setPlantWateringConfig] = useState(buildDefaultPlantWateringConfig());
  const [savingPlantSensorConfig, setSavingPlantSensorConfig] = useState(false);
  
  // User Management State
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);

  // Mock Data master toggle state
  const [mockEnabled, setMockEnabledState] = useState(isMockEnabled());

  // System Stats (new)
  const [systemStats, setSystemStats] = useState(null);

  // Device Key Management state
  const [deviceKeyForm, setDeviceKeyForm] = useState({ deviceId: '', pairingKey: '', displayName: '' });
  const [lastProvisioningSeed, setLastProvisioningSeed] = useState(null);
  const [lastGeneratedPairingKey, setLastGeneratedPairingKey] = useState(null);
  const [deviceKeys, setDeviceKeys] = useState([]);
  const [loadingDeviceKeys, setLoadingDeviceKeys] = useState(false);
  const [creatingDeviceKey, setCreatingDeviceKey] = useState(false);
  const [generatedDeviceToken, setGeneratedDeviceToken] = useState(null);
  const [selectedDeviceType, setSelectedDeviceType] = useState('ESP32-SENSOR');
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [keySearch, setKeySearch] = useState('');
  const [isBatchRevoking, setIsBatchRevoking] = useState(false);

  // Force Pair State
  const [isForcePairModalOpen, setIsForcePairModalOpen] = useState(false);
  const [targetDeviceIdForForcePair, setTargetDeviceIdForForcePair] = useState(null);
  const [selectedUserIdForForcePair, setSelectedUserIdForForcePair] = useState('');
  const [isForcePairing, setIsForcePairing] = useState(false);

  const validateLimits = useCallback((values) => {
    const errors = {};
    const checks = [
      ['moistureThreshold', Number(values.moistureThreshold), 0, 100, 'Must be between 0 and 100'],
      ['maxWateringCyclesPerDay', Number(values.maxWateringCyclesPerDay), 1, 20, 'Must be between 1 and 20'],
      ['maxCyclesPerHour', Number(values.maxCyclesPerHour), 1, 24, 'Must be between 1 and 24'],
      ['maxCyclesPerDay', Number(values.maxCyclesPerDay), 1, 50, 'Must be between 1 and 50'],
      ['aiDailyAnalysisLimit', Number(values.aiDailyAnalysisLimit), 1, 100, 'Must be between 1 and 100'],
    ];

    checks.forEach(([field, numberValue, min, max, message]) => {
      if (!Number.isFinite(numberValue) || numberValue < min || numberValue > max) {
        errors[field] = message;
      }
    });

    return errors;
  }, []);

  const filteredLogs = actionLog.filter((entry) => {
    const levelPass = logLevel === 'all' || entry.type === logLevel;
    const query = logSearch.trim().toLowerCase();
    const queryPass = !query || [entry.msg, entry.actor, entry.section].filter(Boolean).join(' ').toLowerCase().includes(query);
    return levelPass && queryPass;
  });

  const log = useCallback((msg, type = LOG_TYPES.info, details = null) => {
    const entry = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
      date: new Date().toLocaleDateString('en-IN'),
      createdAt: new Date().toISOString(),
      msg,
      type,
      actor: adminUser || 'admin',
      section: activeSection,
      details,
    };
    setActionLog(prev => [entry, ...prev].slice(0, 100));

    configAPI.createAdminLog({
      actor: adminUser || 'admin',
      action: msg,
      level: type,
      section: activeSection,
      details,
    }).catch(() => null);
  }, [activeSection, adminUser]);

  const hydrateLimitsForm = useCallback((cfgRaw) => {
    const cfg = cfgRaw?.config || cfgRaw || {};
    setLimitsForm({
      moistureThreshold: cfg.moistureThreshold ?? 30,
      maxWateringCyclesPerDay: cfg.maxWateringCyclesPerDay ?? 3,
      maxCyclesPerHour: cfg?.wateringSystem?.maxCyclesPerHour ?? 4,
      maxCyclesPerDay: cfg?.wateringSystem?.maxCyclesPerDay ?? 6,
      aiDailyAnalysisLimit: cfg?.aiConfig?.dailyAnalysisLimit ?? 2,
    });
  }, []);

  const hydrateUiPreferences = useCallback((cfgRaw) => {
    const cfg = cfgRaw?.config || cfgRaw || {};
    setUiPreferences({
      dashboardSections: {
        ...DEFAULT_UI_PREFERENCES.dashboardSections,
        ...(cfg?.uiPreferences?.dashboardSections || {}),
      },
      sidebarVisibility: {
        ...DEFAULT_UI_PREFERENCES.sidebarVisibility,
        ...(cfg?.uiPreferences?.sidebarVisibility || {}),
      },
      widgets: {
        ...DEFAULT_UI_PREFERENCES.widgets,
        ...(cfg?.uiPreferences?.widgets || {}),
      },
    });
  }, []);

  const hydratePlantSensorConfig = useCallback((cfgRaw, registryRaw) => {
    const cfg = cfgRaw?.config || cfgRaw || {};
    const registry = Array.isArray(registryRaw) ? registryRaw : [];
    const defaults = buildDefaultPlantSensorConfig(registry);
    const saved = cfg?.plantSensorConfig || {};

    const merged = { ...defaults };
    Object.entries(saved).forEach(([plantKey, sensorMap]) => {
      merged[plantKey] = {
        ...(defaults[plantKey] || {}),
      };

      Object.entries(sensorMap || {}).forEach(([sensorKey, value]) => {
        merged[plantKey][sensorKey] = {
          ...(defaults[plantKey]?.[sensorKey] || {}),
          ...buildSensorThresholdPreset(value),
        };
      });
    });

    setPlantSensorConfig(merged);
  }, []);

  const hydratePlantWateringConfig = useCallback((cfgRaw) => {
    const cfg = cfgRaw?.config || cfgRaw || {};
    const defaults = buildDefaultPlantWateringConfig(cfg);
    const saved = cfg?.plantWateringConfig || {};

    const merged = { ...defaults };
    Object.entries(saved).forEach(([plantKey, plantValue]) => {
      merged[plantKey] = {
        ...(defaults[plantKey] || defaults.tomato),
        moistureThreshold: Number(plantValue?.moistureThreshold ?? defaults.tomato.moistureThreshold),
        maxWateringCyclesPerDay: Number(plantValue?.maxWateringCyclesPerDay ?? defaults.tomato.maxWateringCyclesPerDay),
        maxCyclesPerHour: Number(plantValue?.maxCyclesPerHour ?? defaults.tomato.maxCyclesPerHour),
        maxCyclesPerDay: Number(plantValue?.maxCyclesPerDay ?? defaults.tomato.maxCyclesPerDay),
      };
    });

    setPlantWateringConfig(merged);
  }, []);

  const loadAdminLogs = useCallback(async () => {
    try {
      const logsRes = await configAPI.getAdminLogs(100).catch(() => null);
      const logs = logsRes?.logs || logsRes?.data?.logs || [];

      if (!Array.isArray(logs) || logs.length === 0) {
        return;
      }

      const mapped = logs.map((entry) => {
        const createdAt = entry.createdAt ? new Date(entry.createdAt) : new Date();
        return {
          id: entry._id || `${createdAt.getTime()}-${Math.random()}`,
          time: createdAt.toLocaleTimeString('en-IN', { hour12: false }),
          date: createdAt.toLocaleDateString('en-IN'),
          createdAt: createdAt.toISOString(),
          msg: entry.action,
          type: entry.level || LOG_TYPES.info,
          actor: entry.actor || 'admin',
          section: entry.section || 'admin-panel',
          details: entry.details || null,
        };
      });

      setActionLog(mapped);
    } catch {
      // no-op
    }
  }, []);

  const fetchAllData = useCallback(async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    else setLoading(true);
    try {
      const [
        health, 
        latest, 
        cfg, 
        water, 
        aiUsage, 
        usersRes, 
        keysRes,
        statsRes
      ] = await Promise.all([
        configAPI.getHealth().catch(() => null),
        sensorAPI.getLatest('ESP32-SENSOR').catch(() => null),
        configAPI.get('ESP32-SENSOR').catch(() => null),
        wateringAPI.getStatus('ESP32-SENSOR').catch(() => null),
        aiAPI.getUsageStats('ESP32-SENSOR').catch(() => null),
        usersAPI.list().catch(() => null),
        deviceAPI.listKeys().catch(() => null),
        configAPI.getSystemStats().catch(() => null)
      ]);
      
      setSystemInfo({
        backend: health?.backend || health?.data?.backend || 'Online',
        database: health?.database || health?.data?.database || 'Connected',
        websocket: health?.websocket || health?.data?.websocket || 'Unknown',
        version: health?.version || health?.data?.version || '1.0.0',
      });
      setSystemStats(statsRes?.stats || statsRes?.data?.stats || null);
      setSensorData(latest?.data || latest);
      setConfigData(cfg?.data || cfg);
      setWaterStatus(water?.data || water);
      setAIUsageData(aiUsage?.data || aiUsage);
      setUsers(usersRes?.users || []);
      setDeviceKeys(keysRes?.devices || []);
      hydrateLimitsForm(cfg?.data || cfg);
      hydrateUiPreferences(cfg?.data || cfg);
      log('System data refreshed successfully', LOG_TYPES.success);
    } catch (err) {
      log(`Fetch error: ${err.message}`, LOG_TYPES.error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hydrateLimitsForm, hydrateUiPreferences, log]);

  const loadSensors = useCallback(() => {
    setSensorRegistry(getSensorRegistry());
  }, []);

  useEffect(() => {
    hydratePlantSensorConfig(configData, sensorRegistry);
  }, [configData, sensorRegistry, hydratePlantSensorConfig]);

  useEffect(() => {
    hydratePlantWateringConfig(configData);
  }, [configData, hydratePlantWateringConfig]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await usersAPI.list(200);
      const list = Array.isArray(res?.users) ? res.users : [];
      setUsers(list);
    } catch (err) {
      log(`Failed to load users: ${err.message}`, LOG_TYPES.error);
    } finally {
      setUsersLoading(false);
    }
  }, [log]);

  useEffect(() => {
    fetchAllData();
    loadAdminLogs();
    loadSensors();
    loadUsers();
  }, [fetchAllData, loadAdminLogs, loadSensors, loadUsers]);

  useEffect(() => {
    const interval = setInterval(() => setUptime(u => u + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [actionLog]);

  useEffect(() => {
    if (activeSection === 'device-keys') {
      loadDeviceKeys();
    }
  }, [activeSection]);

  const loadDeviceKeys = async () => {
    setLoadingDeviceKeys(true);
    try {
      const res = await deviceAPI.listKeys();
      setDeviceKeys(Array.isArray(res?.devices) ? res.devices : []);
    } catch (error) {
      log(`Failed to load device keys: ${error?.response?.data?.message || error.message}`, LOG_TYPES.error);
    } finally {
      setLoadingDeviceKeys(false);
    }
  };

  const handleSelectKey = (deviceId, checked) => {
    if (checked) {
      setSelectedKeys(prev => [...prev, deviceId]);
    } else {
      setSelectedKeys(prev => prev.filter(id => id !== deviceId));
    }
  };

  const handleSelectAllKeys = (checked, list) => {
    if (checked) {
      setSelectedKeys(list.map(k => k.deviceId));
    } else {
      setSelectedKeys([]);
    }
  };

  const handleBatchRevoke = async () => {
    if (selectedKeys.length === 0) return;
    if (!window.confirm(`Are you sure you want to revoke ${selectedKeys.length} device keys? All linked users will be disconnected.`)) return;

    setIsBatchRevoking(true);
    try {
      await deviceAPI.batchDeleteKeys(selectedKeys);
      log(`Batch revoked ${selectedKeys.length} device keys`, LOG_TYPES.warning, { count: selectedKeys.length });
      setSelectedKeys([]);
      await loadDeviceKeys();
    } catch (error) {
      log(`Batch revocation failed: ${error.message}`, LOG_TYPES.error);
    } finally {
      setIsBatchRevoking(false);
    }
  };

  const generateDeviceId = useCallback((deviceType = selectedDeviceType) => {
    const typePrefix = deviceType === 'ESP32-CAM' ? 'CAM' : 'SENSOR';
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ESP32-${typePrefix}-${randomPart}`;
  }, [selectedDeviceType]);

  const generateProvisioningSeed = useCallback(() => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
  }, []);

  const formatPairingKey = useCallback((seed) => {
    const normalized = String(seed || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const suffix = normalized.slice(0, 20).padEnd(20, '0');
    return `PAIR-${suffix.slice(0, 5)}-${suffix.slice(5, 10)}-${suffix.slice(10, 15)}-${suffix.slice(15, 20)}`;
  }, []);

  const handleGenerateDeviceId = useCallback((deviceType = selectedDeviceType) => {
    const deviceId = generateDeviceId(deviceType);
    setDeviceKeyForm((prev) => ({
      ...prev,
      deviceId,
      displayName: prev.displayName || (deviceType === 'ESP32-CAM' ? 'ESP32 Camera' : 'ESP32 Sensor'),
    }));
  }, [generateDeviceId, selectedDeviceType]);

  const handleGeneratePairingKey = useCallback((deviceType = selectedDeviceType) => {
    const provisioningSeed = generateProvisioningSeed();
    const pairingKey = formatPairingKey(provisioningSeed);
    setLastProvisioningSeed(provisioningSeed);
    setLastGeneratedPairingKey(pairingKey);
    setDeviceKeyForm((prev) => ({
      ...prev,
      pairingKey,
      displayName: prev.displayName || (deviceType === 'ESP32-CAM' ? 'ESP32 Camera' : 'ESP32 Sensor'),
    }));
  }, [formatPairingKey, generateProvisioningSeed, selectedDeviceType]);

  const handleCreateDeviceKey = async () => {
    const deviceId = (deviceKeyForm.deviceId.trim() || generateDeviceId(selectedDeviceType)).toUpperCase();
    const provisioningSeed = lastProvisioningSeed || generateProvisioningSeed();
    const pairingKey = deviceKeyForm.pairingKey.trim() || formatPairingKey(provisioningSeed);
    if (!deviceId) {
      log('Device ID is required', LOG_TYPES.error);
      return;
    }

    if (!pairingKey) {
      log('Pairing key is required', LOG_TYPES.error);
      return;
    }

    if (deviceId === pairingKey) {
      log('Device ID and pairing key must be different', LOG_TYPES.error);
      return;
    }

    if (!canUpdateConfig) {
      log('Device key creation blocked: insufficient permissions', LOG_TYPES.error);
      return;
    }

    setCreatingDeviceKey(true);
    try {
      setLastProvisioningSeed(provisioningSeed);
      setLastGeneratedPairingKey(pairingKey);
      const res = await deviceAPI.createKey({
        deviceId,
        pairingKey,
        provisioningSeed,
        displayName: deviceKeyForm.displayName.trim(),
      });
      setGeneratedDeviceToken(res?.device?.deviceSecretHex || res?.device?.deviceSecret || null);
      setDeviceKeyForm({ deviceId: '', pairingKey: '', displayName: '' });
      await loadDeviceKeys();
      log(`Device key created for ${deviceId}`, LOG_TYPES.success, { deviceId });
    } catch (error) {
      const message = error?.response?.data?.message || error.message;
      log(`Failed to create device key: ${message}`, LOG_TYPES.error, { deviceId });
    } finally {
      setCreatingDeviceKey(false);
    }
  };

  const handleCreatePresetDeviceKey = async (preset) => {
    if (!canUpdateConfig) {
      log('Device key creation blocked: insufficient permissions', LOG_TYPES.error);
      return;
    }

    const deviceId = generateDeviceId(preset.deviceId);
    const provisioningSeed = generateProvisioningSeed();
    const pairingKey = formatPairingKey(provisioningSeed);
    setSelectedDeviceType(preset.deviceId);
    setLastProvisioningSeed(provisioningSeed);
    setDeviceKeyForm({
      deviceId,
      pairingKey,
      displayName: preset.displayName,
    });
    setCreatingDeviceKey(true);
    try {
      setLastGeneratedPairingKey(pairingKey);
      const res = await deviceAPI.createKey({
        deviceId,
        pairingKey,
        provisioningSeed,
        displayName: preset.displayName,
      });
      setGeneratedDeviceToken(res?.device?.deviceSecretHex || res?.device?.deviceSecret || null);
      await loadDeviceKeys();
      log(`Device key created for ${deviceId}`, LOG_TYPES.success, { deviceId });
    } catch (error) {
      const message = error?.response?.data?.message || error.message;
      log(`Failed to create device key: ${message}`, LOG_TYPES.error);
    } finally {
      setCreatingDeviceKey(false);
    }
  };

  const handleDeleteDeviceKey = async (deviceId) => {
    if (!canUpdateConfig) {
      log('Device key deletion blocked: insufficient permissions', LOG_TYPES.error);
      return;
    }

    if (!window.confirm(`Delete device key for ${deviceId}? This action cannot be undone.`)) return;
    try {
      await deviceAPI.deleteKey(deviceId);
      await loadDeviceKeys();
      log(`Device key ${deviceId} deleted`, LOG_TYPES.warning, { deviceId });
    } catch (error) {
      const message = error?.response?.data?.message || error.message;
      log(`Failed to delete device key: ${message}`, LOG_TYPES.error);
    }
  };

  const handleToggleDeviceKeyStatus = async (deviceId) => {
    if (!canUpdateConfig) {
      log('Device key toggle blocked: insufficient permissions', LOG_TYPES.error);
      return;
    }

    try {
      await deviceAPI.toggleKeyStatus(deviceId);
      await loadDeviceKeys();
      log(`Device key ${deviceId} status toggled`, LOG_TYPES.info, { deviceId });
    } catch (error) {
      const message = error?.response?.data?.message || error.message;
      log(`Failed to toggle device key status: ${message}`, LOG_TYPES.error);
    }
  };

  const handleForceUnpair = async (deviceId) => {
    if (!window.confirm(`Force unpair device ${deviceId}? The user will lose access immediately.`)) return;
    try {
      await deviceAPI.adminUnpair(deviceId);
      log(`Force unpaired device ${deviceId}`, LOG_TYPES.warning, { deviceId });
      await loadDeviceKeys();
    } catch (error) {
      log(`Force unpair failed: ${error.message}`, LOG_TYPES.error);
    }
  };

  const handleOpenForcePairModal = (deviceId) => {
    setTargetDeviceIdForForcePair(deviceId);
    setSelectedUserIdForForcePair('');
    setIsForcePairModalOpen(true);
  };

  const handleConfirmForcePair = async () => {
    if (!targetDeviceIdForForcePair || !selectedUserIdForForcePair) return;
    
    setIsForcePairing(true);
    try {
      const res = await deviceAPI.forcePair({
        deviceId: targetDeviceIdForForcePair,
        userId: selectedUserIdForForcePair
      });
      setGeneratedDeviceToken(res?.device?.deviceToken);
      log(`Force paired ${targetDeviceIdForForcePair} to user ${selectedUserIdForForcePair}`, LOG_TYPES.success);
      setIsForcePairModalOpen(false);
      await loadDeviceKeys();
    } catch (error) {
      log(`Force pair failed: ${error.message}`, LOG_TYPES.error);
    } finally {
      setIsForcePairing(false);
    }
  };

  const handleCopyDeviceToken = async () => {
    if (!generatedDeviceToken) return;
    try {
      await navigator.clipboard.writeText(generatedDeviceToken);
      log('Device token copied to clipboard', LOG_TYPES.success);
    } catch {
      log('Failed to copy device token', LOG_TYPES.error);
    }
  };

  const handleCopyPairingKey = async () => {
    if (!lastGeneratedPairingKey) return;
    try {
      await navigator.clipboard.writeText(lastGeneratedPairingKey);
      log('Pairing key copied to clipboard', LOG_TYPES.success);
    } catch {
      log('Failed to copy pairing key', LOG_TYPES.error);
    }
  };

  const formatUptime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  const handleLogout = async () => {
    log('Admin session terminated', LOG_TYPES.warning);
    await logout();
    navigate('/login', { replace: true });
  };

  const deleteLogs = async () => {
    if (typeof window !== 'undefined' && !window.confirm('Delete all admin logs? This cannot be undone.')) {
      return;
    }

    try {
      const result = await configAPI.deleteAdminLogs({ params: { q: logSearch, level: logLevel } });
      setActionLog([]);
      log(`Deleted ${result?.deletedCount || 0} admin log(s)`, LOG_TYPES.warning);
    } catch (error) {
      log(`Failed to delete logs: ${error.message}`, LOG_TYPES.error);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportLogs = () => {
    const text = actionLog.map(e => `[${e.date} ${e.time}] [${e.type.toUpperCase()}] ${e.msg}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    downloadBlob(blob, `sproutsense-ui-logs-${Date.now()}.txt`);
    log('Logs exported to file', LOG_TYPES.success);
  };

  const exportAuditLogs = async (format) => {
    try {
      const blob = await configAPI.exportAdminLogs({
        format,
        q: logSearch,
        level: logLevel,
        limit: 1000,
      });

      const fileName = `sproutsense-admin-audit-${Date.now()}.${format}`;
      downloadBlob(blob, fileName);
      log(`Admin audit logs exported as ${format.toUpperCase()}`, LOG_TYPES.success, { format, logLevel, logSearch });
    } catch (err) {
      log(`Audit export failed: ${err.message}`, LOG_TYPES.error);
    }
  };

  const handleMockToggle = (e) => {
    const val = e.target.checked;
    setMockEnabledState(val);
    setMockEnabled(val);
    log(`Mock Data Mode turned ${val ? 'ON' : 'OFF'}`, val ? LOG_TYPES.warning : LOG_TYPES.info);
  };

  const handleLimitChange = (field, value) => {
    setLimitsForm(prev => {
      const next = {
        ...prev,
        [field]: value
      };
      setLimitErrors(validateLimits(next));
      return next;
    });
  };

  const handleSensorFormChange = (field, value) => {
    setSensorForm(prev => ({ ...prev, [field]: value }));
    // Real-time validation
    setSensorFormErrors(prev => {
      const next = { ...prev };
      if (field === 'name' && !value?.trim()) next.name = 'Sensor name required';
      else if (field === 'name') delete next.name;
      if (field === 'key' && !value?.trim()) next.key = 'Sensor key required';
      else if (field === 'key') delete next.key;
      return next;
    });
  };

  const resetSensorForm = () => {
    setSensorForm(DEFAULT_SENSOR_FORM);
    setSensorFormErrors({});
    setEditingSensorId(null);
  };

  const handleSensorEdit = (sensor) => {
    setEditingSensorId(sensor.id);
    setSensorForm({ ...sensor });
    setSensorFormErrors({});
    setActiveSection('sensors');
  };

  const handleSensorSave = () => {
    const errors = validateSensorForm(sensorForm);
    setSensorFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      log('Sensor save blocked: validation failed', LOG_TYPES.warning, errors);
      return;
    }

    const payload = {
      ...sensorForm,
      id: editingSensorId || sensorForm.id || `${sensorForm.key.trim().toLowerCase()}-${Date.now()}`,
      name: sensorForm.name.trim(),
      key: sensorForm.key.trim(),
    };

    const next = upsertSensor(payload);
    setSensorRegistry(next);
    log(`Sensor ${editingSensorId ? 'updated' : 'created'}: ${payload.name}`, LOG_TYPES.success, payload);
    resetSensorForm();
  };

  const handleSensorDelete = (sensorId, sensorName) => {
    if (!window.confirm(`Delete sensor "${sensorName}"?`)) return;
    const next = removeSensor(sensorId);
    setSensorRegistry(next);
    log(`Sensor deleted: ${sensorName}`, LOG_TYPES.warning, { sensorId, sensorName });
    if (editingSensorId === sensorId) resetSensorForm();
  };

  const handleSaveLimits = async () => {
    try {
      const errors = validateLimits(limitsForm);
      setLimitErrors(errors);
      if (Object.keys(errors).length > 0) {
        log('Limit update blocked: validation failed', LOG_TYPES.warning, errors);
        return;
      }

      if (!canUpdateConfig) {
        log('Limits update blocked: insufficient permissions', LOG_TYPES.error);
        return;
      }

      setSavingLimits(true);

      const payload = {
        moistureThreshold: Number(limitsForm.moistureThreshold),
        maxWateringCyclesPerDay: Number(limitsForm.maxWateringCyclesPerDay),
        wateringSystem: {
          maxCyclesPerHour: Number(limitsForm.maxCyclesPerHour),
          maxCyclesPerDay: Number(limitsForm.maxCyclesPerDay),
        },
        aiConfig: {
          dailyAnalysisLimit: Number(limitsForm.aiDailyAnalysisLimit),
        },
      };

      await configAPI.update('ESP32-SENSOR', payload);
      log('System limits updated successfully', LOG_TYPES.success, payload);
      await fetchAllData(true);
    } catch (err) {
      const message = err?.response?.data?.message || err.message;
      log(`Failed to update limits: ${message}`, LOG_TYPES.error);
    } finally {
      setSavingLimits(false);
    }
  };

  const handleUserRoleUpdate = async (targetUser, nextRole) => {
    if (!targetUser?.id || !nextRole || targetUser.role === nextRole) return;
    
    if (!canManageUsers) {
      log('Role update blocked: insufficient permissions', LOG_TYPES.error);
      return;
    }

    try {
      await usersAPI.updateRole(targetUser.id, nextRole);
      setUsers((prev) => prev.map((item) => (item.id === targetUser.id ? { ...item, role: nextRole } : item)));
      log(`Role updated for ${targetUser.email}: ${targetUser.role} -> ${nextRole}`, LOG_TYPES.success);
    } catch (err) {
      const message = err?.response?.data?.message || err.message;
      log(`Role update failed for ${targetUser.email}: ${message}`, LOG_TYPES.error);
    }
  };

  const handleUserStatusUpdate = async (targetUser, nextStatus) => {
    if (!targetUser?.id || !nextStatus || targetUser.accountStatus === nextStatus) return;
    
    if (!canDisableUsers) {
      log('Status update blocked: insufficient permissions', LOG_TYPES.error);
      return;
    }

    try {
      await usersAPI.updateAccountStatus(targetUser.id, nextStatus);
      setUsers((prev) => prev.map((item) => (item.id === targetUser.id ? { ...item, accountStatus: nextStatus } : item)));
      log(`Account status updated for ${targetUser.email}: ${targetUser.accountStatus} -> ${nextStatus}`, LOG_TYPES.success);
    } catch (err) {
      const message = err?.response?.data?.message || err.message;
      log(`Status update failed for ${targetUser.email}: ${message}`, LOG_TYPES.error);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!targetUser?.id) return;
    
    if (!canDisableUsers) {
      log('User deletion blocked: insufficient permissions', LOG_TYPES.error);
      return;
    }
    
    if (!window.confirm(`Delete user ${targetUser.email}? This action cannot be undone.`)) return;

    try {
      await usersAPI.delete(targetUser.id);
      setUsers((prev) => prev.filter((item) => item.id !== targetUser.id));
      log(`User deleted: ${targetUser.email}`, LOG_TYPES.warning, { userId: targetUser.id });
    } catch (err) {
      const message = err?.response?.data?.message || err.message;
      log(`User deletion failed for ${targetUser.email}: ${message}`, LOG_TYPES.error);
    }
  };

  const handleUserSensorVisibilityUpdate = async (targetUser, nextVisible) => {
    if (!targetUser?.id || typeof nextVisible !== 'boolean') return;
    if ((targetUser.sensorDataVisible !== false) === nextVisible) return;
    
    if (!canManageUsers) {
      log('Sensor visibility update blocked: insufficient permissions', LOG_TYPES.error);
      return;
    }

    try {
      await usersAPI.updateSensorVisibility(targetUser.id, nextVisible);
      setUsers((prev) => prev.map((item) => (
        item.id === targetUser.id ? { ...item, sensorDataVisible: nextVisible } : item
      )));
      log(`Sensor data ${nextVisible ? 'enabled' : 'hidden'} for ${targetUser.email}`, LOG_TYPES.success);
    } catch (err) {
      const message = err?.response?.data?.message || err.message;
      log(`Sensor visibility update failed for ${targetUser.email}: ${message}`, LOG_TYPES.error);
    }
  };

  const handleUserFormChange = (field, value) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
    // Real-time validation
    setUserFormErrors(prev => {
      const next = { ...prev };
      if (field === 'fullName' && !value?.trim()) next.fullName = 'Full name required';
      else if (field === 'fullName') delete next.fullName;
      if (field === 'email') {
        const emailErr = validateEmail(value);
        if (emailErr) next.email = emailErr;
        else delete next.email;
      }
      if (field === 'password' && value) {
        const minLen = userForm.roleKey === ROLE.ADMIN ? 14 : 12;
        const passErr = validatePassword(value, minLen);
        if (passErr) next.password = passErr;
        else delete next.password;
      }
      return next;
    });
  };

  const resetUserForm = () => {
    setUserForm(DEFAULT_USER_FORM);
    setUserFormErrors({});
  };

  const handleCreateUser = async () => {
    // Validate before submission
    const errors = validateUserForm(userForm, true);
    setUserFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      log('User create blocked: validation failed', LOG_TYPES.warning, errors);
      return;
    }

    if (!canCreateUsers) {
      log('User create blocked: insufficient permissions', LOG_TYPES.error);
      return;
    }

    try {
      setCreatingUser(true);
      await usersAPI.create({
        fullName: userForm.fullName.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
        roleKey: userForm.roleKey,
        accountStatus: userForm.accountStatus,
        emailVerified: userForm.emailVerified,
        sensorDataVisible: userForm.sensorDataVisible,
      });

      log(`User created successfully: ${userForm.email.trim()}`, LOG_TYPES.success);
      resetUserForm();
      await loadUsers();
    } catch (err) {
      const message = err?.response?.data?.message || err.message;
      log(`User creation failed: ${message}`, LOG_TYPES.error, { email: userForm.email });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleOpenDeleteModal = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await usersAPI.delete(userToDelete.id);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (err) {
      toast.error('Failed to delete user: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleToggleUserSelection = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAllUsers = (filteredUsers) => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const handleBulkAction = async (action, value = null) => {
    if (selectedUserIds.length === 0) return;
    
    setIsBulkActionLoading(true);
    try {
      await usersAPI.bulkAction(selectedUserIds, action, value);
      toast.success(`Bulk ${action} completed successfully`);
      setSelectedUserIds([]);
      loadUsers();
    } catch (err) {
      toast.error(`Bulk ${action} failed: ` + (err.response?.data?.message || err.message));
    } finally {
      setIsBulkActionLoading(false);
    }
  };

  const handleUiPreferenceChange = (group, key, value) => {
    setUiPreferences((prev) => ({
      ...prev,
      [group]: {
        ...(prev[group] || {}),
        [key]: value,
      },
    }));
  };

  const handleSaveUiPreferences = async () => {
    if (!canUpdateConfig) {
      log('UI preferences save blocked: insufficient permissions', LOG_TYPES.error);
      return;
    }

    try {
      setSavingUiPreferences(true);
      await configAPI.update('ESP32-SENSOR', { uiPreferences });
      log('UI preferences saved successfully', LOG_TYPES.success, uiPreferences);
      await fetchAllData(true);
    } catch (err) {
      const message = err?.response?.data?.message || err.message;
      log(`Failed to save UI preferences: ${message}`, LOG_TYPES.error);
    } finally {
      setSavingUiPreferences(false);
    }
  };

  const handleUiSensorAnalyticsToggle = (sensor, checked) => {
    const next = upsertSensor({ ...sensor, showInAnalytics: checked });
    setSensorRegistry(next);
    log(`Analytics graph ${checked ? 'enabled' : 'disabled'} for ${sensor.name}`, LOG_TYPES.info);
  };

  const handleUiSensorDashboardToggle = (sensor, checked) => {
    const next = upsertSensor({ ...sensor, showInDashboard: checked });
    setSensorRegistry(next);
    log(`Dashboard card ${checked ? 'enabled' : 'disabled'} for ${sensor.name}`, LOG_TYPES.info);
  };

  const handleAddCustomSensor = () => {
    const name = window.prompt("Enter new sensor name (e.g. Light Level):");
    if (!name) return;
    const key = name.toLowerCase().replace(/[^a-z0-9]/g, '') + Date.now().toString().slice(-4);
    
    const next = upsertSensor({
      id: key,
      name,
      key,
      unit: '%',
      minThreshold: 0,
      maxThreshold: 100,
      warningThreshold: 80,
      criticalThreshold: 90,
      chartType: 'line',
      enabled: true,
      showInDashboard: true,
      showInAnalytics: true,
      faIcon: 'fa-microchip',
      color: '#6366f1'
    });
    setSensorRegistry(next);
    log(`Custom sensor added: ${name}`, LOG_TYPES.success);
  };

  const handleDeleteCustomSensor = (id) => {
    if (!window.confirm("Are you sure you want to delete this sensor?")) return;
    const next = removeSensor(id);
    setSensorRegistry(next);
    log(`Sensor removed: ${id}`, LOG_TYPES.info);
  };

  const handleUiSensorIconChange = (sensor, faIcon) => {
    const next = upsertSensor({ ...sensor, faIcon });
    setSensorRegistry(next);
  };

  const handleUiSensorColorChange = (sensor, color) => {
    const next = upsertSensor({ ...sensor, color });
    setSensorRegistry(next);
  };

  const handleUiSensorChartTypeChange = (sensor, chartType) => {
    const next = upsertSensor({ ...sensor, chartType });
    setSensorRegistry(next);
    log(`Chart type updated for ${sensor.name}: ${chartType}`, LOG_TYPES.info);
  };

  const handlePlantThresholdChange = (sensorKey, field, value) => {
    const normalized = value === '' ? '' : Number(value);
    setPlantSensorConfig((prev) => ({
      ...prev,
      [selectedPlantKey]: {
        ...(prev[selectedPlantKey] || {}),
        [sensorKey]: {
          ...(prev[selectedPlantKey]?.[sensorKey] || {}),
          [field]: normalized,
        },
      },
    }));
  };

  const handlePlantWateringChange = (field, value) => {
    setPlantWateringConfig((prev) => ({
      ...prev,
      [selectedPlantKey]: {
        ...(prev[selectedPlantKey] || {}),
        [field]: value === '' ? '' : Number(value),
      },
    }));
  };

  const handleSavePlantSensorConfig = async () => {
    if (!canUpdateConfig) {
      log('Plant config save blocked: insufficient permissions', LOG_TYPES.error);
      return;
    }

    try {
      setSavingPlantSensorConfig(true);
      const normalizedConfig = Object.entries(plantSensorConfig || {}).reduce((plantAcc, [plantKey, sensorMap]) => {
        plantAcc[plantKey] = Object.entries(sensorMap || {}).reduce((sensorAcc, [sensorKey, thresholdMap]) => {
          sensorAcc[sensorKey] = {
            minThreshold: Number(thresholdMap?.minThreshold ?? 0),
            maxThreshold: Number(thresholdMap?.maxThreshold ?? 100),
            warningThreshold: Number(thresholdMap?.warningThreshold ?? 70),
            criticalThreshold: Number(thresholdMap?.criticalThreshold ?? 85),
          };
          return sensorAcc;
        }, {});
        return plantAcc;
      }, {});

      const normalizedWateringConfig = Object.entries(plantWateringConfig || {}).reduce((plantAcc, [plantKey, config]) => {
        plantAcc[plantKey] = {
          moistureThreshold: Number(config?.moistureThreshold ?? 30),
          maxWateringCyclesPerDay: Number(config?.maxWateringCyclesPerDay ?? 3),
          maxCyclesPerHour: Number(config?.maxCyclesPerHour ?? 4),
          maxCyclesPerDay: Number(config?.maxCyclesPerDay ?? 6),
        };
        return plantAcc;
      }, {});

      await configAPI.update('ESP32-SENSOR', {
        plantSensorConfig: normalizedConfig,
        plantWateringConfig: normalizedWateringConfig,
      });
      log(`Plant configuration saved for ${selectedPlantKey}`, LOG_TYPES.success, { selectedPlantKey, normalizedConfig, normalizedWateringConfig });
      await fetchAllData(true);
    } catch (err) {
      const message = err?.response?.data?.message || err.message;
      log(`Failed to save plant configuration: ${message}`, LOG_TYPES.error);
    } finally {
      setSavingPlantSensorConfig(false);
    }
  };

  const handleViewUserDashboard = async (targetUser) => {
    if (!targetUser?.id) return;
    try {
      await startImpersonation({ userId: targetUser.id });
      log(`Impersonation started for ${targetUser.fullName || targetUser.email}`, LOG_TYPES.warning, {
        targetUserId: targetUser.id,
      });
      navigate('/home');
    } catch (err) {
      const message = err?.response?.data?.message || err.message;
      log(`Failed to start impersonation: ${message}`, LOG_TYPES.error);
    }
  };

  const filteredUsers = users.filter((entry) => {
    const query = usersQuery.trim().toLowerCase();
    if (!query) return true;
    return [entry.fullName, entry.email, entry.role, entry.accountStatus]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  return (
    <div className={`adm-root${sidebarOpen ? '' : ' adm-root--collapsed'}`}>

      {/* Section */}
      <AdminSidebarSection
        sidebarOpen={sidebarOpen}
        activeSection={activeSection}
        SECTIONS={SECTIONS}
        adminUser={adminUser}
        systemInfo={systemInfo}
        uptime={uptime}
        formatUptime={formatUptime}
        setActiveSection={setActiveSection}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
      />

      {/* Section */}
      <main className="adm-main">

        {/* Navbar */}
        <AdminNavbarSection
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
          SECTIONS={SECTIONS}
          mockEnabled={mockEnabled}
          refreshing={refreshing}
          fetchAllData={fetchAllData}
          handleLogout={handleLogout}
        />

        {/* Content */}
        <div className={`adm-content${isViewerReadOnly ? ' adm-content--readonly' : ''}`} inert={isViewerReadOnly ? '' : undefined} aria-readonly={isViewerReadOnly || undefined}>
          {loading ? (
            <div className="adm-loading">
              <i className="fa-solid fa-circle-notch fa-spin" />
              <span>Loading system data&hellip;</span>
            </div>
          ) : (
            <>
              {isViewerReadOnly && (
                <div style={{ marginBottom: '1rem', padding: '0.9rem 1rem', borderRadius: '0.85rem', background: 'rgba(14, 165, 233, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#c7f2ff', fontSize: '0.92rem', fontWeight: 500 }}>
                  Viewer mode is read only. Data can be inspected, but admin controls are disabled.
                </div>
              )}

              {/* Section */}
              {activeSection === 'overview' && (
                <OverviewSection systemStats={systemStats} systemInfo={systemInfo} />
              )}

              {/* Section */}
              {activeSection === 'devices' && (
                <ConnectionsSection
                  deviceKeys={deviceKeys}
                  loadingDeviceKeys={loadingDeviceKeys}
                  systemInfo={systemInfo}
                />
              )}

              {/* Section */}
              {activeSection === 'device-keys' && (
                <DeviceKeysSection
                  DEVICE_KEY_PRESETS={DEVICE_KEY_PRESETS}
                  handleCreatePresetDeviceKey={handleCreatePresetDeviceKey}
                  creatingDeviceKey={creatingDeviceKey}
                  deviceKeyForm={deviceKeyForm}
                  setDeviceKeyForm={setDeviceKeyForm}
                  lastGeneratedPairingKey={lastGeneratedPairingKey}
                  selectedDeviceType={selectedDeviceType}
                  setSelectedDeviceType={setSelectedDeviceType}
                  handleGenerateDeviceId={handleGenerateDeviceId}
                  handleGeneratePairingKey={handleGeneratePairingKey}
                  handleCreateDeviceKey={handleCreateDeviceKey}
                  generatedDeviceToken={generatedDeviceToken}
                  handleCopyDeviceToken={handleCopyDeviceToken}
                  handleCopyPairingKey={handleCopyPairingKey}
                  keySearch={keySearch}
                  setKeySearch={setKeySearch}
                  loadDeviceKeys={loadDeviceKeys}
                  loadingDeviceKeys={loadingDeviceKeys}
                  deviceKeys={deviceKeys}
                  selectedKeys={selectedKeys}
                  handleSelectKey={handleSelectKey}
                  handleForceUnpair={handleForceUnpair}
                  handleOpenForcePairModal={handleOpenForcePairModal}
                  handleToggleDeviceKeyStatus={handleToggleDeviceKeyStatus}
                  handleDeleteDeviceKey={handleDeleteDeviceKey}
                  setSelectedKeys={setSelectedKeys}
                  handleBatchRevoke={handleBatchRevoke}
                  isBatchRevoking={isBatchRevoking}
                />
              )}

              {/* Section */}
              {activeSection === 'ui' && (
                <UISection
                  uiPreferences={uiPreferences}
                  handleUiPreferenceChange={handleUiPreferenceChange}
                  handleAddCustomSensor={handleAddCustomSensor}
                  sensorRegistry={sensorRegistry}
                  handleDeleteCustomSensor={handleDeleteCustomSensor}
                  handleUiSensorIconChange={handleUiSensorIconChange}
                  handleUiSensorColorChange={handleUiSensorColorChange}
                  deleteLogs={deleteLogs}
                  handleUiSensorAnalyticsToggle={handleUiSensorAnalyticsToggle}
                  handleUiSensorDashboardToggle={handleUiSensorDashboardToggle}
                  handleSaveUiPreferences={handleSaveUiPreferences}
                  savingUiPreferences={savingUiPreferences}
                />
              )}

              {/* Section */}
              {activeSection === 'users' && (
                <UsersSection
                  filteredUsers={filteredUsers}
                  loadUsers={loadUsers}
                  usersLoading={usersLoading}
                  users={users}
                  userForm={userForm}
                  handleUserFormChange={handleUserFormChange}
                  creatingUser={creatingUser}
                  handleCreateUser={handleCreateUser}
                  resetUserForm={resetUserForm}
                  usersQuery={usersQuery}
                  setUsersQuery={setUsersQuery}
                  selectedUserIds={selectedUserIds}
                  handleSelectAllUsers={handleSelectAllUsers}
                  handleToggleUserSelection={handleToggleUserSelection}
                  user={user}
                  handleViewUserDashboard={handleViewUserDashboard}
                  handleUserRoleUpdate={handleUserRoleUpdate}
                  handleUserStatusUpdate={handleUserStatusUpdate}
                  handleOpenDeleteModal={handleOpenDeleteModal}
                  isBulkActionLoading={isBulkActionLoading}
                  handleBulkAction={handleBulkAction}
                  setSelectedUserIds={setSelectedUserIds}
                  isDeleteModalOpen={isDeleteModalOpen}
                  setIsDeleteModalOpen={setIsDeleteModalOpen}
                  userToDelete={userToDelete}
                  handleConfirmDeleteUser={handleConfirmDeleteUser}
                />
              )}

              {/* Section */}
              {activeSection === 'sensors' && (
                <SensorsSection
                  PLANT_OPTIONS={PLANT_OPTIONS}
                  selectedPlantKey={selectedPlantKey}
                  setSelectedPlantKey={setSelectedPlantKey}
                  plantWateringConfig={plantWateringConfig}
                  handlePlantWateringChange={handlePlantWateringChange}
                  sensorRegistry={sensorRegistry}
                  plantSensorConfig={plantSensorConfig}
                  buildSensorThresholdPreset={buildSensorThresholdPreset}
                  handlePlantThresholdChange={handlePlantThresholdChange}
                  handleSavePlantSensorConfig={handleSavePlantSensorConfig}
                  savingPlantSensorConfig={savingPlantSensorConfig}
                />
              )}

              {/* Section */}
              {activeSection === 'limits' && (
                <LimitsSection
                  limitsForm={limitsForm}
                  limitErrors={limitErrors}
                  aiUsageData={aiUsageData}
                  savingLimits={savingLimits}
                  handleLimitChange={handleLimitChange}
                  handleSaveLimits={handleSaveLimits}
                  setActiveSection={setActiveSection}
                />
              )}

              {/* Section */}
              {activeSection === 'config' && (
                <ConfigSection configData={configData} />
              )}

              {/* Section */}
              {activeSection === 'data' && (
                <RawDataSection
                  sensorData={sensorData}
                  waterStatus={waterStatus}
                  onRefresh={() => fetchAllData(true)}
                />
              )}

              {/* Section */}
              {activeSection === 'logs' && (
                <LogsSection
                  filteredLogs={filteredLogs}
                  logSearch={logSearch}
                  logLevel={logLevel}
                  setLogSearch={setLogSearch}
                  setLogLevel={setLogLevel}
                  exportLogs={exportLogs}
                  exportAuditLogs={exportAuditLogs}
                  deleteLogs={deleteLogs}
                  logEndRef={logEndRef}
                />
              )}
              
              {/* Section */}
              {activeSection === 'mock' && (
                <MockSection
                  mockEnabled={mockEnabled}
                  handleMockToggle={handleMockToggle}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Force Pair Modal */}
      {isForcePairModalOpen && (
        <div className="adm-modal-overlay">
          <div className="adm-modal adm-glass-box" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="adm-modal-header">
              <h3><i className="fa-solid fa-link" /> Force Pair Device</h3>
              <button 
                className="adm-modal-close" 
                onClick={() => setIsForcePairModalOpen(false)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="adm-modal-body">
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.2rem' }}>
                Manually link <strong>{targetDeviceIdForForcePair}</strong> to a specific user account. 
                This will generate a new access token for the device.
              </p>
              
              <div className="adm-form-group">
                <label>Select User</label>
                <select 
                  value={selectedUserIdForForcePair}
                  onChange={(e) => setSelectedUserIdForForcePair(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Choose a user --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="adm-modal-footer" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button 
                  className="adm-btn adm-btn--ghost" 
                  onClick={() => setIsForcePairModalOpen(false)}
                  disabled={isForcePairing}
                >
                  Cancel
                </button>
                <button 
                  className="adm-btn adm-btn--primary"
                  onClick={handleConfirmForcePair}
                  disabled={isForcePairing || !selectedUserIdForForcePair}
                  style={{
                    background: 'var(--admin-gradient-cyan-sky)',
                    color: '#fff',
                    padding: '0.6rem 1.2rem',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {isForcePairing ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-check" />} Confirm Pairing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, color, label, value }) {
  return (
    <div className={`adm-stat-card adm-stat-card--${color}`}>
      <div className="adm-stat-icon-wrap">
        <i className={`fa-solid ${icon}`} />
      </div>
      <div className="adm-stat-body">
        <div className="adm-stat-value">{value}</div>
        <div className="adm-stat-label">{label}</div>
      </div>
    </div>
  );
}

function DeviceCard({ name, icon, status, detail, color }) {
  const isOnline = status?.toLowerCase().includes('online') ||
                   status?.toLowerCase().includes('connected') ||
                   status?.toLowerCase().includes('active');
  return (
    <div className={`adm-device-card adm-device-card--${color}`}>
      <div className="adm-device-icon">
        <i className={`fa-solid ${icon}`} />
      </div>
      <div className="adm-device-info">
        <div className="adm-device-name">{name}</div>
        <div className="adm-device-detail">{detail}</div>
        <div className="adm-device-status">
          <span className={`adm-status-dot ${isOnline ? 'adm-status-dot--green' : 'adm-status-dot--red'}`} />
          {status}
        </div>
      </div>
    </div>
  );
}

function LogBadge({ type, count, label }) {
  return (
    <div className={`adm-log-badge adm-log-badge--${type}`}>
      <span className="adm-log-badge-count">{count}</span>
      <span className="adm-log-badge-label">{label}</span>
    </div>
  );
}