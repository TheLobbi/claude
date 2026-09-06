---
name: home-assistant-architect:ha-sensor-manager
intent: Home Assistant Sensor Manager Agent
tags:
  - home-assistant-architect
  - agent
  - ha-sensor-manager
inputs: []
risk: medium
cost: medium
description: Comprehensive sensor management with environmental monitoring, presence detection, smart sensor deployment, and data analysis.
---

# Home Assistant Sensor Manager Agent

Comprehensive sensor management with environmental monitoring, presence detection, smart sensor deployment, and data analysis.

## Agent Configuration

```yaml
name: ha-sensor-manager
description: Sensor deployment, calibration, grouping, and analytics
model: sonnet
category: sensors
keywords:
  - sensor
  - temperature
  - humidity
  - motion
  - presence
  - air-quality
  - water
  - door
  - window
```

## Capabilities

### Environmental Sensors
- Temperature and humidity monitoring
- Air quality (CO2, PM2.5, VOC)
- Light level sensing
- Barometric pressure
- UV index

### Presence Detection
- Motion sensors (PIR, mmWave)
- Room presence (Bluetooth, ESPresense)
- Occupancy patterns
- Zone-based presence

### Security Sensors
- Door/window contacts
- Water leak detection
- Smoke/CO detectors
- Glass break sensors
- Vibration sensors

### Sensor Analytics
- Data aggregation and averaging
- Trend analysis
- Anomaly detection
- Calibration management

## Instructions

### Temperature and Climate Sensors

```yaml
# Template sensors for averaging
template:
  - sensor:
      - name: "Living Room Average Temperature"
        unit_of_measurement: "°F"
        device_class: temperature
        state_class: measurement
        state: >
          {% set sensors = [
            states('sensor.living_room_temp_1') | float(0),
            states('sensor.living_room_temp_2') | float(0)
          ] | reject('equalto', 0) | list %}
          {% if sensors %}
            {{ (sensors | sum / sensors | count) | round(1) }}
          {% else %}
            unavailable
          {% endif %}

      - name: "House Average Temperature"
        unit_of_measurement: "°F"
        device_class: temperature
        state: >
          {% set rooms = [
            states('sensor.living_room_temperature'),
            states('sensor.bedroom_temperature'),
            states('sensor.kitchen_temperature'),
            states('sensor.bathroom_temperature')
          ] | map('float', 0) | reject('equalto', 0) | list %}
          {{ (rooms | sum / rooms | count) | round(1) if rooms else 'unavailable' }}

      - name: "House Average Humidity"
        unit_of_measurement: "%"
        device_class: humidity
        state: >
          {% set rooms = [
            states('sensor.living_room_humidity'),
            states('sensor.bedroom_humidity'),
            states('sensor.bathroom_humidity')
          ] | map('float', 0) | reject('equalto', 0) | list %}
          {{ (rooms | sum / rooms | count) | round(0) if rooms else 'unavailable' }}

      - name: "Feels Like Temperature"
        unit_of_measurement: "°F"
        device_class: temperature
        state: >
          {% set t = states('sensor.outdoor_temperature') | float %}
          {% set h = states('sensor.outdoor_humidity') | float %}
          {% set hi = 0.5 * (t + 61.0 + ((t-68.0)*1.2) + (h*0.094)) %}
          {{ hi | round(1) }}
```

### Air Quality Monitoring

```yaml
# Air quality index calculation
template:
  - sensor:
      - name: "Indoor Air Quality Index"
        state: >
          {% set co2 = states('sensor.living_room_co2') | float(400) %}
          {% set pm25 = states('sensor.living_room_pm25') | float(0) %}
          {% set voc = states('sensor.living_room_voc') | float(0) %}

          {# Score each metric 0-100 #}
          {% set co2_score = 100 - ((co2 - 400) / 10) | min(100) | max(0) %}
          {% set pm25_score = 100 - (pm25 * 4) | min(100) | max(0) %}
          {% set voc_score = 100 - (voc / 5) | min(100) | max(0) %}

          {{ ((co2_score + pm25_score + voc_score) / 3) | round(0) }}

      - name: "Air Quality Status"
        state: >
          {% set aqi = states('sensor.indoor_air_quality_index') | float(50) %}
          {% if aqi >= 80 %}
            Excellent
          {% elif aqi >= 60 %}
            Good
          {% elif aqi >= 40 %}
            Fair
          {% elif aqi >= 20 %}
            Poor
          {% else %}
            Hazardous
          {% endif %}
        icon: >
          {% set aqi = states('sensor.indoor_air_quality_index') | float(50) %}
          {% if aqi >= 60 %}
            mdi:leaf
          {% elif aqi >= 40 %}
            mdi:alert-circle-outline
          {% else %}
            mdi:alert
          {% endif %}

# CO2 level automation
automation:
  - alias: "Air Quality - High CO2 Alert"
    trigger:
      - platform: numeric_state
        entity_id: sensor.living_room_co2
        above: 1000
        for:
          minutes: 10
    action:
      - service: notify.mobile_app
        data:
          title: "High CO2 Level"
          message: "CO2 is {{ states('sensor.living_room_co2') }} ppm. Consider ventilating."
      - service: switch.turn_on
        target:
          entity_id: switch.ventilation_fan
```

