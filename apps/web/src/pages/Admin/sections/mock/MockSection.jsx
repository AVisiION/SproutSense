import React from 'react';
import MockDataPanel from './MockDataPanel';
import { mockDataStore, isSimulationActive } from '../../../../services/mockDataService';
import '../SectionStyles.css';

export default function MockSection({ mockEnabled, handleMockToggle }) {
  const currentScenario = mockDataStore.scenario || 'normal';
  const sensorCount = (mockDataStore.sensors || []).length;
  const alertCount = (mockDataStore.alerts || []).length;
  const isSimulating = isSimulationActive();

  return (
    <div className="adm-section">
      <div className="adm-glass-box adm-mock-header-card">
        <div>
          <h2 className="adm-mock-title">
            <i className="fa-solid fa-vial adm-mock-title-icon" />
            Mock Data Control
          </h2>
          <p className="adm-mock-subtitle">
            Override live API data for testing and presentations. Default: Off.
          </p>
        </div>

        <label className="adm-mock-toggle-wrap">
          <span className={`adm-mock-toggle-state ${mockEnabled ? 'adm-mock-toggle-state--on' : ''}`}>
            {mockEnabled ? 'ON' : 'OFF'}
          </span>

          <span className="adm-mock-switch-shell">
            <input
              type="checkbox"
              checked={mockEnabled}
              onChange={handleMockToggle}
              className="adm-mock-switch-input"
              aria-label="Enable mock data mode"
            />
            <span className={`adm-mock-switch-track ${mockEnabled ? 'adm-mock-switch-track--on' : ''}`}>
              <span className={`adm-mock-switch-knob ${mockEnabled ? 'adm-mock-switch-knob--on' : ''}`} />
            </span>
          </span>
        </label>
      </div>

      {mockEnabled && (
        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem 1.5rem', 
          background: 'var(--grad-glow)',
          borderRadius: '0.75rem',
          border: 'var(--info-border)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Current Scenario</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--chart-humidity)', fontWeight: 700, textTransform: 'capitalize' }}>{currentScenario}</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Sensors Active</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--plant-green)', fontWeight: 700 }}>{sensorCount}</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Alerts</div>
            <div style={{ fontSize: '1.1rem', color: alertCount > 0 ? 'var(--rec-high)' : 'var(--sensor-card-fallback)', fontWeight: 700 }}>{alertCount}</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Drift Mode</div>
            <div style={{ 
              fontSize: '1.1rem', 
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: isSimulating ? 'var(--chart-humidity)' : 'var(--sensor-card-fallback)'
            }}>
              {isSimulating && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--chart-humidity)', animation: 'pulse 2s infinite' }} />}
              {isSimulating ? 'ON' : 'OFF'}
            </div>
          </div>
        </div>
      )}

      {mockEnabled ? (
        <MockDataPanel />
      ) : (
        <div className="adm-glass-box adm-mock-disabled-card">
          <i className="fa-solid fa-power-off adm-mock-disabled-icon" />
          <h3 className="adm-mock-disabled-title">Mock Data is Disabled</h3>
          <p className="adm-mock-disabled-subtitle">
            Turn on the switch above to reveal the control panel and inject mock scenarios into the dashboard.
          </p>

            <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'var(--card-bg)',
            borderRadius: '0.5rem',
            border: 'var(--border-color)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6
          }}>
            <strong style={{ color: 'var(--chart-humidity)' }}>💡 Quick Start:</strong>
            <ol style={{ margin: '0.5rem 0 0', paddingLeft: '1.5rem' }}>
              <li>Enable the switch above</li>
              <li>Go to the <strong>Preset Scenarios</strong> tab</li>
              <li>Select a scenario (e.g., "Baseline Stability")</li>
              <li>Optionally enable "Drift Mode" for live simulation</li>
              <li>Check the dashboard — all pages now show mock data!</li>
            </ol>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
