---
name: energy-management
description: "Home Assistant energy monitoring and optimization patterns."
---

# Energy Management Skill

Home Assistant energy monitoring and optimization patterns.

## Activation Triggers

- Working with energy dashboard
- Solar/battery integration
- EV charger configuration
- Utility rate management
- Power monitoring

## Core Patterns

### Energy Dashboard Configuration

```yaml
# configuration.yaml
energy:

# The Energy dashboard is configured via UI
# Settings > Dashboards > Energy
```

### Power Monitoring Sensors

```yaml
# Whole home power
sensor:
  - platform: template
    sensors:
      home_power:
        friendly_name: "Home Power"
        unit_of_measurement: "W"
        device_class: power
        value_template: >
          {{ states('sensor.main_meter_power') | float(0) }}

      home_energy_daily:
        friendly_name: "Daily Energy"
        unit_of_measurement: "kWh"
        device_class: energy
        value_template: >
          {{ states('sensor.main_meter_energy') | float(0) }}
```

### Solar Integration

```yaml
# Solar production template
template:
  - sensor:
      - name: "Solar Power"
        unit_of_measurement: "W"
        device_class: power
        state_class: measurement
        state: "{{ states('sensor.inverter_power') | float(0) }}"

      - name: "Solar Energy Today"
        unit_of_measurement: "kWh"
        device_class: energy
        state_class: total_increasing
        state: "{{ states('sensor.inverter_energy_today') | float(0) }}"

      - name: "Solar Self Consumption"
        unit_of_measurement: "kWh"
        state: >
          {% set solar = states('sensor.solar_energy_today') | float(0) %}
          {% set export = states('sensor.grid_export_daily') | float(0) %}
          {{ (solar - export) | round(2) }}
```

### Battery Management

```yaml
template:
  - sensor:
      - name: "Battery Mode"
        state: >
          {% set power = states('sensor.battery_power') | float(0) %}
          {% if power > 100 %}
            Charging
          {% elif power < -100 %}
            Discharging
          {% else %}
            Idle
          {% endif %}

      - name: "Battery Runtime"
        unit_of_measurement: "hours"
        state: >
          {% set soc = states('sensor.battery_soc') | float(0) %}
          {% set capacity = 13.5 %}
          {% set load = states('sensor.home_power') | float(1000) / 1000 %}
          {{ ((soc / 100) * capacity / load) | round(1) }}
```

### Time-of-Use Rates

```yaml
# Rate input helpers
input_number:
  electricity_rate_peak:
    name: Peak Rate
    min: 0
    max: 1
    step: 0.01
    unit_of_measurement: "$/kWh"
    initial: 0.35

  electricity_rate_offpeak:
    name: Off-Peak Rate
    min: 0
    max: 1
    step: 0.01
    unit_of_measurement: "$/kWh"
    initial: 0.12

# Binary sensor for rate period
binary_sensor:
  - platform: tod
    name: Peak Rate Period
    after: "16:00"
    before: "21:00"

# Cost calculation
template:
  - sensor:
      - name: "Current Rate"
        unit_of_measurement: "$/kWh"
        state: >
          {% if is_state('binary_sensor.peak_rate_period', 'on') %}
            {{ states('input_number.electricity_rate_peak') }}
          {% else %}
            {{ states('input_number.electricity_rate_offpeak') }}
          {% endif %}

      - name: "Daily Cost"
        unit_of_measurement: "$"
        state: >
          {% set import = states('sensor.grid_import_daily') | float(0) %}
          {% set export = states('sensor.grid_export_daily') | float(0) %}
          {% set rate = states('sensor.current_rate') | float(0.25) %}
          {{ ((import * rate) - (export * rate * 0.8)) | round(2) }}
```

### EV Charging

```yaml
# Smart EV charging automation
automation:
  - alias: "EV - Solar Surplus Charging"
    trigger:
      - platform: numeric_state
        entity_id: sensor.grid_export
        above: 2000
        for: "00:05:00"
    condition:
      - condition: state
        entity_id: binary_sensor.ev_connected
        state: "on"
    action:
      - service: switch.turn_on
        entity_id: switch.ev_charger
      - service: number.set_value
        target:
          entity_id: number.ev_charge_current
        data:
          value: >
            {{ (states('sensor.grid_export') | float / 240) | round | min(32) }}
```

## Energy Dashboard Cards

### Power Flow
```yaml
type: custom:power-flow-card-plus
entities:
  battery:
    entity: sensor.battery_power
    state_of_charge: sensor.battery_soc
  grid:
    entity: sensor.grid_power
  home:
    entity: sensor.home_power
  solar:
    entity: sensor.solar_power
```

### Cost Tracking
```yaml
type: entities
title: Energy Costs
entities:
  - entity: sensor.daily_cost
    name: Today
  - entity: sensor.monthly_cost
    name: This Month
  - entity: sensor.solar_savings
    name: Solar Savings
```

## Hardware Recommendations

| Device | Purpose | Protocol |
|--------|---------|----------|
| Emporia Vue | Whole home | WiFi |
| Shelly EM | Circuit monitor | WiFi |
| IoTaWatt | Multi-circuit | WiFi |
| Sense | AI detection | WiFi |
| Coral TPU | Object detection | USB |
