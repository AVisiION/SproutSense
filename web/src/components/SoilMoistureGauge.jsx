import React from "react";
import GaugeChart from "react-gauge-chart";

const SoilMoistureGauge = ({ value }) => (
  <div style={{ width: "100%", maxWidth: 350, margin: "auto" }}>
    <GaugeChart
      id="soil-moisture-gauge"
      nrOfLevels={30}
      colors={["#ff0000", "#ffff00", "#00ff00"]}
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

export default SoilMoistureGauge;