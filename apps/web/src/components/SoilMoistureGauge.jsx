import React, { useMemo } from "react";
import GaugeChart from "react-gauge-chart";
import { getCSSVariableValue } from '../utils/colorUtils';

const SoilMoistureGauge = ({ value }) => {
  // Resolve CSS variables to actual colors for the gauge chart
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
        textColor="#888"
        formatTextValue={val => `${val}%`}
      />
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <span style={{ fontSize: 18, color: "#888" }}>Soil Moisture</span>
      </div>
    </div>
  );
};

export default SoilMoistureGauge;