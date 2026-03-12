# SproutSense Wiring Guide (Current)

This is the only wiring you need for your current project.


Important:
- Blynk is enabled in firmware (cloud dashboard/app control)
- Google Assistant is removed
- Sensor board is standard ESP32 Dev Module (not ESP32-CAM)
- ESP32-CAM is used only for camera/AI module (no sensors connected)
- Static IP is used in firmware, ensure your WiFi router supports this (default: 192.168.1.120)
- Data is sent to backend API (no direct cloud dashboard wiring)
## Blynk Wiring Notes

Blynk is used for cloud dashboard and app control. The ESP32 connects to Blynk via WiFi (no special hardware wiring required for Blynk itself).

Optional (if you want physical Blynk control/status):
- You may connect a button to a free GPIO and configure it in firmware for manual pump control via Blynk.
- You may connect an LED to a free GPIO to indicate Blynk connection status (not required by default firmware).

All Blynk communication is handled in software. No dedicated Blynk hardware wiring is required for the default setup.

---

## 1) Sensor Controller Board (ESP32 Dev Module)

Use this board for:
- soil moisture
- pH
- DHT22
- light (LDR module AO)
- flow sensor
- relay + pump
- TFT ST7735R display

### Power Rules
- ESP32: USB 5V
- Sensors: 3.3V or 5V as required
- Relay + pump: external 5V supply recommended
- All grounds must be common

---


## 2) Pin Mapping (ESP32 Sensor Controller)

### Sensors (Analog/Other)
- **GPIO 35** (`PIN_SOIL_MOISTURE`): Soil Moisture AO
- **GPIO 34** (`PIN_PH_SENSOR`): pH Sensor AO
- **GPIO 39** (`PIN_LDR`): LDR AO
- **GPIO 13** (`PIN_DHT`): DHT22 DATA
- **GPIO 12** (`PIN_FLOW_SENSOR`): Flow sensor pulse (YF-S401 yellow)

### Relay + Pump
- **GPIO 14** (`PIN_RELAY`): Relay IN1 (pump control)

### TFT ST7735R (SPI, 128x160)
- **GPIO 5** (`PIN_TFT_CS`): TFT CS
- **GPIO 4** (`PIN_TFT_RST`): TFT RST
- **GPIO 27** (`PIN_TFT_DC`): TFT DC (A0)
- **GPIO 23**: TFT MOSI (hardware SPI)
- **GPIO 18**: TFT SCLK (hardware SPI)
- **3.3V**: TFT VCC
- **GND**: TFT GND

---


## 3) Relay and Pump Wiring (Safe)

Relay logic side:
- Relay VCC -> 5V
- Relay GND -> GND
- Relay IN1 -> GPIO 14 (PIN_RELAY)

Pump power side:
- PSU +5V -> Relay COM
- Relay NO -> Pump + (red)
- Pump - (black) -> PSU GND
- PSU GND -> ESP32 GND (common ground)

Why NO contact:
- Pump remains OFF by default when relay is idle (recommended for safety).

---

## 4) DHT22 Wiring

- DHT22 VCC -> 3.3V
- DHT22 DATA -> GPIO 13
- DHT22 GND -> GND
- Optional: 10k pull-up from DATA to 3.3V

---

## 5) Flow Sensor YF-S401

- Red -> 5V
- Black -> GND
- Yellow -> GPIO 12

Mount direction as arrow on sensor body.

---

## 6) ESP32-CAM (AI Module) Wiring

Use ESP32-CAM only for image capture / disease inference.
Do not connect sensor controller analog sensors to ESP32-CAM.

Typical:
- 5V -> ESP32-CAM 5V
- GND -> ESP32-CAM GND
- UART (for flashing) via USB-TTL/FTDI

---

## 7) Quick Pre-Power Checklist

- Common GND connected across ESP32, relay PSU, sensors, TFT
- Pump powered from external 5V (not directly from ESP32 3.3V)
- TFT uses 3.3V logic
- Sensor AO lines are on ADC1 pins (34,35,39)
- No Blynk pins or Blynk dependencies in wiring

---


## 8) Software Match Check

Firmware file:
- `esp32-upload/ESP32-SENSOR/ESP32-SENSOR.ino`

Pin defines in firmware:
- `PIN_SOIL_MOISTURE` = 35
- `PIN_PH_SENSOR` = 34
- `PIN_LDR` = 39
- `PIN_DHT` = 13
- `PIN_FLOW_SENSOR` = 12
- `PIN_RELAY` = 14
- `PIN_TFT_CS` = 5
- `PIN_TFT_RST` = 4
- `PIN_TFT_DC` = 27

Other notes:
- Blynk is enabled in firmware; all communication is via WiFi (no special Blynk hardware required)
- Static IP is set in code: 192.168.1.120 (change in .ino if needed)
- Backend API URL is set in code (no hardware change needed)

---

If boot fails after TFT connection:
- Check CS/DC/RST wiring first
- Ensure TFT VCC is 3.3V
- Keep GPIO 0, 2, 15 boot constraints in mind when flashing


