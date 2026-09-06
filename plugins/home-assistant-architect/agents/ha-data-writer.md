---
name: home-assistant-architect:ha-data-writer
intent: Home Assistant Data Writer Agent
tags:
  - home-assistant-architect
  - agent
  - ha-data-writer
inputs: []
risk: medium
cost: medium
description: Write, update, and manage data in Home Assistant including entity states, input helpers, databases, and configuration files.
---

# Home Assistant Data Writer Agent

Write, update, and manage data in Home Assistant including entity states, input helpers, databases, and configuration files.

## Agent Configuration

```yaml
name: ha-data-writer
description: Write and manage Home Assistant data, states, and configurations
model: sonnet
category: backend
keywords:
  - data
  - state
  - database
  - recorder
  - input
  - helpers
  - configuration
```

## Capabilities

### Entity State Management
- Create and update entity states via REST API
- Manage input helpers (boolean, number, text, select, datetime)
- Create template sensors and binary sensors
- Batch state updates

### Database Operations
- Query recorder database
- Configure long-term statistics
- Manage history retention
- Export historical data

### Configuration Writing
- Generate YAML configuration files
- Create automation packages
- Manage secrets.yaml
- Update customize.yaml

### File Management
- Write to www folder for static assets
- Manage custom_components
- Handle backup operations

## Instructions

### State Updates via REST API

```python
# Python example for state updates
import requests

HA_URL = "http://homeassistant.local:8123"
HA_TOKEN = "your-long-lived-token"

headers = {
    "Authorization": f"Bearer {HA_TOKEN}",
    "Content-Type": "application/json"
}

# Set entity state
def set_state(entity_id, state, attributes=None):
    url = f"{HA_URL}/api/states/{entity_id}"
    data = {
        "state": state,
        "attributes": attributes or {}
    }
    response = requests.post(url, json=data, headers=headers)
    return response.json()

# Example: Update a sensor
set_state(
    "sensor.custom_temperature",
    "72.5",
    {"unit_of_measurement": "°F", "friendly_name": "Custom Temp"}
)
```

### Input Helpers Configuration

```yaml
# configuration.yaml or separate input files

# Input Boolean (toggle)
input_boolean:
  vacation_mode:
    name: Vacation Mode
    icon: mdi:airplane

  guest_mode:
    name: Guest Mode
    icon: mdi:account-group

# Input Number (slider/box)
input_number:
  target_temperature:
    name: Target Temperature
    min: 60
    max: 80
    step: 1
    unit_of_measurement: "°F"
    icon: mdi:thermometer

  brightness_level:
    name: Brightness Level
    min: 0
    max: 100
    step: 5
    mode: slider

# Input Text
input_text:
  alarm_code:
    name: Alarm Code
    min: 4
    max: 6
    mode: password

  custom_message:
    name: Custom Message
    max: 255

# Input Select (dropdown)
input_select:
  house_mode:
    name: House Mode
    options:
      - Home
      - Away
      - Night
      - Vacation
    icon: mdi:home-variant

# Input Datetime
input_datetime:
  morning_alarm:
    name: Morning Alarm
    has_time: true
    has_date: false

  vacation_start:
    name: Vacation Start
    has_time: true
    has_date: true
```

### Template Sensors

```yaml
# Template sensor examples
template:
  - sensor:
      - name: "Average Temperature"
        unit_of_measurement: "°F"
        state: >
          {% set temps = [
            states('sensor.living_room_temp') | float(0),
            states('sensor.bedroom_temp') | float(0),
            states('sensor.kitchen_temp') | float(0)
          ] %}
          {{ (temps | sum / temps | count) | round(1) }}
        availability: >
          {{ states('sensor.living_room_temp') not in ['unknown', 'unavailable'] }}

      - name: "Power Cost Today"
        unit_of_measurement: "$"
        state: >
          {{ (states('sensor.daily_energy') | float(0) * 0.12) | round(2) }}
        icon: mdi:currency-usd

  - binary_sensor:
      - name: "Anyone Home"
        state: >
          {{ is_state('person.owner', 'home') or
             is_state('person.spouse', 'home') }}
        device_class: presence

      - name: "High Energy Usage"
        state: >
          {{ states('sensor.power_consumption') | float(0) > 3000 }}
        device_class: power
        delay_on:
          minutes: 5
```

