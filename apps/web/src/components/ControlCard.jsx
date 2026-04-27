/**
 * ControlCard.jsx — Redesigned Control Dashboard
 * Standardized for "Elite OS" Design System.
 */
import React, { useState, useEffect, useCallback } from 'react';
import ElasticSlider from './bits/ElasticSlider';
import { configAPI, wateringAPI } from '../utils/api';
import '../styles/controlcard.css';

// ── Smart Tips Data ───────────────────────────────────────────────────
const TIPS = {
  general: [
    "Watering early morning (5-8 AM) reduces fungal risks.",
    "Consistency is key—automated schedules promote stable growth.",
    "Soil sensors measure moisture at the root level for accuracy."
  ],
  seedling: "Tip: Keep moisture steady (40-60%) for fragile new roots.",
  vegetative: "Tip: Deeper, less frequent watering encourages robust root depth.",
  flowering: "Tip: Avoid getting water on blooms to prevent rot.",
  fruiting: "Tip: Consistent moisture prevents fruit splitting and blossom end rot."
};

function SmartTip({ text, faIcon = "fa-lightbulb" }) {
  return (
    <div className="cc-tip-inline">
      <i className={`fa-solid ${faIcon} cc-tip-dot`} aria-hidden="true" />
      <span className="cc-tip-text">{text}</span>
    </div>
  );
}

function IntelligenceGuide({ stage }) {
  const stageTip = TIPS[stage] || TIPS.general[0];
  return (
    <Panel faIcon="fa-brain" title="Intelligence Guide" accent="var(--plant-cyan)" status="Neural Active">
      <div className="cc-guide-content">
        <div className="cc-guide-main">
          <p className="cc-guide-text">{stageTip}</p>
        </div>
        <div className="cc-divider" />
        <div className="cc-guide-footer">
          <span className="cc-guide-label">Daily Protocol</span>
          <p className="cc-guide-subtext">{TIPS.general[Math.floor(Math.random() * TIPS.general.length)]}</p>
        </div>
      </div>
    </Panel>
  );
}

