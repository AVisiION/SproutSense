# Edge Impulse Integration Guide for SproutSense

## Overview
This guide explains how to integrate Edge Impulse machine learning models with your ESP32-based SproutSense plant monitoring system.

## What is Edge Impulse?
Edge Impulse is a platform for developing machine learning models that run on embedded devices like ESP32. You can use it to:
- Predict optimal watering times
- Detect plant diseases from images
- Classify plant health states
- Anomaly detection in sensor patterns

---

## Step-by-Step Integration

### 1. Create Edge Impulse Project

**Go to:** https://studio.edgeimpulse.com/

1. **Sign up** and create a new project (name: "SproutSense-ML")
2. **Note your Project ID** (already configured in code: `919040`)
3. **Get your API key** from Project → Keys (already configured)

---

### 2. Collect Training Data

**Option A: Using Your ESP32 (Recommended)**

The ESP32 code already includes data collection functions:
- Every sensor reading is logged in CSV format
- Enable data collection mode by uncommenting `ENABLE_EDGE_IMPULSE_DATA_COLLECTION`
- Connect ESP32 via Serial Monitor
- Copy logged data to CSV file

**CSV Format:**
```csv
timestamp,moisture,temperature,humidity,light,pH,label
1678901234,45.2,25.3,65.0,78.5,6.8,healthy
1678901294,28.1,26.1,63.0,80.2,6.7,needs_water
1678901354,52.8,24.9,68.0,75.3,6.9,overwatered
```

**Labels to use:**
- `healthy` - Plant is in good condition
- `needs_water` - Moisture < 30%
- `overwatered` - Moisture > 80%
- `temperature_stress` - Temp outside 15-30°C range
- `low_light` - Light < 40%
- `ph_imbalance` - pH outside 6.0-7.5 range

**Option B: Manual CSV Creation**

Create CSV from historical data logged in your backend MongoDB.

---

### 3. Design Your Impulse in Edge Impulse Studio

1. **Go to:** Create Impulse
2. **Add Processing Block:**
   - Window size: 1000ms (1 reading)
   - Window increase: 500ms
   - Frequency: 1 Hz
   - Processing block: "Time Series Data" or "Raw Data"
3. **Add Learning Block:**
   - Classification (Keras)
   - Anomaly Detection
4. **Input Features:**
   - moisture
   - temperature
   - humidity
   - light
   - pH
5. **Output Labels:**
   - healthy
   - needs_water
   - overwatered
   - temperature_stress
   - low_light
   - ph_imbalance

---

### 4. Upload Data to Edge Impulse

**Via Web Interface:**
1. Go to **Data Acquisition**
2. Click **Upload Data**
3. Select your CSV file
4. Choose "Auto-split train/test (80/20)"
5. Label: Choose appropriate label for each data segment

**Via CLI (if you get it working):**
```bash
edge-impulse-uploader --category training sensor_data.csv
```

---

### 5. Train Your Model

1. **Go to:** Impulse Design → Create Impulse
2. **Generate Features:**
   - Click "Generate features"
   - Wait for feature extraction
3. **Train Neural Network:**
   - Go to "NN Classifier" or "Classification"
   - Set training parameters:
     - Epochs: 100
     - Learning rate: 0.001
     - Architecture: Simple (5 hidden layers)
   - Click "Start Training"
4. **Evaluate Performance:**
   - Check accuracy (aim for >90%)
   - Check confusion matrix
   - Test with validation data

---

### 6. Deploy to ESP32

1. **Go to:** Deployment
2. **Select:** Arduino library
3. **Click:** Build
4. **Download** the ZIP file (e.g., `SproutSense-ML_inferencing.zip`)

---

### 7. Install Arduino Library

#### Method 1: Arduino IDE
1. Open Arduino IDE
2. Go to: **Sketch → Include Library → Add .ZIP Library**
3. Select downloaded `SproutSense-ML_inferencing.zip`
4. Library will be installed

#### Method 2: Manual Installation
1. Extract ZIP to `Arduino/libraries/` folder:
   - Windows: `Documents\Arduino\libraries\`
   - Mac: `~/Documents/Arduino/libraries/`
   - Linux: `~/Arduino/libraries/`
2. Rename folder to `SproutSense_ML_inferencing`
3. Restart Arduino IDE

---

### 8. Update ESP32 Code

**IMPORTANT:** The ESP32 code is already prepared! Just uncomment this line after installing the library:

In `SproutSense_ESP32_AllInOne.ino`, find this section:
```cpp
// ================= EDGE IMPULSE LIBRARY =================
// UNCOMMENT AFTER INSTALLING EDGE IMPULSE ARDUINO LIBRARY:
// #include <SproutSense-ML_inferencing.h>
```

Change to:
```cpp
// ================= EDGE IMPULSE LIBRARY =================
#include <SproutSense-ML_inferencing.h>
```

Also uncomment:
```cpp
// #define ENABLE_EDGE_IMPULSE_INFERENCE true
```

Change to:
```cpp
#define ENABLE_EDGE_IMPULSE_INFERENCE true
```

---

### 9. Upload to ESP32

1. **Connect** ESP32 to computer via USB
2. **Select** board: ESP32 Dev Module
3. **Select** port: COM port of your ESP32
4. **Click** Upload
5. **Open** Serial Monitor (115200 baud)

---

### 10. Monitor Inference Results

Once running, you'll see output like:
```
[EDGE IMPULSE] Running inference...
[EDGE IMPULSE] Features: [45.2, 25.3, 65.0, 78.5, 6.8]
[EDGE IMPULSE] Predictions:
  healthy: 85.23%
  needs_water: 8.45%
  overwatered: 3.12%
  temperature_stress: 1.56%
  low_light: 0.89%
  ph_imbalance: 0.75%
