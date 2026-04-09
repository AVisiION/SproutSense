# SproutSense Mock Data & Simulation Mode Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Master Controls](#master-controls)
4. [Simulation Modes](#simulation-modes)
5. [Preset Scenarios](#preset-scenarios)
6. [Managing Mock Data](#managing-mock-data)
7. [Use Cases](#use-cases)
8. [Troubleshooting](#troubleshooting)

---

## Overview

**Mock Mode** is a development and testing feature that allows you to:
- Override live API data with synthetic data
- Test all dashboard features without a connected ESP32
- Run realistic simulations with drifting sensor values
- Create and manage test scenarios
- Present the system to stakeholders

### Key Features
- ✅ **No Backend Required** — Works offline with browser-only data
- ✅ **Real-time Simulation** — Sensor values drift naturally every 3 seconds
- ✅ **Pre-built Scenarios** — Normal, Empty, Error, High Load, Demo presets
- ✅ **Full Data Control** — Add, edit, and delete sensors, alerts, users
- ✅ **Export/Import** — Save and restore mock data configurations
- ✅ **Status Indicators** — Visual feedback showing active simulations

### Where to Access
**Admin Panel** → **Mock Data Control** (first section)

---

## Quick Start

### Step 1: Enable Mock Mode
1. Go to **Admin Panel** → **Mock Data Control** section
2. Toggle the **ON/OFF** switch to **ON**
3. The control panel appears below

### Step 2: Apply a Scenario
1. Click the **"Preset Scenarios"** tab
2. Select one of the pre-built scenarios:
   - **Normal** (✓ default) — All sensors active with realistic data
   - **Empty** — No data for testing error states
   - **Error** — Simulates system failures
   - **High Load** — Many sensors and alerts
   - **Demo** — Best for presentations
3. The dashboard updates immediately

### Step 3: Enable Drift Simulation (Optional)
1. In the left sidebar, find **Drift Mode** toggle
2. Turn it **ON** to enable real-time simulation
3. Sensor values will change every 3 seconds (realistic ±0.5 to ±1.5 variation)

### Step 4: View Changes on Dashboard
- **Home Page** — Shows mock sensor readings and status
- **Analytics Page** — Mock history charts populate with time-series data
- **Records Page** — Mock watering logs appear with timestamps
- **Insights Page** — Mock disease detection data shows

**Duration:** ~2 minutes to full mock setup

---

## Master Controls

### Toggle: Mock Data ON/OFF
```
Location: Admin Panel → Mock Data Control → Top Switch
Purpose:  Enable/disable all mock data injection
Status:   Displays "ON" (green) or "OFF" (gray)
Effect:   When OFF, system uses real API calls (if available)
```

### Toggle: Drift Mode
```
Location: Left sidebar → "Drift Mode" toggle
Purpose:  Enable real-time sensor value simulation
Status:   Pulsing blue indicator when active
Effect:   Sensors drift ±0.5-1.5% every 3 seconds (natural variation)
```

### Tabs: Management Interface
```
Tabs Available:
├─ Sensors         → View/edit individual sensor readings
├─ Alerts          → Create system alerts for testing
├─ Crop Analytics  → Adjust crop health KPIs
├─ Weather Station → Set weather simulation values
├─ User Management → Add test users with different roles
├─ Preset Scenarios → Apply pre-built test configurations
```

---

## Simulation Modes

### 1. **Normal Mode** (Default)
```
State:    Drift Mode: OFF (static values)
Sensors:  2 active sensors with baseline readings
- Field A - Zone 1: 62% moisture, 28.4°C, 71% humidity
- Field A - Zone 2: 45% moisture, 31.2°C, 65% humidity

Alerts:   2 example alerts
Crop:     85% health, seedling growth stage
Weather:  Sunny, 24°C, no rain

Use For:  Testing dashboard with realistic baseline data
```

### 2. **Drift Simulation Mode** (Active + Live)
```
State:    Drift Mode: ON (changes every 3 seconds)
Behavior: Each sensor reading:
  - Moisture: ±0.5 variation (0-100% bounds)
  - Temperature: ±0.2°C drift
  - Humidity: ±0.6% drift
  
Animation: Visual "pulsing" indicator in header
Progress:  Activity counter increments per drift cycle
Use For:  Stress testing UI responsiveness, demo watering triggers
```

### 3. **Empty Scenario**
```
State:    All data empty
Sensors:  []
Alerts:   []
Crop:     All zeros, "—" growth stage (N/A state)
Weather:  No data

Use For:  Testing error state UI, empty list handling
```

### 4. **Error Scenario**
```
State:    Simulates system failures
Alerts:   Multiple high-priority errors (sensors offline, connectivity lost)
Sensors:  Marked as "offline" or "inactive"
Use For:  Testing alert UI, error handling, offline mode
```

### 5. **High Load Scenario**
```
State:    Maximum test load
Sensors:  10+ sensors all active
Alerts:   5+ simultaneous alerts
Activity: High update frequency
Use For:  Performance testing, large-scale visual testing
```

### 6. **Demo Scenario**
```
State:    Optimized for presentation
Sensors:  Similar to Normal but with impressive health scores
Crop:     92% health (excellent condition)
Weather:  Perfect conditions (sunny, no rain needed)
Use For:  Live presentations, stakeholder demos
```

---

## Managing Mock Data

### Adding a Sensor
1. Click **"Sensors"** tab
2. Fill the form:
   - **Sensor Name** (e.g., "Field B Zone 3")
   - **Moisture** (0-100)
   - **Temperature** (Celsius)
   - **Humidity** (0-100%)
3. Click **"Add Sensor"**
4. New sensor appears in the list
5. **Drift Mode** will update its values if enabled

### Editing Sensor Values
1. Find sensor in **Sensors** tab
2. Click the sensor card to select it
3. Adjust values in the form above
4. Changes apply immediately to dashboard

### Deleting a Sensor
1. Find sensor in **Sensors** tab
2. Click the **Delete** button (trash icon)
3. Sensor removed from mock data

### Adding Custom Alerts
1. Click **"System Alerts"** tab
2. Fill the form:
   - **Alert Message** (e.g., "Soil too dry")
   - **Alert Type** (error, warning, disease, etc.)
3. Click **"Create Alert"**
4. Alert broadcasts across dashboard immediately

### Adjusting Crop Health
1. Click **"Crop Analytics"** tab
2. Use sliders to adjust:
   - **Overall Score** (0-100%)
   - **Growth Stage** (seedling, vegetative, flowering, fruiting)
   - **Disease Risk** (0-100%)
   - **Water Stress** (0-100%)
   - **Nutrient Level** (0-100%)
3. Changes broadcast immediately to dashboard KPI cards

### Exporting Mock Configuration
1. Click **"Preset Scenarios"** tab
2. Find **"Export Mock Data"** button
3. JSON file downloads with current sensors, alerts, crop, weather, users
4. Share with team or save for later use

### Importing Mock Configuration
1. Click **"Preset Scenarios"** tab
2. Find **"Import Mock Data"** button
3. Select JSON file from your computer
4. All data replaces current mock state
5. Dashboard updates immediately

---

## Use Cases

### Use Case 1: Develop Dashboard Without Hardware
```
Scenario: You're building UI features but ESP32 hardware isn't ready

Steps:
1. Enable Mock Mode
2. Apply "Normal" scenario
3. Enable Drift Mode for dynamic testing
4. Add custom sensors matching your planned hardware config
5. Develop knowing data will always be available

Benefit: No dependencies on hardware availability
```

### Use Case 2: Demonstrate System to Stakeholders
```
Scenario: You need to show a polished demo without real data

Steps:
1. Enable Mock Mode
2. Apply "Demo" scenario (enhanced health scores, perfect weather)
3. Disable Drift Mode (static presentation data)
4. Export mock configuration for reuse
5. Present dashboard to stakeholders

Benefit: Consistent, impressive-looking demo every time
```

### Use Case 3: Test Error Handling
```
Scenario: You need to verify UI gracefully handles errors

Steps:
1. Enable Mock Mode
2. Apply "Error" scenario
3. Manually add more error-type alerts if needed
4. Test that error UI renders correctly
5. Verify error messages are clear

Benefit: Controlled testing without breaking real infrastructure
```

### Use Case 4: Load Testing UI
```
Scenario: You want to stress-test dashboard with many sensors

Steps:
1. Enable Mock Mode
2. Apply "High Load" scenario (10+ sensors, 5+ alerts)
3. Enable Drift Mode
4. Monitor dashboard performance
5. Identify rendering bottlenecks

Benefit: Safe performance testing without production database load
```

### Use Case 5: Training New Team Members
```
Scenario: Onboarding developers who need to understand the system

Steps:
1. Keep Mock Mode enabled in dev environment
2. Show how to apply different scenarios
3. Explain how sensor data flows through UI
4. Let them modify sensors to see live updates
5. Export a standard "training" mock configuration

Benefit: Safe sandbox for new team members to explore
```

---

## Advanced Features

### Real-Time Data Broadcasting
When Drift Mode is ON, changes broadcast to all connected clients via:
- **Subscription System** — mockDataService uses subscriber pattern
- **Component Re-render** — All components using mock data refresh
- **No WebSocket Required** — Works purely in-browser

### Time-Series History Generation
When you query sensor history in mock mode:
- **Historical Data** — api.js generates synthetic time-series
- **Realistic Variation** — Sinusoidal waves + drift simulation
- **Timestamps** — Each point includes accurate timestamp
- **Analytics Ready** — Charts populate automatically

### Disease Detection Mocks
When viewing disease insights in mock mode:
- **Fallback Data** — "leaf_blight" and "healthy" sample detections
- **Confidence Scores** — Realistic detection confidence (0-95%)
- **Device Mapping** — Linked to ESP32-CAM device ID
- **Pagination** — Search and filter works on mock data

### Watering Log Simulation
When viewing watering records:
- **Generated from Sensors** — High-flow-rate periods become watering events
- **Duration Calculation** — Based on sensor history
- **Volume Estimation** — Realistic mL amounts
- **Timestamps** — Accurate to data point

---

## Troubleshooting

### Issue: Mock Data Not Appearing
**Symptom:** Toggled mock on, but dashboard still shows no data

**Solution:**
1. Verify mock is actually ON (green "ON" label visible)
2. Click "Preset Scenarios" tab
3. Select a scenario (even if "Normal" is selected)
4. Refresh the browser page
5. Check browser console (F12) for errors

**Root Cause:** Mock data wasn't initialized properly

---

### Issue: Drift Mode Not Working
**Symptom:** Sensor values don't change even with Drift Mode ON

**Solution:**
1. Check that **Mock Mode is ON** (not just Drift Mode)
2. Ensure at least one sensor exists in "Sensors" tab
3. Toggle Drift Mode OFF then back ON
4. Wait 3-5 seconds (update interval is 3 seconds)
5. Check the blue "pulsing" indicator in header

**Root Cause:** Drift mode requires active mock data

---

### Issue: Changes Not Syncing Across Tabs
**Symptom:** Edit sensor in one tab, doesn't reflect in another

**Solution:**
1. Ensure you clicked "Save" or "Update" after editing
2. Check that "Sensors" tab shows your update
3. Close and reopen affected pages (e.g., Home, Analytics)
4. Open browser console to verify no JS errors

**Root Cause:** Some tabs may not have real-time subscriptions enabled

---

### Issue: Export/Import Not Working
**Symptom:** Can't find export button or import fails

**Solution:**
1. Ensure Mock Mode is ON
2. Click "Preset Scenarios" tab (bottom of list)
3. Look for "Export Mock Data" button at top of tab content
4. For import: select a valid JSON file (verify format matches export)
5. Check browser console for detailed error message

**Root Cause:** Scenarios tab is easily missed

---

### Issue: Deleted Data Reappears
**Symptom:** Deleted a sensor, but it reappeared after refresh

**Solution:**
1. Mock data is stored IN-MEMORY only (not localStorage)
2. Page refresh clears all mock data and resets to defaults
3. To preserve custom config: **Export before refreshing**
4. After refresh: **Import** the exported JSON file
5. Or: Apply a scenario after refresh, then customize

**Root Cause:** In-memory storage means no persistence on page reload

---

## API Integration Details

### How Mock Data Flows Through System

```
MockDataService (in-memory store)
    ↓
    ├─→ isMockEnabled() check in api.js
    ├─→ YES: Return synthetic data from mockDataService getters
    └─→ NO: Make real API call to backend
    
Example: sensorAPI.getHistory()
When isMockEnabled():
1. Retrieve mock sensors from mockDataStore
2. Generate time-series history (normalizeMockSensorHistory)
3. Return properly formatted { data: [...] }
4. React components render as if real API returned it
```

### Key Mock API Methods

| Method | Returns | Notes |
|--------|---------|-------|
| `sensorAPI.getLatest()` | Single sensor reading | Normalized keys (soilMoisture, temperature, etc.) |
| `sensorAPI.getHistory(start, end)` | []History points | Time-series with timestamps, 8-200+ points |
| `wateringAPI.getLogs()` | []Watering events | Generated from sensor high-flow periods |
| `aiAPI.getDiseaseDetections()` | {detections, total} | Mapped from mock alerts + fallback samples |
| `configAPI.get()` | {status, counts} | Mock system status, sensor count |

---

## Best Practices

### ✅ DO
- **Keep Mock Mode OFF in production** (it's dev-only by design)
- **Export your custom configurations** before browser refresh
- **Use scenarios as starting points** then customize
- **Enable Drift Mode for realistic testing** of real-time updates
- **Combine multiple alerts** to test error handling UI

### ❌ DON'T
- **Don't expect data persistence** across page refreshes (import after refresh)
- **Don't use in production** (no real hardware/data)
- **Don't modify mockDataService directly** in code (use UI controls)
- **Don't mix mock and real APIs** (either all mock or all real)

---

## Quick Reference Card

| Action | Location | Keys |
|--------|----------|------|
| Enable/Disable | Admin → Mock Data Control | Toggle switch |
| Apply Scenario | Scenarios tab | Click scenario card |
| Add Sensor | Sensors tab → Form | Fill + "Add Sensor" |
| Edit Sensor | Sensors tab → Existing sensor | Modify + "Update" |
| Delete Sensor | Sensors tab → Sensor card | "Delete" button |
| Enable Drift | Left sidebar | "Drift Mode" toggle |
| Export Data | Scenarios tab | "Export Mock Data" button |
| Import Data | Scenarios tab | "Import Mock Data" button |
| Add Alert | Alerts tab → Form | Fill + "Create Alert" |
| Adjust Crop | Crop Analytics → Sliders | Adjust + auto-save |

---

## FAQ

**Q: Does Mock Mode work offline?**
A: Yes! It's completely browser-based. No backend or internet required.

**Q: Will mock data persist if I close the browser?**
A: No. In-memory only. Export before closing if you need to preserve custom data.

**Q: Can I use Mock Mode in production?**
A: No. It's designed for development/testing only. Real hardware won't be detected.

**Q: Do team members see my mock data?**
A: No, unless they also enable Mock Mode. Real users see real data from backend.

**Q: How do I test with custom sensor values?**
A: Edit individual sensors in the Sensors tab, or import a custom JSON configuration.

**Q: Can I combine real and mock data?**
A: No. Either all mock (isMockEnabled = true) or all real (isMockEnabled = false).

---

## Support & Feedback

For issues or suggestions about Mock Mode:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review your browser console (F12) for error messages
3. Verify you're following steps in [Quick Start](#quick-start)
4. Contact development team with error screenshots

---

**Last Updated:** April 2026
**Version:** 2.0 (Enhanced)
