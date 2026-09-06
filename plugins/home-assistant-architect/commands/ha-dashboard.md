---
name: home-assistant-architect:ha-dashboard
intent: /ha-dashboard Command
tags:
  - home-assistant-architect
  - command
  - ha-dashboard
inputs: []
risk: medium
cost: medium
description: Create, customize, and manage Home Assistant Lovelace dashboards.
---

# /ha-dashboard Command

Create, customize, and manage Home Assistant Lovelace dashboards.

## Usage

```bash
# Create a new dashboard
/ha-dashboard create <type> [options]

# Generate cards
/ha-dashboard card <card-type> <entity>

# Apply theme
/ha-dashboard theme <theme-name>

# Export dashboard
/ha-dashboard export <dashboard-name>
```

## Arguments

### Dashboard Types
- `overview` - Home overview with all rooms
- `mobile` - Mobile-optimized layout
- `tablet` - Tablet/wall panel layout
- `security` - Security-focused dashboard
- `energy` - Energy monitoring dashboard
- `media` - Media control dashboard
- `climate` - Climate and comfort dashboard

### Card Types
- `room` - Room card with climate
- `weather` - Animated weather card
- `camera` - Camera view card
- `graph` - Mini graph card
- `button` - Styled button card
- `entity` - Entity status card

## Examples

```bash
# Create mobile dashboard
/ha-dashboard create mobile

# Create security dashboard with cameras
/ha-dashboard create security --cameras

# Generate room card
/ha-dashboard card room light.living_room

# Generate weather card
/ha-dashboard card weather weather.home

# Apply modern glass theme
/ha-dashboard theme modern_glass

# Export dashboard to file
/ha-dashboard export main_dashboard
```

## Output

Returns complete YAML configuration for:
- Dashboard views
- Card configurations
- Theme definitions
- HACS dependencies list

## Agent Delegation

This command delegates to:
- `ha-dashboard-designer` for custom designs
- `ha-frontend-builder` for standard layouts
- `ha-customization-expert` for themes
