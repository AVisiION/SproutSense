import React from 'react';
import MockDataPanel from './MockDataPanel';
import '../SectionStyles.css';

export default function MockSection({ mockEnabled, handleMockToggle }) {
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

      {mockEnabled ? (
        <MockDataPanel />
      ) : (
        <div className="adm-glass-box adm-mock-disabled-card">
          <i className="fa-solid fa-power-off adm-mock-disabled-icon" />
          <h3 className="adm-mock-disabled-title">Mock Data is Disabled</h3>
          <p className="adm-mock-disabled-subtitle">
            Turn on the switch above to reveal the control panel and inject mock scenarios into the dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
