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
          background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(16, 185, 129, 0.05))',
          borderRadius: '0.75rem',
          border: '1px solid rgba(34, 211, 238, 0.2)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Current Scenario</div>
            <div style={{ fontSize: '1.1rem', color: '#22d3ee', fontWeight: 700, textTransform: 'capitalize' }}>{currentScenario}</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Sensors Active</div>
            <div style={{ fontSize: '1.1rem', color: '#10b981', fontWeight: 700 }}>{sensorCount}</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Alerts</div>
            <div style={{ fontSize: '1.1rem', color: alertCount > 0 ? '#f59e0b' : '#6b7280', fontWeight: 700 }}>{alertCount}</div>
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
              color: isSimulating ? '#22d3ee' : '#6b7280'
            }}>
              {isSimulating && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22d3ee', animation: 'pulse 2s infinite' }} />}
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
            background: 'rgba(34, 211, 238, 0.05)',
            borderRadius: '0.5rem',
            border: '1px solid rgba(34, 211, 238, 0.15)',
            fontSize: '0.85rem',
            color: '#cbd5e1',
            lineHeight: 1.6
          }}>
            <strong style={{ color: '#22d3ee' }}>💡 Quick Start:</strong>
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
