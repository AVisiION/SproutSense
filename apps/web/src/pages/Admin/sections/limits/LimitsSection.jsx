import React from 'react';
import '../SectionStyles.css';

export default function LimitsSection({
  limitsForm,
  handleLimitChange,
  limitErrors,
  aiUsageData,
  setActiveSection,
  handleSaveLimits,
  savingLimits,
}) {
  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2><i className="fa-solid fa-gauge-high" /> Limits & Quotas</h2>
        <span className="adm-section-badge">System Governance</span>
      </div>

      <div className="adm-limits-grid">
        <div className="adm-glass-box adm-limits-card">
          <div className="adm-limits-card-header">
            <div className="adm-limits-card-icon adm-limits-icon--ai">
              <i className="fa-solid fa-robot" />
            </div>
            <div>
              <h3>AI Analysis Quota</h3>
              <span className="adm-limits-card-sub">Disease detection & crop health</span>
            </div>
          </div>

          <div className="adm-limits-control">
            <label className="adm-limits-label">Daily Limit</label>
            <div className="adm-limits-input-row">
              <input
                className="adm-input"
                type="number"
                min="1"
                max="100"
                value={limitsForm.aiDailyAnalysisLimit}
                onChange={(e) => handleLimitChange('aiDailyAnalysisLimit', e.target.value)}
              />
              <span className="adm-limits-unit">analyses / day</span>
            </div>
            {limitErrors.aiDailyAnalysisLimit && <div className="adm-input-error">{limitErrors.aiDailyAnalysisLimit}</div>}
          </div>

          <div className="adm-limits-usage">
            <div className="adm-limits-usage-header">
              <span>Today's Usage</span>
              <span className="adm-limits-usage-count">
                {aiUsageData ? `${aiUsageData.usedCount} / ${aiUsageData.dailyLimit}` : 'N/A'}
              </span>
            </div>
            <div className="adm-limits-progress-bg">
              <div
                className="adm-limits-progress-fill"
                style={{
                  width: aiUsageData ? `${Math.min((aiUsageData.usedCount / aiUsageData.dailyLimit) * 100, 100)}%` : '0%',
                  background: aiUsageData && (aiUsageData.usedCount / aiUsageData.dailyLimit) > 0.8 ? '#ef4444' : '#a78bfa',
                }}
              />
            </div>
            <div className="adm-limits-usage-footer">
              <span><i className="fa-solid fa-circle-check adm-limits-icon-ok" /> Remaining: <strong>{aiUsageData ? aiUsageData.remaining : 'N/A'}</strong></span>
            </div>
          </div>
        </div>

        <div className="adm-glass-box adm-limits-card adm-limits-card--info">
          <div className="adm-limits-card-header">
            <div className="adm-limits-card-icon adm-limits-icon--plant">
              <i className="fa-solid fa-seedling" />
            </div>
            <div>
              <h3>Plant Watering Limits</h3>
              <span className="adm-limits-card-sub">Per-plant configuration</span>
            </div>
          </div>

          <div className="adm-limits-info-body">
            <div className="adm-limits-info-icon">
              <i className="fa-solid fa-arrow-right-arrow-left" />
            </div>
            <p>Moisture thresholds and watering cycle limits are now configured <strong>per plant type</strong> in the Plant Sensors section.</p>
            <button className="adm-action-btn adm-action-btn--start adm-limits-go-sensors" onClick={() => setActiveSection('sensors')}>
              <i className="fa-solid fa-seedling" /> Go to Plant Sensors
            </button>
          </div>
        </div>
      </div>

      <div className="adm-btn-row adm-limits-save-row">
        <button className="adm-action-btn adm-action-btn--start" onClick={handleSaveLimits} disabled={savingLimits || Object.keys(limitErrors).length > 0}>
          <i className="fa-solid fa-save" /> {savingLimits ? 'Saving...' : 'Save Limits'}
        </button>
      </div>
    </div>
  );
}
