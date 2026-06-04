---
name: ha-automation
description: "Automation YAML patterns, triggers, conditions, actions, and best practices for Home Assistant."
---

# Home Assistant Automation Skill

Automation YAML patterns, triggers, conditions, actions, and best practices for Home Assistant.

## Activation Triggers

Activate this skill when:
- Creating or modifying automations
- Working with automation YAML
- Designing trigger logic
- Building condition chains
- Creating action sequences

## Automation Structure

```yaml
# Complete automation template
alias: "Descriptive Name"
id: unique_automation_id  # Optional but recommended
description: "What this automation does and why"
mode: single  # single, restart, queued, parallel

# Variables available throughout
variables:
  room: "living_room"
  default_brightness: 80

trigger:
  - platform: state
    entity_id: binary_sensor.motion
    to: "on"
    id: motion_detected  # For use in choose

condition:
  - condition: sun
    after: sunset

action:
  - service: light.turn_on
    target:
      entity_id: "light.{{ room }}"
    data:
      brightness_pct: "{{ default_brightness }}"
```

## Trigger Types

### State Trigger
```yaml
trigger:
  - platform: state
    entity_id: binary_sensor.door
    from: "off"
    to: "on"
    for:
      seconds: 30
    attribute: any  # Optional: trigger on attribute change
```

### Time Trigger
```yaml
trigger:
  - platform: time
    at: "06:30:00"

  # Multiple times
  - platform: time
    at:
      - "07:00:00"
      - "12:00:00"
      - "18:00:00"

  # Input datetime
  - platform: time
    at: input_datetime.wake_up_time
```

### Time Pattern
```yaml
trigger:
  - platform: time_pattern
    hours: "/2"  # Every 2 hours
    minutes: "30"

  - platform: time_pattern
    minutes: "/5"  # Every 5 minutes
```

### Sun Trigger
```yaml
trigger:
  - platform: sun
    event: sunset
    offset: "-01:00:00"  # 1 hour before sunset
```

### Numeric State
```yaml
trigger:
  - platform: numeric_state
    entity_id: sensor.temperature
    above: 75
    below: 85
    for:
      minutes: 5
```

### Template Trigger
```yaml
trigger:
  - platform: template
    value_template: >
      {{ states('sensor.power') | float > 1000 and
         is_state('input_boolean.high_power_alert', 'on') }}
    for:
      minutes: 5
```

### Event Trigger
```yaml
trigger:
  - platform: event
    event_type: mobile_app_notification_action
    event_data:
      action: "TURN_OFF_LIGHTS"
```

### Device Trigger
```yaml
trigger:
  - platform: device
    type: turned_on
    device_id: abc123def456
    entity_id: switch.smart_plug
    domain: switch
```

### Webhook Trigger
```yaml
trigger:
  - platform: webhook
    webhook_id: my_custom_webhook
    allowed_methods:
      - POST
    local_only: true
```

### MQTT Trigger
```yaml
trigger:
  - platform: mqtt
    topic: "home/doorbell/status"
    payload: "pressed"
```

## Condition Types

### State Condition
```yaml
condition:
  - condition: state
    entity_id: input_boolean.guest_mode
    state: "off"

  # Multiple states (OR)
  - condition: state
    entity_id: alarm_control_panel.home
    state:
      - "armed_home"
      - "armed_away"
```

### Numeric State
```yaml
condition:
  - condition: numeric_state
    entity_id: sensor.battery
    above: 20
```

### Time Condition
```yaml
condition:
  - condition: time
    after: "22:00:00"
    before: "06:00:00"
    weekday:
      - mon
      - tue
      - wed
      - thu
      - fri
```

### Sun Condition
```yaml
condition:
  - condition: sun
    after: sunset
    before: sunrise
    after_offset: "-00:30:00"
```

### Zone Condition
```yaml
condition:
  - condition: zone
    entity_id: device_tracker.phone
    zone: zone.home
```

### Template Condition
```yaml
condition:
  - condition: template
    value_template: >
      {{ now().month in [6, 7, 8] }}  # Summer months
```

### Logical Operators
```yaml
condition:
  - condition: and
    conditions:
      - condition: state
        entity_id: input_boolean.vacation
        state: "off"
      - condition: or
        conditions:
          - condition: state
            entity_id: person.john
            state: "home"
          - condition: state
            entity_id: person.jane
            state: "home"
```

