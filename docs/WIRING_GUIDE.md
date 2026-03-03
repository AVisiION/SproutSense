# SproutSense Wiring Guide

## Overview

This document explains how to connect all sensors, relays, and the water pump to your ESP32-CAM-MB microcontroller. Proper wiring is essential for reliable operation.

**Important Notes:**
- This is breadboard-based assembly
- All connections use jumper wires
- External 5V power supply needed for pump + relay (with common ground to ESP32)
- No OLED display required (use Serial Monitor and Blynk dashboard instead)

---

## Power Distribution

### Power Supply Requirements

- **ESP32-CAM-MB:** 5V input via USB or breadboard rails
- **Relay Module:** 5V control voltage + 5V coil power
- **Water Pump:** 3-6V DC (typically 5V)
- **Sensors:** 3.3V-5V (DHT22 needs 3-5.5V)

### Breadboard Layout

```
[+5V Power Supply] ─────────────────────┐
                                        ├─→ [+ Power Rail]
[GND / Common Ground] ──────────────────┼─→ [- Ground Rail]
                                        │
                        [ESP32 USB 5V] ┘
```

**Critical:** Connect ESP32 GND to breadboard GND rail, and breadboard GND to power supply GND (common ground).

---

## Sensor Wiring Diagram

### 1. **Soil Moisture Sensor (Capacitive v2.0)**

| Component Pin | Connects To ESP32 Pin | Notes |
|---|---|---|
| VCC (Red) | +3.3V or +5V rail | Best with 5V for full range |
| GND (Black) | Ground rail | Common ground |
| AO (Yellow) | GPIO 35 (ADC1_CH7) | Analog signal |
| DO (Green) | Not used | Digital output unused |

**Practical Wiring:**
```
Moisture Sensor
├─ VCC ──→ 5V breadboard rail
├─ GND ──→ GND breadboard rail
└─ AO  ──→ ESP32-CAM GPIO 35

[No header wires needed from ESP32, analog pins are referenced directly]
```

---

### 2. **pH Sensor (ZS-09 Soil pH Module)**

| Component Pin | Connects To ESP32 Pin | Notes |
|---|---|---|
| VCC (Red) | +5V rail | Requires stable 5V |
| GND (Black) | Ground rail | Common ground |
| AO (Yellow) | GPIO 34 (ADC1_CH6) | Analog pH voltage |
| DO (White) | Not used | Digital threshold unused |

**Practical Wiring:**
```
pH Sensor Module
├─ VCC ──→ 5V breadboard rail
├─ GND ──→ GND breadboard rail
└─ AO  ──→ ESP32-CAM GPIO 34
```

**Calibration Note:**
- Requires 2 calibration points (config.h constants)
- Point 1: pH 7.0 buffer → typically outputs ~2.5V
- Point 2: pH 4.0 buffer → typically outputs ~3.3V
- Adjust via software if sensor drifts

---

### 3. **DHT22 Temperature & Humidity Sensor**

| Component Pin | Connects To ESP32 Pin | Notes |
|---|---|---|
| VCC (typically pin 1) | +3.3V rail | Can be +5V tolerant |
| GND (typically pin 4) | Ground rail | Common ground |
| DATA (typically pin 2) | GPIO 13 | Digital single-wire protocol |
| Pin 3 | Not used | No connection |

**Practical Wiring:**
```
[DHT22 Module]
├─ Pin 1 (VCC) ──→ 3.3V breadboard rail (with optional 10kΩ pull-up to VCC)
├─ Pin 2 (DATA) ──→ ESP32-CAM GPIO 13
├─ Pin 3 ──→ Not used
└─ Pin 4 (GND) ──→ GND breadboard rail

Optional Pull-up Resistor:
  10kΩ resistor between GPIO 13 and 3.3V (helps signal integrity)
```

**Timing Note:**
- DHT requires 2 seconds minimum between successive reads
- Handled automatically in code (DHT_READ_INTERVAL_MS)

---

### 4. **LDR Light Sensor (Digital Module)**

| Component Pin | Connects To ESP32 Pin | Notes |
|---|---|---|
| VCC (Red) | +5V rail | Full brightness range with 5V |
| GND (Black) | Ground rail | Common ground |
| AO (Yellow) | GPIO 39 (ADC1_CH3) | Analog voltage output |
| DO (Green) | Not used | Digital threshold unused |

**Practical Wiring:**
```
LDR Module
├─ VCC ──→ 5V breadboard rail
├─ GND ──→ GND breadboard rail
└─ AO  ──→ ESP32-CAM GPIO 39
```

