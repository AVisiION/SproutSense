import { useState, useCallback, useEffect } from 'react';
import {
  mockDataStore,
  addSensor, updateSensor, deleteSensor,
  addAlert, updateAlert, deleteAlert,
  updateCropHealth, updateWeather,
  addUser, updateUser, deleteUser,
  applyScenario, resetToDefaults,
  exportMockData, importMockData,
  isSimulationActive, setSimulationActive, subscribeToMockUpdates
} from '../../../../services/mockDataService';
import './MockDataPanel.css';

const TABS = [
  { id: 'Sensors',     icon: 'fa-microchip',   label: 'Plant Sensors' },
  { id: 'Alerts',      icon: 'fa-bell',        label: 'System Alerts' },
  { id: 'Crop Health', icon: 'fa-leaf',        label: 'Crop Analytics' },
  { id: 'Weather',     icon: 'fa-cloud-sun',   label: 'Weather Station' },
  { id: 'Users',       icon: 'fa-users-gear',  label: 'User Management' },
  { id: 'Scenarios',   icon: 'fa-layer-group', label: 'Preset Scenarios' },
];

export default function MockDataPanel() {
  const [activeTab, setActiveTab] = useState('Sensors');
  const [, forceUpdate] = useState(0);
  const isSimActive = isSimulationActive();

  useEffect(() => {
    return subscribeToMockUpdates(() => forceUpdate(n => n + 1));
  }, []);

  const refresh = useCallback(() => forceUpdate(n => n + 1), []);

  return (
    <div className="mock-panel">
      {/* Simulation Internal Sidebar */}
      <aside className="mock-sidebar">
        <div className="mock-sidebar-header">
          <h4>Simulation Registry</h4>
        </div>
        
        <nav className="mock-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`mock-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`fa-solid ${tab.icon}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mock-sidebar-footer">
          <div className="mock-sim-toggle">
            <span>Drift Mode</span>
            <label className="adm-toggle-sm">
              <input 
                type="checkbox" 
                checked={isSimActive} 
                onChange={(e) => setSimulationActive(e.target.checked)}
              />
              <span className="slider-sm" />
            </label>
          </div>
        </div>
      </aside>

      {/* Main Simulation Content */}
      <main className="mock-content">
        <header className="mock-header">
          <div className="mock-header-title">
            <i className={`fa-solid ${TABS.find(t => t.id === activeTab)?.icon}`} style={{ color: '#22d3ee' }} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>{activeTab}</h3>
          </div>
          
          {isSimActive && (
            <div className="mock-indicator">
              <span className="mock-pulse-dot" />
              Live Simulation Active
            </div>
          )}
        </header>

        <div className="mock-tab-pane">
          {activeTab === 'Sensors'     && <SensorsTab    refresh={refresh} />}
          {activeTab === 'Alerts'      && <AlertsTab     refresh={refresh} />}
          {activeTab === 'Crop Health'  && <CropHealthTab refresh={refresh} />}
          {activeTab === 'Weather'     && <WeatherTab    refresh={refresh} />}
          {activeTab === 'Users'       && <UsersTab      refresh={refresh} />}
          {activeTab === 'Scenarios'   && <ScenariosTab  refresh={refresh} />}
        </div>
      </main>
    </div>
  );
}