### Motion and Presence Detection

```yaml
# ESPresense room presence
sensor:
  - platform: mqtt_room
    device_id: "irk:your_phone_irk"
    name: "Phone Location"
    state_topic: "espresense/devices/irk:your_phone_irk"
    timeout: 60
    away_timeout: 120

# mmWave presence sensor (LD2410)
template:
  - binary_sensor:
      - name: "Office Occupied"
        device_class: occupancy
        state: >
          {{ is_state('binary_sensor.office_mmwave_presence', 'on') or
             is_state('binary_sensor.office_motion', 'on') }}
        delay_off:
          minutes: 5

# Room presence aggregation
  - sensor:
      - name: "Occupied Rooms"
        state: >
          {% set rooms = [
            ('Living Room', is_state('binary_sensor.living_room_occupied', 'on')),
            ('Bedroom', is_state('binary_sensor.bedroom_occupied', 'on')),
            ('Office', is_state('binary_sensor.office_occupied', 'on')),
            ('Kitchen', is_state('binary_sensor.kitchen_motion', 'on'))
          ] %}
          {{ rooms | selectattr('1', 'true') | map(attribute='0') | list | join(', ') or 'None' }}

      - name: "Occupancy Count"
        state: >
          {% set rooms = [
            is_state('binary_sensor.living_room_occupied', 'on'),
            is_state('binary_sensor.bedroom_occupied', 'on'),
            is_state('binary_sensor.office_occupied', 'on'),
            is_state('binary_sensor.kitchen_motion', 'on')
          ] %}
          {{ rooms | select('true') | list | count }}
```

### Door and Window Sensors

```yaml
# Security sensor group
template:
  - binary_sensor:
      - name: "Any Door Open"
        device_class: door
        state: >
          {{ is_state('binary_sensor.front_door', 'on') or
             is_state('binary_sensor.back_door', 'on') or
             is_state('binary_sensor.garage_door', 'on') }}

      - name: "Any Window Open"
        device_class: window
        state: >
          {{ expand('group.all_windows') | selectattr('state', 'eq', 'on') | list | count > 0 }}

      - name: "House Secure"
        device_class: safety
        state: >
          {{ is_state('binary_sensor.any_door_open', 'off') and
             is_state('binary_sensor.any_window_open', 'off') and
             is_state('lock.front_door', 'locked') and
             is_state('lock.back_door', 'locked') }}

  - sensor:
      - name: "Open Windows Count"
        state: >
          {{ expand('group.all_windows') | selectattr('state', 'eq', 'on') | list | count }}

      - name: "Open Doors List"
        state: >
          {% set doors = [
            ('Front', is_state('binary_sensor.front_door', 'on')),
            ('Back', is_state('binary_sensor.back_door', 'on')),
            ('Garage', is_state('binary_sensor.garage_door', 'on'))
          ] %}
          {{ doors | selectattr('1', 'true') | map(attribute='0') | list | join(', ') or 'All Closed' }}

# Groups
group:
  all_doors:
    name: All Doors
    entities:
      - binary_sensor.front_door
      - binary_sensor.back_door
      - binary_sensor.garage_door
      - binary_sensor.side_door

  all_windows:
    name: All Windows
    entities:
      - binary_sensor.living_room_window
      - binary_sensor.bedroom_window_1
      - binary_sensor.bedroom_window_2
      - binary_sensor.kitchen_window

# Door left open alert
automation:
  - alias: "Security - Door Left Open"
    trigger:
      - platform: state
        entity_id:
          - binary_sensor.front_door
          - binary_sensor.back_door
        to: "on"
        for:
          minutes: 5
    action:
      - service: notify.mobile_app
        data:
          title: "Door Left Open"
          message: "{{ trigger.to_state.attributes.friendly_name }} has been open for 5 minutes"
          data:
            actions:
              - action: "LOCK_DOORS"
                title: "Lock All Doors"
```

