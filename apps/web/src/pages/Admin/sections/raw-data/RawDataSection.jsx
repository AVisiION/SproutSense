import React from 'react';
import '../SectionStyles.css';

export default function RawDataSection({ sensorData, waterStatus, onRefresh }) {
  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2><i className="fa-solid fa-database" /> Latest Sensor Payload</h2>
        <button className="adm-icon-btn" onClick={onRefresh} title="Refresh">
          <i className="fa-solid fa-rotate" />
        </button>
      </div>
      <div className="adm-glass-box">
        <pre className="adm-pre">
          {sensorData ? JSON.stringify(sensorData, null, 2) : 'No data available.'}
        </pre>
      </div>
      <div className="adm-glass-box adm-rawdata-water-card">
        <h3 className="adm-rawdata-water-title"><i className="fa-solid fa-droplet" /> Water Status Payload</h3>
        <pre className="adm-pre">
          {waterStatus ? JSON.stringify(waterStatus, null, 2) : 'No data available.'}
        </pre>
      </div>
    </div>
  );
}
