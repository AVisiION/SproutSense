import React from "react";

export default function DeviceCard({ name, icon, status, detail, color }) {
  const isOnline = status?.toLowerCase().includes('online') ||
                   status?.toLowerCase().includes('connected') ||
                   status?.toLowerCase().includes('active');
  return (
    <div className={`adm-device-card adm-device-card--${color}`}>
      <div className="adm-device-icon">
        <i className={`fa-solid ${icon}`} />
      </div>
      <div className="adm-device-info">
        <div className="adm-device-name">{name}</div>
        <div className="adm-device-detail">{detail}</div>
        <div className="adm-device-status">
          <span className={`adm-status-dot ${isOnline ? 'adm-status-dot--green' : 'adm-status-dot--red'}`} />
          {status}
        </div>
      </div>
    </div>
  );
}

