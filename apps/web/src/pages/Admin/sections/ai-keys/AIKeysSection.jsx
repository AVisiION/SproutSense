/**
 * AIKeysSection.jsx
 * Admin-only panel for managing Gemini AI API keys stored in the database.
 * Keys are masked on display. No key values are ever returned to the client.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { aiAPI } from '../../../../utils/api';
import './AIKeysSection.css';

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  );
}

export default function AIKeysSection({ 
  log,
  limitsForm,
  limitErrors,
  aiUsageData,
  savingLimits,
  handleLimitChange,
  handleSaveLimits 
}) {
  const [keys, setKeys]           = useState([]);
  const [allUsage, setAllUsage]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [toggling, setToggling]   = useState(null);
  const [deleting, setDeleting]   = useState(null);
  const [form, setForm]           = useState({ label: '', key: '' });
  const [formError, setFormError] = useState('');
  const [showKey, setShowKey]     = useState(false);

  const fetchKeysAndUsage = useCallback(async () => {
    setLoading(true);
    try {
      const [keysRes, usageRes] = await Promise.all([
        aiAPI.getAdminKeys().catch(() => ({ keys: [] })),
        aiAPI.getAllUsageStats().catch(() => [])
      ]);
      setKeys(keysRes?.keys || []);
      setAllUsage(usageRes?.data || (Array.isArray(usageRes) ? usageRes : []));
    } catch {
      setKeys([]);
      setAllUsage([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeysAndUsage(); }, [fetchKeysAndUsage]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.key.trim() || form.key.trim().length < 10) {
      setFormError('Enter a valid API key (at least 10 characters).');
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      await aiAPI.addAdminKey({ label: form.label.trim() || 'AI API Key', key: form.key.trim() });
      setForm({ label: '', key: '' });
      log?.('AI API key added', 'success');
      await fetchKeysAndUsage();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to add key');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (index) => {
    setToggling(index);
    try {
      await aiAPI.toggleAdminKey(index);
      log?.(`AI key ${index} status toggled`, 'info');
      await fetchKeysAndUsage();
    } catch (err) {
      log?.(err?.response?.data?.message || 'Failed to toggle key', 'error');
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('Delete this AI API key? This cannot be undone.')) return;
    setDeleting(index);
    try {
      await aiAPI.deleteAdminKey(index);
      log?.(`AI key ${index} deleted`, 'warning');
      await fetchKeysAndUsage();
    } catch (err) {
      log?.(err?.response?.data?.message || 'Failed to delete key', 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <section className="aik-root" aria-label="AI API Key Management">
      {/* Header */}
      <div className="aik-header">
        <span className="aik-header-icon"><KeyIcon /></span>
        <div>
          <h2 className="aik-title">AI API Keys & Quotas</h2>
          <p className="aik-sub">
            Manage API keys (Gemini, OpenAI, etc.) used by all AI features. Keys are stored server-side and never exposed to users.
            The first <strong>active</strong> key in the list is used for requests.
          </p>
        </div>
        <span className="aik-badge">Admin Only</span>
      </div>

      {/* Env key notice */}
      <div className="aik-notice">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Keys added here override the <code>AI_API_KEY</code> or <code>GEMINI_API_KEY</code> environment variables. The env var is used as a final fallback.
      </div>

      {/* Quota Section */}
      <div className="aik-card">
        <div className="aik-card-head">
          <span className="aik-card-title">AI Analysis Quota</span>
        </div>
        <div className="adm-limits-control" style={{ padding: '1rem' }}>
          <label className="adm-limits-label" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Daily Limit (Disease detection & crop health)</label>
          <div className="adm-limits-input-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              className="aik-input"
              type="number"
              min="1"
              max="100"
              style={{ width: '100px' }}
              value={limitsForm?.aiDailyAnalysisLimit || ''}
              onChange={(e) => handleLimitChange && handleLimitChange('aiDailyAnalysisLimit', e.target.value)}
            />
            <span className="adm-limits-unit" style={{ color: 'var(--text-secondary)' }}>analyses / day</span>
          </div>
          {limitErrors?.aiDailyAnalysisLimit && <div className="aik-form-error">{limitErrors.aiDailyAnalysisLimit}</div>}
          
          <div className="adm-limits-usage" style={{ background: 'var(--glass-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div className="adm-limits-usage-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Today's Usage</span>
              <span className="adm-limits-usage-count" style={{ fontWeight: '500' }}>
                {aiUsageData ? `${aiUsageData.usedCount} / ${aiUsageData.dailyLimit}` : 'N/A'}
              </span>
            </div>
            <div className="adm-limits-progress-bg" style={{ height: '6px', background: 'var(--glass-border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div
                className="adm-limits-progress-fill"
                style={{
                  height: '100%',
                  width: aiUsageData ? `${Math.min((aiUsageData.usedCount / aiUsageData.dailyLimit) * 100, 100)}%` : '0%',
                  background: aiUsageData && (aiUsageData.usedCount / aiUsageData.dailyLimit) > 0.8 ? '#ef4444' : '#a78bfa',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <div className="adm-limits-usage-footer" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Remaining: <strong>{aiUsageData ? aiUsageData.remaining : 'N/A'}</strong></span>
            </div>
          </div>
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <button className="aik-add-btn" onClick={handleSaveLimits} disabled={savingLimits || !!limitErrors?.aiDailyAnalysisLimit}>
              {savingLimits ? 'Saving...' : 'Save Limits'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Usage Tracking */}
      <div className="aik-card">
        <div className="aik-card-head">
          <span className="aik-card-title">User / Device AI Usage</span>
          <span className="aik-count">{allUsage.length}</span>
        </div>
        
        {loading ? (
          <div className="aik-loading">
            <div className="aik-spinner" />
            Loading usage...
          </div>
        ) : allUsage.length === 0 ? (
          <div className="aik-empty">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <p>No usage tracked for today.</p>
          </div>
        ) : (
          <table className="aik-table">
            <thead>
              <tr>
                <th>Device ID / User</th>
                <th>Used</th>
                <th>Daily Limit</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Last Used</th>
              </tr>
            </thead>
            <tbody>
              {allUsage.map((u, i) => (
                <tr key={u.deviceId || i}>
                  <td className="aik-label">{u.deviceId}</td>
                  <td>{u.usedCount}</td>
                  <td>{u.dailyLimit}</td>
                  <td>{u.remaining}</td>
                  <td>
                    {u.exhausted ? (
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Exhausted</span>
                    ) : (
                      <span style={{ color: '#22c55e' }}>Healthy</span>
                    )}
                  </td>
                  <td className="aik-date">
                    {u.lastUsedAt ? new Date(u.lastUsedAt).toLocaleString() : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Keys table */}
      <div className="aik-card">
        <div className="aik-card-head">
          <span className="aik-card-title">Stored Keys</span>
          <span className="aik-count">{keys.length}</span>
        </div>

        {loading ? (
          <div className="aik-loading">
            <div className="aik-spinner" />
            Loading keys…
          </div>
        ) : keys.length === 0 ? (
          <div className="aik-empty">
            <KeyIcon />
            <p>No API keys stored. Add one below to enable AI features.</p>
          </div>
        ) : (
          <table className="aik-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Label</th>
                <th>Key (masked)</th>
                <th>Status</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.index} className={k.active ? '' : 'aik-row--inactive'}>
                  <td className="aik-idx">{k.index + 1}</td>
                  <td className="aik-label">{k.label}</td>
                  <td><code className="aik-masked">{k.keyMasked}</code></td>
                  <td>
                    <button
                      className={`aik-status-btn ${k.active ? 'active' : 'inactive'}`}
                      onClick={() => handleToggle(k.index)}
                      disabled={toggling === k.index}
                      title={k.active ? 'Click to disable' : 'Click to enable'}
                    >
                      {toggling === k.index ? '…' : k.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="aik-date">
                    {k.addedAt ? new Date(k.addedAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <button
                      className="aik-delete-btn"
                      onClick={() => handleDelete(k.index)}
                      disabled={deleting === k.index}
                      title="Delete key"
                    >
                      {deleting === k.index ? '…' : <TrashIcon />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add key form */}
      <div className="aik-card">
        <div className="aik-card-head">
          <span className="aik-card-title">Add New Key</span>
        </div>
        <form className="aik-form" onSubmit={handleAdd} noValidate>
          <div className="aik-form-row">
            <div className="aik-field">
              <label className="aik-field-label">Label</label>
              <input
                className="aik-input"
                type="text"
                placeholder="e.g. Production Key 1"
                value={form.label}
                onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                maxLength={60}
              />
            </div>
            <div className="aik-field aik-field--key">
              <label className="aik-field-label">
                API Key (OpenAI / Gemini / etc.)
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="aik-link">
                  Get a key ↗
                </a>
              </label>
              <div className="aik-key-wrap">
                <input
                  className="aik-input aik-input--key"
                  type={showKey ? 'text' : 'password'}
                  placeholder="AIza..."
                  value={form.key}
                  onChange={e => { setForm(p => ({ ...p, key: e.target.value })); setFormError(''); }}
                  required
                />
                <button type="button" className="aik-toggle-vis" onClick={() => setShowKey(s => !s)} title={showKey ? 'Hide' : 'Show'}>
                  {showKey ? (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
          {formError && <p className="aik-form-error">{formError}</p>}
          <div className="aik-form-actions">
            <button className="aik-add-btn" type="submit" disabled={saving}>
              {saving ? (
                <span className="aik-spinner aik-spinner--sm" />
              ) : (
                <PlusIcon />
              )}
              {saving ? 'Saving…' : 'Add API Key'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
