/**
 * AdminPanelPage.jsx
 * Professional glass-morphism admin dashboard.
 * Sections: Overview, Devices, Config, Raw Data, Logs, Mock Data
 * Features: Font Awesome icons, animated cards, live log feed, interactive controls
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { aiAPI, configAPI, sensorAPI, wateringAPI, usersAPI, deviceAPI } from '../../utils/api';
import { getSensorRegistry, upsertSensor, removeSensor } from '../../utils/sensorRegistry';
import { ACCOUNT_STATUS, ROLE } from '../../auth/permissions';
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
  const { logout, user } = useAuth();
  const adminUser = user?.fullName || user?.email || 'admin';
  const navigate = useNavigate();
  const logEndRef = useRef(null);

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
  const [sidebarOpen,   setSidebarOpen]      = useState(true);
  const [sensorRegistry, setSensorRegistry] = useState([]);
  const [sensorForm, setSensorForm] = useState(DEFAULT_SENSOR_FORM);
  const [editingSensorId, setEditingSensorId] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersQuery, setUsersQuery] = useState('');
  const [userForm, setUserForm] = useState(DEFAULT_USER_FORM);
  const [creatingUser, setCreatingUser] = useState(false);
  const [uiPreferences, setUiPreferences] = useState(DEFAULT_UI_PREFERENCES);
  const [savingUiPreferences, setSavingUiPreferences] = useState(false);
  const [selectedPlantKey, setSelectedPlantKey] = useState('tomato');
  const [plantSensorConfig, setPlantSensorConfig] = useState({ tomato: {} });
  const [plantWateringConfig, setPlantWateringConfig] = useState(buildDefaultPlantWateringConfig());
  const [savingPlantSensorConfig, setSavingPlantSensorConfig] = useState(false);
  
  // Mock Data master toggle state
  const [mockEnabled, setMockEnabledState] = useState(isMockEnabled());

  // Device Key Management state
  const [deviceKeyForm, setDeviceKeyForm] = useState({ deviceId: '', displayName: '' });
  const [deviceKeys, setDeviceKeys] = useState([]);
  const [loadingDeviceKeys, setLoadingDeviceKeys] = useState(false);
  const [creatingDeviceKey, setCreatingDeviceKey] = useState(false);
  const [generatedDeviceSecret, setGeneratedDeviceSecret] = useState(null);

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

  const fetchAllData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [health, latest, cfg, water, aiUsage] = await Promise.all([
        configAPI.getHealth().catch(() => null),
        sensorAPI.getLatest().catch(() => null),
        configAPI.get().catch(() => null),
        wateringAPI.getStatus().catch(() => null),
        aiAPI.getUsageStats().catch(() => null),
      ]);
      setSystemInfo(health?.data || health);
      setSensorData(latest?.data || latest);
      setConfigData(cfg?.data || cfg);
      setWaterStatus(water?.data || water);
      setAIUsageData(aiUsage?.data || aiUsage);
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

  const handleCreateDeviceKey = async () => {
    const deviceId = deviceKeyForm.deviceId.trim().toUpperCase();
    if (!deviceId) {
      log('Device ID is required', LOG_TYPES.error);
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
      log(`Device key created for ${deviceId}`, LOG_TYPES.success);
    } catch (error) {
      log(`Failed to create device key: ${error?.response?.data?.message || error.message}`, LOG_TYPES.error);
    } finally {
      setCreatingDeviceKey(false);
    }
  };

  const handleCreatePresetDeviceKey = async (preset) => {
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
      log(`Failed to create device key: ${error?.response?.data?.message || error.message}`, LOG_TYPES.error);
    } finally {
      setCreatingDeviceKey(false);
    }
  };

  const handleDeleteDeviceKey = async (deviceId) => {
    if (!window.confirm(`Delete device key for ${deviceId}?`)) return;
    try {
      await deviceAPI.deleteKey(deviceId);
      await loadDeviceKeys();
      log(`Device key ${deviceId} deleted`, LOG_TYPES.warning);
    } catch (error) {
      log(`Failed to delete device key: ${error?.response?.data?.message || error.message}`, LOG_TYPES.error);
    }
  };

  const handleToggleDeviceKeyStatus = async (deviceId) => {
    try {
      await deviceAPI.toggleKeyStatus(deviceId);
      await loadDeviceKeys();
      log(`Device key ${deviceId} status toggled`, LOG_TYPES.info);
    } catch (error) {
      log(`Failed to toggle device key status: ${error?.response?.data?.message || error.message}`, LOG_TYPES.error);
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
  };

  const resetSensorForm = () => {
    setSensorForm(DEFAULT_SENSOR_FORM);
    setEditingSensorId(null);
  };

  const handleSensorEdit = (sensor) => {
    setEditingSensorId(sensor.id);
    setSensorForm({ ...sensor });
    setActiveSection('sensors');
  };

  const handleSensorSave = () => {
    if (!sensorForm.name.trim() || !sensorForm.key.trim()) {
      log('Sensor save blocked: name and key are required', LOG_TYPES.warning);
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
      log('Limits updated from admin panel', LOG_TYPES.success, payload);
      await fetchAllData(true);
    } catch (err) {
      log(`Failed to update limits: ${err.message}`, LOG_TYPES.error);
    } finally {
      setSavingLimits(false);
    }
  };

  const handleUserRoleUpdate = async (targetUser, nextRole) => {
    if (!targetUser?.id || !nextRole || targetUser.role === nextRole) return;

    try {
      await usersAPI.updateRole(targetUser.id, nextRole);
      setUsers((prev) => prev.map((item) => (item.id === targetUser.id ? { ...item, role: nextRole } : item)));
      log(`Role updated for ${targetUser.email} -> ${nextRole}`, LOG_TYPES.success);
    } catch (err) {
      log(`Role update failed for ${targetUser.email}: ${err.message}`, LOG_TYPES.error);
    }
  };

  const handleUserStatusUpdate = async (targetUser, nextStatus) => {
    if (!targetUser?.id || !nextStatus || targetUser.accountStatus === nextStatus) return;

    try {
      await usersAPI.updateAccountStatus(targetUser.id, nextStatus);
      setUsers((prev) => prev.map((item) => (item.id === targetUser.id ? { ...item, accountStatus: nextStatus } : item)));
      log(`Status updated for ${targetUser.email} -> ${nextStatus}`, LOG_TYPES.success);
    } catch (err) {
      log(`Status update failed for ${targetUser.email}: ${err.message}`, LOG_TYPES.error);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!targetUser?.id) return;
    if (!window.confirm(`Delete user ${targetUser.email}? This cannot be undone.`)) return;

    try {
      await usersAPI.delete(targetUser.id);
      setUsers((prev) => prev.filter((item) => item.id !== targetUser.id));
      log(`User deleted: ${targetUser.email}`, LOG_TYPES.warning);
    } catch (err) {
      log(`Delete failed for ${targetUser.email}: ${err.message}`, LOG_TYPES.error);
    }
  };

  const handleUserSensorVisibilityUpdate = async (targetUser, nextVisible) => {
    if (!targetUser?.id || typeof nextVisible !== 'boolean') return;
    if ((targetUser.sensorDataVisible !== false) === nextVisible) return;

    try {
      await usersAPI.updateSensorVisibility(targetUser.id, nextVisible);
      setUsers((prev) => prev.map((item) => (
        item.id === targetUser.id ? { ...item, sensorDataVisible: nextVisible } : item
      )));
      log(`Sensor data ${nextVisible ? 'enabled' : 'hidden'} for ${targetUser.email}`, LOG_TYPES.success);
    } catch (err) {
      log(`Sensor visibility update failed for ${targetUser.email}: ${err.message}`, LOG_TYPES.error);
    }
  };

  const handleUserFormChange = (field, value) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetUserForm = () => {
    setUserForm(DEFAULT_USER_FORM);
  };

  const handleCreateUser = async () => {
    const fullName = userForm.fullName.trim();
    const email = userForm.email.trim();
    const password = userForm.password;
    const minPasswordLength = userForm.roleKey === ROLE.ADMIN ? 14 : 12;

    if (!fullName || !email || !password) {
      log('User create blocked: full name, email, and password are required', LOG_TYPES.warning);
      return;
    }

    if (password.length < minPasswordLength) {
      log(`User create blocked: password must be at least ${minPasswordLength} characters for ${userForm.roleKey}`, LOG_TYPES.warning);
      return;
    }

    try {
      setCreatingUser(true);
      await usersAPI.create({
        fullName,
        email,
        password,
        roleKey: userForm.roleKey,
        accountStatus: userForm.accountStatus,
        emailVerified: userForm.emailVerified,
        sensorDataVisible: userForm.sensorDataVisible,
      });
      log(`User created manually: ${email}`, LOG_TYPES.success);
      resetUserForm();
      await loadUsers();
    } catch (err) {
      const message = err?.response?.data?.message || err.message;
      log(`User create failed: ${message}`, LOG_TYPES.error);
    } finally {
      setCreatingUser(false);
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
    try {
      setSavingUiPreferences(true);
      await configAPI.update('ESP32-SENSOR', { uiPreferences });
      log('UI preferences saved successfully', LOG_TYPES.success, uiPreferences);
      await fetchAllData(true);
    } catch (err) {
      log(`Failed to save UI preferences: ${err.message}`, LOG_TYPES.error);
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
      log(`Plant sensor thresholds saved for ${selectedPlantKey}`, LOG_TYPES.success, { selectedPlantKey });
      await fetchAllData(true);
    } catch (err) {
      log(`Failed to save plant sensor thresholds: ${err.message}`, LOG_TYPES.error);
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
            <span className="adm-brand-role">Admin Panel</span>
          </div>
        </div>

        <div className="adm-sidebar-divider" />

        <nav className="adm-nav">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`adm-nav-item${activeSection === s.id ? ' active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <i className={`fa-solid ${s.icon} adm-nav-icon`} />
              <span className="adm-nav-label">{s.label}</span>
              {activeSection === s.id && <span className="adm-nav-pill" />}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-session-info">
            <i className="fa-solid fa-clock" />
            <span>Session: {formatUptime(uptime)}</span>
          </div>
          <button className="adm-logout-btn" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────── */}
      <main className="adm-main">

        {/* Header */}
        <header className="adm-header">
          <div className="adm-header-left">
            <button className="adm-toggle-btn" onClick={() => setSidebarOpen(o => !o)}>
              <i className="fa-solid fa-bars" />
            </button>
            <div>
              <h1 className="adm-header-title">
                <i className={`fa-solid ${SECTIONS.find(s => s.id === activeSection)?.icon}`} />
                &ensp;{SECTIONS.find(s => s.id === activeSection)?.label}
              </h1>
              <p className="adm-header-sub">SproutSense Control Panel</p>
            </div>
          </div>
          <div className="adm-header-right">
            <span className="adm-badge adm-badge--green">
              <i className="fa-solid fa-shield-halved" /> Authenticated
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
                    <h2><i className="fa-solid fa-chart-line" /> System Overview</h2>
                    <span className="adm-section-badge">Live</span>
                  </div>

                  <div className="adm-cards-grid">
                    <StatCard icon="fa-server"       color="blue"   label="Backend"      value={systemInfo?.backend   || 'Online'} />
                    <StatCard icon="fa-database"     color="green"  label="Database"     value={systemInfo?.database  || 'Connected'} />
                    <StatCard icon="fa-tachometer-alt" color="red" label="API Version"   value={systemInfo?.version || '1.0.0'} />
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
                            padding: '0.55rem 0.9rem',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            borderRadius: '0.5rem',
                            fontSize: '0.82rem',
                            fontWeight: '600',
                            cursor: creatingDeviceKey ? 'not-allowed' : 'pointer',
                            opacity: creatingDeviceKey ? 0.6 : 1,
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

                  {/* Device Keys List */}
                  <div className="adm-glass-box">
                    <h3><i className="fa-solid fa-list" /> Registered Device Keys</h3>
                    {loadingDeviceKeys ? (
                      <p style={{ color: '#94a3b8' }}><i className="fa-solid fa-spinner fa-spin" /> Loading device keys...</p>
                    ) : deviceKeys.length === 0 ? (
                      <p style={{ color: '#94a3b8' }}>No device keys registered yet.</p>
                    ) : (
                      <div className="adm-device-keys-table">
                        {deviceKeys.map((key) => (
                          <div key={key.deviceId} style={{
                            padding: '1rem',
                            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                            display: 'grid',
                            gridTemplateColumns: '1fr auto auto auto',
                            gap: '0.8rem',
                            alignItems: 'center',
                          }}>
                            <div>
                              <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.95rem', fontWeight: '600', color: '#e2e8f0' }}>
                                {key.deviceId}
                              </p>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                                {key.displayName || '(No display name)'}
                              </p>
                            </div>
                            <span style={{
                              padding: '0.3rem 0.8rem',
                              borderRadius: '0.4rem',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: key.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                              color: key.isActive ? '#22c55e' : '#94a3b8',
                            }}>
                              {key.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={() => handleToggleDeviceKeyStatus(key.deviceId)}
                              style={{
                                padding: '0.5rem 0.8rem',
                                background: 'rgba(148, 163, 184, 0.2)',
                                border: '1px solid rgba(148, 163, 184, 0.3)',
                                borderRadius: '0.4rem',
                                color: '#cbd5e1',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                              }}
                            >
                              <i className={`fa-solid ${key.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`} />
                            </button>
                            <button
                              onClick={() => handleDeleteDeviceKey(key.deviceId)}
                              style={{
                                padding: '0.5rem 0.8rem',
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '0.4rem',
                                color: '#ef4444',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                              }}
                            >
                              <i className="fa-solid fa-trash" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── UI ─────────────────────────────────────── */}
              {activeSection === 'ui' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-palette" /> UI Control Center</h2>
                    <span className="adm-section-badge">Live UI Config</span>
                  </div>

                  <div className="adm-device-grid" style={{ marginBottom: '1rem' }}>
                    <div className="adm-glass-box">
                      <h3><i className="fa-solid fa-table-columns" /> Sidebar Visibility</h3>
                      {Object.entries(uiPreferences.sidebarVisibility).map(([key, enabled]) => (
                        <div className="adm-config-row" key={`sidebar-${key}`}>
                          <span className="adm-config-key">Show {key}</span>
                          <input type="checkbox" checked={Boolean(enabled)} onChange={(e) => handleUiPreferenceChange('sidebarVisibility', key, e.target.checked)} />
                        </div>
                      ))}
                    </div>

                    <div className="adm-glass-box">
                      <h3><i className="fa-solid fa-layer-group" /> Dashboard Sections</h3>
                      {Object.entries(uiPreferences.dashboardSections).map(([key, enabled]) => (
                        <div className="adm-config-row" key={`dash-${key}`}>
                          <span className="adm-config-key">Show {key}</span>
                          <input type="checkbox" checked={Boolean(enabled)} onChange={(e) => handleUiPreferenceChange('dashboardSections', key, e.target.checked)} />
                        </div>
                      ))}
                      <h3 style={{ marginTop: '1rem' }}><i className="fa-solid fa-sliders" /> Widgets</h3>
                      {Object.entries(uiPreferences.widgets).map(([key, enabled]) => (
                        <div className="adm-config-row" key={`widget-${key}`}>
                          <span className="adm-config-key">{key}</span>
                          <input type="checkbox" checked={Boolean(enabled)} onChange={(e) => handleUiPreferenceChange('widgets', key, e.target.checked)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="adm-glass-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0 }}><i className="fa-solid fa-chart-line" /> Sensors & UI Visibility</h3>
                      <button className="adm-btn btn-primary" onClick={handleAddCustomSensor}>
                        <i className="fa-solid fa-plus" /> Add Sensor
                      </button>
                    </div>
                    {sensorRegistry.length === 0 ? (
                      <p className="adm-empty"><i className="fa-solid fa-circle-info" /> No sensors available for UI graph control.</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="adm-log-table">
                          <thead>
                            <tr>
                              <th>Sensor</th>
                              <th>Icon</th>
                              <th>Color</th>
                              <th>Show Graph</th>
                              <th>Show in Dashboard</th>
                              <th>Chart Type</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sensorRegistry.map((sensor) => (
                              <tr key={`ui-graph-${sensor.id}`}>
                                <td>{sensor.name}</td>
                                <td>
                                  <input 
                                    className="adm-input" 
                                    style={{ width: '120px', padding: '4px' }} 
                                    value={sensor.faIcon || ''} 
                                    onChange={(e) => handleUiSensorIconChange(sensor, e.target.value)} 
                                    placeholder="fa-microchip" 
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="color" 
                                    value={sensor.color || '#6366f1'} 
                                    onChange={(e) => handleUiSensorColorChange(sensor, e.target.value)} 
                                    style={{ padding: '0', cursor: 'pointer', border: 'none', background: 'none' }}
                                  />
                                </td>
                                <td>
                                  <input type="checkbox" checked={Boolean(sensor.showInAnalytics)} onChange={(e) => handleUiSensorAnalyticsToggle(sensor, e.target.checked)} />
                                </td>
                                <td>
                                  <input type="checkbox" checked={Boolean(sensor.showInDashboard)} onChange={(e) => handleUiSensorDashboardToggle(sensor, e.target.checked)} />
                                </td>
                                <td>
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
                                </td>
                                <td>
                                  <button className="adm-btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleDeleteCustomSensor(sensor.id)} title="Delete Sensor">
                                    <i className="fa-solid fa-trash" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="adm-btn-row" style={{ marginTop: '0.75rem' }}>
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
                    <h2><i className="fa-solid fa-users" /> User Management</h2>
                    <div className="adm-btn-row">
                      <button className="adm-icon-btn" onClick={loadUsers} title="Refresh users">
                        <i className={`fa-solid fa-rotate ${usersLoading ? 'fa-spin' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="adm-glass-box" style={{ marginBottom: '1rem' }}>
                    <h3><i className="fa-solid fa-user-plus" /> Add User Manually</h3>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Full Name</span>
                      <input
                        className="adm-input"
                        style={{ width: '260px' }}
                        type="text"
                        value={userForm.fullName}
                        onChange={(e) => handleUserFormChange('fullName', e.target.value)}
                        placeholder="User full name"
                      />
                    </div>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Email</span>
                      <input
                        className="adm-input"
                        style={{ width: '260px' }}
                        type="email"
                        value={userForm.email}
                        onChange={(e) => handleUserFormChange('email', e.target.value)}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Temporary Password</span>
                      <input
                        className="adm-input"
                        style={{ width: '260px' }}
                        type="password"
                        value={userForm.password}
                        onChange={(e) => handleUserFormChange('password', e.target.value)}
                        placeholder="Minimum 12 chars"
                      />
                    </div>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Role</span>
                      <select
                        className="adm-input"
                        value={userForm.roleKey}
                        onChange={(e) => handleUserFormChange('roleKey', e.target.value)}
                      >
                        <option value={ROLE.ADMIN}>admin</option>
                        <option value={ROLE.USER}>user</option>
                        <option value={ROLE.VIEWER}>viewer</option>
                      </select>
                    </div>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Account Status</span>
                      <select
                        className="adm-input"
                        value={userForm.accountStatus}
                        onChange={(e) => handleUserFormChange('accountStatus', e.target.value)}
                      >
                        <option value={ACCOUNT_STATUS.PENDING_VERIFICATION}>pending_verification</option>
                        <option value={ACCOUNT_STATUS.ACTIVE}>active</option>
                        <option value={ACCOUNT_STATUS.SUSPENDED}>suspended</option>
                        <option value={ACCOUNT_STATUS.DISABLED}>disabled</option>
                      </select>
                    </div>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Email Verified</span>
                      <input
                        type="checkbox"
                        checked={Boolean(userForm.emailVerified)}
                        onChange={(e) => handleUserFormChange('emailVerified', e.target.checked)}
                      />
                    </div>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Sensor Data Visible</span>
                      <input
                        type="checkbox"
                        checked={Boolean(userForm.sensorDataVisible)}
                        onChange={(e) => handleUserFormChange('sensorDataVisible', e.target.checked)}
                      />
                    </div>
                    <div className="adm-btn-row" style={{ marginTop: '0.75rem' }}>
                      <button className="adm-action-btn adm-action-btn--start" onClick={handleCreateUser} disabled={creatingUser}>
                        <i className="fa-solid fa-user-plus" /> {creatingUser ? 'Creating...' : 'Create User'}
                      </button>
                      <button className="adm-action-btn adm-action-btn--stop" onClick={resetUserForm} disabled={creatingUser}>
                        <i className="fa-solid fa-rotate-left" /> Reset
                      </button>
                    </div>
                  </div>

                  <div className="adm-glass-box" style={{ marginBottom: '1rem' }}>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Search Users</span>
                      <input
                        className="adm-input"
                        style={{ width: '260px' }}
                        type="text"
                        value={usersQuery}
                        onChange={(e) => setUsersQuery(e.target.value)}
                        placeholder="Name, email, role, status"
                      />
                    </div>
                  </div>

                  <div className="adm-glass-box">
                    <h3><i className="fa-solid fa-user-shield" /> Accounts ({filteredUsers.length})</h3>
                    {usersLoading ? (
                      <p className="adm-empty"><i className="fa-solid fa-circle-notch fa-spin" /> Loading users...</p>
                    ) : filteredUsers.length === 0 ? (
                      <p className="adm-empty"><i className="fa-solid fa-circle-info" /> No users match your filters.</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="adm-log-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Role</th>
                              <th>Status</th>
                              <th>Plant Type</th>
                              <th>Email Verified</th>
                              <th>Sensor Data</th>
                              <th>Last Login</th>
                              <th>Dashboard View</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUsers.map((entry) => {
                              const isSelf = entry.email === user?.email;
                              return (
                                <tr key={entry.id}>
                                  <td>{entry.fullName || '-'}</td>
                                  <td>{entry.email}</td>
                                  <td>{entry.role || ROLE.USER}</td>
                                  <td>
                                    <select
                                      className="adm-input"
                                      value={entry.accountStatus || ACCOUNT_STATUS.PENDING_VERIFICATION}
                                      onChange={(e) => handleUserStatusUpdate(entry, e.target.value)}
                                      disabled={isSelf && entry.role === ROLE.ADMIN}
                                    >
                                      <option value={ACCOUNT_STATUS.PENDING_VERIFICATION}>pending_verification</option>
                                      <option value={ACCOUNT_STATUS.ACTIVE}>active</option>
                                      <option value={ACCOUNT_STATUS.SUSPENDED}>suspended</option>
                                      <option value={ACCOUNT_STATUS.DISABLED}>disabled</option>
                                    </select>
                                  </td>
                                  <td>{entry.preferredPlant || 'tomato'}</td>
                                  <td>{entry.emailVerified ? 'Yes' : 'No'}</td>
                                  <td>
                                    <button
                                      className="adm-action-btn"
                                      style={{
                                        padding: '0.35rem 0.75rem',
                                        border: entry.sensorDataVisible === false
                                          ? '1px solid rgba(239,68,68,0.35)'
                                          : '1px solid rgba(67,160,71,0.35)',
                                        color: entry.sensorDataVisible === false ? '#ffb3b3' : '#b9f6ca'
                                      }}
                                      onClick={() => handleUserSensorVisibilityUpdate(entry, entry.sensorDataVisible === false)}
                                    >
                                      <i className={`fa-solid ${entry.sensorDataVisible === false ? 'fa-eye-slash' : 'fa-eye'}`} />
                                      {entry.sensorDataVisible === false ? ' Hidden' : ' Visible'}
                                    </button>
                                  </td>
                                  <td>{entry.lastLoginAt ? new Date(entry.lastLoginAt).toLocaleString() : 'Never'}</td>
                                  <td>
                                    <button
                                      className="adm-action-btn adm-action-btn--start"
                                      style={{ padding: '0.4rem 0.85rem', boxShadow: '0 0 14px rgba(67,160,71,0.45)' }}
                                      onClick={() => handleViewUserDashboard(entry)}
                                    >
                                      <i className="fa-solid fa-arrow-up-right-from-square" /> View
                                    </button>
                                  </td>
                                  <td>
                                    <div className="adm-btn-row" style={{ gap: '0.45rem', flexWrap: 'wrap' }}>
                                      <button
                                        className="adm-action-btn adm-action-btn--start"
                                        style={{ padding: '0.35rem 0.75rem', opacity: entry.role === ROLE.ADMIN ? 0.6 : 1 }}
                                        onClick={() => handleUserRoleUpdate(entry, ROLE.ADMIN)}
                                        disabled={isSelf || entry.role === ROLE.ADMIN}
                                      >
                                        <i className="fa-solid fa-user-shield" /> Admin
                                      </button>
                                      <button
                                        className="adm-action-btn adm-action-btn--stop"
                                        style={{ padding: '0.35rem 0.75rem', opacity: entry.role === ROLE.VIEWER ? 0.6 : 1 }}
                                        onClick={() => handleUserRoleUpdate(entry, ROLE.VIEWER)}
                                        disabled={isSelf || entry.role === ROLE.VIEWER}
                                      >
                                        <i className="fa-solid fa-user-tag" /> Viewer
                                      </button>
                                      <button
                                        className="adm-action-btn"
                                        style={{ padding: '0.35rem 0.75rem', border: '1px solid rgba(239,68,68,0.35)', color: '#ffb3b3' }}
                                        onClick={() => handleDeleteUser(entry)}
                                        disabled={isSelf}
                                      >
                                        <i className="fa-solid fa-trash" /> Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── PLANT SENSOR CONFIG ────────────────────── */}
              {activeSection === 'sensors' && (
                <div className="adm-section">
                  <div className="adm-section-header">
                    <h2><i className="fa-solid fa-seedling" /> Plant Sensor Configuration</h2>
                    <span className="adm-section-badge">Per Plant Thresholds</span>
                  </div>

                  <div className="adm-glass-box" style={{ marginBottom: '1rem' }}>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Select Plant Type</span>
                      <select className="adm-input" value={selectedPlantKey} onChange={(e) => setSelectedPlantKey(e.target.value)}>
                        {PLANT_OPTIONS.map((plant) => (
                          <option key={plant.key} value={plant.key}>{plant.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="adm-glass-box" style={{ marginBottom: '1rem' }}>
                    <h3><i className="fa-solid fa-droplet" /> Moisture & Watering</h3>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Soil Moisture Threshold (%)</span>
                      <input
                        className="adm-input"
                        type="number"
                        min="0"
                        max="100"
                        value={plantWateringConfig?.[selectedPlantKey]?.moistureThreshold ?? 30}
                        onChange={(e) => handlePlantWateringChange('moistureThreshold', e.target.value)}
                      />
                    </div>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Max Watering Cycles / Day</span>
                      <input
                        className="adm-input"
                        type="number"
                        min="1"
                        max="20"
                        value={plantWateringConfig?.[selectedPlantKey]?.maxWateringCyclesPerDay ?? 3}
                        onChange={(e) => handlePlantWateringChange('maxWateringCyclesPerDay', e.target.value)}
                      />
                    </div>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Watering System Max Cycles / Hour</span>
                      <input
                        className="adm-input"
                        type="number"
                        min="1"
                        max="24"
                        value={plantWateringConfig?.[selectedPlantKey]?.maxCyclesPerHour ?? 4}
                        onChange={(e) => handlePlantWateringChange('maxCyclesPerHour', e.target.value)}
                      />
                    </div>
                    <div className="adm-config-row">
                      <span className="adm-config-key">Watering System Max Cycles / Day</span>
                      <input
                        className="adm-input"
                        type="number"
                        min="1"
                        max="50"
                        value={plantWateringConfig?.[selectedPlantKey]?.maxCyclesPerDay ?? 6}
                        onChange={(e) => handlePlantWateringChange('maxCyclesPerDay', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="adm-glass-box">
                    <h3><i className="fa-solid fa-sliders" /> Thresholds for {PLANT_OPTIONS.find((item) => item.key === selectedPlantKey)?.label || selectedPlantKey}</h3>

                    {sensorRegistry.length === 0 ? (
                      <p className="adm-empty"><i className="fa-solid fa-circle-info" /> No sensors available. Configure sensor registry first.</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="adm-log-table">
                          <thead>
                            <tr>
                              <th>Sensor</th>
                              <th>Key</th>
                              <th>Min</th>
                              <th>Max</th>
                              <th>Warning</th>
                              <th>Critical</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sensorRegistry.map((sensor) => {
                              const sensorThresholds = plantSensorConfig?.[selectedPlantKey]?.[sensor.key]
                                || buildSensorThresholdPreset(sensor);
                              return (
                                <tr key={`plant-threshold-${selectedPlantKey}-${sensor.id}`}>
                                  <td>{sensor.name}</td>
                                  <td>{sensor.key}</td>
                                  <td>
                                    <input className="adm-input" type="number" value={sensorThresholds.minThreshold} onChange={(e) => handlePlantThresholdChange(sensor.key, 'minThreshold', e.target.value)} />
                                  </td>
                                  <td>
                                    <input className="adm-input" type="number" value={sensorThresholds.maxThreshold} onChange={(e) => handlePlantThresholdChange(sensor.key, 'maxThreshold', e.target.value)} />
                                  </td>
                                  <td>
                                    <input className="adm-input" type="number" value={sensorThresholds.warningThreshold} onChange={(e) => handlePlantThresholdChange(sensor.key, 'warningThreshold', e.target.value)} />
                                  </td>
                                  <td>
                                    <input className="adm-input" type="number" value={sensorThresholds.criticalThreshold} onChange={(e) => handlePlantThresholdChange(sensor.key, 'criticalThreshold', e.target.value)} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="adm-btn-row" style={{ marginTop: '1rem' }}>
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
                  </div>

                  <div className="adm-device-grid" style={{ marginBottom: '1rem' }}>
                    <div className="adm-glass-box">
                      <h3><i className="fa-solid fa-robot" /> AI Quota</h3>
                      <div className="adm-config-row">
                        <span className="adm-config-key">AI Analyses / Day</span>
                        <div>
                          <input className="adm-input" type="number" min="1" max="100" value={limitsForm.aiDailyAnalysisLimit} onChange={(e) => handleLimitChange('aiDailyAnalysisLimit', e.target.value)} />
                          {limitErrors.aiDailyAnalysisLimit && <div className="adm-input-error">{limitErrors.aiDailyAnalysisLimit}</div>}
                        </div>

                  <div className="adm-glass-box" style={{ marginBottom: '1rem' }}>
                    <h3><i className="fa-solid fa-circle-info" /> Plant Watering Limits</h3>
                    <p className="adm-header-sub">Moisture and watering limits are now managed in Plant Sensors section for each plant type.</p>
                  </div>
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Usage Today</span>
                        <span className="adm-config-val">{aiUsageData ? `${aiUsageData.usedCount}/${aiUsageData.dailyLimit}` : 'N/A'}</span>
                      </div>
                      <div className="adm-config-row">
                        <span className="adm-config-key">Remaining</span>
                        <span className="adm-config-val">{aiUsageData ? aiUsageData.remaining : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="adm-btn-row" style={{ marginTop: '0.75rem' }}>
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