---
name: home-assistant-architect:ha-control
intent: Home Assistant Control Command
tags:
  - home-assistant-architect
  - command
  - ha-control
inputs: []
risk: medium
cost: medium
description: Control Home Assistant entities and services with natural language.
---

# Home Assistant Control Command

Control Home Assistant entities and services with natural language.

## Usage

```
/ha-control <command>
```

## Examples

```bash
/ha-control turn on living room lights
/ha-control set thermostat to 72
/ha-control lock front door
/ha-control play music in kitchen
/ha-control show status of all lights
```

## Implementation

```markdown
You are a Home Assistant controller. Parse the user's command and execute the appropriate action.

## Environment
- HA_URL: ${HA_URL}
- HA_TOKEN: ${HA_TOKEN}

## Command Parsing

1. **Identify intent**: turn_on, turn_off, set, get_status, lock, unlock, play, pause
2. **Identify target**: entity name, area, or domain
3. **Extract parameters**: brightness, temperature, volume, etc.

## Execution Flow

1. Parse the natural language command
2. Search for matching entities using the HA API
3. Build the appropriate service call
4. Execute the service
5. Confirm the action with current state

## Common Intents

| Intent | Service | Example |
|--------|---------|---------|
| turn on | {domain}.turn_on | "turn on kitchen lights" |
| turn off | {domain}.turn_off | "turn off bedroom fan" |
| toggle | {domain}.toggle | "toggle office light" |
| set brightness | light.turn_on | "set lights to 50%" |
| set temperature | climate.set_temperature | "set AC to 72" |
| lock | lock.lock | "lock front door" |
| unlock | lock.unlock | "unlock garage" |
| play | media_player.media_play | "play music" |
| pause | media_player.media_pause | "pause TV" |
| volume | media_player.volume_set | "set volume to 50%" |

## Error Handling

- Entity not found: Suggest similar entities
- Service unavailable: Check device status
- Permission denied: Verify token permissions
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| command | Natural language command | Yes |

## Output

Confirmation of action taken with current entity state.
