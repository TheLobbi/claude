---
name: home-assistant-architect:ha-sensor
intent: /ha-sensor Command
tags:
  - home-assistant-architect
  - command
  - ha-sensor
inputs: []
risk: medium
cost: medium
description: Configure and manage sensors, presence detection, and monitoring.
---

# /ha-sensor Command

Configure and manage sensors, presence detection, and monitoring.

## Usage

```bash
# Add sensor
/ha-sensor add <type> <location>

# Create group
/ha-sensor group <name> <entities>

# Setup presence
/ha-sensor presence <method>

# Generate analytics
/ha-sensor analytics <sensor>
```

## Arguments

### Sensor Types
- `temperature` - Temperature sensor
- `humidity` - Humidity sensor
- `motion` - Motion/PIR sensor
- `presence` - mmWave presence
- `door` - Door/window contact
- `leak` - Water leak sensor
- `air` - Air quality (CO2, PM2.5)
- `power` - Power monitoring

### Presence Methods
- `motion` - PIR motion sensors
- `mmwave` - mmWave radar
- `ble` - Bluetooth (ESPresense)
- `room` - Room presence
- `combined` - Multi-sensor fusion

## Examples

```bash
# Add temperature sensors
/ha-sensor add temperature living_room,bedroom,kitchen

# Create security sensor group
/ha-sensor group security door.front,door.back,window.*

# Setup room presence with mmWave
/ha-sensor presence mmwave --rooms office,bedroom

# Setup ESPresense tracking
/ha-sensor presence ble --devices phone,watch

# Generate analytics for temperature
/ha-sensor analytics sensor.living_room_temperature

# Add air quality monitoring
/ha-sensor add air living_room --co2 --pm25 --voc
```

## Configuration Options

### Temperature Sensors
- Calibration offset
- Average calculation
- Feels-like temperature

### Presence Detection
- Timeout duration
- Zone configuration
- Multi-sensor fusion
- Away detection

### Security Sensors
- Alert thresholds
- Arming modes
- Notification rules

### Air Quality
- AQI calculation
- Alert thresholds
- Ventilation automation

## Output

Returns:
- Sensor configurations
- Template sensors
- Groups and aggregations
- Automations
- Dashboard cards
- Calibration helpers

## Agent Delegation

This command delegates to:
- `ha-sensor-manager` for sensor setup
- `ha-data-writer` for template sensors
- `ha-automation-architect` for automations