### Database Queries

```python
# Query recorder database directly
import sqlite3
from datetime import datetime, timedelta

def query_history(db_path, entity_id, hours=24):
    """Query state history from recorder database."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    start_time = datetime.utcnow() - timedelta(hours=hours)

    query = """
    SELECT state, last_changed
    FROM states
    INNER JOIN states_meta ON states.metadata_id = states_meta.metadata_id
    WHERE states_meta.entity_id = ?
    AND last_changed > ?
    ORDER BY last_changed DESC
    """

    cursor.execute(query, (entity_id, start_time.isoformat()))
    results = cursor.fetchall()
    conn.close()

    return results

# Query statistics for long-term data
def query_statistics(db_path, statistic_id, days=30):
    """Query long-term statistics."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    start_time = datetime.utcnow() - timedelta(days=days)

    query = """
    SELECT start_ts, mean, min, max, sum
    FROM statistics
    INNER JOIN statistics_meta ON statistics.metadata_id = statistics_meta.id
    WHERE statistics_meta.statistic_id = ?
    AND start_ts > ?
    ORDER BY start_ts DESC
    """

    cursor.execute(query, (statistic_id, start_time.timestamp()))
    results = cursor.fetchall()
    conn.close()

    return results
```

### Recorder Configuration

```yaml
# configuration.yaml
recorder:
  db_url: mysql://user:password@localhost/homeassistant
  purge_keep_days: 10
  commit_interval: 1

  # Exclude noisy entities
  exclude:
    domains:
      - automation
      - script
    entity_globs:
      - sensor.sun_*
    entities:
      - sensor.last_boot
      - sensor.date

  # Include specific entities
  include:
    domains:
      - sensor
      - binary_sensor
      - climate
    entities:
      - automation.important_automation
```

### Configuration Packages

```yaml
# packages/climate_package.yaml
# Organize related configuration together

climate_package:
  # Input helpers
  input_number:
    target_temp_home:
      name: Home Temperature
      min: 65
      max: 78
      step: 1
      unit_of_measurement: "°F"

    target_temp_away:
      name: Away Temperature
      min: 60
      max: 72
      step: 1
      unit_of_measurement: "°F"

  # Template sensors
  template:
    - sensor:
        - name: "Current Target Temp"
          state: >
            {% if is_state('input_select.house_mode', 'Home') %}
              {{ states('input_number.target_temp_home') }}
            {% else %}
              {{ states('input_number.target_temp_away') }}
            {% endif %}

  # Automations
  automation:
    - alias: "Climate - Apply Target Temperature"
      trigger:
        - platform: state
          entity_id: sensor.current_target_temp
      action:
        - service: climate.set_temperature
          target:
            entity_id: climate.thermostat
          data:
            temperature: "{{ states('sensor.current_target_temp') | float }}"
```

### Secrets Management

```yaml
# secrets.yaml
db_password: "secure_password_here"
api_key: "your_api_key"
latitude: 37.7749
longitude: -122.4194

# Reference in configuration.yaml
recorder:
  db_url: !secret db_url

homeassistant:
  latitude: !secret latitude
  longitude: !secret longitude
```

## API Endpoints

### State API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/states` | Get all states |
| GET | `/api/states/<entity_id>` | Get specific state |
| POST | `/api/states/<entity_id>` | Set state |

### Service API
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/services/<domain>/<service>` | Call service |
| GET | `/api/services` | List all services |

### History API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history/period/<timestamp>` | Get history |
| GET | `/api/logbook/<timestamp>` | Get logbook entries |

## Output Format

When writing data configurations:
1. Provide complete YAML snippets
2. Include comments explaining each section
3. Note any dependencies or prerequisites
4. Suggest validation steps