## Action Patterns

### Service Call
```yaml
action:
  - service: light.turn_on
    target:
      entity_id: light.kitchen
    data:
      brightness_pct: 100
      transition: 2
```

### Dynamic Targets
```yaml
action:
  - service: light.turn_on
    target:
      entity_id: >
        {{ expand('group.all_lights')
           | selectattr('state', 'eq', 'on')
           | map(attribute='entity_id')
           | list }}
```

### Delay & Wait
```yaml
action:
  - delay:
      seconds: 30

  - wait_for_trigger:
      - platform: state
        entity_id: binary_sensor.door
        to: "off"
    timeout:
      minutes: 5
    continue_on_timeout: true

  - wait_template: "{{ is_state('lock.front', 'locked') }}"
    timeout: "00:01:00"
```

### Choose (If/Else)
```yaml
action:
  - choose:
      - conditions:
          - condition: state
            entity_id: sun.sun
            state: "below_horizon"
        sequence:
          - service: light.turn_on
            target:
              entity_id: light.porch
            data:
              brightness_pct: 100
      - conditions:
          - condition: numeric_state
            entity_id: sensor.illuminance
            below: 100
        sequence:
          - service: light.turn_on
            target:
              entity_id: light.porch
            data:
              brightness_pct: 50
    default:
      - service: light.turn_off
        target:
          entity_id: light.porch
```

### If/Then/Else
```yaml
action:
  - if:
      - condition: state
        entity_id: input_boolean.notify
        state: "on"
    then:
      - service: notify.mobile_app
        data:
          message: "Alert!"
    else:
      - service: persistent_notification.create
        data:
          message: "Alert logged"
```

### Repeat
```yaml
action:
  # Repeat count
  - repeat:
      count: 3
      sequence:
        - service: light.toggle
          target:
            entity_id: light.alert
        - delay:
            milliseconds: 500

  # While loop
  - repeat:
      while:
        - condition: state
          entity_id: binary_sensor.motion
          state: "on"
      sequence:
        - delay:
            seconds: 10

  # For each
  - repeat:
      for_each:
        - light.bedroom
        - light.office
        - light.kitchen
      sequence:
        - service: light.turn_off
          target:
            entity_id: "{{ repeat.item }}"
        - delay:
            seconds: 1
```

### Parallel
```yaml
action:
  - parallel:
      - service: light.turn_on
        target:
          entity_id: light.living_room
      - service: media_player.play_media
        target:
          entity_id: media_player.speaker
        data:
          media_content_id: "welcome_home.mp3"
          media_content_type: "music"
```

### Response Variables
```yaml
action:
  - service: weather.get_forecasts
    target:
      entity_id: weather.home
    data:
      type: daily
    response_variable: forecast

  - service: notify.mobile_app
    data:
      message: >
        Tomorrow's forecast: {{ forecast['weather.home'].forecast[0].condition }}
```

## Templates

### Common Templates
```yaml
# Current time
"{{ now().strftime('%H:%M') }}"

# Entity state
"{{ states('sensor.temperature') }}"

# State with default
"{{ states('sensor.battery') | float(100) }}"

# Attribute
"{{ state_attr('climate.thermostat', 'current_temperature') }}"

# Time since last change
"{{ (now() - states.sensor.motion.last_changed).seconds }}"

# Entity count
"{{ states.light | selectattr('state', 'eq', 'on') | list | count }}"

# Area entities
"{{ area_entities('Living Room') }}"

# Device entities
"{{ device_entities('device_id') }}"
```

## Best Practices

1. **Use descriptive aliases** - Clear names help debugging
2. **Add descriptions** - Explain the automation purpose
3. **Use automation modes** appropriately:
   - `single`: Default, ignores new triggers while running
   - `restart`: Stops current run, starts new
   - `queued`: Queues new triggers
   - `parallel`: Runs multiple instances
4. **Use trigger IDs** - For complex choose logic
5. **Add logging** for debugging:
   ```yaml
   action:
     - service: system_log.write
       data:
         message: "Automation triggered: {{ trigger.entity_id }}"
         level: info
   ```
6. **Validate before saving** - Use Developer Tools
7. **Test with trace** - Review automation traces
