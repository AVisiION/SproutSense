import { isMockEnabled, mockDataStore } from '../../services/mockDataService';
import { useState } from 'react';
import { getCSSVariableValue } from '../../utils/colorUtils';

export default function MockBanner() {
  if (!isMockEnabled()) return null;

  const [showDetails, setShowDetails] = useState(false);
  const isSimulating = mockDataStore.simulationActive;
  const sensorCount = (mockDataStore.sensors || []).length;
  
  // Resolve CSS variables for styling
  const iconColor = getCSSVariableValue('--mock-banner-icon-bg');
  const accentColor = getCSSVariableValue('--mock-banner-accent');
  const bgSim = getCSSVariableValue('--mock-banner-bg-sim');
  const bgNormal = getCSSVariableValue('--mock-banner-bg-normal');
  const borderSim = getCSSVariableValue('--mock-banner-border-sim');
  const borderNormal = getCSSVariableValue('--mock-banner-border-normal');
  const textSim = getCSSVariableValue('--mock-banner-text-sim');
  const textNormal = getCSSVariableValue('--mock-banner-text-normal');
  const panelBg = getCSSVariableValue('--mock-banner-panel-bg');
  const panelBorder = getCSSVariableValue('--mock-banner-panel-border');
  const panelText = getCSSVariableValue('--mock-banner-panel-text');
  
  return (
    <>
      <div
        role="alert"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 9999,
          background: isSimulating ? bgSim : bgNormal,
          borderBottom: isSimulating ? borderSim : borderNormal,
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.8125rem',
          fontWeight: 500,
          color: isSimulating ? textSim : textNormal,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          {isSimulating ? (
            <span style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: iconColor,
              animation: 'pulse 2s infinite'
            }} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          )}
          <span>
            <strong>Mock Data Active</strong> — 
            {isSimulating 
              ? ` Live Simulation ON (${sensorCount} sensors drifting)` 
              : ' Live sensor readings are overridden'
            }
          </span>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'inherit',
            color: 'inherit',
            textDecoration: 'underline',
            fontWeight: 600,
            padding: '0 0.5rem',
          }}
        >
          {showDetails ? 'Hide' : 'Help'}
        </button>
      </div>

      {showDetails && (
        <div style={{
          position: 'sticky',
          top: '32px',
          zIndex: 9998,
          background: panelBg,
          borderBottom: panelBorder,
          padding: '1rem 1.25rem',
          color: panelText,
          fontSize: '0.8rem',
          lineHeight: 1.6,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ maxWidth: '75rem', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <h4 style={{ margin: '0 0 0.5rem', color: accentColor, fontSize: '0.875rem', fontWeight: 600 }}>
                  ✅ Current Status
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1rem', listStyle: 'none' }}>
                  <li>Scenario: <strong>{mockDataStore.scenario}</strong></li>
                  <li>Sensors: <strong>{sensorCount}</strong></li>
                  <li>Drift Mode: <strong>{isSimulating ? 'ON' : 'OFF'}</strong></li>
                </ul>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem', color: accentColor, fontSize: '0.875rem', fontWeight: 600 }}>
                  🚀 Quick Actions
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                  <li>Go to <strong>Admin Panel</strong> → <strong>Mock Data Control</strong></li>
                  <li>Check <strong>Help & Guide</strong> tab for full instructions</li>
                  <li>Customize in <strong>Sensors</strong>, <strong>Alerts</strong>, <strong>Crop</strong> tabs</li>
                </ul>
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem', color: accentColor, fontSize: '0.875rem', fontWeight: 600 }}>
                  📋 Supported Pages
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                  <li>✓ Home → Sensor readings & alerts</li>
                  <li>✓ Analytics → History charts & KPIs</li>
                  <li>✓ Records → Watering logs</li>
                  <li>✓ Insights → Disease detection</li>
                </ul>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <button
                  onClick={() => setShowDetails(false)}
                  style={{
                    background: 'rgba(34, 211, 238, 0.1)',
                    border: '1px solid rgba(34, 211, 238, 0.3)',
                    color: accentColor,
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Close Help Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  );
}