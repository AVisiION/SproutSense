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
import { ACCOUNT_STATUS, ROLE, PERMISSION } from '../../auth/permissions';
import './Admin.css';
import { setMockEnabled, isMockEnabled } from '../../services/mockDataService';
import MockDataPanel from './MockDataPanel';
import './MockDataPanel.css';

const SECTIONS = [
  { id: 'overview', label: 'Overview',  icon: 'fa-chart-line' },
  { id: 'devices',  label: 'Devices',   icon: 'fa-microchip' },
  { id: 'device-keys', label: 'Device Keys', icon: 'fa-key' },
  { id: 'users',    label: 'Users',     icon: 'fa-users' },
  { id: 'ui',       label: 'UI',        icon: 'fa-palette' },
  { id: 'sensors',  label: 'Plant Sensors',   icon: 'fa-seedling' },
  { id: 'limits',   label: 'Limits',    icon: 'fa-gauge-high' },
  { id: 'config',   label: 'Config',    icon: 'fa-sliders' },
  { id: 'data',     label: 'Raw Data',  icon: 'fa-database' },
  { id: 'logs',     label: 'Logs',      icon: 'fa-terminal' },
  { id: 'mock',     label: 'Mock Data', icon: 'fa-vial' }, // New Mock Data tab
];

const PLANT_OPTIONS = [
  { key: 'tomato', label: 'Tomato' },
  { key: 'potato', label: 'Potato' },
  { key: 'pepper_bell', label: 'Pepper (Bell)' },
  { key: 'maize', label: 'Maize (Corn)' },
  { key: 'grape', label: 'Grape' },
  { key: 'apple', label: 'Apple' },
  { key: 'peach', label: 'Peach' },
  { key: 'strawberry', label: 'Strawberry' },
];

const DEVICE_KEY_PRESETS = [
  { deviceId: 'ESP32-SENSOR', displayName: 'Environmental Sensor Node' },
  { deviceId: 'ESP32-CAM', displayName: 'Disease Detection Camera' },
];

const LOG_TYPES = { info: 'info', success: 'success', warning: 'warning', error: 'error' };

// ─── Validation Utilities ─────────────────────────────────────────────────────
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? null : 'Invalid email format';
};

const validatePassword = (password, minLength = 12) => {
  if (password.length < minLength) return `Must be at least ${minLength} characters`;
  if (!/[a-z]/.test(password)) return 'Must contain lowercase letters';
  if (!/[A-Z]/.test(password)) return 'Must contain uppercase letters';
  if (!/[0-9]/.test(password)) return 'Must contain numbers';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Must contain special characters';
  return null;
};

const validateSensorForm = (form) => {
  const errors = {};
  if (!form.name?.trim()) errors.name = 'Sensor name required';
  if (!form.key?.trim()) errors.key = 'Sensor key required';
  if (!form.unit?.trim()) errors.unit = 'Unit required';
  if (typeof form.minThreshold !== 'number') errors.minThreshold = 'Min threshold required';
  if (typeof form.maxThreshold !== 'number') errors.maxThreshold = 'Max threshold required';
  if (form.minThreshold >= form.maxThreshold) {
    errors.maxThreshold = 'Must be greater than min threshold';
  }
  return errors;
};

const validateUserForm = (form, isCreate = true) => {
  const errors = {};
  if (!form.fullName?.trim()) errors.fullName = 'Full name required';
  if (!form.email?.trim()) errors.email = 'Email required';
  const emailError = validateEmail(form.email);
  if (emailError) errors.email = emailError;
  if (isCreate) {
    if (!form.password) errors.password = 'Password required';
    const minLen = form.roleKey === ROLE.ADMIN ? 14 : 12;
    const passError = validatePassword(form.password, minLen);
    if (passError) errors.password = passError;
  }
  return errors;
};


const DEFAULT_SENSOR_FORM = {
  name: '',
  key: '',
  unit: '',
  dataType: 'number',
  category: 'custom',
  minThreshold: 0,
  maxThreshold: 100,
  warningThreshold: 70,
  criticalThreshold: 85,
  chartType: 'line',
  enabled: true,
  showInDashboard: true,
  showInAnalytics: true,
};

const DEFAULT_USER_FORM = {
  fullName: '',
  email: '',
  password: '',
  roleKey: ROLE.USER,
  accountStatus: ACCOUNT_STATUS.ACTIVE,
  emailVerified: true,
  sensorDataVisible: true,
};

const DEFAULT_UI_PREFERENCES = {
  dashboardSections: {
    sensors: true,
    analytics: true,
    alerts: true,
    controls: true,
    ai: true,
    insights: true,
  },
  sidebarVisibility: {
    home: true,
    sensors: true,
    analytics: true,
    alerts: true,
    controls: true,
    ai: true,
    insights: true,
    backend: true,
    esp32: true,
    settings: true,
  },
  widgets: {
    showAlertBadge: true,
    showStatusDots: true,
    showSystemStatusPanel: true,
  }
};

const buildSensorThresholdPreset = (sensor) => ({
  minThreshold: Number(sensor?.minThreshold ?? 0),
  maxThreshold: Number(sensor?.maxThreshold ?? 100),
  warningThreshold: Number(sensor?.warningThreshold ?? 70),
  criticalThreshold: Number(sensor?.criticalThreshold ?? 85),
});

const buildDefaultPlantSensorConfig = (registry) => {
  const bySensor = (Array.isArray(registry) ? registry : []).reduce((acc, sensor) => {
    if (sensor?.key) {
      acc[sensor.key] = buildSensorThresholdPreset(sensor);
    }
    return acc;
  }, {});

  return {
    tomato: bySensor,
  };
};

const buildDefaultPlantWateringConfig = (cfgRaw) => {
  const cfg = cfgRaw?.config || cfgRaw || {};
  return {
    tomato: {
      moistureThreshold: Number(cfg?.moistureThreshold ?? 30),
      maxWateringCyclesPerDay: Number(cfg?.maxWateringCyclesPerDay ?? 3),
      maxCyclesPerHour: Number(cfg?.wateringSystem?.maxCyclesPerHour ?? 4),
      maxCyclesPerDay: Number(cfg?.wateringSystem?.maxCyclesPerDay ?? 6),
    },
  };
};