// ─── SENSORS TAB (Card Based) ────────────────────────────────────────────────
function SensorsTab({ refresh }) {
  const [form, setForm] = useState({ name: '', moisture: 60, temperature: 28, humidity: 70 });
  const sensors = mockDataStore.sensors || [];

  function handleAdd(e) {
    e.preventDefault();
    addSensor(form);
    setForm({ name: '', moisture: 60, temperature: 28, humidity: 70 });
    refresh();
  }

  return (
    <div className="mock-tab-wrapper">
      <div className="mock-form-glass">
        <h4 style={{ margin: '0 0 1rem', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Provision New Node</h4>
        <form onSubmit={handleAdd} className="mock-field-group">
          <div className="mock-input-field">
            <label>Node Name</label>
            <input type="text" placeholder="Zone identifier" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="mock-input-field">
            <label>Moisture %</label>
            <input type="number" min="0" max="100" value={form.moisture}
              onChange={e => setForm(p => ({ ...p, moisture: +e.target.value }))} />
          </div>
          <div className="mock-input-field">
            <label>Temp °C</label>
            <input type="number" step="0.1" value={form.temperature}
              onChange={e => setForm(p => ({ ...p, temperature: +e.target.value }))} />
          </div>
          <button type="submit" className="adm-refresh-btn" style={{ height: '40px', alignSelf: 'flex-end', width: 'auto', padding: '0 1.5rem', borderRadius: '0.5rem' }}>
            Provision Node
          </button>
        </form>
      </div>

      <div className="mock-grid">
        {sensors.map(s => (
          <div key={s.id} className={`mock-record-card ${s.lastUpdate === 'pulsing' ? 'mock-flash-update' : ''}`}>
            <div className="mock-card-header">
              <div>
                <span className="mock-card-id">{s.id}</span>
                <h3 className="mock-card-title">{s.name}</h3>
              </div>
              <span className={`mock-status-chip mock-status--${s.status}`}>{s.status}</span>
            </div>
            
            <div className="mock-card-metrics">
              <div className="mock-metric">
                <span className="mock-metric-label">Moisture</span>
                <span className="mock-metric-value">{s.moisture}%</span>
              </div>
              <div className="mock-metric">
                <span className="mock-metric-label">Temp</span>
                <span className="mock-metric-value">{s.temperature}°C</span>
              </div>
              <div className="mock-metric">
                <span className="mock-metric-label">Humidity</span>
                <span className="mock-metric-value">{s.humidity}%</span>
              </div>
            </div>

            <div className="mock-card-footer">
              <select className="mock-select-sm" value={s.status}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }}
                onChange={e => { updateSensor(s.id, { status: e.target.value }); refresh(); }}>
                <option value="active">Active</option>
                <option value="warning">Warning</option>
                <option value="offline">Offline</option>
              </select>
              <button className="adm-btn-danger" style={{ padding: '0.4rem', borderRadius: '0.4rem' }}
                onClick={() => { deleteSensor(s.id); refresh(); }}>
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ALERTS TAB ──────────────────────────────────────────────────────────────
function AlertsTab({ refresh }) {
  const [form, setForm] = useState({ type: 'moisture', severity: 'medium', message: '' });
  const alerts = mockDataStore.alerts || [];

  function handleAdd(e) {
    e.preventDefault();
    addAlert(form);
    setForm({ type: 'moisture', severity: 'medium', message: '' });
    refresh();
  }

  return (
    <div className="mock-tab-wrapper">
      <div className="mock-form-glass">
        <form onSubmit={handleAdd} className="mock-field-group">
          <div className="mock-input-field">
            <label>Alert Type</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="moisture">Soil Moisture</option>
              <option value="temperature">Temperature</option>
              <option value="system">System Health</option>
              <option value="disease">Crop Disease</option>
            </select>
          </div>
          <div className="mock-input-field">
            <label>Severity</label>
            <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}>
              <option value="low">Low Impact</option>
              <option value="medium">Medium Priority</option>
              <option value="high">Critical Risk</option>
            </select>
          </div>
          <div className="mock-input-field" style={{ gridColumn: 'span 2' }}>
            <label>Internal Message</label>
            <input type="text" placeholder="Description of the event..." value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required />
          </div>
          <button type="submit" className="adm-refresh-btn" style={{ height: '40px', alignSelf: 'flex-end', width: 'auto', padding: '0 1.5rem', borderRadius: '0.5rem' }}>
            Broadcast Alert
          </button>
        </form>
      </div>

      <div className="mock-grid">
        {alerts.map(a => (
          <div key={a.id} className="mock-record-card">
            <div className="mock-card-header">
              <div>
                <span className="mock-card-id">{a.id} • {a.timestamp}</span>
                <h3 className="mock-card-title">{a.type.toUpperCase()}</h3>
              </div>
              <span className={`mock-status-chip mock-status--${a.severity === 'high' ? 'warning' : 'active'}`}>{a.severity}</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.5rem 0' }}>{a.message}</p>
            <div className="mock-card-footer">
              <label className="mock-sim-toggle" style={{ border: 'none', background: 'none', padding: 0 }}>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Active</span>
                <label className="adm-toggle-sm">
                  <input type="checkbox" checked={a.enabled}
                    onChange={e => { updateAlert(a.id, { enabled: e.target.checked }); refresh(); }} />
                  <span className="slider-sm" />
                </label>
              </label>
              <button className="adm-btn-danger" style={{ padding: '0.4rem', borderRadius: '0.4rem' }}
                onClick={() => { deleteAlert(a.id); refresh(); }}>
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CROP HEALTH TAB ──────────────────────────────────────────────────────────
function CropHealthTab({ refresh }) {
  const ch = mockDataStore.cropHealth || {};
  function handleChange(field, v) { updateCropHealth({ [field]: v }); refresh(); }

  return (
    <div className="mock-tab-wrapper">
      <div className="mock-form-glass">
        <h4 style={{ margin: '0 0 1.5rem', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Analytic Overrides</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <SimulationSlider label="Overall Health Index" value={ch.overallScore} onChange={v => handleChange('overallScore', v)} unit="%" />
          <SimulationSlider label="Disease Probability" value={ch.diseaseProbability} onChange={v => handleChange('diseaseProbability', v)} unit="%" />
          <SimulationSlider label="Water Stress Level" value={ch.waterStress} onChange={v => handleChange('waterStress', v)} unit="%" />
          <SimulationSlider label="Nutrient Saturation" value={ch.nutrientLevel} onChange={v => handleChange('nutrientLevel', v)} unit="%" />
          
          <div className="mock-input-field">
            <label>Current Growth Stage</label>
            <select value={ch.growthStage} onChange={e => handleChange('growthStage', e.target.value)}>
              {['Germination', 'Seedling', 'Vegetative', 'Budding', 'Flowering', 'Ripening', 'Harvest'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WEATHER TAB ──────────────────────────────────────────────────────────────
function WeatherTab({ refresh }) {
  const w = mockDataStore.weather || {};
  function handleChange(field, v) { updateWeather({ [field]: v }); refresh(); }

  return (
    <div className="mock-tab-wrapper">
      <div className="mock-form-glass">
        <h4 style={{ margin: '0 0 1.5rem', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>Simulation Environment</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <SimulationSlider label="Temperature" value={w.temperature} min={-10} max={55} onChange={v => handleChange('temperature', v)} unit="°C" />
          <SimulationSlider label="Relative Humidity" value={w.humidity} onChange={v => handleChange('humidity', v)} unit="%" />
          <SimulationSlider label="Atmospheric Rainfall" value={w.rainfall} max={300} onChange={v => handleChange('rainfall', v)} unit="mm" />
          <SimulationSlider label="Wind Velocity" value={w.windSpeed} max={120} onChange={v => handleChange('windSpeed', v)} unit="km/h" />
          
          <div className="mock-input-field">
            <label>Sky Condition</label>
            <select value={w.forecast} onChange={e => handleChange('forecast', e.target.value)}>
              {['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Thunderstorm', 'Windy'].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── USERS TAB ────────────────────────────────────────────────────────────────
function UsersTab({ refresh }) {
  const users = mockDataStore.users || [];
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer' });

  function handleAdd(e) {
    e.preventDefault();
    addUser(form);
    setForm({ name: '', email: '', role: 'viewer' });
    refresh();
  }

  return (
    <div className="mock-tab-wrapper">
      <div className="mock-form-glass">
        <form onSubmit={handleAdd} className="mock-field-group">
          <div className="mock-input-field">
            <label>User Name</label>
            <input type="text" placeholder="Identity" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="mock-input-field">
            <label>Email Address</label>
            <input type="email" placeholder="contact@domain.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="mock-input-field">
            <label>System Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="admin">Administrator</option>
              <option value="operator">Operator</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button type="submit" className="adm-refresh-btn" style={{ height: '40px', alignSelf: 'flex-end', width: 'auto', padding: '0 1.5rem', borderRadius: '0.5rem' }}>
            Create Ident
          </button>
        </form>
      </div>

      <div className="mock-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {users.map(u => (
          <div key={u.id} className="mock-record-card">
            <div className="mock-card-header">
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', color: '#22d3ee' }}>
                  <i className="fa-solid fa-user" />
                </div>
                <div>
                  <h3 className="mock-card-title">{u.name}</h3>
                  <span className="mock-card-id">{u.email}</span>
                </div>
              </div>
              <span className={`mock-status-chip ${u.active ? 'mock-status--active' : 'mock-status--offline'}`}>
                {u.active ? 'Active' : 'Locked'}
              </span>
            </div>
            
            <div className="mock-card-footer">
              <select className="mock-select-sm" value={u.role}
                onChange={e => { updateUser(u.id, { role: e.target.value }); refresh(); }}>
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
                <option value="viewer">Viewer</option>
              </select>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <label className="adm-toggle-sm">
                  <input type="checkbox" checked={u.active}
                    onChange={e => { updateUser(u.id, { active: e.target.checked }); refresh(); }} />
                  <span className="slider-sm" />
                </label>
                <button className="adm-btn-danger" style={{ padding: '0.4rem', borderRadius: '0.4rem' }}
                  onClick={() => { deleteUser(u.id); refresh(); }}>
                  <i className="fa-solid fa-user-minus" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SCENARIOS TAB ────────────────────────────────────────────────────────────
function ScenariosTab({ refresh }) {
  const currentScenario = mockDataStore.scenario;
  const scenarios = [
    { key: 'normal',   label: 'Baseline Stability', desc: 'Standard operating conditions with nominal readings.', icon: 'fa-check-circle' },
    { key: 'empty',    label: 'Null State',        desc: 'Simulate first-time user experience or data loss.', icon: 'fa-folder-open' },
    { key: 'error',    label: 'Critical Fault',     desc: 'Force API errors and sensor failure states.', icon: 'fa-triangle-exclamation' },
    { key: 'highLoad', label: 'Enterprise Stress', desc: 'Large scale deployment simulation (20+ nodes).', icon: 'fa-server' },
    { key: 'demo',     label: 'Elite Showcase',    desc: 'Optimized readings for high-end presentations.', icon: 'fa-star' },
  ];

  return (
    <div className="mock-tab-wrapper">
      <div className="mock-scenario-grid">
        {scenarios.map(s => (
          <div key={s.key} 
            className={`mock-scenario-action ${currentScenario === s.key ? 'active' : ''}`}
            onClick={() => { applyScenario(s.key); refresh(); }}>
            <i className={`fa-solid ${s.icon}`} style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'block', color: currentScenario === s.key ? '#22d3ee' : '#94a3b8' }} />
            <span className="mock-scenario-name">{s.label}</span>
            <span className="mock-scenario-desc">{s.desc}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <h4 style={{ margin: '0 0 1rem', color: '#fff' }}>Kernel Maintenance</h4>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="adm-refresh-btn" style={{ width: 'auto', padding: '0 1.5rem' }} onClick={() => { exportMockData(); }}>
             Export Architecture
          </button>
          <button className="adm-btn-danger" style={{ width: 'auto', padding: '0 1.5rem', border: 'none' }} onClick={() => { resetToDefaults(); refresh(); }}>
             Factory Reset Simulation
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function SimulationSlider({ label, value, min = 0, max = 100, onChange, unit }) {
  return (
    <div className="mock-slider-box">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>{label}</label>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#22d3ee' }}>{value}{unit}</span>
      </div>
      <input 
        type="range" 
        className="mock-range-input" 
        min={min} max={max} value={value} 
        onChange={e => onChange(+e.target.value)} 
      />
    </div>
  );
}