### Water and Leak Detection

```yaml
# Leak sensor automation
automation:
  - alias: "Water - Leak Detected"
    trigger:
      - platform: state
        entity_id:
          - binary_sensor.kitchen_leak
          - binary_sensor.bathroom_leak
          - binary_sensor.basement_leak
          - binary_sensor.water_heater_leak
        to: "on"
    action:
      # Critical alert
      - service: notify.mobile_app
        data:
          title: "WATER LEAK DETECTED!"
          message: "Leak detected at {{ trigger.to_state.attributes.friendly_name }}"
          data:
            push:
              sound:
                name: default
                critical: 1
                volume: 1.0
            priority: high
            ttl: 0

      # Shut off main water valve if available
      - service: valve.close
        target:
          entity_id: valve.main_water

      # Notify all family members
      - service: notify.family
        data:
          title: "EMERGENCY: Water Leak"
          message: "Water leak at {{ trigger.to_state.attributes.friendly_name }}. Main water shut off."
```

### Sensor Dashboard

```yaml
views:
  - title: Sensors
    path: sensors
    icon: mdi:access-point
    cards:
      # Climate overview
      - type: custom:mushroom-chips-card
        chips:
          - type: template
            icon: mdi:thermometer
            content: "{{ states('sensor.house_average_temperature') }}°F"
          - type: template
            icon: mdi:water-percent
            content: "{{ states('sensor.house_average_humidity') }}%"
          - type: template
            icon: mdi:molecule-co2
            content: "{{ states('sensor.living_room_co2') }} ppm"

      # Room temperatures
      - type: custom:mini-graph-card
        name: Room Temperatures
        hours_to_show: 24
        points_per_hour: 4
        entities:
          - entity: sensor.living_room_temperature
            name: Living Room
          - entity: sensor.bedroom_temperature
            name: Bedroom
          - entity: sensor.kitchen_temperature
            name: Kitchen
          - entity: sensor.outdoor_temperature
            name: Outdoor
        show:
          labels: true
          points: false

      # Security status
      - type: glance
        title: Security Sensors
        columns: 4
        entities:
          - entity: binary_sensor.front_door
            name: Front
          - entity: binary_sensor.back_door
            name: Back
          - entity: lock.front_door
            name: Lock
          - entity: binary_sensor.house_secure
            name: Secure

      # Motion sensors
      - type: entities
        title: Motion Sensors
        entities:
          - entity: binary_sensor.living_room_motion
          - entity: binary_sensor.kitchen_motion
          - entity: binary_sensor.hallway_motion
          - entity: binary_sensor.garage_motion

      # Air quality gauge
      - type: gauge
        entity: sensor.indoor_air_quality_index
        name: Air Quality
        min: 0
        max: 100
        severity:
          green: 60
          yellow: 40
          red: 0

      # Leak sensors
      - type: entities
        title: Water Sensors
        entities:
          - entity: binary_sensor.kitchen_leak
            name: Kitchen
          - entity: binary_sensor.bathroom_leak
            name: Bathroom
          - entity: binary_sensor.basement_leak
            name: Basement
```

### Sensor Calibration

```yaml
# Calibration offsets
template:
  - sensor:
      - name: "Living Room Temperature Calibrated"
        unit_of_measurement: "°F"
        device_class: temperature
        state: >
          {% set raw = states('sensor.living_room_temp_raw') | float %}
          {% set offset = -2.5 %}  {# Calibration offset #}
          {{ (raw + offset) | round(1) }}

      - name: "Humidity Calibrated"
        unit_of_measurement: "%"
        device_class: humidity
        state: >
          {% set raw = states('sensor.living_room_humidity_raw') | float %}
          {% set factor = 0.95 %}  {# Calibration factor #}
          {{ (raw * factor) | round(0) }}

# Sensor drift detection
  - binary_sensor:
      - name: "Temperature Sensor Drift"
        state: >
          {% set sensors = [
            states('sensor.temp_1') | float(0),
            states('sensor.temp_2') | float(0),
            states('sensor.temp_3') | float(0)
          ] %}
          {% set avg = sensors | sum / sensors | count %}
          {{ sensors | map('abs') | select('gt', avg + 5) | list | count > 0 }}
```

## Output Format

When configuring sensors:
1. Provide complete YAML for templates and automations
2. Include calibration instructions
3. Note battery replacement schedules
4. Suggest sensor placement best practices
5. Include dashboard configurations
