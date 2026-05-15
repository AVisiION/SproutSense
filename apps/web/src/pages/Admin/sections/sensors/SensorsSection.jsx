import React from 'react';

export default function SensorsSection({
  PLANT_OPTIONS,
  selectedPlantKey,
  setSelectedPlantKey,
  plantWateringConfig,
  handlePlantWateringChange,
  sensorRegistry,
  plantSensorConfig,
  buildSensorThresholdPreset,
  handlePlantThresholdChange,
  handleSavePlantSensorConfig,
  savingPlantSensorConfig,
}) {
  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h2><i className="fa-solid fa-seedling" /> Plant Sensor Configuration</h2>
        <span className="adm-section-badge">Per Plant Thresholds</span>
      </div>

      <div className="adm-glass-box adm-plant-hero">
        <div className="adm-plant-hero-inner">
          <div className="adm-plant-hero-icon">
            <i className="fa-solid fa-leaf" />
          </div>
          <div className="adm-plant-hero-info">
            <span className="adm-plant-hero-label">Active Plant Profile</span>
            <h3 className="adm-plant-hero-name">
              {PLANT_OPTIONS.find((p) => p.key === selectedPlantKey)?.label || selectedPlantKey}
            </h3>
          </div>
          <select className="adm-input adm-plant-select" value={selectedPlantKey} onChange={(e) => setSelectedPlantKey(e.target.value)}>
            {PLANT_OPTIONS.map((plant) => (
              <option key={plant.key} value={plant.key}>{plant.label}</option>
            ))}
          </select>
        </div>
        <div className="adm-plant-chips">
          {PLANT_OPTIONS.map((plant) => (
            <button
              key={plant.key}
              className={`adm-plant-chip ${selectedPlantKey === plant.key ? 'adm-plant-chip--active' : ''}`}
              onClick={() => setSelectedPlantKey(plant.key)}
            >
              <i className="fa-solid fa-seedling" /> {plant.label}
            </button>
          ))}
        </div>
      </div>

      <div className="adm-watering-grid">
        <div className="adm-watering-card">
          <div className="adm-watering-card-icon" style={{ background: 'var(--surface-1)', color: 'var(--chart-moisture)' }}>
            <i className="fa-solid fa-droplet" />
          </div>
          <div className="adm-watering-card-body">
            <span className="adm-watering-card-label">Soil Moisture Threshold</span>
            <div className="adm-watering-card-input-wrap">
              <input
                className="adm-input"
                type="number"
                min="0"
                max="100"
                value={plantWateringConfig?.[selectedPlantKey]?.moistureThreshold ?? 30}
                onChange={(e) => handlePlantWateringChange('moistureThreshold', e.target.value)}
              />
              <span className="adm-watering-unit">%</span>
            </div>
          </div>
        </div>

        <div className="adm-watering-card">
          <div className="adm-watering-card-icon" style={{ background: 'var(--surface-1)', color: 'var(--chart-healthy)' }}>
            <i className="fa-solid fa-arrows-rotate" />
          </div>
          <div className="adm-watering-card-body">
            <span className="adm-watering-card-label">Max Watering Cycles / Day</span>
            <div className="adm-watering-card-input-wrap">
              <input
                className="adm-input"
                type="number"
                min="1"
                max="20"
                value={plantWateringConfig?.[selectedPlantKey]?.maxWateringCyclesPerDay ?? 3}
                onChange={(e) => handlePlantWateringChange('maxWateringCyclesPerDay', e.target.value)}
              />
              <span className="adm-watering-unit">cycles</span>
            </div>
          </div>
        </div>

        <div className="adm-watering-card">
          <div className="adm-watering-card-icon" style={{ background: 'var(--surface-1)', color: 'var(--rec-high)' }}>
            <i className="fa-solid fa-clock" />
          </div>
          <div className="adm-watering-card-body">
            <span className="adm-watering-card-label">System Max Cycles / Hour</span>
            <div className="adm-watering-card-input-wrap">
              <input
                className="adm-input"
                type="number"
                min="1"
                max="24"
                value={plantWateringConfig?.[selectedPlantKey]?.maxCyclesPerHour ?? 4}
                onChange={(e) => handlePlantWateringChange('maxCyclesPerHour', e.target.value)}
              />
              <span className="adm-watering-unit">/hr</span>
            </div>
          </div>
        </div>

        <div className="adm-watering-card">
          <div className="adm-watering-card-icon" style={{ background: 'var(--surface-1)', color: 'var(--orchid-color)' }}>
            <i className="fa-solid fa-calendar-day" />
          </div>
          <div className="adm-watering-card-body">
            <span className="adm-watering-card-label">System Max Cycles / Day</span>
            <div className="adm-watering-card-input-wrap">
              <input
                className="adm-input"
                type="number"
                min="1"
                max="50"
                value={plantWateringConfig?.[selectedPlantKey]?.maxCyclesPerDay ?? 6}
                onChange={(e) => handlePlantWateringChange('maxCyclesPerDay', e.target.value)}
              />
              <span className="adm-watering-unit">/day</span>
            </div>
          </div>
        </div>
      </div>

      <div className="adm-glass-box">
        <div className="adm-threshold-header">
          <h3><i className="fa-solid fa-sliders" /> Sensor Thresholds</h3>
          <span className="adm-threshold-plant-badge">
            <i className="fa-solid fa-leaf" /> {PLANT_OPTIONS.find((item) => item.key === selectedPlantKey)?.label || selectedPlantKey}
          </span>
        </div>

        {sensorRegistry.length === 0 ? (
          <div className="adm-empty-state">
            <i className="fa-solid fa-microchip" />
            <p>No sensors registered yet.</p>
            <span>Configure the sensor registry to set per-plant thresholds.</span>
          </div>
        ) : (
          <div className="adm-threshold-grid">
            {sensorRegistry.map((sensor) => {
              const sensorThresholds = plantSensorConfig?.[selectedPlantKey]?.[sensor.key]
                || buildSensorThresholdPreset(sensor);
              return (
                <div key={`plant-threshold-${selectedPlantKey}-${sensor.id}`} className="adm-threshold-card">
                  <div className="adm-threshold-card-head">
                    <div className="adm-threshold-sensor-icon">
                      <i className="fa-solid fa-microchip" />
                    </div>
                    <div>
                      <h4 className="adm-threshold-sensor-name">{sensor.name}</h4>
                      <span className="adm-threshold-sensor-key">{sensor.key}</span>
                    </div>
                  </div>

                  <div className="adm-threshold-fields">
                    <div className="adm-threshold-field">
                      <label>Min</label>
                      <input className="adm-input" type="number" value={sensorThresholds.minThreshold} onChange={(e) => handlePlantThresholdChange(sensor.key, 'minThreshold', e.target.value)} />
                      <div className="adm-threshold-bar" style={{ background: 'var(--chart-moisture)' }} />
                    </div>
                    <div className="adm-threshold-field">
                      <label>Max</label>
                      <input className="adm-input" type="number" value={sensorThresholds.maxThreshold} onChange={(e) => handlePlantThresholdChange(sensor.key, 'maxThreshold', e.target.value)} />
                      <div className="adm-threshold-bar" style={{ background: 'var(--chart-healthy)' }} />
                    </div>
                    <div className="adm-threshold-field">
                      <label>Warning</label>
                      <input className="adm-input" type="number" value={sensorThresholds.warningThreshold} onChange={(e) => handlePlantThresholdChange(sensor.key, 'warningThreshold', e.target.value)} />
                      <div className="adm-threshold-bar" style={{ background: 'var(--rec-high)' }} />
                    </div>
                    <div className="adm-threshold-field">
                      <label>Critical</label>
                      <input className="adm-input" type="number" value={sensorThresholds.criticalThreshold} onChange={(e) => handlePlantThresholdChange(sensor.key, 'criticalThreshold', e.target.value)} />
                      <div className="adm-threshold-bar" style={{ background: 'var(--rec-critical)' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="adm-btn-row" style={{ marginTop: '1.5rem' }}>
          <button className="adm-action-btn adm-action-btn--start" onClick={handleSavePlantSensorConfig} disabled={savingPlantSensorConfig || sensorRegistry.length === 0}>
            <i className="fa-solid fa-floppy-disk" /> {savingPlantSensorConfig ? 'Saving...' : 'Save Plant Sensor Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
