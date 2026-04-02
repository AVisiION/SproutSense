/**
 * ControlCard.jsx — Redesigned Control Dashboard
 *
 * Sections (each rendered as a panel card):
 *  1. Pump Status Hero   — live ring + Water Now / Stop
 *  2. Timed Watering     — duration slider + start button
 *  3. Auto-Watering      — toggle + moisture threshold slider
 *  4. Daily Schedule     — toggle + time picker
 *  5. Plant & AI         — growth toggle + stage select + AI mode select
 *
 * All GlassIcon usages replaced with Font Awesome 6 icons.
 */
import React, { useState } from 'react';
import ElasticSlider from './bits/ElasticSlider';
import { configAPI, wateringAPI } from '../utils/api';
import '../styles/controlcard.css';

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
function Panel({ faIcon, title, accent, children }) {
  return (
    <div className="cc-panel" style={{ '--cc-accent': accent }}>
      <div className="cc-panel-header">
        <span className="cc-panel-icon-wrap" aria-hidden="true">
          <i className={`fa-solid ${faIcon}`} />
        </span>
        <h3 className="cc-panel-title">{title}</h3>
      </div>
      <div className="cc-panel-body">{children}</div>
    </div>
  );
}

// ── Pump status ring ───────────────────────────────────────────────
function PumpRing({ active }) {
  const color  = active ? '#22d3ee' : '#475569';
  const R = 38;
  const C = 2 * Math.PI * R;
  return (
    <div className="cc-pump-ring-wrap">
      <svg className="cc-pump-ring-svg" viewBox="0 0 96 96" aria-hidden="true">
        {/* Track */}
        <circle cx="48" cy="48" r={R} fill="none" strokeWidth="5"
          stroke="rgba(255,255,255,0.07)" />
        {/* Arc — always full when active, quarter-arc when idle */}
        <circle cx="48" cy="48" r={R} fill="none" strokeWidth="5"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={active ? `${C} 0` : `${C * 0.25} ${C * 0.75}`}
          strokeDashoffset={C * 0.25}
          style={{
            filter: active ? `drop-shadow(0 0 8px ${color})` : 'none',
            transition: 'stroke-dasharray 0.7s cubic-bezier(0.4,0,0.2,1), stroke 0.4s',
          }}
        />
      </svg>
      <div className="cc-pump-ring-inner">
        <i
          className={`fa-solid fa-water cc-pump-icon${active ? ' cc-pump-icon--on' : ''}`}
          aria-hidden="true"
        />
        <span className="cc-pump-label">{active ? 'ON' : 'IDLE'}</span>
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

      {/* ===== SECTION HEADER ===== */}
      <div className="cc-header">
        <div className="cc-header-left">
          <i className="fa-solid fa-sliders cc-header-icon" aria-hidden="true" />
          <div>
            <h2 className="cc-header-title">Watering Controls</h2>
            <p className="cc-header-sub">Manual, auto &amp; scheduled irrigation management</p>
          </div>
        </div>
        {/* Pump status badge */}
        <span className={`cc-pump-badge${pumpActive ? ' cc-pump-badge--on' : ''}`}>
          <span className="cc-pump-badge-dot" />
          <i className="fa-solid fa-water" aria-hidden="true" />
          Pump: {pumpActive ? 'Running' : 'Idle'}
        </span>
      </div>

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
        <Panel faIcon="fa-hand" title="Manual Control" accent="#22d3ee">
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
        </Panel>

        {/* 2. Timed Watering */}
        <Panel faIcon="fa-hourglass-half" title="Timed Watering" accent="#a78bfa">
          <div className="cc-field">
            <div className="cc-field-label">
              <i className="fa-solid fa-stopwatch" aria-hidden="true" />
              Duration
              <span className="cc-field-value-badge">{waterDuration}s</span>
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
              className="cc-btn cc-btn--primary cc-btn--full"
              onClick={handleTimedWater}
              disabled={pumpActive}
            >
              <i className="fa-solid fa-hourglass-start" aria-hidden="true" />
              Start {waterDuration}s Timer
            </button>
          </div>
        </Panel>

        {/* 3. Auto-Watering */}
        <Panel faIcon="fa-robot" title="Auto-Watering" accent="#22c55e">
          <Toggle
            on={autoWater}
            onToggle={handleAutoWaterToggle}
            label="Auto-Water Mode"
            hint="Triggers pump when soil drops below threshold"
            faIcon="fa-droplet"
          />
          <div className="cc-divider" />
          <div className="cc-field">
            <div className="cc-field-label">
              <i className="fa-solid fa-ruler-horizontal" aria-hidden="true" />
              Moisture Threshold
              <span className="cc-field-value-badge">{moistureThreshold}%</span>
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
        </Panel>

        {/* 4. Daily Schedule */}
        <Panel faIcon="fa-calendar-days" title="Daily Schedule" accent="#f59e0b">
          <Toggle
            on={scheduleEnabled}
            onToggle={() => setScheduleEnabled(s => !s)}
            label="Enable Schedule"
            hint="Water once daily at the set time"
            faIcon="fa-clock"
          />
          <div className="cc-divider" />
          <div className="cc-field">
            <div className="cc-field-label">
              <i className="fa-solid fa-clock" aria-hidden="true" />
              Schedule Time
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
                  ? <><i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" /> Saving…</>
                  : <><i className="fa-solid fa-floppy-disk" aria-hidden="true" /> Save</>}
              </button>
            </div>
          </div>
        </Panel>

        {/* 5. Plant & AI Controls */}
        <Panel faIcon="fa-seedling" title="Plant Growth &amp; AI" accent="#34d399">
          <Toggle
            on={!!plantGrowthEnabled}
            onToggle={() => onPlantGrowthEnabledChange?.(!plantGrowthEnabled)}
            label="Plant Growth Tracking"
            hint="Enable growth-stage context for automations and AI"
            faIcon="fa-leaf"
          />
          <div className="cc-divider" />

          <div className="cc-field">
            <label className="cc-field-label" htmlFor="cc-stage-select">
              <i className="fa-solid fa-seedling" aria-hidden="true" />
              Growth Stage
            </label>
            <div className="cc-select-wrap">
              <i className="fa-solid fa-chevron-down cc-select-caret" aria-hidden="true" />
              <select
                id="cc-stage-select"
                className="cc-select"
                value={plantGrowthStage}
                onChange={e => onPlantGrowthStageChange?.(e.target.value)}
                disabled={!plantGrowthEnabled}
              >
                <option value="seedling">&#127807; Seedling</option>
                <option value="vegetative">&#127807; Vegetative</option>
                <option value="flowering">&#127800; Flowering</option>
                <option value="fruiting">&#127822; Fruiting</option>
              </select>
            </div>
          </div>

          <div className="cc-field">
            <label className="cc-field-label" htmlFor="cc-ai-mode-select">
              <i className="fa-solid fa-brain" aria-hidden="true" />
              AI Disease Insights Mode
            </label>
            <div className="cc-ai-row">
              <div className="cc-select-wrap" style={{ flex: 1 }}>
                <i className="fa-solid fa-chevron-down cc-select-caret" aria-hidden="true" />
                <select
                  id="cc-ai-mode-select"
                  className="cc-select"
                  value={aiInsightsMode}
                  onChange={e => onAiInsightsModeChange?.(e.target.value)}
                >
                  <option value="live_feed">&#128247; Live Feed</option>
                  <option value="snapshots">&#128444; Snapshots</option>
                </select>
              </div>
              <button
                className="cc-btn cc-btn--success"
                onClick={onSaveAiControls}
                disabled={isAiControlSaving}
              >
                {isAiControlSaving
                  ? <><i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" /> Saving…</>
                  : <><i className="fa-solid fa-floppy-disk" aria-hidden="true" /> Save</>}
              </button>
            </div>
          </div>
        </Panel>

      </div>{/* end .cc-grid */}
    </section>
  );
}
