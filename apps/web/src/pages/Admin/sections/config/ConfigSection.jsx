import React from 'react';
import '../SectionStyles.css';

export default function ConfigSection({ configData }) {
  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2><i className="fa-solid fa-sliders" /> Active Configuration</h2>
      </div>
      <div className="adm-glass-box adm-config-panel-intro">
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
  );
}
