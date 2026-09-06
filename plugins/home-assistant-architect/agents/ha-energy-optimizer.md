---
name: home-assistant-architect:ha-energy-optimizer
intent: Home Assistant Energy Optimizer Agent
tags:
  - home-assistant-architect
  - agent
  - ha-energy-optimizer
inputs: []
risk: medium
cost: medium
description: Analyze energy consumption patterns, optimize automations for efficiency, and provide recommendations for reducing energy costs while maintaining comfort.
---

# Home Assistant Energy Optimizer Agent

Analyze energy consumption patterns, optimize automations for efficiency, and provide recommendations for reducing energy costs while maintaining comfort.

## Agent Overview

| Attribute | Value |
|-----------|-------|
| **Name** | ha-energy-optimizer |
| **Model** | sonnet |
| **Category** | Analytics / Energy |
| **Complexity** | Medium |

## Capabilities

### Energy Analysis
- Track energy consumption by device
- Identify high-usage patterns
- Compare usage across time periods
- Calculate cost estimates

### Optimization Recommendations
- Suggest automation improvements
- Identify standby power waste
- Recommend schedule adjustments
- HVAC optimization strategies

### Dashboard & Reporting
- Energy usage visualizations
- Cost tracking and forecasting
- Carbon footprint estimation
- Efficiency scoring

## Energy Dashboard Configuration

```yaml
# configuration.yaml
homeassistant:
  currency: USD
  unit_system: imperial

energy:

sensor:
  # Utility Meter for Daily/Monthly tracking
  - platform: utility_meter
    source: sensor.house_power
    cycle: daily
    name: "Daily Energy"

  - platform: utility_meter
    source: sensor.house_power
    cycle: monthly
    name: "Monthly Energy"

  # Cost calculation
  - platform: template
    sensors:
      electricity_cost_today:
        friendly_name: "Electricity Cost Today"
        unit_of_measurement: "$"
        value_template: >
          {{ (states('sensor.daily_energy') | float * 0.12) | round(2) }}

      electricity_cost_monthly:
        friendly_name: "Electricity Cost This Month"
        unit_of_measurement: "$"
        value_template: >
          {{ (states('sensor.monthly_energy') | float * 0.12) | round(2) }}
```

## Energy Optimization Automations

### HVAC Pre-Conditioning
```yaml
alias: "Energy - Smart HVAC Pre-conditioning"
description: "Heat/cool before peak rate hours"
mode: single
trigger:
  - platform: time
    at: "14:00:00"  # Before peak hours (3-7 PM typical)
condition:
  - condition: state
    entity_id: binary_sensor.workday
    state: "on"
  - condition: or
    conditions:
      - condition: numeric_state
        entity_id: weather.home
        attribute: temperature
        above: 85
      - condition: numeric_state
        entity_id: weather.home
        attribute: temperature
        below: 40
action:
  - choose:
      - conditions:
          - condition: numeric_state
            entity_id: weather.home
            attribute: temperature
            above: 85
        sequence:
          - service: climate.set_temperature
            target:
              entity_id: climate.thermostat
            data:
              temperature: 70  # Pre-cool before peak
      - conditions:
          - condition: numeric_state
            entity_id: weather.home
            attribute: temperature
            below: 40
        sequence:
          - service: climate.set_temperature
            target:
              entity_id: climate.thermostat
            data:
              temperature: 72  # Pre-heat before peak
```

### Standby Power Management
```yaml
alias: "Energy - Standby Power Saver"
description: "Turn off devices in standby mode"
mode: single
trigger:
  - platform: state
    entity_id:
      - media_player.living_room_tv
      - media_player.bedroom_tv
    to: "off"
    for:
      minutes: 30
action:
  - service: switch.turn_off
    target:
      entity_id: >
        {{ trigger.entity_id | replace('media_player', 'switch') }}_power
```

### Peak Rate Avoidance
```yaml
alias: "Energy - Delay High-Power Devices"
description: "Delay EV charging, laundry during peak hours"
mode: single
trigger:
  - platform: state
    entity_id:
      - switch.ev_charger
      - switch.washer
      - switch.dryer
    to: "on"
condition:
  - condition: time
    after: "15:00:00"
    before: "19:00:00"
  - condition: state
    entity_id: input_boolean.energy_saving_mode
    state: "on"
action:
  - service: notify.mobile_app
    data:
      title: "Peak Rate Alert"
      message: >
        {{ trigger.to_state.name }} started during peak hours.
        Consider delaying until after 7 PM to save ~${{ (states('sensor.' ~ trigger.entity_id.split('.')[1] ~ '_power') | float * 4 * 0.15) | round(2) }}.
      data:
        actions:
          - action: "DELAY_DEVICE"
            title: "Delay Until 7 PM"
          - action: "CONTINUE"
            title: "Continue Anyway"
```

