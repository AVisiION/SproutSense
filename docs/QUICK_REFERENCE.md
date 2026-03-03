# SproutSense Quick Reference Card

## 📋 File Structure
```
z:\MINOR _ PROJECT\
├── src\
│   ├── main.cpp              (↑ START HERE - main sketch)
│   ├── config.h              (← Pin mapping & constants)
│   ├── secrets.h.example     (→ Copy to secrets.h, add credentials)
│   ├── sensors.h/cpp         (Read 5 sensor types)
│   ├── watering.h/cpp        (Irrigation FSM)
│   ├── network.h/cpp         (Wi-Fi + Blynk)
│   ├── ai_hooks.h/cpp        (AI stubs - not yet active)
│   └── README.md             (↑ Getting started guide)
│
└── docs\
    └── WIRING_GUIDE.md       (Complete hardware connections)
```

---

## 🚀 Quick Start (5 Steps)

### 1. **Create secrets.h**
```bash
cd z:\MINOR _ PROJECT\src\
copy secrets.h.example secrets.h
```
Then edit `secrets.h` and fill in:
- Wi-Fi SSID & password
- Blynk auth token (from https://blynk.cloud)
- OpenWeatherMap API key (free from https://openweathermap.org)

### 2. **Install Libraries** (Arduino IDE)
```
Sketch → Include Library → Manage Libraries
Search for and install:
  ✓ Blynk
  ✓ DHT sensor library
  ✓ Arduino_JSON
```

### 3. **Upload Code**
```
Tools → Board → ESP32-CAM
Tools → Upload Speed → 921600
Tools → Partition → Huge APP (3MB No OTA)
Sketch → Upload
```

### 4. **Open Serial Monitor**
```
Tools → Serial Monitor (115200 baud)
Watch startup messages
```

### 5. **Test Everything**
```
Type in Serial Monitor:
  t  → Sensor self-test
  s  → Show readings
  p  → Pump ON
  q  → Pump OFF
```

---

## 📍 GPIO Pin Assignments

```
┌──────────────────────────────────────┐
│ ANALOG SENSORS (ADC1)                │
├──────────────────────────────────────┤
│ GPIO 34  → pH Sensor     (SIG)       │
│ GPIO 35  → Moisture Sensor           │
│ GPIO 39  → Light Sensor (LDR)        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ DIGITAL SENSORS & CONTROL            │
├──────────────────────────────────────┤
│ GPIO 12  → Flow Sensor (Interrupt)   │
│ GPIO 13  → DHT22 (Temp/Humidity)     │
│ GPIO 14  → Relay CH1 (Pump Control)  │
│ GPIO 15  → Relay CH2 (Unused)        │
└──────────────────────────────────────┘
```

---

## 🎮 Serial Monitor Debug Commands

```
?   Help menu
t   Sensor self-test (validates all 5 sensors)
s   Show current sensor readings
c   Show connection status (Wi-Fi, Blynk)
w   Show watering state machine
p   Manual pump ON
q   Manual pump OFF  
r   Relay module test (toggle twice)
d   Full diagnostics (all systems)
m   Memory information (heap usage)
```

**Example Output:**
```
> t
[SELF-TEST] Moisture: 45% ✓
[SELF-TEST] pH: 6.8 ✓
[SELF-TEST] Temp: 28°C, Humidity: 65% ✓
[SELF-TEST] Light: 75% ✓
[SELF-TEST] Result: SUCCESS ✓
```

---

## 📊 Blynk Virtual Pins Configuration

```
In Blynk App → Add Widget for each pin:

V0  → Gauge       (Soil Moisture %)       [Read-only]
V1  → Gauge       (pH Value)              [Read-only]
V2  → Thermometer (Temperature °C)        [Read-only]
V3  → Gauge       (Humidity %)            [Read-only]
V4  → Progress    (Light Level %)         [Read-only]
V5  → Number      (Flow Volume mL)        [Read-only]
V6  → Button      (Pump ON/OFF)           [Write - Manual Control]
V7  → Button      (Camera Snapshot)       [Write - Future]
V8  → Number      (Cycles/Hour)           [Read-only]
V9  → Text        (Last Watering)         [Read-only]
```

---

## ⚙️ Configuration Tweaking

### Soil Moisture Threshold
**File:** `config.h`
```cpp
#define MOISTURE_THRESHOLD_PERCENT  30.0  // Water when below 30%
```
Lower = water less frequently  
Higher = water more frequently

### Watering Safety Limits
```cpp
#define MAX_WATERING_CYCLES_PER_HOUR  3      // Max cycles
#define TARGET_WATER_VOLUME_ML        100.0  // mL per cycle
#define PUMP_MAX_RUNTIME_MS           20000  // 20 sec max
```

### Sensor Timing
```cpp
#define SENSOR_SAMPLING_INTERVAL_MS   5000   // Read every 5 sec
#define BLYNK_UPDATE_INTERVAL_MS      10000  // Sync every 10 sec
#define WEATHER_UPDATE_INTERVAL_MS    1800000 // Every 30 min
```

---

## 🔧 Calibration Quick Tips

### Moisture Sensor
1. Air-dry soil → Read ADC (use multimeter on GPIO 35)
2. Saturate soil → Read new ADC value
3. Update `config.h`:
   ```cpp
   #define MOISTURE_ADC_DRY  [dry_value]
   #define MOISTURE_ADC_WET  [wet_value]
   ```

### pH Sensor
1. Immerse in pH 7.0 buffer
2. Note voltage output (Serial: type 's')
3. Immerse in pH 4.0 buffer  
4. Note new voltage
5. Update `config.h`:
   ```cpp
   #define PH_CALIBRATION_VOLTAGE_PH7  [your_value]
   #define PH_CALIBRATION_VOLTAGE_PH4  [your_value]
   ```

### Flow Sensor
1. Run pump into measuring cup for 10 seconds
2. Check Serial: "Flow Rate: X.X ml/min"
3. Calculate total ML / (seconds / 60)
4. If off, adjust `FLOW_SENSOR_PULSES_PER_ML`

---

## 🌊 Watering FSM States

```
IDLE ────────→ Check moisture < 30%?
 ↑                (No: stay in IDLE)
 │                (Yes: go to CHECK_CONDITIONS)
 │
 └─ CHECK_CONDITIONS ──→ Any block conditions?
                         ├─ In cooldown? → Back to IDLE
                         ├─ Max cycles reached? → IDLE
                         ├─ Rain expected? → IDLE  
                         └─ All clear? → WATERING
                         
 WATERING ──→ Monitor flow until:
              ├─ 100 mL reached? → COOLDOWN
              └─ 20 sec timeout? → COOLDOWN
              
 COOLDOWN ──→ Wait 20 minutes → Back to IDLE
```

**Commands to test FSM:**
```
Type 'w' → Shows current state
Type 'p' → Manual pump ON (skips IDLE check)
Type 'q' → Manual pump OFF
Type 's' → Show moisture level (real-time)
```

---

## 🚨 Common Issues & Fixes

| Issue | Quick Fix |
|---|---|
| Code won't compile | Check library install: Blynk, DHT, JSON |
| Can't find secrets.h | Copy `secrets.h.example` → `secrets.h` |
| Sensor reads -1 | Invalid ADC reading → check wires |
| Won't connect Wi-Fi | Check SSID/password in secrets.h (case-sensitive) |
| Blynk shows offline | Verify auth token matches device |
| Pump never runs | Type 'r' to test relay click |
| Flow sensor stuck | Check GPIO 12 interrupt attached |
| Memory decreasing | Possible memory leak - restart device |

---

## 🔌 Power Requirements

```
Main 5V Power Supply (2A minimum, 4A recommended)
├─→ ESP32-CAM (100-300 mA depending on activity)
├─→ Relay Module (50 mA)
└─→ Water Pump (300-500 mA when running)

CRITICAL: All GND connections must be common
  [PSU GND] ──→ [Breadboard GND] ──→ [ESP32 GND]
```

---

## 📈 Performance Targets

```
Uptime:         97%+ (auto-reconnect, non-blocking)
Sensor Accuracy: ±5% (with calibration)
Response Time:   <5 sec (Blynk <2 sec)
Watering Error:  ±10% (volume control via flow sensor)
Sensor Updates:  Every 5 seconds
Blynk Sync:      Every 10 seconds
History Log:     Every 60 seconds
Weather Check:   Every 30 minutes
```

---

## 📱 Blynk App Setup Steps

1. **Download App** (iOS App Store / Android Play Store)
2. **Sign up** for free account
3. **Create New Device**
   - Name: "SproutSense"
   - Paste auth token from `secrets.h`
4. **Add Widgets** (see pin list above)
5. **Set up Notifications**
   - Menu → Device Notifications → ON
   - Will alert on extreme conditions
6. **View Dashboard**
   - Sensor gauges update every 10 sec
   - Control pump manually
   - 7-day history charts

---

## 🎯 Testing Checklist

### Hardware Level
- [ ] Moisture sensor responds to wet/dry
- [ ] pH sensor shows stable ~2.5V at rest
- [ ] DHT warm hand increases temperature reading
- [ ] LDR light increases with brightness
- [ ] Flow sensor pulses on water flow
- [ ] Relay clicks when GPIO 14 goes HIGH
- [ ] Pump draws power only when relay energized

### Software Level
- [ ] Serial startup messages appear
- [ ] 't' command passes all 5 sensors
- [ ] 'c' command shows Wi-Fi CONNECTED + Blynk SYNCED
- [ ] 's' command shows valid sensor numbers
- [ ] 'p' → pump ON, 'q' → pump OFF works
- [ ] Manual Blynk button toggles pump
- [ ] Dashboard values update every 10 sec
- [ ] No error messages in Serial Monitor

### System Level
- [ ] System runs 1+ hours without restart
- [ ] Memory usage stable (type 'm')
- [ ] Uptime counter incrementing (type 'd')
- [ ] Watering triggers at 30% moisture
- [ ] Max 3 cycles per hour enforced
- [ ] Notifications arrive in Blynk app

---

## 🔑 Key Files Reference

| File | Contains | Edit When |
|---|---|---|
| `main.cpp` | Main loop, timing | Changing logic flow |
| `config.h` | All pin#, thresholds | Adjusting hardware pin assignments or sensor sensitivity |
| `secrets.h` | Credentials | Adding Wi-Fi, Blynk, API keys |
| `sensors.cpp` | Sensor readers | Changing averaging, calibration |
| `watering.cpp` | Irrigation FSM | Tweaking safety rules, volumes |
| `network.cpp` | Blynk integration | Adding new virtual pins |
| `ai_hooks.cpp` | AI stubs | Implementing Image Impulse, Gemini, IFTTT |

---

## 📚 Documentation Map

```
NEW TO PROJECT?
  └─→ Read: src/README.md (Getting Started)

WIRING CONFUSED?
  └─→ Read: docs/WIRING_GUIDE.md

WANT TO CHANGE CONFIG?
  └─→ Edit: src/config.h (all constants)

IMPLEMENTING AI FEATURES?
  └─→ Edit: src/ai_hooks.cpp (look for TODO)

DEBUGGING WEIRD BEHAVIOR?
  └─→ Use: Serial Monitor debug commands (type '?')

OVERALL PROJECT ARCHITECTURE?
  └─→ Read: IMPLEMENTATION_SUMMARY.md (this file)
```

---

## ✅ Next Steps After Setup

1. **Test sensor calibration** (run 't' command multiple times)
2. **Create Blynk dashboard** (add all 9 widgets)
3. **Manual watering test** (use 'p'/'q' commands)
4. **Automatic watering test** (lower threshold temporarily, watch FSM)
5. **Fine-tune parameters** in `config.h` based on plant type
6. **Monitor 24 hours** to validate reliability
7. **Enable AI features** as desired (Edge Impulse, Gemini, IFTTT)

---

## 🆘 Emergency Procedures

### Pump Won't Stop Running (SAFETY RISK)
```
1. Unplug 5V power supply immediately
2. Check relay module receives power
3. Verify GPIO 14 → Relay IN1 connection
4. Type 'q' in Serial to stop (but pump may continue if relay stuck)
5. Test relay with 'r' command
```

### Water Overflow in Progress
```
1. Manually lift pump suction out of water
2. Type 'q' in Serial Monitor
3. Unplug power if necessary
4. Check flow sensor is working
```

### Serial Monitor Shows Errors
```
1. Check SD card has proper secrets.h
2. Verify all libraries installed
3. Review error message in Serial output
4. Check config.h matches actual wiring
5. Restart device (power cycle)
```

---

## 📞 Support Resources

- **Hardware Questions:** See [WIRING_GUIDE.md](docs/WIRING_GUIDE.md)
- **Getting Started:** See [README.md](src/README.md)
- **Code Comments:** Check function headers in `.h` files
- **API Details:** See function comments in `.cpp` files
- **Troubleshooting:** See README.md FAQ section
- **Serial Commands:** Type `?` in Serial Monitor

---

## 🎓 Learning Resources

- **Blynk Docs:** https://docs.blynk.io
- **ESP32 Pinout:** https://github.com/espressif/arduino-esp32
- **OpenWeatherMap API:** https://openweathermap.org/api
- **Edge Impulse:** https://edgeimpulse.com
- **Google Gemini:** https://aistudio.google.com

---

**Version:** 1.0.0 BETA (March 2, 2026)  
**Status:** ✅ Ready for Deployment  
**Print this card for quick reference!** 📋
