import React from "react";

export default function LogBadge({ type, count, label }) {
  return (
    <div className={`adm-log-badge adm-log-badge--${type}`}>
      <span className="adm-log-badge-count">{count}</span>
      <span className="adm-log-badge-label">{label}</span>
    </div>
  );
}