**Light Sensitivity:**
- 0% = Dark (ADC ~0)
- 100% = Bright light (ADC ~4095)
- Approximate calibration based on ambient conditions

---

## Flow & Pump Control

### 5. **Water Flow Sensor (YF-S401)**

| Component Pin | Connects To ESP32 Pin | Notes |
|---|---|---|
| Yellow (Pulse) | GPIO 12 | Interrupt-based pulse counting |
| Red (5V+) | 5V breadboard rail | Operating voltage 5-24V |
| Black (GND) | Ground rail | Common ground |

**Practical Wiring:**
```
YF-S401 Flow Sensor
├─ Red   ──→ 5V breadboard rail
├─ Black ──→ GND breadboard rail
└─ Yellow ──→ ESP32-CAM GPIO 12 (interrupt-capable)

[Optional] 100nF capacitor across Red & Black for noise suppression
```

**Pulse Output:**
- ~5.5 pulses per mL (calibrated in config.h)
- Interrupt-driven (lowest latency)
- Frequency depends on flow rate

**Installation Notes:**
- Mount in water line between pump and plant pot
- Ensure tight connections (sealed with PTFE tape if screw-in)
- Flow direction marked on sensor body

---

### 6. **Relay Module (5V Dual Channel)**

| Relay Pin | Connects To | Purpose | Notes |
|---|---|---|---|
| GND | Ground rail | Reference | Common ground |
| VCC | 5V rail | Relay coil power | 5V relay module |
| IN1 | GPIO 14 | Channel 1 control | High = relay ON |
| IN2 | GPIO 15 | Channel 2 control | Not currently used |
| COM1 | Pump +5V wire | Common pole | Switched terminal |
| NO1 | See wiring below | Normally open | Open when relay OFF |
| COM2 | Not used | Channel 2 | For future expansion |

**Detailed Relay Wiring:**

```
Relay Module
├─ GND ──→ Ground breadboard rail
├─ VCC ──→ 5V breadboard rail
│
├─ IN1 ──→ ESP32-CAM GPIO 14  [Pump control input]
├─ IN2 ──→ GPIO 15 [Not used yet]
│
└─ Switch Contacts (Channel 1):
   ├─ COM1 ──→ [+5V from external PSU] ──→ Pump power input
   ├─ NO1  ──→ Pump red wire
   └─ NC1  ──→ Not used
```

**Pump Circuit (with Relay):**
```
[External 5V PSU]
  │
  ├─ (+) ──→ [Relay COM1 terminal]
  │
  └─ (-) ──→ [GND breadboard] ──→ [Pump black wire] ──→ [Relay NO1]

[Relay NO1] ──→ [Pump red wire (back to +5V through relay)]
```

**Relay Control Logic:**
- GPIO 14 = HIGH: Relay energizes, pump receives power
- GPIO 14 = LOW: Relay de-energizes, pump stops
- Inrush current protection: ESP32 GPIO sinks/sources ~40mA safely

---

### 7. **Water Pump (DC 3-6V Micro)**

| Pump Connection | Source | Notes |
|---|---|---|
| Red wire (+) | Relay normally-open (NO1) contact | Via relay switch |
| Black wire (-) | Ground rail (common with external PSU) | Return path |

**Practical Installation:**

```
[Water Reservoir]
    │
    ├─→ [Intake tube / Suction] ────→ [YF-S401 Flow Sensor Input]
    │
    │   [YF-S401 Sensor]
    │
    └─→ [Output tube] ────→ [Plant pot]

Pump is placed IN the reservoir or with intake tube submerged.
```

**Safety Considerations:**
- Pump max runtime: 20 seconds (enforced in code)
- Water volume target: 100 mL per watering cycle
- Always test pump operation before full deployment
- Priming pump with water before first use recommended

---

## ESP32-CAM Pin Summary

### GPIO Pin Assignment (Safe Allocation)

```
ESP32-CAM-MB PIN MAP
═══════════════════════════════════════════════════════════════

ADC1 Pins (Analog Input – Safe from Camera):
┌─────────────────────────────────────────────┐
│ GPIO 34 (ADC1_CH6) ........... pH Sensor    │
│ GPIO 35 (ADC1_CH7) ........... Moisture     │
│ GPIO 39 (ADC1_CH3) ........... Light (LDR)  │
└─────────────────────────────────────────────┘

Digital GPIO (Available on breadboard headers):
┌─────────────────────────────────────────────┐
│ GPIO 12 (D6) ................. Flow Sensor  │
│ GPIO 13 (D7) ................. DHT22        │
│ GPIO 14 (D8) ................. Relay CH1    │
│ GPIO 15 (D9) ................. Relay CH2    │
└─────────────────────────────────────────────┘

Camera Pins (DO NOT USE):
┌─────────────────────────────────────────────┐
│ GPIO 32, 33 (ADC2) ........... [RESERVED]   │
│ GPIO 0, 2, 4, 5, 16, 17 ...... [RESERVED]   │
│ SPI pins, UART pins .......... [RESERVED]   │
└─────────────────────────────────────────────┘
```