// ── Reusable toggle ────────────────────────────────────────────────────
function Toggle({ on, onToggle, disabled, label, hint, faIcon }) {
  return (
    <div className={`cc-toggle-row${disabled ? ' cc-toggle-row--disabled' : ''}`}>
      <div className="cc-toggle-left">
        <i className={`fa-solid ${faIcon} cc-toggle-icon`} aria-hidden="true" />
        <div>
          <div className="cc-toggle-label">{label}</div>
          {hint && <div className="cc-toggle-hint">{hint}</div>}
        </div>
      </div>
      <button
        className={`cc-switch${on ? ' cc-switch--on' : ''}`}
        onClick={onToggle}
        disabled={disabled}
        aria-checked={on}
        role="switch"
        aria-label={label}
      >
        <span className="cc-switch-knob">
          <i className={`fa-solid ${on ? 'fa-check' : 'fa-xmark'} cc-knob-icon`} aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}

// ── Section panel wrapper ───────────────────────────────────────────
function Panel({ faIcon, title, accent, children, status = 'Operational' }) {
  return (
    <div className="cc-panel" style={{ '--cc-accent': accent }}>
      <div className="cc-panel-header">
        <div className="cc-panel-header-left">
          <span className="cc-panel-icon-wrap" aria-hidden="true">
            <i className={`fa-solid ${faIcon}`} />
          </span>
          <h3 className="cc-panel-title">{title}</h3>
        </div>
        <div className="cc-panel-status">
          <span className="cc-status-dot" />
          {status}
        </div>
      </div>
      <div className="cc-panel-body">{children}</div>
    </div>
  );
}

// ── Pump status ring ───────────────────────────────────────────────
function PumpRing({ active }) {
  const R = 38;
  const C = 2 * Math.PI * R;
  return (
    <div className="cc-pump-ring-wrap" style={{ width: '96px', height: '96px' }}>
      <svg className="cc-pump-ring-svg" viewBox="0 0 96 96" aria-hidden="true" style={{ width: '96px', height: '96px' }}>
        <circle cx="48" cy="48" r={R} fill="none" strokeWidth="6"
          stroke="var(--border-moss)" />
        <circle cx="48" cy="48" r={R} fill="none" strokeWidth="6"
          stroke="var(--plant-cyan)"
          strokeLinecap="round"
          strokeDasharray={active ? `${C} 0` : `${C * 0.3} ${C * 0.7}`}
          strokeDashoffset={C * 0.25}
          style={{
            filter: active ? `drop-shadow(0 0 12px var(--plant-cyan))` : 'none',
            transition: 'stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>
      <div className="cc-pump-ring-inner">
        <i
          className={`fa-solid fa-water cc-pump-icon${active ? ' cc-pump-icon--on' : ''}`}
          aria-hidden="true"
        />
        <span className="cc-pump-label">
          {active ? 'PUMPING' : 'IDLE'}
        </span>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────
export function ControlCard({
  pumpActive,
  onStartWatering,
  onStopWatering,
  moistureThreshold,
  onMoistureThresholdChange,
  onSaveMoistureThreshold,
  isThresholdSaving,
  plantGrowthEnabled,
  onPlantGrowthEnabledChange,
  plantGrowthStage,
  onPlantGrowthStageChange,
  aiInsightsMode,
  onAiInsightsModeChange,
  onSaveAiControls,
  isAiControlSaving,
  sensors,
  onNotification,
}) {
  const [waterDuration,    setWaterDuration]    = useState(30);
  const [autoWater,        setAutoWater]        = useState(true);
  const [scheduleEnabled,  setScheduleEnabled]  = useState(false);
  const [scheduleTime,     setScheduleTime]     = useState('07:00');
  const [savingSchedule,   setSavingSchedule]   = useState(false);
  const [wateringLogs,     setWateringLogs]     = useState([]);
  const [loadingLogs,      setLoadingLogs]      = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const data = await wateringAPI.getLogs(5);
      setWateringLogs(data || []);
    } catch (err) {
      console.error("Failed to fetch watering logs", err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!pumpActive) {
      fetchLogs();
    }
  }, [pumpActive, fetchLogs]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatLogDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const soilMoisture = sensors?.soilMoisture;
  const needsWater   = soilMoisture !== undefined && soilMoisture < moistureThreshold;

  const handleAutoWaterToggle = async () => {
    const next = !autoWater;
    setAutoWater(next);
    try {
      await configAPI.update('ESP32-SENSOR', { autoWaterEnabled: next });
      onNotification?.(`Auto-watering ${next ? 'enabled' : 'disabled'}`, 'success');
    } catch {
      onNotification?.('Failed to update auto-water setting', 'error');
      setAutoWater(!next);
    }
  };

  const handleTimedWater = async () => {
    try {
      await wateringAPI.start('ESP32-SENSOR', waterDuration);
      onNotification?.(`Watering for ${waterDuration}s`, 'success');
    } catch {
      onNotification?.('Failed to start timed watering', 'error');
    }
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await configAPI.update('ESP32-SENSOR', { scheduleEnabled, scheduleTime });
      onNotification?.(
        `Schedule ${scheduleEnabled ? 'saved: ' + scheduleTime : 'disabled'}`,
        'success',
      );
    } catch {
      onNotification?.('Failed to save schedule', 'error');
    } finally {
      setSavingSchedule(false);
    }
  };

  return (
    <section className="cc-root">

      {/* ===== MOISTURE ALERT STRIP ===== */}
      {soilMoisture !== undefined && (
        <div className={`cc-alert${needsWater ? ' cc-alert--warn' : ' cc-alert--ok'}`}>
          <i className={`fa-solid ${needsWater ? 'fa-triangle-exclamation' : 'fa-circle-check'}`} aria-hidden="true" />
          <span>
            {needsWater
              ? `Soil at ${soilMoisture}% — below threshold (${moistureThreshold}%), watering recommended`
              : `Soil at ${soilMoisture}% — moisture level adequate`}
          </span>
        </div>
      )}

      {/* ===== PANEL GRID ===== */}
      <div className="cc-grid">

        {/* 1. Manual Control */}
        <Panel faIcon="fa-hand" title="Manual Control" accent="var(--plant-cyan)">
          <div className="cc-pump-hero">
            <PumpRing active={pumpActive} />
            <div className="cc-pump-btns">
              <button
                className="cc-btn cc-btn--water"
                onClick={onStartWatering}
                disabled={pumpActive}
              >
                <i className="fa-solid fa-play" aria-hidden="true" />
                Water Now
              </button>
              <button
                className="cc-btn cc-btn--stop"
                onClick={onStopWatering}
                disabled={!pumpActive}
              >
                <i className="fa-solid fa-stop" aria-hidden="true" />
                Stop Pump
              </button>
            </div>
          </div>
          <SmartTip text="Tip: Use for quick soil refreshes." />
        </Panel>

        {/* 2. Timed Watering */}
        <Panel faIcon="fa-hourglass-half" title="Timed Watering" accent="var(--control-timed, #a78bfa)">
          <div className="cc-field">
            <div className="cc-field-row">
              <div className="cc-field-label">
                <i className="fa-solid fa-stopwatch" aria-hidden="true" />
                Duration
              </div>
              <span className="cc-field-value">{waterDuration}s</span>
            </div>
            <div className="cc-slider-wrap">
              <ElasticSlider
                defaultValue={waterDuration}
                maxValue={300}
                startingValue={5}
                isStepped={true}
                stepSize={5}
                onChange={val => setWaterDuration(Math.round(val))}
                unit="seconds"
              />
            </div>
            <button
              className="cc-btn cc-btn--success cc-btn--full"
              onClick={handleTimedWater}
              disabled={pumpActive}
            >
              <i className="fa-solid fa-hourglass-start" aria-hidden="true" />
              Start Timer
            </button>
          </div>
          <SmartTip text="Auto-shutoff enabled." />
        </Panel>

        {/* 3. Auto-Watering */}
        <Panel faIcon="fa-robot" title="Auto-Watering" accent="var(--plant-green)">
          <Toggle
            on={autoWater}
            onToggle={handleAutoWaterToggle}
            label="Auto-Water Mode"
            hint="Trigger by soil threshold"
            faIcon="fa-droplet"
          />
          <div className="cc-divider" />
          <div className="cc-field">
            <div className="cc-field-row">
              <div className="cc-field-label">
                <i className="fa-solid fa-ruler-horizontal" aria-hidden="true" />
                Threshold
              </div>
              <span className="cc-field-value">{moistureThreshold}%</span>
            </div>
            <div className="cc-slider-wrap">
              <ElasticSlider
                defaultValue={moistureThreshold}
                maxValue={100}
                startingValue={0}
                isStepped={true}
                stepSize={1}
                onChange={val => onMoistureThresholdChange(Math.round(val))}
                unit="%"
              />
            </div>
            <button
              className="cc-btn cc-btn--success cc-btn--full"
              onClick={onSaveMoistureThreshold}
              disabled={isThresholdSaving}
            >
              {isThresholdSaving
                ? <><i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" /> Saving…</>
                : <><i className="fa-solid fa-floppy-disk" aria-hidden="true" /> Save Threshold</>}
            </button>
          </div>
          <SmartTip text="Ideal: 30-40% for most plants." />
        </Panel>

        {/* 4. Daily Schedule */}
        <Panel faIcon="fa-calendar-days" title="Daily Schedule" accent="var(--plant-cyan)">
          <Toggle
            on={scheduleEnabled}
            onToggle={() => setScheduleEnabled(s => !s)}
            label="Enable Schedule"
            hint="Daily automation"
            faIcon="fa-clock"
          />
          <div className="cc-divider" />
          <div className="cc-field">
            <div className="cc-field-row">
              <div className="cc-field-label">
                <i className="fa-solid fa-clock" aria-hidden="true" />
                Start Time
              </div>
            </div>
            <div className="cc-time-row">
              <div className="cc-time-input-wrap">
                <i className="fa-solid fa-clock cc-time-icon" aria-hidden="true" />
                <input
                  type="time"
                  className="cc-time-input"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  disabled={!scheduleEnabled}
                />
              </div>
              <button
                className="cc-btn cc-btn--success"
                onClick={handleSaveSchedule}
                disabled={savingSchedule || !scheduleEnabled}
              >
                {savingSchedule
                  ? <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
                  : <i className="fa-solid fa-floppy-disk" aria-hidden="true" />}
                Save
              </button>
            </div>
          </div>
          <SmartTip text="Morning schedule reduces evaporation." />
        </Panel>

        {/* 5. Plant & AI Controls */}
        <Panel faIcon="fa-seedling" title="Plant & AI" accent="var(--plant-green)">
          <Toggle
            on={!!plantGrowthEnabled}
            onToggle={() => onPlantGrowthEnabledChange?.(!plantGrowthEnabled)}
            label="Growth Tracking"
            hint="AI optimization"
            faIcon="fa-leaf"
          />
          <div className="cc-divider" />

          <div className="cc-field">
            <div className="cc-field-row">
              <label className="cc-field-label" htmlFor="cc-stage-select">
                <i className="fa-solid fa-seedling" aria-hidden="true" />
                Plant Stage
              </label>
            </div>
            <div className="cc-select-wrap">
              <i className="fa-solid fa-chevron-down cc-select-caret" aria-hidden="true" />
              <select
                id="cc-stage-select"
                className="cc-select"
                value={plantGrowthStage}
                onChange={e => onPlantGrowthStageChange?.(e.target.value)}
                disabled={!plantGrowthEnabled}
              >
                <option value="seedling">Seedling</option>
                <option value="vegetative">Vegetative</option>
                <option value="flowering">Flowering</option>
                <option value="fruiting">Fruiting</option>
              </select>
            </div>
          </div>

          <div className="cc-field">
            <div className="cc-field-row">
              <label className="cc-field-label" htmlFor="cc-ai-mode-select">
                <i className="fa-solid fa-brain" aria-hidden="true" />
                AI Insights
              </label>
            </div>
            <div className="cc-time-row">
              <div className="cc-select-wrap" style={{ flex: 1 }}>
                <i className="fa-solid fa-chevron-down cc-select-caret" aria-hidden="true" />
                <select
                  id="cc-ai-mode-select"
                  className="cc-select"
                  value={aiInsightsMode}
                  onChange={e => onAiInsightsModeChange?.(e.target.value)}
                >
                  <option value="live_feed">Live Feed</option>
                  <option value="snapshots">Snapshots</option>
                </select>
              </div>
              <button
                className="cc-btn cc-btn--success"
                onClick={onSaveAiControls}
                disabled={isAiControlSaving}
              >
                {isAiControlSaving
                  ? <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
                  : <i className="fa-solid fa-floppy-disk" aria-hidden="true" />}
                Save
              </button>
            </div>
          </div>
          <SmartTip text="AI improves with more data." />
        </Panel>

        {/* 6. Intelligence Guide */}
        <IntelligenceGuide stage={plantGrowthStage} />

      </div>{/* end .cc-grid */}

      {/* ===== WATERING LOGS PANEL ===== */}
      <div className="cc-panel cc-panel--logs">
        <div className="cc-panel-header">
          <div className="cc-panel-header-left">
            <span className="cc-panel-icon-wrap">
              <i className="fa-solid fa-clock-rotate-left" />
            </span>
            <h3 className="cc-panel-title">Watering History</h3>
          </div>
          {loadingLogs && <div className="cc-loading-tag">SYNCING_CHANNELS...</div>}
        </div>

        <div className="cc-log-list">
          {wateringLogs.length > 0 ? (
            wateringLogs.map((log, i) => (
              <div key={log._id || i} className="cc-log-entry">
                <div className="cc-log-time">{formatLogDate(log.startedAt)}</div>
                <div className="cc-log-details">
                  <div className="cc-log-main">
                    <span className="cc-log-vol">{log.volumeMl || 0} mL</span>
                    <span className="cc-log-dur">{formatDuration(log.durationSeconds)}</span>
                  </div>
                  <div className="cc-log-status">{log.status?.toUpperCase() || 'COMPLETED'}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="cc-no-logs">NO_RECENT_ACTIVITY</div>
          )}
        </div>
      </div>

    </section>
  );
}
