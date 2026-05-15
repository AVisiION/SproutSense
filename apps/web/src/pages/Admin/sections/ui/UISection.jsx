import React, { useState } from 'react';
import './UISection.css';

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
  handleUiSensorPropertyChange,
  handleSaveUiPreferences,
  handleSaveUserPreferences,
  savingUiPreferences,
  users = [],
}) {
  const [activeTab, setActiveTab] = useState('general');
  const [targetMode, setTargetMode] = useState('global'); // 'global', 'specific', 'all'
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const safePrefs = uiPreferences || {};
  const sidebarVisibility = safePrefs.sidebarVisibility || {};
  const sidebarLabels = safePrefs.sidebarLabels || {};
  const sidebarIcons = safePrefs.sidebarIcons || {};
  const dashboardSections = safePrefs.dashboardSections || {};
  const dashboardLabels = safePrefs.dashboardLabels || {};
  const dashboardIcons = safePrefs.dashboardIcons || {};
  const widgets = safePrefs.widgets || {};
  const appearance = safePrefs.appearance || {};
  const notifications = safePrefs.notifications || {};
  const dataDisplay = safePrefs.dataDisplay || {};
  const accessibility = safePrefs.accessibility || {};

  const tabs = [
    { id: 'general', label: 'General', icon: 'fa-wand-magic-sparkles' },
    { id: 'navigation', label: 'Navigation', icon: 'fa-table-columns' },
    { id: 'features', label: 'Features', icon: 'fa-puzzle-piece' },
    { id: 'sensors', label: 'Sensors', icon: 'fa-chart-line' },
  ];

  return (
    <div className="ui-root">
      <div className="ui-header">
        <div className="ui-header-icon">
          <i className="fa-solid fa-palette" />
        </div>
        <div>
          <h2 className="ui-title">UI Control Center</h2>
          <p className="ui-sub">Configure aesthetic preferences, visible modules, and sensor graph representations.</p>
        </div>
        
        <div className="ui-target-controls">
          <div className="ui-mode-selector">
            <button 
              className={`ui-mode-btn ${targetMode === 'global' ? 'active' : ''}`}
              onClick={() => { setTargetMode('global'); setSelectedUserIds([]); }}
              title="Apply changes to system-wide defaults"
            >
              <i className="fa-solid fa-globe" />
              Global
            </button>
            <button 
              className={`ui-mode-btn ${targetMode === 'all' ? 'active' : ''}`}
              onClick={() => { setTargetMode('all'); setSelectedUserIds([]); }}
              title="Push these settings to EVERY user's personal profile"
            >
              <i className="fa-solid fa-users" />
              All Users
            </button>
            <div className="ui-specific-wrapper">
              <button 
                className={`ui-mode-btn ${targetMode === 'specific' ? 'active' : ''}`}
                onClick={() => setTargetMode('specific')}
                title="Apply changes to specific users only"
              >
                <i className="fa-solid fa-user-check" />
                Targeted ({selectedUserIds.length})
              </button>
              
              {targetMode === 'specific' && (
                <div className="ui-user-dropdown-trigger" onClick={() => setShowUserDropdown(!showUserDropdown)}>
                  <i className={`fa-solid fa-chevron-${showUserDropdown ? 'up' : 'down'}`} />
                </div>
              )}

              {showUserDropdown && targetMode === 'specific' && (
                <div className="ui-user-dropdown glass-card">
                  <div className="ui-user-search">
                    <i className="fa-solid fa-magnifying-glass" />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()} 
                    />
                  </div>
                  <div className="ui-user-list">
                    {users
                      .filter(u => 
                        u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) || 
                        u.email?.toLowerCase().includes(userSearch.toLowerCase())
                      )
                      .map(user => (
                      <label key={user.id} className="ui-user-item" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => {
                            setSelectedUserIds(prev => 
                              prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id]
                            );
                          }}
                        />
                        <div className="ui-user-info">
                          <span className="ui-user-name">{user.fullName}</span>
                          <span className="ui-user-email">{user.email}</span>
                        </div>
                      </label>
                    ))}
                    {users.length === 0 && <div className="ui-user-empty">No users found</div>}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button 
            className={`ui-save-btn ${targetMode !== 'global' ? 'ui-save-btn--targeted' : ''}`}
            disabled={savingUiPreferences || (targetMode === 'specific' && selectedUserIds.length === 0)}
            onClick={() => {
              if (targetMode === 'global') handleSaveUiPreferences();
              else if (targetMode === 'all') handleSaveUserPreferences([], true);
              else handleSaveUserPreferences(selectedUserIds, false);
            }}
          >
            {savingUiPreferences ? (
              <i className="fa-solid fa-circle-notch fa-spin" />
            ) : (
              <i className="fa-solid fa-floppy-disk" />
            )}
            {targetMode === 'global' ? 'Save Global' : targetMode === 'all' ? 'Push to All' : 'Apply to Selected'}
          </button>
        </div>
      </div>

      <div className="ui-tabs-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`ui-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fa-solid ${tab.icon}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="ui-tab-content">
        {activeTab === 'general' && (
          <div className="ui-grid">
            {/* Appearance Settings */}
            <div className="ui-card">
              <div className="ui-card-header">
                <div className="ui-card-icon" style={{ background: 'var(--surface-1)', color: 'var(--orchid-color)' }}>
                  <i className="fa-solid fa-wand-magic-sparkles" />
                </div>
                <div>
                  <h3 className="ui-card-title">Appearance & Theme</h3>
                  <p className="ui-card-desc">Global visual aesthetic settings</p>
                </div>
              </div>
              <div className="ui-options-group">
                <div className="ui-option-row">
                  <span className="ui-option-label">Theme Mode</span>
                  <select 
                    className="ui-select" 
                    value={appearance.theme || 'liquid-glass'}
                    onChange={(e) => handleUiPreferenceChange('appearance', 'theme', e.target.value)}
                  >
                    <option value="liquid-glass">Liquid Glass</option>
                    <option value="dark">Solid Dark</option>
                    <option value="light">Bright Light</option>
                  </select>
                </div>
                <div className="ui-option-row">
                  <span className="ui-option-label">Glass Intensity</span>
                  <select 
                    className="ui-select" 
                    value={appearance.glassIntensity || 'medium'}
                    onChange={(e) => handleUiPreferenceChange('appearance', 'glassIntensity', e.target.value)}
                  >
                    <option value="low">Low (Subtle Blur)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="high">High (Frosted)</option>
                  </select>
                </div>
              </div>
              <div className="ui-list">
                <label className="ui-item">
                  <div className="ui-item-info">
                    <div className={`ui-item-dot ${appearance.animationsEnabled ? 'active' : 'inactive'}`} />
                    <span className="ui-item-label">Enable UI Animations</span>
                  </div>
                  <div className="ui-switch-wrapper">
                    <input type="checkbox" checked={Boolean(appearance.animationsEnabled)} onChange={(e) => handleUiPreferenceChange('appearance', 'animationsEnabled', e.target.checked)} />
                    <span className="ui-switch-slider" />
                  </div>
                </label>
                <label className="ui-item">
                  <div className="ui-item-info">
                    <div className={`ui-item-dot ${appearance.compactMode ? 'active' : 'inactive'}`} />
                    <span className="ui-item-label">Compact Layout Mode</span>
                  </div>
                  <div className="ui-switch-wrapper">
                    <input type="checkbox" checked={Boolean(appearance.compactMode)} onChange={(e) => handleUiPreferenceChange('appearance', 'compactMode', e.target.checked)} />
                    <span className="ui-switch-slider" />
                  </div>
                </label>
              </div>
            </div>

            {/* Accessibility Controls */}
            <div className="ui-card">
              <div className="ui-card-header">
                <div className="ui-card-icon" style={{ background: 'var(--surface-1)', color: 'var(--warning-color)' }}>
                  <i className="fa-solid fa-universal-access" />
                </div>
                <div>
                  <h3 className="ui-card-title">Accessibility</h3>
                  <p className="ui-card-desc">Visibility and contrast improvements</p>
                </div>
              </div>
              <div className="ui-list">
                <label className="ui-item">
                  <div className="ui-item-info">
                    <div className={`ui-item-dot ${accessibility.highContrast ? 'active' : 'inactive'}`} />
                    <span className="ui-item-label">High Contrast Mode</span>
                  </div>
                  <div className="ui-switch-wrapper">
                    <input type="checkbox" checked={Boolean(accessibility.highContrast)} onChange={(e) => handleUiPreferenceChange('accessibility', 'highContrast', e.target.checked)} />
                    <span className="ui-switch-slider" />
                  </div>
                </label>
                <label className="ui-item">
                  <div className="ui-item-info">
                    <div className={`ui-item-dot ${accessibility.largeText ? 'active' : 'inactive'}`} />
                    <span className="ui-item-label">Large Text (Dyslexia Friendly)</span>
                  </div>
                  <div className="ui-switch-wrapper">
                    <input type="checkbox" checked={Boolean(accessibility.largeText)} onChange={(e) => handleUiPreferenceChange('accessibility', 'largeText', e.target.checked)} />
                    <span className="ui-switch-slider" />
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'navigation' && (
          <div className="ui-grid">
            {/* Dashboard Sections */}
            <div className="ui-card">
              <div className="ui-card-header">
                <div className="ui-card-icon" style={{ background: 'var(--surface-1)', color: 'var(--chart-humidity)' }}>
                  <i className="fa-solid fa-layer-group" />
                </div>
                <div>
                  <h3 className="ui-card-title">Dashboard Modules</h3>
                  <p className="ui-card-desc">Customize labels, icons and visibility of main modules</p>
                </div>
              </div>
              <div className="ui-list-nested">
                {Object.entries(dashboardSections).map(([key, enabled]) => (
                  <div className="ui-nested-item" key={`dash-deep-${key}`}>
                    <div className="ui-item-main">
                      <div className="ui-item-info">
                        <div className={`ui-item-dot ${enabled ? 'active' : 'inactive'}`} />
                        <span className="ui-item-label" style={{ fontWeight: 600 }}>{key.toUpperCase()}</span>
                      </div>
                      <div className="ui-switch-wrapper">
                        <input type="checkbox" checked={Boolean(enabled)} onChange={(e) => handleUiPreferenceChange('dashboardSections', key, e.target.checked)} />
                        <span className="ui-switch-slider" />
                      </div>
                    </div>
                    <div className="ui-item-controls">
                      <div className="ui-mini-field">
                        <label>Label</label>
                        <input 
                          className="ui-input-sm" 
                          value={dashboardLabels[key] || ''} 
                          onChange={(e) => handleUiPreferenceChange('dashboardLabels', key, e.target.value)}
                        />
                      </div>
                      <div className="ui-mini-field">
                        <label>Icon</label>
                        <input 
                          className="ui-input-sm" 
                          value={dashboardIcons[key] || ''} 
                          onChange={(e) => handleUiPreferenceChange('dashboardIcons', key, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Visibility */}
            <div className="ui-card">
              <div className="ui-card-header">
                <div className="ui-card-icon" style={{ background: 'var(--surface-1)', color: 'var(--chart-light)' }}>
                  <i className="fa-solid fa-table-columns" />
                </div>
                <div>
                  <h3 className="ui-card-title">Sidebar Navigation</h3>
                  <p className="ui-card-desc">Deep control over sidebar labels and icons</p>
                </div>
              </div>
              <div className="ui-list-nested">
                {Object.entries(sidebarVisibility).map(([key, enabled]) => (
                  <div className="ui-nested-item" key={`sidebar-deep-${key}`}>
                    <div className="ui-item-main">
                      <div className="ui-item-info">
                        <div className={`ui-item-dot ${enabled ? 'active' : 'inactive'}`} />
                        <span className="ui-item-label" style={{ fontWeight: 600 }}>{key.toUpperCase()}</span>
                      </div>
                      <div className="ui-switch-wrapper">
                        <input type="checkbox" checked={Boolean(enabled)} onChange={(e) => handleUiPreferenceChange('sidebarVisibility', key, e.target.checked)} />
                        <span className="ui-switch-slider" />
                      </div>
                    </div>
                    <div className="ui-item-controls">
                      <div className="ui-mini-field">
                        <label>Label</label>
                        <input 
                          className="ui-input-sm" 
                          value={sidebarLabels[key] || ''} 
                          onChange={(e) => handleUiPreferenceChange('sidebarLabels', key, e.target.value)}
                        />
                      </div>
                      <div className="ui-mini-field">
                        <label>Icon</label>
                        <input 
                          className="ui-input-sm" 
                          value={sidebarIcons[key] || ''} 
                          onChange={(e) => handleUiPreferenceChange('sidebarIcons', key, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="ui-grid">
            {/* Widget Controls */}
            <div className="ui-card">
              <div className="ui-card-header">
                <div className="ui-card-icon" style={{ background: 'var(--surface-1)', color: 'var(--chart-healthy)' }}>
                  <i className="fa-solid fa-puzzle-piece" />
                </div>
                <div>
                  <h3 className="ui-card-title">Widget Controls</h3>
                  <p className="ui-card-desc">Fine-tune widget and utility appearance</p>
                </div>
              </div>
              <div className="ui-list">
                {Object.entries(widgets).map(([key, enabled]) => (
                  <label className="ui-item" key={`widget-${key}`}>
                    <div className="ui-item-info">
                      <div className={`ui-item-dot ${enabled ? 'active' : 'inactive'}`} />
                      <span className="ui-item-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}</span>
                    </div>
                    <div className="ui-switch-wrapper">
                      <input type="checkbox" checked={Boolean(enabled)} onChange={(e) => handleUiPreferenceChange('widgets', key, e.target.checked)} />
                      <span className="ui-switch-slider" />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Notifications Controls */}
            <div className="ui-card">
              <div className="ui-card-header">
                <div className="ui-card-icon" style={{ background: 'var(--surface-1)', color: 'var(--rec-critical)' }}>
                  <i className="fa-solid fa-bell" />
                </div>
                <div>
                  <h3 className="ui-card-title">Notifications</h3>
                  <p className="ui-card-desc">Alerting behaviors and positions</p>
                </div>
              </div>
              <div className="ui-options-group">
                <div className="ui-option-row">
                  <span className="ui-option-label">Toast Position</span>
                  <select 
                    className="ui-select" 
                    value={notifications.toastPosition || 'top-right'}
                    onChange={(e) => handleUiPreferenceChange('notifications', 'toastPosition', e.target.value)}
                  >
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>
              </div>
              <div className="ui-list">
                <label className="ui-item">
                  <div className="ui-item-info">
                    <div className={`ui-item-dot ${notifications.soundEnabled ? 'active' : 'inactive'}`} />
                    <span className="ui-item-label">Play Sound on Alerts</span>
                  </div>
                  <div className="ui-switch-wrapper">
                    <input type="checkbox" checked={Boolean(notifications.soundEnabled)} onChange={(e) => handleUiPreferenceChange('notifications', 'soundEnabled', e.target.checked)} />
                    <span className="ui-switch-slider" />
                  </div>
                </label>
                <label className="ui-item">
                  <div className="ui-item-info">
                    <div className={`ui-item-dot ${notifications.browserNotifications ? 'active' : 'inactive'}`} />
                    <span className="ui-item-label">Browser Notifications</span>
                  </div>
                  <div className="ui-switch-wrapper">
                    <input type="checkbox" checked={Boolean(notifications.browserNotifications)} onChange={(e) => handleUiPreferenceChange('notifications', 'browserNotifications', e.target.checked)} />
                    <span className="ui-switch-slider" />
                  </div>
                </label>
              </div>
            </div>

            {/* Data Display Controls */}
            <div className="ui-card">
              <div className="ui-card-header">
                <div className="ui-card-icon" style={{ background: 'var(--surface-1)', color: 'var(--chart-moisture)' }}>
                  <i className="fa-solid fa-database" />
                </div>
                <div>
                  <h3 className="ui-card-title">Data Display</h3>
                  <p className="ui-card-desc">Telemetry rendering configurations</p>
                </div>
              </div>
              <div className="ui-options-group">
                <div className="ui-option-row">
                  <span className="ui-option-label">Default Time Range</span>
                  <select 
                    className="ui-select" 
                    value={dataDisplay.defaultTimeRange || '7d'}
                    onChange={(e) => handleUiPreferenceChange('dataDisplay', 'defaultTimeRange', e.target.value)}
                  >
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>
                <div className="ui-option-row">
                  <span className="ui-option-label">Refresh Interval</span>
                  <select 
                    className="ui-select" 
                    value={dataDisplay.refreshInterval || 30}
                    onChange={(e) => handleUiPreferenceChange('dataDisplay', 'refreshInterval', Number(e.target.value))}
                  >
                    <option value={10}>10 Seconds</option>
                    <option value={30}>30 Seconds</option>
                    <option value={60}>60 Seconds</option>
                  </select>
                </div>
              </div>
              <div className="ui-list">
                <label className="ui-item">
                  <div className="ui-item-info">
                    <div className={`ui-item-dot ${dataDisplay.autoRefresh ? 'active' : 'inactive'}`} />
                    <span className="ui-item-label">Enable Auto-Refresh</span>
                  </div>
                  <div className="ui-switch-wrapper">
                    <input type="checkbox" checked={Boolean(dataDisplay.autoRefresh)} onChange={(e) => handleUiPreferenceChange('dataDisplay', 'autoRefresh', e.target.checked)} />
                    <span className="ui-switch-slider" />
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sensors' && (
          <div className="ui-card">
              <div className="ui-card-header">
                <div className="ui-card-icon" style={{ background: 'var(--surface-1)', color: 'var(--sensor-card-fallback)' }}>
                <i className="fa-solid fa-chart-line" />
              </div>
              <div>
                <h3 className="ui-card-title">Sensor Graph Configuration</h3>
                <p className="ui-card-desc">Configure visual appearance for specific telemetry streams.</p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <button className="ui-btn-secondary" onClick={handleAddCustomSensor}>
                  <i className="fa-solid fa-plus" /> Add Sensor
                </button>
              </div>
            </div>
            
            <div style={{ padding: '20px' }}>
              {sensorRegistry.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-chart-area" style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>No sensors configured for UI graph control.</p>
                </div>
              ) : (
                <div className="ui-sensor-grid">
                  {sensorRegistry.map((sensor) => (
                    <div key={`ui-graph-${sensor.id}`} className="ui-sensor-card">
                      <div className="ui-sensor-header">
                        <div className="ui-sensor-color-preview" style={{ background: sensor.color || 'var(--sensor-card-fallback)' }} />
                        <div className="ui-sensor-name">
                          <h4>{sensor.name}</h4>
                          <span>{sensor.key}</span>
                        </div>
                        <button className="ui-btn-danger" onClick={() => handleDeleteCustomSensor(sensor.id)} title="Delete Sensor">
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>

                      <div className="ui-field-group">
                        <div className="ui-field">
                          <label>Icon Class</label>
                          <input className="ui-input" value={sensor.faIcon || ''} onChange={(e) => handleUiSensorIconChange(sensor, e.target.value)} placeholder="fa-microchip" />
                        </div>
                        <div className="ui-field">
                          <label>Graph Color</label>
                          <div className="ui-color-picker">
                            <input type="color" value={sensor.color || '#6366f1'} onChange={(e) => handleUiSensorColorChange(sensor, e.target.value)} />
                            <span className="ui-color-hex">{sensor.color || '#6366f1'}</span>
                          </div>
                        </div>
                        <div className="ui-field">
                          <label>Chart Type</label>
                          <select className="ui-select" style={{ width: '110px' }} value={sensor.chartType || 'line'} onChange={(e) => handleUiSensorChartTypeChange(sensor, e.target.value)}>
                            <option value="line">Line</option>
                            <option value="area">Area</option>
                            <option value="bar">Bar</option>
                            <option value="gauge">Gauge</option>
                            <option value="scorecard">Scorecard</option>
                            <option value="status">Status</option>
                            <option value="sparkline">Sparkline</option>
                          </select>
                        </div>
                      </div>

                      <div className="ui-field-group" style={{ marginTop: '16px', borderTop: '1px solid var(--border-soft)', paddingTop: '16px' }}>
                        <div className="ui-field">
                          <label>Fill Opacity (%)</label>
                          <input 
                            type="range" 
                            min="0" max="100" 
                            value={sensor.fillOpacity ?? 10} 
                            onChange={(e) => handleUiSensorPropertyChange(sensor, 'fillOpacity', Number(e.target.value))} 
                            style={{ width: '110px' }}
                          />
                        </div>
                        <div className="ui-field">
                          <label>Line Curve (Tension)</label>
                          <input 
                            type="range" 
                            min="0" max="1" step="0.1" 
                            value={sensor.lineTension ?? 0.4} 
                            onChange={(e) => handleUiSensorPropertyChange(sensor, 'lineTension', Number(e.target.value))} 
                            style={{ width: '110px' }}
                          />
                        </div>
                      </div>

                      <div className="ui-list" style={{ borderTop: '1px solid var(--border-soft)', margin: '8px -16px -16px', padding: '8px 0' }}>
                        
                        <label className="ui-item">
                          <div className="ui-item-info">
                            <span className="ui-item-label">Animations Enabled</span>
                          </div>
                          <div className="ui-switch-wrapper">
                            <input type="checkbox" checked={Boolean(sensor.animationEnabled ?? true)} onChange={(e) => handleUiSensorPropertyChange(sensor, 'animationEnabled', e.target.checked)} />
                            <span className="ui-switch-slider" />
                          </div>
                        </label>

                        <label className="ui-item">
                          <div className="ui-item-info">
                            <span className="ui-item-label">Show Data Points</span>
                          </div>
                          <div className="ui-switch-wrapper">
                            <input type="checkbox" checked={Boolean(sensor.showDataPoints ?? false)} onChange={(e) => handleUiSensorPropertyChange(sensor, 'showDataPoints', e.target.checked)} />
                            <span className="ui-switch-slider" />
                          </div>
                        </label>

                        <label className="ui-item">
                          <div className="ui-item-info">
                            <span className="ui-item-label">Auto-Scale Y Axis</span>
                          </div>
                          <div className="ui-switch-wrapper">
                            <input type="checkbox" checked={Boolean(sensor.yAxisAutoScale ?? true)} onChange={(e) => handleUiSensorPropertyChange(sensor, 'yAxisAutoScale', e.target.checked)} />
                            <span className="ui-switch-slider" />
                          </div>
                        </label>

                        <label className="ui-item">
                          <div className="ui-item-info">
                            <span className="ui-item-label">Show in Analytics</span>
                          </div>
                          <div className="ui-switch-wrapper">
                            <input type="checkbox" checked={Boolean(sensor.showInAnalytics)} onChange={(e) => handleUiSensorAnalyticsToggle(sensor, e.target.checked)} />
                            <span className="ui-switch-slider" />
                          </div>
                        </label>
                        
                        <label className="ui-item">
                          <div className="ui-item-info">
                            <span className="ui-item-label">Show in Dashboard</span>
                          </div>
                          <div className="ui-switch-wrapper">
                            <input type="checkbox" checked={Boolean(sensor.showInDashboard)} onChange={(e) => handleUiSensorDashboardToggle(sensor, e.target.checked)} />
                            <span className="ui-switch-slider" />
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
