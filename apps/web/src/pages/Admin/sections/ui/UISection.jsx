import React from 'react';

export default function UISection({
  uiPreferences,
  handleUiPreferenceChange,
  handleAddCustomSensor,
  sensorRegistry,
  handleDeleteCustomSensor,
  handleUiSensorIconChange,
  handleUiSensorColorChange,
  handleUiSensorChartTypeChange,
  handleUiSensorAnalyticsToggle,
  handleUiSensorDashboardToggle,
  handleSaveUiPreferences,
  savingUiPreferences,
}) {
  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2><i className="fa-solid fa-palette" /> UI Control Center</h2>
        <span className="adm-section-badge">Live UI Config</span>
      </div>

      <div className="adm-ui-controls-grid">
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
                  <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</span>
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
  );
}