---

## Complete Breadboard Layout (Top View)

```
┌────────────────────────────────────────────────────────────┐
│  POWER RAILS                                               │
│  ═════════════════════════════════════════════════════════ │
│  [+5V]..[+5V]..[+5V]    [GND]..[GND]..[GND]               │
│                                                            │
│  SENSORS (Left side)                                       │
│  ───────────────────────────────────────────────────────── │
│  Moisture ──┐                                              │
│   [VCC]─────┼──→ +5V rail                                 │
│   [GND]─────┼──→ GND rail                                 │
│   [AO]──────┼──→ GPIO 35                                  │
│                                                            │
│  pH ────────┐                                              │
│   [VCC]─────┼──→ +5V rail                                 │
│   [GND]─────┼──→ GND rail                                 │
│   [AO]──────┼──→ GPIO 34                                  │
│                                                            │
│  DHT22 ─────┐                                              │
│   [VCC]─────┼──→ 3.3V rail                                │
│   [DATA]────┼──→ GPIO 13 (+ 10k pull-up to 3.3V)         │
│   [GND]─────┼──→ GND rail                                 │
│                                                            │
│  LDR ───────┐                                              │
│   [VCC]─────┼──→ +5V rail                                 │
│   [GND]─────┼──→ GND rail                                 │
│   [AO]──────┼──→ GPIO 39                                  │
│                                                            │
│  CONTROL (Right side)                                      │
│  ───────────────────────────────────────────────────────── │
│  Flow Sensor ─┐                                            │
│   [5V]────────┼──→ +5V rail                               │
│   [GND]───────┼──→ GND rail                               │
│   [Pulse]─────┼──→ GPIO 12                                │
│                                                            │
│  Relay Module ─┐                                           │
│   [VCC]────────┼──→ +5V rail (5V)                         │
│   [GND]────────┼──→ GND rail                              │
│   [IN1]────────┼──→ GPIO 14                               │
│   [IN2]────────┼──→ GPIO 15                               │
│   [COM1]───────┼──→ External 5V (Pump +)                  │
│   [NO1]────────┼──→ Pump red wire                         │
│                                                            │
└────────────────────────────────────────────────────────────┘

[External PSU: 5V, 2A minimum]
├─ (+) ──→ Relay COM1 terminal
└─ (-) ──→ GND breadboard rail (common with ESP32 GND)
```

---

## Power Considerations

### ESP32-CAM Power Consumption
- **Idle:** ~100 mA
- **Wi-Fi transmit:** ~150-200 mA
- **Camera capture:** ~200-300 mA

### Relay & Pump Power Consumption
- **Relay coil:** ~50 mA @ 5V
- **Pump running:** ~300-500 mA @ 5V (depends on model)

### Recommended Power Supply
- **Minimum:** 5V, 2A
- **Recommended:** 5V, 4A (for headroom, allows future expansion)
- **Type:** Regulated DC power supply or 5V AC adapter with rectifier

### External vs. USB Power
- **USB Port:** Can power ESP32-CAM itself but NOT heavy loads (pump)
- **Breadboard +5V Rail:** Use external PSU for pump + relay (same GND as USB)

---

## Jumper Wire Checklist

| Sensor/Component | Number of Wires | Wire Types | Length |
|---|---|---|---|
| Moisture | 3 | VCC, GND, Analog | 10-15 cm |
| pH | 3 | VCC, GND, Analog | 10-15 cm |
| DHT22 | 3 | VCC, DATA, GND | 15-20 cm |
| LDR | 3 | VCC, GND, Analog | 10-15 cm |
| Flow Sensor | 3 | 5V, Pulse, GND | 20-30 cm |
| Relay | 6 | VCC, GND, IN1, IN2, COM1, NO1 | 15-25 cm |
| Power Rails | 2 | +5V, GND | 30-50 cm (each) |
| **Total** | **≈23** | Mix of M-M | Various |

---

## Testing & Verification

### Pre-Deployment Checklist