export default function AdminPanelPage() {
  const { logout, user, hasPermission } = useAuth();
  const adminUser = user?.fullName || user?.email || 'admin';
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
  const [deviceKeyForm, setDeviceKeyForm] = useState({ deviceId: '', displayName: '' });
  const [deviceKeys, setDeviceKeys] = useState([]);
  const [loadingDeviceKeys, setLoadingDeviceKeys] = useState(false);
  const [creatingDeviceKey, setCreatingDeviceKey] = useState(false);
  const [generatedDeviceSecret, setGeneratedDeviceSecret] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [keySearch, setKeySearch] = useState('');
  const [isBatchRevoking, setIsBatchRevoking] = useState(false);

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

  const handleCreateDeviceKey = async () => {
    const deviceId = deviceKeyForm.deviceId.trim().toUpperCase();
    if (!deviceId) {
      log('Device ID is required', LOG_TYPES.error);
      return;
    }

    if (!canUpdateConfig) {
      log('Device key creation blocked: insufficient permissions', LOG_TYPES.error);
      return;
    }

    setCreatingDeviceKey(true);
    try {
      const res = await deviceAPI.createKey({
        deviceId,
        displayName: deviceKeyForm.displayName.trim(),
      });
      setGeneratedDeviceSecret(res?.device?.deviceSecret);
      setDeviceKeyForm({ deviceId: '', displayName: '' });
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

    setDeviceKeyForm({
      deviceId: preset.deviceId,
      displayName: preset.displayName,
    });
    setCreatingDeviceKey(true);
    try {
      const res = await deviceAPI.createKey({
        deviceId: preset.deviceId,
        displayName: preset.displayName,
      });
      setGeneratedDeviceSecret(res?.device?.deviceSecret);
      await loadDeviceKeys();
      log(`Device key created for ${preset.deviceId}`, LOG_TYPES.success);
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

  const handleCopySecret = async () => {
    if (!generatedDeviceSecret) return;
    try {
      await navigator.clipboard.writeText(generatedDeviceSecret);
      log('Device secret copied to clipboard', LOG_TYPES.success);
    } catch {
      log('Failed to copy secret', LOG_TYPES.error);
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

  const clearLogs = () => {
    setActionLog([]);
    log('Log history cleared', LOG_TYPES.warning);
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
      log(`Role updated for ${targetUser.email}: ${targetUser.role} → ${nextRole}`, LOG_TYPES.success);
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
      log(`Account status updated for ${targetUser.email}: ${targetUser.accountStatus} → ${nextStatus}`, LOG_TYPES.success);
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

  const handleViewUserDashboard = (targetUser) => {
    if (!targetUser?.id) return;
    const query = new URLSearchParams({
      userId: targetUser.id,
      role: targetUser.role || 'user',
      plant: targetUser.preferredPlant || 'tomato',
    }).toString();
    window.open(`/home?previewUser=${query}`, '_blank', 'noopener,noreferrer');
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

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-brand">
          <img src="/assets/icon.svg" alt="" className="adm-brand-logo" />
          <div className="adm-brand-text">
            <span className="adm-brand-name">SproutSense</span>
            <span className="adm-brand-role">Control Panel</span>
          </div>
        </div>

        {/* Admin Profile Mini */}
        <div className="adm-sidebar-profile">
          <div className="adm-profile-avatar">
            {(adminUser?.charAt(0) || 'A').toUpperCase()}
          </div>
          <div className="adm-profile-info">
            <span className="adm-profile-name">{adminUser}</span>
            <span className="adm-profile-role">
              <i className="fa-solid fa-shield-halved" /> Administrator
            </span>
          </div>
        </div>

        <div className="adm-sidebar-divider" />

        <div className="adm-nav-group-label">Navigation</div>
        <nav className="adm-nav">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`adm-nav-item${activeSection === s.id ? ' active' : ''}`}
              onClick={() => {
                setActiveSection(s.id);
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <i className={`fa-solid ${s.icon} adm-nav-icon`} />
              <span className="adm-nav-label">{s.label}</span>
              {activeSection === s.id && <span className="adm-nav-pill" />}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-session-info">
            <i className="fa-solid fa-signal" />
            <span>Uptime: {formatUptime(uptime)}</span>
          </div>
          <div className="adm-sidebar-version">
            <i className="fa-solid fa-code-branch" />
            <span>v{systemInfo?.version || '3.1.0'}</span>
          </div>
          <button 
            className="adm-sidebar-close-btn" 
            onClick={() => setSidebarOpen(false)}
            title="Close sidebar"
          >
            <i className="fa-solid fa-xmark" />
            <span>Close</span>
          </button>
          <button className="adm-logout-btn" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <div 
        className="adm-sidebar-overlay"
        onClick={() => setSidebarOpen(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
        aria-label="Close sidebar"
        style={{ display: sidebarOpen ? 'block' : 'none' }}
      />

      {/* ── Main ──────────────────────────────────────── */}
      <main className="adm-main">

        {/* Header / Navbar */}
        <header className="adm-header">
          <div className="adm-header-left">
            <button className="adm-toggle-btn" onClick={() => setSidebarOpen(o => !o)}>
              <i className={`fa-solid ${sidebarOpen ? 'fa-indent' : 'fa-bars'}`} />
            </button>
            <div className="adm-header-breadcrumb">
              <span className="adm-breadcrumb-root">Admin</span>
              <i className="fa-solid fa-chevron-right adm-breadcrumb-sep" />
              <span className="adm-breadcrumb-current">
                <i className={`fa-solid ${SECTIONS.find(s => s.id === activeSection)?.icon}`} />
                {SECTIONS.find(s => s.id === activeSection)?.label}
              </span>
            </div>
          </div>
          <div className="adm-header-right">
            <div className="adm-header-env">
              <span className="adm-env-dot" />
              <span>{mockEnabled ? 'Mock Mode' : 'Production'}</span>
            </div>
            <span className="adm-badge adm-badge--green">
              <i className="fa-solid fa-shield-halved" /> Secure
            </span>
            <button
              className={`adm-refresh-btn${refreshing ? ' spinning' : ''}`}
              onClick={() => fetchAllData(true)}
              title="Refresh all data"
            >
              <i className="fa-solid fa-rotate" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="adm-content">
          {loading ? (
            <div className="adm-loading">
              <i className="fa-solid fa-circle-notch fa-spin" />
              <span>Loading system data&hellip;</span>
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ────────────────────────────────── */}
              {activeSection === 'overview' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-chart-line" /> Dashboard Overview</h2>
                    <span className="adm-section-badge">Live Intelligence</span>
                  </div>

                  <div className="adm-dashboard-grid">
                    {/* User Distribution Card */}
                    <div className="adm-glass-box adm-stat-widget">
                      <div className="adm-widget-header">
                        <div className="adm-widget-icon" style={{ background: 'rgba(34, 211, 238, 0.1)', color: '#22d3ee' }}>
                          <i className="fa-solid fa-users" />
                        </div>
                        <div className="adm-widget-title">
                          <h3>User Activity</h3>
                          <p>{systemStats?.users?.online || 0} active in last 15m</p>
                        </div>
                        <div className="adm-widget-value">{systemStats?.users?.total || 0}</div>
                      </div>
                      <div className="adm-widget-content">
                        <div className="adm-role-bars">
                          {Object.entries(systemStats?.users?.roleDistribution || {}).map(([role, data]) => (
                            <div key={role} className="adm-role-bar-item">
                              <div className="adm-role-label">
                                <span>{role.charAt(0).toUpperCase() + role.slice(1)}s</span>
                                <span>{data.total}</span>
                              </div>
                              <div className="adm-progress-bg">
                                <div 
                                  className={`adm-progress-fill adm-progress-fill--${role}`} 
                                  style={{ width: `${(data.total / (systemStats?.users?.total || 1)) * 100}%` }}
                                />
                              </div>
                              <div className="adm-role-online">
                                <span className="adm-pulse-dot" /> {data.online} Online
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Most Used Plant & Network Health */}
                    <div className="adm-dashboard-side">
                      <div className="adm-glass-box adm-mini-widget">
                        <div className="adm-mini-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                          <i className="fa-solid fa-leaf" />
                        </div>
                        <div className="adm-mini-info">
                          <span className="adm-mini-label">Popular Growth Choice</span>
                          <span className="adm-mini-value">{systemStats?.users?.topPlant || 'None'}</span>
                        </div>
                      </div>

                      <div className="adm-glass-box adm-mini-widget">
                        <div className="adm-mini-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                          <i className="fa-solid fa-database" />
                        </div>
                        <div className="adm-mini-info">
                          <span className="adm-mini-label">Database Sync</span>
                          <span className="adm-mini-value">{systemInfo?.database || 'Connected'}</span>
                        </div>
                      </div>

                      <div className="adm-glass-box adm-mini-widget">
                        <div className="adm-mini-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                          <i className="fa-solid fa-code-branch" />
                        </div>
                        <div className="adm-mini-info">
                          <span className="adm-mini-label">System Kernel</span>
                          <span className="adm-mini-value">v{systemInfo?.version || '1.0.0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── DEVICES ─────────────────────────────────── */}
              {activeSection === 'devices' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-microchip" /> Connected Devices</h2>
                  </div>
                  <div className="adm-device-grid">
                    <DeviceCard
                      name="ESP32-SENSOR"
                      icon="fa-wifi"
                      status={systemInfo?.esp32 || 'Unknown'}
                      detail="Environmental monitoring node"
                      color="green"
                    />
                    <DeviceCard
                      name="ESP32-CAM"
                      icon="fa-camera"
                      status={systemInfo?.esp32Cam || 'Unknown'}
                      detail="AI disease detection camera"
                      color="blue"
                    />
                    <DeviceCard
                      name="WebSocket"
                      icon="fa-bolt"
                      status={systemInfo?.websocket || 'Unknown'}
                      detail="Real-time data stream"
                      color="yellow"
                    />
                    <DeviceCard
                      name="Backend API"
                      icon="fa-server"
                      status={systemInfo?.backend || 'Online'}
                      detail="Node.js Express server"
                      color="purple"
                    />
                  </div>
                </div>
              )}

              {/* ── DEVICE KEYS ─────────────────────────────────────── */}
              {activeSection === 'device-keys' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-key" /> Device Key Management</h2>
                    <span className="adm-section-badge">Generate & Manage</span>
                  </div>

                  {/* Create New Device Key */}
                  <div className="adm-glass-box">
                    <h3><i className="fa-solid fa-plus-circle" /> Generate New Device Key</h3>
                    <div className="adm-form-row" style={{ marginBottom: '0.8rem' }}>
                      {DEVICE_KEY_PRESETS.map((preset) => (
                        <button
                          key={preset.deviceId}
                          onClick={() => handleCreatePresetDeviceKey(preset)}
                          disabled={creatingDeviceKey}
                          style={{
                            background: 'rgba(148, 163, 184, 0.15)',
                            color: '#cbd5e1',
                            padding: '1.55rem 1rem',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            borderRadius: '0.5rem',
                            fontSize: '0.82rem',
                            fontWeight: '600',
                            cursor: creatingDeviceKey ? 'not-allowed' : 'pointer',
                            opacity: creatingDeviceKey ? 0.6 : 1,
                            marginRight: preset.deviceId === 'ESP32-SENSOR' ? '1rem' : undefined,
                          }}
                        >
                          <i className="fa-solid fa-wand-magic-sparkles" /> Quick Create {preset.deviceId}
                        </button>
                      ))}
                    </div>
                    <div className="adm-form-row">
                      <div className="adm-form-group">
                        <label>Device ID</label>
                        <input
                          type="text"
                          placeholder="ESP32-SENSOR"
                          value={deviceKeyForm.deviceId}
                          onChange={(e) => setDeviceKeyForm({ ...deviceKeyForm, deviceId: e.target.value.toUpperCase() })}
                          maxLength={50}
                        />
                      </div>
                      <div className="adm-form-group">
                        <label>Display Name (Optional)</label>
                        <input
                          type="text"
                          placeholder="Greenhouse Node"
                          value={deviceKeyForm.displayName}
                          onChange={(e) => setDeviceKeyForm({ ...deviceKeyForm, displayName: e.target.value })}
                          maxLength={120}
                        />
                      </div>
                      <div className="adm-form-group">
                        <button
                          onClick={handleCreateDeviceKey}
                          disabled={creatingDeviceKey || !deviceKeyForm.deviceId}
                          style={{
                            background: 'linear-gradient(135deg, #22d3ee, #0ea5e9)',
                            color: '#fff',
                            padding: '0.7rem 1.2rem',
                            border: 'none',
                            borderRadius: '0.6rem',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            cursor: creatingDeviceKey ? 'not-allowed' : 'pointer',
                            opacity: creatingDeviceKey ? 0.6 : 1,
                          }}
                        >
                          <i className={`fa-solid ${creatingDeviceKey ? 'fa-spinner fa-spin' : 'fa-plus'}`} /> {creatingDeviceKey ? 'Creating...' : 'Create Key'}
                        </button>
                      </div>
                    </div>

                    {/* Generated Secret Display */}
                    {generatedDeviceSecret && (
                      <div style={{
                        marginTop: '1.2rem',
                        padding: '1rem',
                        background: 'rgba(34, 211, 238, 0.1)',
                        border: '1px solid rgba(34, 211, 238, 0.3)',
                        borderRadius: '0.6rem',
                      }}>
                        <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>
                          <i className="fa-solid fa-shield" /> Generated Device Secret (Save this immediately!)
                        </p>
                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                          <code style={{
                            flex: 1,
                            padding: '0.8rem',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(34, 211, 238, 0.2)',
                            borderRadius: '0.4rem',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            color: '#22d3ee',
                            wordBreak: 'break-all',
                          }}>
                            {generatedDeviceSecret}
                          </code>
                          <button
                            onClick={handleCopySecret}
                            style={{
                              padding: '0.6rem 1rem',
                              background: 'rgba(34, 211, 238, 0.2)',
                              border: '1px solid rgba(34, 211, 238, 0.4)',
                              borderRadius: '0.4rem',
                              color: '#22d3ee',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <i className="fa-solid fa-copy" /> Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Registered Device Keys with Search and Cards */}
                  <div className="adm-glass-box">
                    <div className="adm-search-row">
                      <div className="adm-search-container">
                        <i className="fa-solid fa-magnifying-glass" />
                        <input 
                          type="text" 
                          className="adm-search-input" 
                          placeholder="Search by ID, Name or User Email..." 
                          value={keySearch}
                          onChange={(e) => setKeySearch(e.target.value)}
                        />
                      </div>
                      <button className="adm-icon-btn" onClick={loadDeviceKeys} title="Refresh Device Keys">
                        <i className={`fa-solid fa-rotate ${loadingDeviceKeys ? 'fa-spin' : ''}`} />
                      </button>
                    </div>

                    {loadingDeviceKeys ? (
                      <div className="adm-loading">
                        <i className="fa-solid fa-spinner fa-spin" />
                        <span>Synchronizing Secure Keys...</span>
                      </div>
                    ) : (
                      <>
                        <div className="adm-key-grid">
                          {deviceKeys
                            .filter(k => {
                              const q = keySearch.toLowerCase().trim();
                              if (!q) return true;
                              return (
                                k.deviceId.toLowerCase().includes(q) ||
                                (k.displayName || '').toLowerCase().includes(q) ||
                                (k.linkedUser?.email || '').toLowerCase().includes(q) ||
                                (k.linkedUser?.fullName || '').toLowerCase().includes(q)
                              );
                            })
                            .map((key) => (
                              <div 
                                key={key.deviceId} 
                                className={`adm-key-card ${selectedKeys.includes(key.deviceId) ? 'adm-key-card--selected' : ''}`}
                              >
                                <div className="adm-key-selection">
                                  <input 
                                    type="checkbox" 
                                    className="adm-key-checkbox"
                                    checked={selectedKeys.includes(key.deviceId)}
                                    onChange={(e) => handleSelectKey(key.deviceId, e.target.checked)}
                                  />
                                </div>

                                <div className="adm-key-header">
                                  <span className="adm-key-id">{key.deviceId}</span>
                                  <span className="adm-key-name">{key.displayName || 'Unnamed Terminal'}</span>
                                </div>

                                {key.isLinked ? (
                                  <div className="adm-key-owner">
                                    <div className="adm-owner-avatar">
                                      {key.linkedUser?.fullName?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="adm-owner-info">
                                      <span className="adm-owner-name">{key.linkedUser?.fullName}</span>
                                      <span className="adm-owner-email">{key.linkedUser?.email}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="adm-key-owner" style={{ opacity: 0.5, borderStyle: 'dashed' }}>
                                    <div className="adm-owner-avatar" style={{ background: 'rgba(148, 163, 184, 0.2)' }}>
                                      <i className="fa-solid fa-unlink" style={{ fontSize: '0.7rem' }} />
                                    </div>
                                    <div className="adm-owner-info">
                                      <span className="adm-owner-name">Not Linked</span>
                                      <span className="adm-owner-email">Pending assignment</span>
                                    </div>
                                  </div>
                                )}

                                <div className="adm-key-meta">
                                  <div className="adm-last-seen">
                                    <i className="fa-solid fa-clock" />
                                    {key.lastSeenAt 
                                      ? `Active ${new Date(key.lastSeenAt).toLocaleDateString()} ${new Date(key.lastSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                                      : 'Never Connected'
                                    }
                                  </div>
                                  <span className={`adm-badge ${key.isActive ? 'adm-badge--green' : 'adm-badge--gray'}`}>
                                    {key.isActive ? 'ACTIVE' : 'REVOKED'}
                                  </span>
                                </div>

                                <div className="adm-key-footer">
                                  <button 
                                    className="adm-icon-btn ad-icon-btn--yellow"
                                    onClick={() => handleToggleDeviceKeyStatus(key.deviceId)}
                                    title={key.isActive ? 'Revoke Access' : 'Restore Access'}
                                  >
                                    <i className={`fa-solid ${key.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`} />
                                  </button>
                                  <button 
                                    className="adm-btn-revoke"
                                    onClick={() => handleDeleteDeviceKey(key.deviceId)}
                                  >
                                    <i className="fa-solid fa-trash-can" /> Delete Key
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>

                        {deviceKeys.length === 0 && (
                          <div className="adm-empty">
                            <i className="fa-solid fa-key" />
                            <span>No device keys found. Generate one to get started.</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Batch Action Bar */}
              <div className={`adm-batch-bar ${selectedKeys.length > 0 ? 'adm-batch-bar--visible' : ''}`}>
                <div className="adm-batch-count">
                  <span>{selectedKeys.length}</span> Device Keys Selected
                </div>
                <div className="adm-batch-actions">
                  <button className="adm-batch-btn adm-batch-btn--ghost" onClick={() => setSelectedKeys([])}>
                    Cancel
                  </button>
                  <button 
                    className="adm-batch-btn adm-batch-btn--danger" 
                    onClick={handleBatchRevoke}
                    disabled={isBatchRevoking}
                  >
                    {isBatchRevoking ? 'Revoking...' : `Revoke Selected`}
                  </button>
                </div>
              </div>

              {/* ── UI ─────────────────────────────────────── */}
              {activeSection === 'ui' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-palette" /> UI Control Center</h2>
                    <span className="adm-section-badge">Live UI Config</span>
                  </div>

                  {/* Visibility Controls Grid */}
                  <div className="adm-ui-controls-grid">
                    {/* Sidebar Visibility */}
                    <div className="adm-glass-box adm-ui-panel">
                      <div className="adm-ui-panel-header">
                        <div className="adm-ui-panel-icon" style={{ background: 'rgba(34, 211, 238, 0.1)', color: '#22d3ee' }}>
                          <i className="fa-solid fa-table-columns" />
                        </div>
                        <div>
                          <h3>Sidebar Visibility</h3>
                          <span className="adm-ui-panel-sub">Control which items appear in the navigation sidebar</span>
                        </div>
                      </div>
                      <div className="adm-ui-toggle-list">
                        {Object.entries(uiPreferences.sidebarVisibility).map(([key, enabled]) => (
                          <label className="adm-ui-toggle-item" key={`sidebar-${key}`}>
                            <div className="adm-ui-toggle-info">
                              <i className="fa-solid fa-circle" style={{ fontSize: '0.4rem', color: enabled ? '#4ade80' : '#334155' }} />
                              <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                            </div>
                            <div className="adm-ui-switch">
                              <input type="checkbox" checked={Boolean(enabled)} onChange={(e) => handleUiPreferenceChange('sidebarVisibility', key, e.target.checked)} />
                              <span className="adm-ui-switch-slider" />
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Dashboard Sections & Widgets */}
                    <div className="adm-glass-box adm-ui-panel">
                      <div className="adm-ui-panel-header">
                        <div className="adm-ui-panel-icon" style={{ background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa' }}>
                          <i className="fa-solid fa-layer-group" />
                        </div>
                        <div>
                          <h3>Dashboard Sections</h3>
                          <span className="adm-ui-panel-sub">Toggle visibility of main dashboard modules</span>
                        </div>
                      </div>
                      <div className="adm-ui-toggle-list">
                        {Object.entries(uiPreferences.dashboardSections).map(([key, enabled]) => (
                          <label className="adm-ui-toggle-item" key={`dash-${key}`}>
                            <div className="adm-ui-toggle-info">
                              <i className="fa-solid fa-circle" style={{ fontSize: '0.4rem', color: enabled ? '#4ade80' : '#334155' }} />
                              <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                            </div>
                            <div className="adm-ui-switch">
                              <input type="checkbox" checked={Boolean(enabled)} onChange={(e) => handleUiPreferenceChange('dashboardSections', key, e.target.checked)} />
                              <span className="adm-ui-switch-slider" />
                            </div>
                          </label>
                        ))}
                      </div>

                      <div className="adm-ui-divider" />

                      <div className="adm-ui-panel-header" style={{ marginBottom: '0.5rem' }}>
                        <div className="adm-ui-panel-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}>
                          <i className="fa-solid fa-sliders" />
                        </div>
                        <div>
                          <h3>Widget Controls</h3>
                          <span className="adm-ui-panel-sub">Fine-tune widget appearance</span>
                        </div>
                      </div>
                      <div className="adm-ui-toggle-list">
                        {Object.entries(uiPreferences.widgets).map(([key, enabled]) => (
                          <label className="adm-ui-toggle-item" key={`widget-${key}`}>
                            <div className="adm-ui-toggle-info">
                              <i className="fa-solid fa-circle" style={{ fontSize: '0.4rem', color: enabled ? '#4ade80' : '#334155' }} />
                              <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                            </div>
                            <div className="adm-ui-switch">
                              <input type="checkbox" checked={Boolean(enabled)} onChange={(e) => handleUiPreferenceChange('widgets', key, e.target.checked)} />
                              <span className="adm-ui-switch-slider" />
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sensor Graph Config */}
                  <div className="adm-glass-box" style={{ marginTop: '1.5rem' }}>
                    <div className="adm-threshold-header">
                      <h3><i className="fa-solid fa-chart-line" /> Sensor Graph Configuration</h3>
                      <button className="adm-action-btn adm-action-btn--start" onClick={handleAddCustomSensor} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                        <i className="fa-solid fa-plus" /> Add Sensor
                      </button>
                    </div>

                    {sensorRegistry.length === 0 ? (
                      <div className="adm-empty-state">
                        <i className="fa-solid fa-chart-area" />
                        <p>No sensors configured for UI graph control.</p>
                        <span>Add a sensor to configure its visual appearance.</span>
                      </div>
                    ) : (
                      <div className="adm-sensor-ui-grid">
                        {sensorRegistry.map((sensor) => (
                          <div key={`ui-graph-${sensor.id}`} className="adm-sensor-ui-card">
                            <div className="adm-sensor-ui-header">
                              <div className="adm-sensor-ui-color" style={{ background: sensor.color || '#6366f1' }} />
                              <div className="adm-sensor-ui-name">
                                <h4>{sensor.name}</h4>
                                <span>{sensor.key}</span>
                              </div>
                              <button className="adm-card-btn adm-card-btn--danger" onClick={() => handleDeleteCustomSensor(sensor.id)} title="Delete Sensor">
                                <i className="fa-solid fa-trash" />
                              </button>
                            </div>

                            <div className="adm-sensor-ui-controls">
                              <div className="adm-sensor-ui-field">
                                <label>Icon Class</label>
                                <input className="adm-input" value={sensor.faIcon || ''} onChange={(e) => handleUiSensorIconChange(sensor, e.target.value)} placeholder="fa-microchip" />
                              </div>
                              <div className="adm-sensor-ui-field">
                                <label>Color</label>
                                <div className="adm-color-picker-wrap">
                                  <input type="color" value={sensor.color || '#6366f1'} onChange={(e) => handleUiSensorColorChange(sensor, e.target.value)} />
                                  <span className="adm-color-hex">{sensor.color || '#6366f1'}</span>
                                </div>
                              </div>
                              <div className="adm-sensor-ui-field">
                                <label>Chart Type</label>
                                <select className="adm-input" value={sensor.chartType || 'line'} onChange={(e) => handleUiSensorChartTypeChange(sensor, e.target.value)}>
                                  <option value="line">Line</option>
                                  <option value="area">Area</option>
                                  <option value="bar">Bar</option>
                                  <option value="gauge">Gauge</option>
                                  <option value="scorecard">Scorecard</option>
                                  <option value="status">Status</option>
                                  <option value="table">Table</option>
                                  <option value="sparkline">Sparkline</option>
                                </select>
                              </div>
                            </div>

                            <div className="adm-sensor-ui-toggles">
                              <label className="adm-ui-toggle-item">
                                <span>Show Graph</span>
                                <div className="adm-ui-switch">
                                  <input type="checkbox" checked={Boolean(sensor.showInAnalytics)} onChange={(e) => handleUiSensorAnalyticsToggle(sensor, e.target.checked)} />
                                  <span className="adm-ui-switch-slider" />
                                </div>
                              </label>
                              <label className="adm-ui-toggle-item">
                                <span>Show in Dashboard</span>
                                <div className="adm-ui-switch">
                                  <input type="checkbox" checked={Boolean(sensor.showInDashboard)} onChange={(e) => handleUiSensorDashboardToggle(sensor, e.target.checked)} />
                                  <span className="adm-ui-switch-slider" />
                                </div>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="adm-btn-row" style={{ marginTop: '1.5rem' }}>
                    <button className="adm-action-btn adm-action-btn--start" onClick={handleSaveUiPreferences} disabled={savingUiPreferences}>
                      <i className="fa-solid fa-floppy-disk" /> {savingUiPreferences ? 'Saving...' : 'Save UI Preferences'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── USERS ───────────────────────────────────── */}
              {activeSection === 'users' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <h2><i className="fa-solid fa-users" /> Identity & Access</h2>
                      <span className="adm-section-badge">{filteredUsers.length} Logged Identities</span>
                    </div>
                    <div className="adm-btn-row">
                      <button className="adm-icon-btn" onClick={loadUsers} title="Sync User Data">
                        <i className={`fa-solid fa-rotate ${usersLoading ? 'fa-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Identity Statistics */}
                  <div className="adm-dashboard-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className="adm-glass-box adm-mini-widget">
                      <div className="adm-mini-icon" style={{ background: 'rgba(34, 211, 238, 0.1)', color: '#22d3ee' }}>
                        <i className="fa-solid fa-users-viewfinder" />
                      </div>
                      <div className="adm-mini-info">
                        <span className="adm-mini-label">Total Registry</span>
                        <span className="adm-mini-value">{users.length}</span>
                      </div>
                    </div>
                    <div className="adm-glass-box adm-mini-widget">
                      <div className="adm-mini-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                        <i className="fa-solid fa-user-check" />
                      </div>
                      <div className="adm-mini-info">
                        <span className="adm-mini-label">Active Profiles</span>
                        <span className="adm-mini-value">{users.filter(u => u.accountStatus === 'active').length}</span>
                      </div>
                    </div>
                    <div className="adm-glass-box adm-mini-widget">
                      <div className="adm-mini-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <i className="fa-solid fa-user-clock" />
                      </div>
                      <div className="adm-mini-info">
                        <span className="adm-mini-label">Pending Verification</span>
                        <span className="adm-mini-value">{users.filter(u => u.accountStatus === 'pending_verification').length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Provisioning Form */}
                  <div className="adm-glass-box" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                      <i className="fa-solid fa-user-plus" style={{ color: '#22d3ee' }} /> Identity Provisioning
                    </h3>
                    
                    <div className="adm-form-grid">
                      <div className="adm-form-group">
                        <label>Full Identity Name</label>
                        <input className="adm-input" type="text" placeholder="e.g. John Doe" value={userForm.fullName} onChange={(e) => handleUserFormChange('fullName', e.target.value)} />
                      </div>
                      <div className="adm-form-group">
                        <label>Security Email</label>
                        <input className="adm-input" type="email" placeholder="user@sproutsense.io" value={userForm.email} onChange={(e) => handleUserFormChange('email', e.target.value)} />
                      </div>
                      <div className="adm-form-group">
                        <label>Initial Passkey</label>
                        <input className="adm-input" type="password" placeholder="••••••••••••" value={userForm.password} onChange={(e) => handleUserFormChange('password', e.target.value)} />
                      </div>
                      <div className="adm-form-group">
                        <label>Assigned Role</label>
                        <select className="adm-input" value={userForm.roleKey} onChange={(e) => handleUserFormChange('roleKey', e.target.value)}>
                          <option value={ROLE.ADMIN}>Administrator</option>
                          <option value={ROLE.USER}>Standard User</option>
                          <option value={ROLE.VIEWER}>Guest Viewer</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="adm-toggle-group">
                      <label className="adm-toggle-label">
                        <input type="checkbox" checked={Boolean(userForm.emailVerified)} onChange={(e) => handleUserFormChange('emailVerified', e.target.checked)} />
                        <span>Pre-Verify Email</span>
                      </label>
                      <label className="adm-toggle-label">
                        <input type="checkbox" checked={Boolean(userForm.sensorDataVisible)} onChange={(e) => handleUserFormChange('sensorDataVisible', e.target.checked)} />
                        <span>Allow Sensor Data</span>
                      </label>
                    </div>

                    <div className="adm-btn-row" style={{ marginTop: '1.5rem' }}>
                      <button className="adm-action-btn adm-action-btn--start" onClick={handleCreateUser} disabled={creatingUser}>
                        <i className="fa-solid fa-plus-circle" /> {creatingUser ? 'Provisioning...' : 'Provision New Identity'}
                      </button>
                      <button className="adm-action-btn adm-action-btn--ghost" onClick={resetUserForm}>Reset Form</button>
                    </div>
                  </div>

                  {/* Toolbar & Search */}
                  <div className="adm-toolbar">
                    <div className="adm-search-container" style={{ flex: 1, maxWidth: '400px' }}>
                      <i className="fa-solid fa-magnifying-glass" />
                      <input 
                        type="text" 
                        placeholder="Search by name, email or role..." 
                        value={usersQuery} 
                        onChange={(e) => setUsersQuery(e.target.value)} 
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Select All</span>
                      <label className="adm-toggle-sm">
                        <input 
                          type="checkbox" 
                          checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0} 
                          onChange={() => handleSelectAllUsers(filteredUsers)} 
                        />
                        <span className="slider-sm" />
                      </label>
                    </div>
                  </div>

                  {/* User Card Grid */}
                  {usersLoading ? (
                    <div className="adm-loading-block">
                      <i className="fa-solid fa-circle-notch fa-spin" />
                      <span>Syncing Identity Registry...</span>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="adm-empty-state">
                      <i className="fa-solid fa-users-slash" />
                      <p>No identities found matching the search parameters.</p>
                    </div>
                  ) : (
                    <div className="adm-user-grid">
                      {filteredUsers.map((u) => {
                        const isSelf = u.email === user?.email;
                        const isSelected = selectedUserIds.includes(u.id);
                        return (
                          <div key={u.id} className={`adm-user-card ${isSelected ? 'adm-user-card--selected' : ''}`}>
                            <div className="adm-user-card-select">
                              <input type="checkbox" checked={isSelected} onChange={() => handleToggleUserSelection(u.id)} />
                            </div>
                            
                            <div className="adm-user-card-header">
                              <div className={`adm-user-avatar adm-user-avatar--${u.role}`}>
                                {u.fullName?.charAt(0).toUpperCase() || '?'}
                                {u.accountStatus === 'active' && <span className="adm-user-online-dot" title="Active Account" />}
                              </div>
                              <div className="adm-user-card-info">
                                <h4 className="adm-user-card-name">
                                  {u.fullName} {isSelf && <span className="adm-self-pill">YOU</span>}
                                </h4>
                                <span className="adm-user-card-email">{u.email}</span>
                              </div>
                            </div>

                            <div className="adm-user-card-badges">
                              <span className={`adm-role-tag adm-role-tag--${u.role}`}>{u.role?.toUpperCase()}</span>
                              <span className={`adm-status-badge adm-status-badge--${u.accountStatus}`}>{u.accountStatus?.replace('_',' ')}</span>
                            </div>

                            <div className="adm-user-card-details">
                              <div className="adm-card-detail-item">
                                <i className="fa-solid fa-leaf" />
                                <span>{u.preferredPlant || 'Default Garden'}</span>
                              </div>
                              <div className="adm-card-detail-item">
                                <i className="fa-solid fa-clock-rotate-left" />
                                <span>{u.lastLoginAt ? `Seen ${new Date(u.lastLoginAt).toLocaleDateString()}` : 'Never Seen'}</span>
                              </div>
                            </div>

                            <div className="adm-user-card-actions">
                              <button className="adm-card-btn" onClick={() => handleViewUserDashboard(u)} title="View Dashboard">
                                <i className="fa-solid fa-desktop" />
                              </button>
                              <div className="adm-card-dropdown">
                                <select 
                                  value={u.accountStatus} 
                                  onChange={(e) => handleUserStatusUpdate(u, e.target.value)}
                                  disabled={isSelf && u.role === 'admin'}
                                >
                                  <option value="active">Active</option>
                                  <option value="suspended">Suspend</option>
                                  <option value="disabled">Disable</option>
                                </select>
                              </div>
                              <button 
                                className="adm-card-btn adm-card-btn--danger" 
                                onClick={() => handleOpenDeleteModal(u)}
                                disabled={isSelf}
                                title="Purge Identity"
                              >
                                <i className="fa-solid fa-trash-can" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Bulk Action Bar */}
                  <div className={`adm-bulk-bar ${selectedUserIds.length > 0 ? 'adm-bulk-bar--visible' : ''}`}>
                    <div className="adm-bulk-info">
                      <span className="adm-bulk-count">{selectedUserIds.length}</span> identities selected
                    </div>
                    <div className="adm-bulk-actions">
                      <button className="adm-bulk-action" onClick={() => handleBulkAction('status', 'suspended')} disabled={isBulkActionLoading}>
                        <i className="fa-solid fa-user-slash" /> Suspend
                      </button>
                      <button className="adm-bulk-action" onClick={() => handleBulkAction('status', 'active')} disabled={isBulkActionLoading}>
                        <i className="fa-solid fa-user-check" /> Activate
                      </button>
                      <div className="adm-bulk-divider" />
                      <button className="adm-bulk-action adm-bulk-action--danger" onClick={() => handleBulkAction('delete')} disabled={isBulkActionLoading}>
                        <i className="fa-solid fa-trash" /> Purge Selection
                      </button>
                      <button className="adm-bulk-close" onClick={() => setSelectedUserIds([])}>
                        <i className="fa-solid fa-times" />
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation Modal */}
                  {isDeleteModalOpen && (
                    <div className="adm-modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
                      <div className="adm-modal-content adm-glass-box" onClick={e => e.stopPropagation()}>
                        <div className="adm-modal-header" style={{ color: '#ef4444' }}>
                          <i className="fa-solid fa-triangle-exclamation" /> 
                          <h3 style={{ margin: 0 }}>Confirm Identity Purge</h3>
                        </div>
                        <div className="adm-modal-body">
                          <p>You are about to permanently delete <strong>{userToDelete?.fullName}</strong> ({userToDelete?.email}).</p>
                          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>This action is irreversible and will remove all associated telemetry history.</p>
                        </div>
                        <div className="adm-modal-footer">
                          <button className="adm-action-btn adm-action-btn--ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                          <button className="adm-action-btn adm-action-btn--stop" onClick={handleConfirmDeleteUser}>
                            Confirm Deletion
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── PLANT SENSOR CONFIG ────────────────────── */}
              {activeSection === 'sensors' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-seedling" /> Plant Sensor Configuration</h2>
                    <span className="adm-section-badge">Per Plant Thresholds</span>
                  </div>

                  {/* Plant Selector Hero */}
                  <div className="adm-glass-box adm-plant-hero">
                    <div className="adm-plant-hero-inner">
                      <div className="adm-plant-hero-icon">
                        <i className="fa-solid fa-leaf" />
                      </div>
                      <div className="adm-plant-hero-info">
                        <span className="adm-plant-hero-label">Active Plant Profile</span>
                        <h3 className="adm-plant-hero-name">
                          {PLANT_OPTIONS.find(p => p.key === selectedPlantKey)?.label || selectedPlantKey}
                        </h3>
                      </div>
                      <select className="adm-input adm-plant-select" value={selectedPlantKey} onChange={(e) => setSelectedPlantKey(e.target.value)}>
                        {PLANT_OPTIONS.map((plant) => (
                          <option key={plant.key} value={plant.key}>{plant.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="adm-plant-chips">
                      {PLANT_OPTIONS.map((plant) => (
                        <button
                          key={plant.key}
                          className={`adm-plant-chip ${selectedPlantKey === plant.key ? 'adm-plant-chip--active' : ''}`}
                          onClick={() => setSelectedPlantKey(plant.key)}
                        >
                          <i className="fa-solid fa-seedling" /> {plant.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Watering Parameters Grid */}
                  <div className="adm-watering-grid">
                    <div className="adm-watering-card">
                      <div className="adm-watering-card-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
                        <i className="fa-solid fa-droplet" />
                      </div>
                      <div className="adm-watering-card-body">
                        <span className="adm-watering-card-label">Soil Moisture Threshold</span>
                        <div className="adm-watering-card-input-wrap">
                          <input
                            className="adm-input"
                            type="number" min="0" max="100"
                            value={plantWateringConfig?.[selectedPlantKey]?.moistureThreshold ?? 30}
                            onChange={(e) => handlePlantWateringChange('moistureThreshold', e.target.value)}
                          />
                          <span className="adm-watering-unit">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="adm-watering-card">
                      <div className="adm-watering-card-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80' }}>
                        <i className="fa-solid fa-arrows-rotate" />
                      </div>
                      <div className="adm-watering-card-body">
                        <span className="adm-watering-card-label">Max Watering Cycles / Day</span>
                        <div className="adm-watering-card-input-wrap">
                          <input
                            className="adm-input"
                            type="number" min="1" max="20"
                            value={plantWateringConfig?.[selectedPlantKey]?.maxWateringCyclesPerDay ?? 3}
                            onChange={(e) => handlePlantWateringChange('maxWateringCyclesPerDay', e.target.value)}
                          />
                          <span className="adm-watering-unit">cycles</span>
                        </div>
                      </div>
                    </div>

                    <div className="adm-watering-card">
                      <div className="adm-watering-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24' }}>
                        <i className="fa-solid fa-clock" />
                      </div>
                      <div className="adm-watering-card-body">
                        <span className="adm-watering-card-label">System Max Cycles / Hour</span>
                        <div className="adm-watering-card-input-wrap">
                          <input
                            className="adm-input"
                            type="number" min="1" max="24"
                            value={plantWateringConfig?.[selectedPlantKey]?.maxCyclesPerHour ?? 4}
                            onChange={(e) => handlePlantWateringChange('maxCyclesPerHour', e.target.value)}
                          />
                          <span className="adm-watering-unit">/hr</span>
                        </div>
                      </div>
                    </div>

                    <div className="adm-watering-card">
                      <div className="adm-watering-card-icon" style={{ background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa' }}>
                        <i className="fa-solid fa-calendar-day" />
                      </div>
                      <div className="adm-watering-card-body">
                        <span className="adm-watering-card-label">System Max Cycles / Day</span>
                        <div className="adm-watering-card-input-wrap">
                          <input
                            className="adm-input"
                            type="number" min="1" max="50"
                            value={plantWateringConfig?.[selectedPlantKey]?.maxCyclesPerDay ?? 6}
                            onChange={(e) => handlePlantWateringChange('maxCyclesPerDay', e.target.value)}
                          />
                          <span className="adm-watering-unit">/day</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sensor Threshold Cards */}
                  <div className="adm-glass-box">
                    <div className="adm-threshold-header">
                      <h3><i className="fa-solid fa-sliders" /> Sensor Thresholds</h3>
                      <span className="adm-threshold-plant-badge">
                        <i className="fa-solid fa-leaf" /> {PLANT_OPTIONS.find((item) => item.key === selectedPlantKey)?.label || selectedPlantKey}
                      </span>
                    </div>

                    {sensorRegistry.length === 0 ? (
                      <div className="adm-empty-state">
                        <i className="fa-solid fa-microchip" />
                        <p>No sensors registered yet.</p>
                        <span>Configure the sensor registry to set per-plant thresholds.</span>
                      </div>
                    ) : (
                      <div className="adm-threshold-grid">
                        {sensorRegistry.map((sensor) => {
                          const sensorThresholds = plantSensorConfig?.[selectedPlantKey]?.[sensor.key]
                            || buildSensorThresholdPreset(sensor);
                          return (
                            <div key={`plant-threshold-${selectedPlantKey}-${sensor.id}`} className="adm-threshold-card">
                              <div className="adm-threshold-card-head">
                                <div className="adm-threshold-sensor-icon">
                                  <i className="fa-solid fa-microchip" />
                                </div>
                                <div>
                                  <h4 className="adm-threshold-sensor-name">{sensor.name}</h4>
                                  <span className="adm-threshold-sensor-key">{sensor.key}</span>
                                </div>
                              </div>

                              <div className="adm-threshold-fields">
                                <div className="adm-threshold-field">
                                  <label>Min</label>
                                  <input className="adm-input" type="number" value={sensorThresholds.minThreshold} onChange={(e) => handlePlantThresholdChange(sensor.key, 'minThreshold', e.target.value)} />
                                  <div className="adm-threshold-bar" style={{ background: '#3b82f6' }} />
                                </div>
                                <div className="adm-threshold-field">
                                  <label>Max</label>
                                  <input className="adm-input" type="number" value={sensorThresholds.maxThreshold} onChange={(e) => handlePlantThresholdChange(sensor.key, 'maxThreshold', e.target.value)} />
                                  <div className="adm-threshold-bar" style={{ background: '#22c55e' }} />
                                </div>
                                <div className="adm-threshold-field">
                                  <label>Warning</label>
                                  <input className="adm-input" type="number" value={sensorThresholds.warningThreshold} onChange={(e) => handlePlantThresholdChange(sensor.key, 'warningThreshold', e.target.value)} />
                                  <div className="adm-threshold-bar" style={{ background: '#f59e0b' }} />
                                </div>
                                <div className="adm-threshold-field">
                                  <label>Critical</label>
                                  <input className="adm-input" type="number" value={sensorThresholds.criticalThreshold} onChange={(e) => handlePlantThresholdChange(sensor.key, 'criticalThreshold', e.target.value)} />
                                  <div className="adm-threshold-bar" style={{ background: '#ef4444' }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="adm-btn-row" style={{ marginTop: '1.5rem' }}>
                      <button className="adm-action-btn adm-action-btn--start" onClick={handleSavePlantSensorConfig} disabled={savingPlantSensorConfig || sensorRegistry.length === 0}>
                        <i className="fa-solid fa-floppy-disk" /> {savingPlantSensorConfig ? 'Saving...' : 'Save Plant Sensor Configuration'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── LIMITS ──────────────────────────────────── */}
              {activeSection === 'limits' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-gauge-high" /> Limits & Quotas</h2>
                    <span className="adm-section-badge">System Governance</span>
                  </div>

                  {/* Limits Dashboard Grid */}
                  <div className="adm-limits-grid">
                    {/* AI Quota Card */}
                    <div className="adm-glass-box adm-limits-card">
                      <div className="adm-limits-card-header">
                        <div className="adm-limits-card-icon" style={{ background: 'rgba(167, 139, 250, 0.12)', color: '#a78bfa' }}>
                          <i className="fa-solid fa-robot" />
                        </div>
                        <div>
                          <h3>AI Analysis Quota</h3>
                          <span className="adm-limits-card-sub">Disease detection & crop health</span>
                        </div>
                      </div>

                      <div className="adm-limits-control">
                        <label className="adm-limits-label">Daily Limit</label>
                        <div className="adm-limits-input-row">
                          <input
                            className="adm-input"
                            type="number" min="1" max="100"
                            value={limitsForm.aiDailyAnalysisLimit}
                            onChange={(e) => handleLimitChange('aiDailyAnalysisLimit', e.target.value)}
                          />
                          <span className="adm-limits-unit">analyses / day</span>
                        </div>
                        {limitErrors.aiDailyAnalysisLimit && <div className="adm-input-error">{limitErrors.aiDailyAnalysisLimit}</div>}
                      </div>

                      {/* Usage Gauge */}
                      <div className="adm-limits-usage">
                        <div className="adm-limits-usage-header">
                          <span>Today's Usage</span>
                          <span className="adm-limits-usage-count">
                            {aiUsageData ? `${aiUsageData.usedCount} / ${aiUsageData.dailyLimit}` : 'N/A'}
                          </span>
                        </div>
                        <div className="adm-limits-progress-bg">
                          <div
                            className="adm-limits-progress-fill"
                            style={{
                              width: aiUsageData ? `${Math.min((aiUsageData.usedCount / aiUsageData.dailyLimit) * 100, 100)}%` : '0%',
                              background: aiUsageData && (aiUsageData.usedCount / aiUsageData.dailyLimit) > 0.8 ? '#ef4444' : '#a78bfa',
                            }}
                          />
                        </div>
                        <div className="adm-limits-usage-footer">
                          <span><i className="fa-solid fa-circle-check" style={{ color: '#4ade80' }} /> Remaining: <strong>{aiUsageData ? aiUsageData.remaining : 'N/A'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Plant Watering Info Card */}
                    <div className="adm-glass-box adm-limits-card adm-limits-card--info">
                      <div className="adm-limits-card-header">
                        <div className="adm-limits-card-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80' }}>
                          <i className="fa-solid fa-seedling" />
                        </div>
                        <div>
                          <h3>Plant Watering Limits</h3>
                          <span className="adm-limits-card-sub">Per-plant configuration</span>
                        </div>
                      </div>

                      <div className="adm-limits-info-body">
                        <div className="adm-limits-info-icon">
                          <i className="fa-solid fa-arrow-right-arrow-left" />
                        </div>
                        <p>Moisture thresholds and watering cycle limits are now configured <strong>per plant type</strong> in the Plant Sensors section.</p>
                        <button className="adm-action-btn adm-action-btn--start" style={{ marginTop: '1rem' }} onClick={() => setActiveSection('sensors')}>
                          <i className="fa-solid fa-seedling" /> Go to Plant Sensors
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="adm-btn-row" style={{ marginTop: '1.5rem' }}>
                    <button className="adm-action-btn adm-action-btn--start" onClick={handleSaveLimits} disabled={savingLimits || Object.keys(limitErrors).length > 0}>
                      <i className="fa-solid fa-save" /> {savingLimits ? 'Saving...' : 'Save Limits'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── CONFIG ──────────────────────────────────── */}
              {activeSection === 'config' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-sliders" /> Active Configuration</h2>
                  </div>
                  <div className="adm-glass-box" style={{ marginBottom: '1rem' }}>
                    <h3><i className="fa-solid fa-file-code" /> Config Snapshot</h3>
                    <p className="adm-header-sub">Read-only config view. Use Limits tab to edit operational limits.</p>
                  </div>
                  <div className="adm-glass-box">
                    {configData
                      ? Object.entries(configData).map(([k, v]) => (
                        <div className="adm-config-row" key={k}>
                          <span className="adm-config-key">
                            <i className="fa-solid fa-code" />&ensp;{k}
                          </span>
                          <span className="adm-config-val">{String(v)}</span>
                        </div>
                      ))
                      : <p className="adm-empty"><i className="fa-solid fa-circle-info" /> No config data available.</p>
                    }
                  </div>
                </div>
              )}

              {/* ── RAW DATA ────────────────────────────────── */}
              {activeSection === 'data' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-database" /> Latest Sensor Payload</h2>
                    <button className="adm-icon-btn" onClick={() => fetchAllData(true)} title="Refresh">
                      <i className="fa-solid fa-rotate" />
                    </button>
                  </div>
                  <div className="adm-glass-box">
                    <pre className="adm-pre">
                      {sensorData ? JSON.stringify(sensorData, null, 2) : 'No data available.'}
                    </pre>
                  </div>
                  <div className="adm-glass-box" style={{marginTop:'1rem'}}>
                    <h3 style={{marginBottom:'0.75rem'}}><i className="fa-solid fa-droplet" /> Water Status Payload</h3>
                    <pre className="adm-pre">
                      {waterStatus ? JSON.stringify(waterStatus, null, 2) : 'No data available.'}
                    </pre>
                  </div>
                </div>
              )}

              {/* ── LOGS ────────────────────────────────────── */}
              {activeSection === 'logs' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-terminal" /> Admin Audit Logs</h2>
                    <div className="adm-btn-row">
                      <button className="adm-icon-btn adm-icon-btn--yellow" onClick={exportLogs} title="Export current on-screen text logs">
                        <i className="fa-solid fa-file-arrow-down" />
                      </button>
                      <button className="adm-icon-btn adm-icon-btn--yellow" onClick={() => exportAuditLogs('csv')} title="Export filtered audit logs CSV">
                        <i className="fa-solid fa-file-csv" />
                      </button>
                      <button className="adm-icon-btn adm-icon-btn--yellow" onClick={() => exportAuditLogs('json')} title="Export filtered audit logs JSON">
                        <i className="fa-solid fa-file-code" />
                      </button>
                      <button className="adm-icon-btn adm-icon-btn--red" onClick={clearLogs} title="Clear logs">
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </div>

                  <div className="adm-glass-box" style={{ marginBottom: '1rem' }}>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Search</span>
                      <input
                        className="adm-input"
                        style={{ width: '220px' }}
                        type="text"
                        value={logSearch}
                        onChange={(e) => setLogSearch(e.target.value)}
                        placeholder="Search action, actor, section"
                      />
                    </div>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Level</span>
                      <select className="adm-input" value={logLevel} onChange={(e) => setLogLevel(e.target.value)}>
                        <option value="all">All</option>
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                      </select>
                    </div>
                  </div>

                  <div className="adm-log-stats">
                    <LogBadge type="success" count={filteredLogs.filter(l => l.type === 'success').length} label="Success" />
                    <LogBadge type="info"    count={filteredLogs.filter(l => l.type === 'info').length}    label="Info" />
                    <LogBadge type="warning" count={filteredLogs.filter(l => l.type === 'warning').length} label="Warning" />
                    <LogBadge type="error"   count={filteredLogs.filter(l => l.type === 'error').length}   label="Error" />
                  </div>

                  <div className="adm-glass-box" style={{ marginTop: '1rem' }}>
                    <h3><i className="fa-solid fa-table" /> Filtered Log Table ({filteredLogs.length})</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="adm-log-table">
                        <thead>
                          <tr>
                            <th>Time</th>
                            <th>Level</th>
                            <th>Actor</th>
                            <th>Section</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLogs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="adm-log-table-empty">No matching logs</td>
                            </tr>
                          ) : filteredLogs.map((entry) => (
                            <tr key={`row-${entry.id}`}>
                              <td>{entry.date} {entry.time}</td>
                              <td>
                                <span className={`adm-log-type adm-log-type--${entry.type}`}>
                                  {entry.type?.toUpperCase()}
                                </span>
                              </td>
                              <td>{entry.actor || 'admin'}</td>
                              <td>{entry.section || '-'}</td>
                              <td>{entry.msg}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="adm-log-terminal">
                    {filteredLogs.length === 0 ? (
                      <div className="adm-empty">
                        <i className="fa-solid fa-circle-check" /> No actions logged yet.
                      </div>
                    ) : (
                      filteredLogs.map(entry => (
                        <div key={entry.id} className={`adm-log-row adm-log-row--${entry.type}`}>
                          <span className="adm-log-time">[{entry.time}]</span>
                          <span className={`adm-log-type adm-log-type--${entry.type}`}>
                            [{entry.type.toUpperCase()}]
                          </span>
                          <span className="adm-log-msg">{entry.actor || 'admin'}@{entry.section || 'admin-panel'} - {entry.msg}</span>
                        </div>
                      ))
                    )}
                    <div ref={logEndRef} />
                  </div>
                </div>
              )}
              
              {/* ── MOCK DATA ───────────────────────────────── */}
              {activeSection === 'mock' && (
                <div className="adm-section">
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    background: 'var(--bg-glass, rgba(255, 255, 255, 0.05))',
                    padding: '1.25rem',
                    borderRadius: '1rem',
                    border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.1))',
                  }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main, #fff)', margin: '0 0 0.25rem 0' }}>
                        <i className="fa-solid fa-vial" style={{ color: 'var(--color-primary, #10b981)', marginRight: '0.5rem' }} />
                        Mock Data Control
                      </h2>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted, #9ca3af)', margin: 0 }}>
                        Override live API data for testing and presentations. Default: Off.
                      </p>
                    </div>

                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}>
                      <span style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 600,
                        color: mockEnabled ? 'var(--color-primary, #10b981)' : 'var(--text-muted, #9ca3af)'
                      }}>
                        {mockEnabled ? 'ON' : 'OFF'}
                      </span>

                      <span style={{ position: 'relative', display: 'inline-block', width: 52, height: 28 }}>
                        <input
                          type="checkbox"
                          checked={mockEnabled}
                          onChange={handleMockToggle}
                          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                          aria-label="Enable mock data mode"
                        />
                        <span style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 9999,
                          background: mockEnabled ? 'var(--color-primary, #10b981)' : 'var(--bg-glass-strong, rgba(255, 255, 255, 0.1))',
                          transition: 'background 200ms ease',
                          border: '1px solid var(--border-glass, rgba(255, 255, 255, 0.2))',
                        }}>
                          <span style={{
                            position: 'absolute',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#fff',
                            top: 3,
                            left: mockEnabled ? 27 : 3,
                            transition: 'left 200ms ease',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                          }} />
                        </span>
                      </span>
                    </label>
                  </div>

                  {mockEnabled ? (
                    <MockDataPanel />
                  ) : (
                    <div className="adm-glass-box" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                      <i className="fa-solid fa-power-off" style={{ fontSize: '2.5rem', color: 'var(--text-muted, #9ca3af)', marginBottom: '1rem' }} />
                      <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main, #fff)' }}>Mock Data is Disabled</h3>
                      <p style={{ margin: 0, color: 'var(--text-muted, #9ca3af)', maxWidth: '400px', marginInline: 'auto' }}>
                        Turn on the switch above to reveal the control panel and inject mock scenarios into the dashboard.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
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