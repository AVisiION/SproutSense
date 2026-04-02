import { useState, useCallback } from 'react';
import {
  mockDataStore,
  addSensor, updateSensor, deleteSensor,
  addAlert, updateAlert, deleteAlert,
  updateCropHealth, updateWeather,
  addUser, updateUser, deleteUser,
  applyScenario, resetToDefaults,
  exportMockData, importMockData,
} from '../../services/mockDataService';

const TABS = ['Sensors', 'Alerts', 'Crop Health', 'Weather', 'Users', 'Scenarios'];

export default function MockDataPanel() {
  const [activeTab, setActiveTab] = useState('Sensors');
  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate(n => n + 1), []);

  return (
    <div className="mock-panel">
      {/* Tab Bar */}
      <div className="mock-tabs" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`mock-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mock-tab-content">
        {activeTab === 'Sensors'    && <SensorsTab    refresh={refresh} />}
        {activeTab === 'Alerts'     && <AlertsTab     refresh={refresh} />}
        {activeTab === 'Crop Health' && <CropHealthTab refresh={refresh} />}
        {activeTab === 'Weather'    && <WeatherTab    refresh={refresh} />}
        {activeTab === 'Users'      && <UsersTab      refresh={refresh} />}
        {activeTab === 'Scenarios'  && <ScenariosTab  refresh={refresh} />}
      </div>
    </div>
  );
}

// ─── SENSORS TAB ─────────────────────────────────────────────────────────────
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
    <div className="mock-section">
      <h3 className="mock-section-title">Sensor Records <span className="mock-badge">{sensors.length}</span></h3>

      <form className="mock-form" onSubmit={handleAdd}>
        <div className="mock-form-row">
          <div className="mock-field">
            <label htmlFor="s-name">Sensor Name</label>
            <input id="s-name" type="text" placeholder="Field A - Zone 1" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="mock-field">
            <label htmlFor="s-moisture">Moisture %</label>
            <input id="s-moisture" type="number" min="0" max="100" value={form.moisture}
              onChange={e => setForm(p => ({ ...p, moisture: +e.target.value }))} />
          </div>
          <div className="mock-field">
            <label htmlFor="s-temp">Temp °C</label>
            <input id="s-temp" type="number" min="0" max="60" step="0.1" value={form.temperature}
              onChange={e => setForm(p => ({ ...p, temperature: +e.target.value }))} />
          </div>
          <div className="mock-field">
            <label htmlFor="s-humidity">Humidity %</label>
            <input id="s-humidity" type="number" min="0" max="100" value={form.humidity}
              onChange={e => setForm(p => ({ ...p, humidity: +e.target.value }))} />
          </div>
        </div>
        <button type="submit" className="mock-btn mock-btn-primary">+ Add Sensor</button>
      </form>

      {sensors.length === 0 ? (
        <p className="mock-empty">No sensors. Add one above.</p>
      ) : (
        <div className="mock-table-wrap">
          <table className="mock-table">
            <thead>
              <tr><th>ID</th><th>Name</th><th>Moisture</th><th>Temp</th><th>Humidity</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {sensors.map(s => (
                <tr key={s.id}>
                  <td><span className="mock-id">{s.id}</span></td>
                  <td>
                    <input className="mock-inline-input" defaultValue={s.name}
                      onBlur={e => { updateSensor(s.id, { name: e.target.value }); refresh(); }} />
                  </td>
                  <td>
                    <input className="mock-inline-input narrow" type="number" min="0" max="100"
                      defaultValue={s.moisture}
                      onBlur={e => { updateSensor(s.id, { moisture: +e.target.value }); refresh(); }} />
                  </td>
                  <td>
                    <input className="mock-inline-input narrow" type="number" step="0.1"
                      defaultValue={s.temperature}
                      onBlur={e => { updateSensor(s.id, { temperature: +e.target.value }); refresh(); }} />
                  </td>
                  <td>
                    <input className="mock-inline-input narrow" type="number" min="0" max="100"
                      defaultValue={s.humidity}
                      onBlur={e => { updateSensor(s.id, { humidity: +e.target.value }); refresh(); }} />
                  </td>
                  <td>
                    <select className="mock-select-sm" defaultValue={s.status}
                      onChange={e => { updateSensor(s.id, { status: e.target.value }); refresh(); }}>
                      <option value="active">active</option>
                      <option value="warning">warning</option>
                      <option value="offline">offline</option>
                    </select>
                  </td>
                  <td>
                    <button className="mock-btn-icon" aria-label="Delete sensor"
                      onClick={() => { deleteSensor(s.id); refresh(); }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── ALERTS TAB ───────────────────────────────────────────────────────────────
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
    <div className="mock-section">
      <h3 className="mock-section-title">Alert Records <span className="mock-badge">{alerts.length}</span></h3>

      <form className="mock-form" onSubmit={handleAdd}>
        <div className="mock-form-row">
          <div className="mock-field">
            <label htmlFor="a-type">Type</label>
            <select id="a-type" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="moisture">moisture</option>
              <option value="temperature">temperature</option>
              <option value="system">system</option>
              <option value="disease">disease</option>
            </select>
          </div>
          <div className="mock-field">
            <label htmlFor="a-severity">Severity</label>
            <select id="a-severity" value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>
          <div className="mock-field flex-2">
            <label htmlFor="a-msg">Message</label>
            <input id="a-msg" type="text" placeholder="Alert message..." value={form.message}
              onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required />
          </div>
        </div>
        <button type="submit" className="mock-btn mock-btn-primary">+ Add Alert</button>
      </form>

      {alerts.length === 0 ? (
        <p className="mock-empty">No alerts defined.</p>
      ) : (
        <div className="mock-table-wrap">
          <table className="mock-table">
            <thead><tr><th>ID</th><th>Type</th><th>Severity</th><th>Message</th><th>Enabled</th><th></th></tr></thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a.id}>
                  <td><span className="mock-id">{a.id}</span></td>
                  <td><span className={`mock-chip type-${a.type}`}>{a.type}</span></td>
                  <td><span className={`mock-chip sev-${a.severity}`}>{a.severity}</span></td>
                  <td>
                    <input className="mock-inline-input wide" defaultValue={a.message}
                      onBlur={e => { updateAlert(a.id, { message: e.target.value }); refresh(); }} />
                  </td>
                  <td>
                    <label className="mock-toggle-sm" aria-label="Toggle alert">
                      <input type="checkbox" checked={a.enabled}
                        onChange={e => { updateAlert(a.id, { enabled: e.target.checked }); refresh(); }} />
                      <span className="slider-sm" />
                    </label>
                  </td>
                  <td>
                    <button className="mock-btn-icon" onClick={() => { deleteAlert(a.id); refresh(); }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── CROP HEALTH TAB ──────────────────────────────────────────────────────────
function CropHealthTab({ refresh }) {
  const ch = mockDataStore.cropHealth || {};

  function handleChange(field, value) {
    updateCropHealth({ [field]: value });
    refresh();
  }

  return (
    <div className="mock-section">
      <h3 className="mock-section-title">Crop Health Values</h3>
      <div className="mock-sliders">
        <SliderField label="Overall Health Score" value={ch.overallScore ?? 0} min={0} max={100}
          onChange={v => handleChange('overallScore', v)} unit="%" />
        <SliderField label="Disease Probability" value={ch.diseaseProbability ?? 0} min={0} max={100}
          onChange={v => handleChange('diseaseProbability', v)} unit="%" />
        <SliderField label="Water Stress" value={ch.waterStress ?? 0} min={0} max={100}
          onChange={v => handleChange('waterStress', v)} unit="%" />
        <SliderField label="Nutrient Level" value={ch.nutrientLevel ?? 0} min={0} max={100}
          onChange={v => handleChange('nutrientLevel', v)} unit="%" />
        <div className="mock-field">
          <label htmlFor="growth-stage">Growth Stage</label>
          <select id="growth-stage" value={ch.growthStage ?? 'Vegetative'}
            onChange={e => handleChange('growthStage', e.target.value)}>
            {['Germination', 'Seedling', 'Vegetative', 'Budding', 'Flowering', 'Ripening', 'Harvest'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── WEATHER TAB ──────────────────────────────────────────────────────────────
function WeatherTab({ refresh }) {
  const w = mockDataStore.weather || {};

  function handleChange(field, value) {
    updateWeather({ [field]: value });
    refresh();
  }

  return (
    <div className="mock-section">
      <h3 className="mock-section-title">Weather Data</h3>
      <div className="mock-sliders">
        <SliderField label="Temperature" value={w.temperature ?? 25} min={0} max={50}
          onChange={v => handleChange('temperature', v)} unit="°C" />
        <SliderField label="Humidity" value={w.humidity ?? 60} min={0} max={100}
          onChange={v => handleChange('humidity', v)} unit="%" />
        <SliderField label="Rainfall" value={w.rainfall ?? 0} min={0} max={200}
          onChange={v => handleChange('rainfall', v)} unit="mm" />
        <SliderField label="Wind Speed" value={w.windSpeed ?? 10} min={0} max={100}
          onChange={v => handleChange('windSpeed', v)} unit="km/h" />
        <SliderField label="UV Index" value={w.uvIndex ?? 5} min={0} max={12}
          onChange={v => handleChange('uvIndex', v)} unit="" />
        <div className="mock-field">
          <label htmlFor="forecast">Forecast</label>
          <select id="forecast" value={w.forecast ?? 'Sunny'}
            onChange={e => handleChange('forecast', e.target.value)}>
            {['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Thunderstorm', 'Windy'].map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── USERS TAB ────────────────────────────────────────────────────────────────
function UsersTab({ refresh }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'viewer' });
  const users = mockDataStore.users;

  function handleAdd(e) {
    e.preventDefault();
    addUser(form);
    setForm({ name: '', email: '', role: 'viewer' });
    refresh();
  }

  return (
    <div className="mock-section">
      <h3 className="mock-section-title">User Accounts <span className="mock-badge">{users.length}</span></h3>

      <form className="mock-form" onSubmit={handleAdd}>
        <div className="mock-form-row">
          <div className="mock-field">
            <label htmlFor="u-name">Name</label>
            <input id="u-name" type="text" placeholder="Full name" value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="mock-field">
            <label htmlFor="u-email">Email</label>
            <input id="u-email" type="email" placeholder="user@example.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="mock-field">
            <label htmlFor="u-role">Role</label>
            <select id="u-role" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="admin">admin</option>
              <option value="viewer">viewer</option>
              <option value="operator">operator</option>
            </select>
          </div>
        </div>
        <button type="submit" className="mock-btn mock-btn-primary">+ Add User</button>
      </form>

      <div className="mock-table-wrap">
        <table className="mock-table">
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><span className="mock-id">{u.id}</span></td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select className="mock-select-sm" value={u.role}
                    onChange={e => { updateUser(u.id, { role: e.target.value }); refresh(); }}>
                    <option value="admin">admin</option>
                    <option value="viewer">viewer</option>
                    <option value="operator">operator</option>
                  </select>
                </td>
                <td>
                  <label className="mock-toggle-sm">
                    <input type="checkbox" checked={u.active}
                      onChange={e => { updateUser(u.id, { active: e.target.checked }); refresh(); }} />
                    <span className="slider-sm" />
                  </label>
                </td>
                <td>
                  <button className="mock-btn-icon" onClick={() => { deleteUser(u.id); refresh(); }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SCENARIOS TAB ────────────────────────────────────────────────────────────
function ScenariosTab({ refresh }) {
  const [importText, setImportText] = useState('');
  const [importMsg, setImportMsg] = useState('');

  const scenarios = [
    { key: 'normal',   label: 'Normal',    desc: 'Realistic sensor readings, a few alerts', color: 'success' },
    { key: 'empty',    label: 'Empty',     desc: 'All collections cleared, test empty states', color: 'muted' },
    { key: 'error',    label: 'Error State', desc: 'Simulate null data / API failure', color: 'error' },
    { key: 'highLoad', label: 'High Load', desc: '20 sensors, dense data set', color: 'warning' },
    { key: 'demo',     label: 'Demo Mode', desc: 'Best-case readings for presentations', color: 'primary' },
  ];

  function handleImport() {
    const result = importMockData(importText);
    setImportMsg(result.success ? '✓ Imported successfully' : `✗ ${result.error}`);
    if (result.success) { setImportText(''); refresh(); }
  }

  function handleExport() {
    const data = exportMockData();
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sproutsense-mock-data.json';
    a.click();
  }

  return (
    <div className="mock-section">
      <h3 className="mock-section-title">Dataset Scenarios</h3>
      <p className="mock-desc">Apply a preset to instantly switch the entire mock dataset.</p>

      <div className="mock-scenarios">
        {scenarios.map(s => (
          <button key={s.key}
            className={`mock-scenario-card ${mockDataStore.scenario === s.key ? 'active' : ''} scenario-${s.color}`}
            onClick={() => { applyScenario(s.key); refresh(); }}>
            <span className="scenario-label">{s.label}</span>
            <span className="scenario-desc">{s.desc}</span>
            {mockDataStore.scenario === s.key && <span className="scenario-active-dot" />}
          </button>
        ))}
      </div>

      <div className="mock-divider" />

      <div className="mock-io">
        <div className="mock-io-section">
          <h4>Export Current Data</h4>
          <p className="mock-desc">Download the current mock dataset as JSON.</p>
          <button className="mock-btn mock-btn-secondary" onClick={handleExport}>
            ↓ Export JSON
          </button>
        </div>
        <div className="mock-io-section">
          <h4>Import Data</h4>
          <p className="mock-desc">Paste a JSON dataset to replace current mock data.</p>
          <textarea
            className="mock-textarea"
            placeholder='{ "sensors": [...], "alerts": [...] }'
            value={importText}
            onChange={e => setImportText(e.target.value)}
            rows={4}
          />
          <button className="mock-btn mock-btn-secondary" onClick={handleImport}>↑ Import JSON</button>
          {importMsg && <p className="mock-import-msg">{importMsg}</p>}
        </div>
      </div>

      <div className="mock-divider" />
      <div className="mock-reset-row">
        <span className="mock-desc">Restore all data to default seed values.</span>
        <button className="mock-btn mock-btn-danger" onClick={() => { resetToDefaults(); refresh(); }}>
          ↺ Reset to Defaults
        </button>
      </div>
    </div>
  );
}

// ─── Slider helper ────────────────────────────────────────────────────────────
function SliderField({ label, value, min, max, onChange, unit }) {
  return (
    <div className="mock-slider-field">
      <div className="mock-slider-header">
        <label>{label}</label>
        <span className="mock-slider-value">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(+e.target.value)} />
    </div>
  );
}