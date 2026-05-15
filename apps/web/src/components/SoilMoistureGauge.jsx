import React, { useMemo } from "react";
import GaugeChart from "react-gauge-chart";
import { getCSSVariableValue } from '../utils/colorUtils';

const SoilMoistureGauge = ({ value }) => {
  // Resolve CSS variables to actual color strings for the third-party gauge.
  // Libraries like `react-gauge-chart` require concrete color values
  // (hex / rgb) rather than CSS `var(...)` tokens, so we resolve them here.
  const colors = useMemo(() => {
    return [
      getCSSVariableValue('--gauge-danger'),
      getCSSVariableValue('--gauge-warning'),
      getCSSVariableValue('--gauge-safe'),
    ];
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 350, margin: "auto" }}>
      <GaugeChart
        id="soil-moisture-gauge"
        nrOfLevels={30}
        colors={colors}
        arcWidth={0.3}
        percent={value / 100}
        textColor={getCSSVariableValue('--text-muted')}
        formatTextValue={val => `${val}%`}
      />
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <span style={{ fontSize: 18, color: getCSSVariableValue('--text-muted') }}>Soil Moisture</span>
      </div>
    </div>
  );
};

export default SoilMoistureGauge;