import React from 'react';
import LogBadge from '../components/badges/LogBadge';
import './SectionStyles.css';

export default function LogsSection({
  exportLogs,
  exportAuditLogs,
  clearLogs,
  logSearch,
  setLogSearch,
  logLevel,
  setLogLevel,
  filteredLogs,
  logEndRef,
}) {
  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2><i className="fa-solid fa-terminal" /> Admin Audit Logs</h2>
        <div className="adm-btn-row">
          <button className="adm-icon-btn adm-icon-btn--yellow" onClick={exportLogs} title="Export current on-screen text logs">
            <i className="fa-solid fa-file-arrow-down" />
          </button>
          <button className="adm-icon-btn adm-icon-btn--yellow" onClick={() => exportAuditLogs('csv')} title="Export filtered audit logs CSV">
            <i className="fa-solid fa-file-csv" />
          </button>
          <button className="adm-icon-btn adm-icon-btn--yellow" onClick={() => exportAuditLogs('json')} title="Export filtered audit logs JSON">
            <i className="fa-solid fa-file-code" />
          </button>
          <button className="adm-icon-btn adm-icon-btn--red" onClick={clearLogs} title="Clear logs">
            <i className="fa-solid fa-trash" />
          </button>
        </div>
      </div>

      <div className="adm-glass-box adm-logs-filter-card">
        <div className="adm-config-row">
          <span className="adm-config-key">Search</span>
          <input
            className="adm-input adm-logs-search-input"
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="Search action, actor, section"
          />
        </div>
        <div className="adm-config-row">
          <span className="adm-config-key">Level</span>
          <select className="adm-input" value={logLevel} onChange={(e) => setLogLevel(e.target.value)}>
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      <div className="adm-log-stats">
        <LogBadge type="success" count={filteredLogs.filter((l) => l.type === 'success').length} label="Success" />
        <LogBadge type="info" count={filteredLogs.filter((l) => l.type === 'info').length} label="Info" />
        <LogBadge type="warning" count={filteredLogs.filter((l) => l.type === 'warning').length} label="Warning" />
        <LogBadge type="error" count={filteredLogs.filter((l) => l.type === 'error').length} label="Error" />
      </div>

      <div className="adm-glass-box adm-logs-table-card">
        <h3><i className="fa-solid fa-table" /> Filtered Log Table ({filteredLogs.length})</h3>
        <div className="adm-logs-table-wrap">
          <table className="adm-log-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Level</th>
                <th>Actor</th>
                <th>Section</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="adm-log-table-empty">No matching logs</td>
                </tr>
              ) : filteredLogs.map((entry) => (
                <tr key={`row-${entry.id}`}>
                  <td>{entry.date} {entry.time}</td>
                  <td>
                    <span className={`adm-log-type adm-log-type--${entry.type}`}>
                      {entry.type?.toUpperCase()}
                    </span>
                  </td>
                  <td>{entry.actor || 'admin'}</td>
                  <td>{entry.section || '-'}</td>
                  <td>{entry.msg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="adm-log-terminal">
        {filteredLogs.length === 0 ? (
          <div className="adm-empty">
            <i className="fa-solid fa-circle-check" /> No actions logged yet.
          </div>
        ) : (
          filteredLogs.map((entry) => (
            <div key={entry.id} className={`adm-log-row adm-log-row--${entry.type}`}>
              <span className="adm-log-time">[{entry.time}]</span>
              <span className={`adm-log-type adm-log-type--${entry.type}`}>
                [{entry.type.toUpperCase()}]
              </span>
              <span className="adm-log-msg">{entry.actor || 'admin'}@{entry.section || 'admin-panel'} - {entry.msg}</span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
