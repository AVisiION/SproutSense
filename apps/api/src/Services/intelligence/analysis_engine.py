import sys
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

def analyze_sensor_data(data):
    """
    Analyzes historical sensor data to detect anomalies and trends.
    """
    if not data:
        return {"error": "No data provided"}

    df = pd.DataFrame(data)
    
    # Ensure numeric types
    for col in ['soilMoisture', 'temperature', 'humidity', 'light']:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    df = df.dropna()

    if df.empty:
        return {"error": "Insufficient data after cleaning"}

    # Basic Stats
    stats = df[['soilMoisture', 'temperature', 'humidity', 'light']].describe().to_dict()

    # Anomaly Detection (Isolation Forest)
    features = ['soilMoisture', 'temperature', 'humidity']
    model = IsolationForest(contamination=0.05, random_state=42)
    df['anomaly'] = model.fit_predict(df[features])
    
    anomalies = df[df['anomaly'] == -1].tail(5).to_dict(orient='records')

    # Trend Analysis
    correlation = df[features].corr().to_dict()
    
    # Simple Health Score prediction
    # (Mock logic: Moisture stability + Temp stability)
    moisture_std = df['soilMoisture'].std()
    health_score = max(0, min(100, 100 - (moisture_std * 2)))

    report = {
        "summary": {
            "health_score": round(health_score, 2),
            "data_points": len(df),
            "moisture_avg": round(df['soilMoisture'].mean(), 2),
            "temp_avg": round(df['temperature'].mean(), 2)
        },
        "anomalies": anomalies,
        "correlations": correlation,
        "insights": [
            "Moisture levels are stable" if moisture_std < 10 else "High moisture volatility detected",
            "Temperature-Humidity correlation: " + str(round(correlation['temperature']['humidity'], 2))
        ]
    }
    
    return report

if __name__ == "__main__":
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No input received"}))
            sys.exit(1)
            
        data = json.loads(input_data)
        result = analyze_sensor_data(data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