Before uploading code, verify all connections:

- [ ] All GND connections united (common ground between ESP32 and external PSU)
- [ ] No 5V accidentally connected to 3.3V-only pins
- [ ] Moisture sensor: Wet reading reads low ADC, dry reads high
- [ ] pH sensor: Connected to correct ADC pin, stable voltage ~2.5V at rest
- [ ] DHT22: Warm hand brings temp reading up, humidity responds
- [ ] LDR: Bright area reads high, dark area reads low (inverted behavior if needed)
- [ ] Flow sensor: No power, pulses at rest (no false triggering)
- [ ] Relay: IN1 (GPIO 14) control actively toggles relay click
- [ ] Pump: Only draws power when relay energized from IN1
- [ ] No short circuits visible (use multimeter across power rails)

### In-Code Testing (Serial Monitor)

After uploading, type the following in Serial Monitor (115200 baud):

```
t   → Sensor self-test (validates all 5 sensors)
s   → Show current sensor readings
r   → Relay test (clicks on/off)
p   → Manual pump ON
q   → Manual pump OFF
w   → Show watering state
c   → Show network status
?   → Help menu
```

---

## Troubleshooting

### Symptom: Moisture sensor always reads 0% or 100%

**Causes:**
- ADC pin not connected
- Wrong GPIO pin used (check config.h)
- VCC/GND swapped

**Fix:** Verify pin in config.h, check jumpers, use multimeter on analog pin.

---

### Symptom: pH sensor reads garbage (< 0 or > 14)

**Causes:**
- Voltage divider unbalanced
- Unstable power supply
- Calibration constants wrong

**Fix:** Measure voltage on AO pin with multimeter (should be 0.5-3.2V), check config.h calibration.

---

### Symptom: DHT22 returns NaN (not a number)

**Causes:**
- Data line not pulled up properly
- Pin conflict with camera
- Sensor powered from wrong voltage

**Fix:** Add 10kΩ pull-up, verify pin GPIO 13 not used by camera, check power.

---

### Symptom: Pump never turns on even with manual control

**Causes:**
- Relay not powered (VCC not on +5V rail)
- IN1 not connected to GPIO 14
- Relay defective
- Pump power supply disconnected

**Fix:** Verify relay VCC & IN1 connections, test relay click by typing 'r' in Serial Monitor.

---

### Symptom: Pump runs continuously / won't stop

**Causes:**
- GPIO 14 stuck HIGH
- Relay contacts welded
- No interrupt on flow sensor (pump never shuts off based on volume)

**Fix:** Check flow sensor GPIO 12 connection, verify pump shutoff timeout (20 sec) triggers, test relay with 'r' command.

---

## Next Steps

1. **Upload Code:**
   - Ensure `secrets.h` is created with Wi-Fi credentials
   - Select partition: "Huge APP (3MB No OTA)"
   - Upload via Arduino IDE or PlatformIO

2. **Open Serial Monitor:**
   - Baud: 115200
   - Watch initialization messages
   - Run 't' command to self-test

3. **Create Blynk Device:**
   - Download Blynk app (iOS/Android)
   - Add new device with template name "SproutSense"
   - Paste auth token into `secrets.h`

4. **Monitor Dashboard:**
   - Check sensor readings in Blynk app
   - Test manual pump control
   - Monitor watering cycles

---

## Safety Reminders

⚠️ **Electrical Safety:**
- Use proper 5V power supply (not random voltage)
- Never connect 12V or higher to ESP32 (fatal)
- Use breadboard caps for power stability
- Keep water away from electronics

⚠️ **Mechanical Safety:**
- Pump only operates while properly submerged in water
- Test with empty pot first before plants
- 20-second pump timeout prevents overflow
- Check for leaks before leaving system unattended

⚠️ **Sensor Maintenance:**
- pH sensor: Rinse in distilled water after each use
- Moisture sensor: Allow to dry between measurements
- DHT22: Keep away from direct water spray
- Flow sensor: Clear any sediment from intake

---

## Additional Resources

- **ESP32-CAM Pinout:** https://github.com/espressif/arduino-esp32/blob/master/variants/esp32/pins_arduino.h
- **DHT Library:** https://github.com/adafruit/DHT-sensor-library
- **Blynk Documentation:** https://docs.blynk.io
- **OpenWeatherMap API:** https://openweathermap.org/api
- **Edge Impulse:** https://edgeimpulse.com

---

**Document Version:** 1.0  
**Last Updated:** March 2, 2026  
**Author:** SproutSense Project Team
