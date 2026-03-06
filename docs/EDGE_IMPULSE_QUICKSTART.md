# Edge Impulse Quick Start for SproutSense

## 🚀 Quick Setup (5 Steps)

### Step 1: Train Model in Edge Impulse Studio
1. Visit https://studio.edgeimpulse.com/
2. Create project "SproutSense-ML"
3. Upload sensor data CSV (see format below)
4. Design impulse → Train model
5. Deploy as **Arduino library**

### Step 2: Install Arduino Library
1. Download ZIP from Edge Impulse deployment
2. Arduino IDE → Sketch → Include Library → Add .ZIP Library
3. Select downloaded file

### Step 3: Update ESP32 Code
In `SproutSense_ESP32_AllInOne.ino`, **uncomment these 4 lines**:

```cpp
// Line ~18: UNCOMMENT THIS
#include <SproutSense-ML_inferencing.h>

// Lines ~175-178: UNCOMMENT THESE
#define ENABLE_EDGE_IMPULSE_INFERENCE      true
#define ENABLE_EDGE_IMPULSE_DATA_COLLECTION false  // Set true only when collecting data
#define EDGE_IMPULSE_INFERENCE_INTERVAL_MS 60000
#define EDGE_IMPULSE_DATA_LOG_INTERVAL_MS  5000
```

### Step 4: Upload to ESP32
1. Connect ESP32 via USB
2. Select board: ESP32 Dev Module
3. Click Upload
4. Open Serial Monitor (115200 baud)

### Step 5: Monitor Results
Watch Serial Monitor for:
```
[EDGE_IMPULSE] Running inference...
[EDGE_IMPULSE] Classification: healthy (85.2% confidence)
```

---

## 📊 Training Data Format

### CSV Structure
```csv
timestamp,moisture,temperature,humidity,light,pH,label
1678901234,45.2,25.3,65.0,78.5,6.8,healthy
1678901294,28.1,26.1,63.0,80.2,6.7,needs_water
1678901354,82.3,23.5,72.0,70.1,6.6,overwatered
```

### Collect Data from ESP32
1. Set `ENABLE_EDGE_IMPULSE_DATA_COLLECTION` to `true`
2. Upload code to ESP32
3. Open Serial Monitor
4. Copy data lines starting with `[EI_DATA]`
5. Paste into CSV file
6. Collect 100+ samples per label

### Recommended Labels
- `healthy` - Optimal conditions
- `needs_water` - Moisture < 30%
- `overwatered` - Moisture > 80%
- `temperature_stress` - Temp outside 15-30°C
- `low_light` - Light < 40%
- `ph_imbalance` - pH outside 6.0-7.5

---

## 🎯 Model Configuration in Edge Impulse

### Impulse Design
- **Time series window:** 1000ms
- **Processing block:** Raw Data or Time Series
- **Learning block:** Classification (Keras)

### Input Features (5 total)
1. moisture (0-100%)
2. temperature (°C)
3. humidity (0-100%)
4. light (0-100%)
5. pH (4.0-9.0)

### Output Classes (6 total)
1. healthy
2. needs_water
3. overwatered
4. temperature_stress
5. low_light
6. ph_imbalance

### Training Settings
- **Epochs:** 100
- **Learning rate:** 0.001
- **Validation split:** 20%
- **Target accuracy:** >90%

---

## 🔧 Code Integration Points

### Already Implemented ✅

**1. Data Collection**
```cpp
collectEdgeImpulseTrainingData()
// Auto-logs CSV data to Serial Monitor
```

**2. Feature Preparation**
```cpp
prepareFeaturesForInference(features, size)
// Normalizes sensor values for model input
```

**3. Inference Execution**
```cpp
runEdgeImpulseInference()
// Runs prediction and returns classification
```

**4. Result Access**
```cpp
getLastInferenceResult(prediction, confidence)
// Get last prediction: "healthy", 85.2%
```

**5. Statistics**
```cpp
printEdgeImpulseStats()
// Shows inference count, average time, etc.
```

### Main Loop Integration
```cpp
void loop() {
  // Runs every 60 seconds automatically
  #ifdef ENABLE_EDGE_IMPULSE_INFERENCE
  if (runEdgeImpulseInference()) {
    char prediction[64];
    float confidence;
    if (getLastInferenceResult(prediction, confidence)) {
      // Act on prediction
      if (strcmp(prediction, "needs_water") == 0 && confidence > 0.7) {
        triggerWatering();
      }
    }
  }
  #endif
}
```

---

## 🐛 Troubleshooting

### Library Not Found
**Error:** `fatal error: SproutSense-ML_inferencing.h: No such file`  
**Fix:** Install Arduino library from Edge Impulse deployment

### Feature Size Mismatch
**Error:** `Feature size mismatch: got X, expected Y`  
**Fix:** Model expects different number of features. Regenerate with 5 features.

### Low Inference Accuracy
**Fix:**
- Collect more balanced training data (equal samples per class)
- Increase training epochs (try 200)
- Check sensor calibration
- Verify feature normalization ranges

### Memory Issues
**Error:** `Guru Meditation Error`  
**Fix:**
- Tools → Partition Scheme → "Huge APP (3MB)"
- Or deploy smaller model from Edge Impulse

### Slow Inference
**Observation:** Inference takes >500ms  
**Fix:**
- Use "EON Tuner" in Edge Impulse for optimization
- Reduce neural network layers
- Use quantized model (INT8)

---

## 📈 Expected Performance

### Inference Metrics
- **Time:** 20-50ms per inference
- **Memory:** ~50KB RAM, ~200KB Flash
- **Accuracy:** 85-95% with good training data
- **Power:** Negligible impact on ESP32

### Data Requirements
- **Minimum:** 50 samples per class (300 total)
- **Recommended:** 100+ samples per class (600+ total)
- **Collection time:** ~1 hour at 5-second intervals

---

## 🎓 Learning Resources

- **Edge Impulse Docs:** https://docs.edgeimpulse.com/
- **ESP32 Guide:** https://docs.edgeimpulse.com/docs/development-platforms/officially-supported-mcu-targets/espressif-esp32
- **Video Tutorial:** https://www.youtube.com/c/EdgeImpulse
- **Forum:** https://forum.edgeimpulse.com/

---

## 💡 Next Steps

1. ✅ Code is ready - just uncomment 4 lines
2. 🚀 Train your first model in Edge Impulse Studio  
3. 📦 Install Arduino library
4. 🔌 Upload and test!

**Any questions?** Check `docs/EDGE_IMPULSE_INTEGRATION.md` for detailed guide.

---

**Made with 🌱 for SproutSense**