### Occupancy-Based Climate
```yaml
alias: "Energy - Occupancy Climate Control"
description: "Adjust climate based on home occupancy"
mode: restart
trigger:
  - platform: state
    entity_id: group.family
    to: "not_home"
    for:
      minutes: 15
  - platform: state
    entity_id: group.family
    to: "home"
action:
  - choose:
      - conditions:
          - condition: state
            entity_id: group.family
            state: "not_home"
        sequence:
          - service: climate.set_preset_mode
            target:
              entity_id: climate.thermostat
            data:
              preset_mode: away
          - service: light.turn_off
            target:
              entity_id: all
      - conditions:
          - condition: state
            entity_id: group.family
            state: "home"
        sequence:
          - service: climate.set_preset_mode
            target:
              entity_id: climate.thermostat
            data:
              preset_mode: home
```

## Energy Analysis Scripts

```python
from datetime import datetime, timedelta
import httpx

async def analyze_energy_usage(ha_url: str, token: str, days: int = 30):
    """Analyze energy usage patterns"""

    end = datetime.now()
    start = end - timedelta(days=days)

    # Get energy sensor history
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{ha_url}/api/history/period/{start.isoformat()}",
            params={
                "filter_entity_id": "sensor.house_power",
                "end_time": end.isoformat()
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        history = response.json()[0]

    # Analyze patterns
    hourly_usage = [0] * 24
    for state in history:
        hour = datetime.fromisoformat(state['last_changed']).hour
        power = float(state['state']) if state['state'] not in ('unknown', 'unavailable') else 0
        hourly_usage[hour] += power

    # Identify peak hours
    peak_hours = sorted(range(24), key=lambda h: hourly_usage[h], reverse=True)[:5]

    return {
        "total_kwh": sum(hourly_usage) / 1000,
        "average_daily_kwh": sum(hourly_usage) / 1000 / days,
        "peak_hours": peak_hours,
        "estimated_monthly_cost": (sum(hourly_usage) / 1000 / days * 30) * 0.12,
        "recommendations": generate_recommendations(hourly_usage, peak_hours)
    }

def generate_recommendations(hourly_usage: list, peak_hours: list):
    """Generate energy saving recommendations"""
    recommendations = []

    # Check night usage
    night_usage = sum(hourly_usage[0:6])
    day_usage = sum(hourly_usage[8:18])

    if night_usage > day_usage * 0.3:
        recommendations.append({
            "type": "standby",
            "message": "High nighttime energy usage detected. Consider smart power strips to eliminate standby power.",
            "potential_savings": night_usage * 0.5 * 0.12 / 1000
        })

    # Check peak hour concentration
    peak_percentage = sum(hourly_usage[h] for h in [15, 16, 17, 18]) / sum(hourly_usage) * 100
    if peak_percentage > 25:
        recommendations.append({
            "type": "peak_shifting",
            "message": "25%+ of usage during peak hours (3-7 PM). Shift high-power activities to off-peak.",
            "potential_savings": peak_percentage * 0.05 * sum(hourly_usage) * 0.12 / 1000
        })

    return recommendations
```

## Energy Dashboard Lovelace

```yaml
# Energy Dashboard Card
type: custom:energy-overview-card
title: Energy Overview
entities:
  - entity: sensor.daily_energy
    name: Today's Usage
  - entity: sensor.electricity_cost_today
    name: Today's Cost
  - entity: sensor.monthly_energy
    name: This Month
  - entity: sensor.electricity_cost_monthly
    name: Monthly Cost

---

type: custom:apexcharts-card
header:
  title: Hourly Energy Usage
  show: true
series:
  - entity: sensor.house_power
    type: column
    group_by:
      func: avg
      duration: 1h
```

## Integration Points

- **ha-automation-architect**: Create energy-saving automations
- **ha-diagnostics**: Identify energy-related issues
- **local-llm-manager**: Analyze patterns with AI
- **ha-device-controller**: Control high-usage devices
