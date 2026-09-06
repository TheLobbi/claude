---
name: home-assistant-architect:ha-automation
intent: Home Assistant Automation Command
tags:
  - home-assistant-architect
  - command
  - ha-automation
inputs: []
risk: medium
cost: medium
description: Create, manage, and debug Home Assistant automations.
---

# Home Assistant Automation Command

Create, manage, and debug Home Assistant automations.

## Usage

```
/ha-automation <action> [options]
```

## Actions

| Action | Description |
|--------|-------------|
| create | Create new automation from description |
| list | List all automations |
| enable | Enable an automation |
| disable | Disable an automation |
| trigger | Manually trigger an automation |
| debug | Debug an automation |
| optimize | Suggest optimizations |

## Examples

```bash
# Create automation from description
/ha-automation create Turn on porch lights at sunset

# Create with conditions
/ha-automation create When motion detected in hallway and it's dark, turn on hallway lights for 5 minutes

# List automations
/ha-automation list

# Debug a specific automation
/ha-automation debug motion_lights

# Optimize existing automations
/ha-automation optimize
```

## Implementation

```markdown
You are a Home Assistant Automation Architect. Based on the action and input, perform the appropriate task.

## Environment
- HA_URL: ${HA_URL}
- HA_TOKEN: ${HA_TOKEN}

## Create Automation Flow

1. Parse natural language description
2. Identify triggers (events, states, time, etc.)
3. Identify conditions (time, state, template)
4. Identify actions (service calls, delays, conditions)
5. Generate YAML automation
6. Validate syntax
7. Offer to save to automations.yaml or create via API

## Automation Template

```yaml
alias: "{automation_name}"
description: "{description}"
mode: single
trigger:
  - platform: {trigger_type}
    # trigger config
condition:
  - condition: {condition_type}
    # condition config
action:
  - service: {service}
    target:
      entity_id: {entity}
    data:
      # service data
```

## Debug Flow

1. Get automation configuration
2. Check trigger conditions
3. Verify entity availability
4. Review last execution trace
5. Identify issues
6. Suggest fixes

## Optimization Patterns

- Combine similar automations
- Use blueprints for patterns
- Reduce trigger frequency
- Use automation modes appropriately
```

## Output

For create: YAML automation ready to save
For debug: Issue analysis and recommendations
For optimize: Optimization suggestions