[EDGE IMPULSE] Classification: healthy
[EDGE IMPULSE] Timing: 23ms
```

---

## Model Types You Can Build

### 1. Plant Health Classification
**Input:** moisture, temperature, humidity, light, pH  
**Output:** healthy, needs_water, overwatered, stressed  
**Use Case:** Automatic health monitoring

### 2. Optimal Watering Predictor
**Input:** moisture, weather forecast, time of day, light  
**Output:** water_now, water_later, skip_today  
**Use Case:** Intelligent watering schedule

### 3. Disease Detection (with Camera)
**Input:** Plant image from ESP32-CAM  
**Output:** healthy, fungal_infection, pest_damage, nutrient_deficiency  
**Use Case:** Early disease detection

### 4. Anomaly Detection
**Input:** Time series sensor data  
**Output:** normal, anomaly_detected  
**Use Case:** Detect sensor failures or unusual environmental changes

---

## Code Functions Already Implemented

### Data Collection
```cpp
void collectEdgeImpulseTrainingData()
```
- Collects sensor readings
- Formats as CSV
- Outputs to Serial for copy/paste

### Inference
```cpp
void runEdgeImpulseInference()
```
- Reads current sensors
- Prepares feature array
- Runs ML inference
- Returns prediction with confidence

### Feature Preparation
```cpp
void prepareFeaturesForInference(float* features)
```
- Normalizes sensor values
- Orders features correctly
- Handles missing data

---

## Troubleshooting

### Library Not Found
**Error:** `fatal error: SproutSense-ML_inferencing.h: No such file or directory`
**Fix:** Make sure you installed the Arduino library from Edge Impulse deployment

### Inference Fails
**Error:** `ei_run_classifier() returned error`
**Fix:** Check that feature count matches model input size

### Low Accuracy
**Fix:** 
- Collect more training data
- Balance your dataset (equal samples per class)
- Increase training epochs
- Try different neural network architecture

### Memory Issues
**Error:** `Guru Meditation Error: Core 0 panic'ed (LoadProhibited)`
**Fix:** 
- Use smaller model (reduce layers/neurons)
- Enable PSRAM in Arduino IDE
- Free up memory by disabling unused features

---

## Advanced Features

### Real-time Data Streaming
Enable streaming sensor data to Edge Impulse Studio:
```cpp
#define ENABLE_EDGE_IMPULSE_STREAMING true
```

### On-device Learning
Update model with new data:
- Enable "EON Tuner" in deployment
- Use online learning APIs

### Multi-model Inference
Run multiple models simultaneously:
- Health classification
- Disease detection (image)
- Watering prediction

---

## Resources

- **Edge Impulse Docs:** https://docs.edgeimpulse.com/
- **ESP32 Examples:** https://docs.edgeimpulse.com/docs/development-platforms/officially-supported-mcu-targets/espressif-esp32
- **Arduino Library Guide:** https://docs.edgeimpulse.com/docs/deployment/arduino-library
- **Tutorial Videos:** https://www.youtube.com/c/EdgeImpulse

---

## Support

If you encounter issues:
1. Check Edge Impulse Forum: https://forum.edgeimpulse.com/
2. Check Serial Monitor output
3. Enable debug mode: `ei_printf` statements
4. Contact Edge Impulse support with your project ID

---

## Example Training Data

Here's a sample dataset to get started:

```csv
timestamp,moisture,temperature,humidity,light,pH,label
1678901234,45.2,25.3,65.0,78.5,6.8,healthy
1678901294,28.1,26.1,63.0,80.2,6.7,needs_water
1678901354,52.8,24.9,68.0,75.3,6.9,healthy
1678901414,82.3,23.5,72.0,70.1,6.6,overwatered
1678901474,38.7,35.2,45.0,85.2,7.1,temperature_stress
1678901534,41.3,24.8,66.0,22.4,6.8,low_light
1678901594,44.9,25.1,64.0,79.3,5.2,ph_imbalance
```

Save 100+ samples for each label for best results.

---

**Happy Machine Learning! 🌱🤖**
