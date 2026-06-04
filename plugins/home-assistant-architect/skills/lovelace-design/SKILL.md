---
name: lovelace-design
description: "Advanced Lovelace dashboard patterns for Home Assistant."
---

# Lovelace Dashboard Design Skill

Advanced Lovelace dashboard patterns for Home Assistant.

## Activation Triggers

- Working with `ui-lovelace.yaml`
- Creating dashboard views
- Custom card configurations
- Theme development
- Responsive layouts

## Core Patterns

### Dashboard Structure

```yaml
# ui-lovelace.yaml structure
title: Home
views:
  - title: Overview
    path: overview
    icon: mdi:home
    badges: []
    cards: []

  - title: Rooms
    path: rooms
    icon: mdi:floor-plan
    panel: false
    cards: []

  - title: Settings
    path: settings
    icon: mdi:cog
    subview: true
    back_path: /lovelace/overview
    cards: []
```

### Card Types Reference

| Card | Use Case |
|------|----------|
| `entities` | List of entities |
| `glance` | Quick status view |
| `button` | Single action |
| `light` | Light control |
| `thermostat` | Climate control |
| `weather-forecast` | Weather display |
| `picture-glance` | Camera/image |
| `gauge` | Sensor display |
| `grid` | Card layout |
| `horizontal-stack` | Horizontal layout |
| `vertical-stack` | Vertical layout |

### Layout Cards

```yaml
# Grid layout
type: grid
columns: 3
square: false
cards:
  - type: entity
    entity: sensor.temp

# Horizontal stack
type: horizontal-stack
cards:
  - type: button
    entity: light.living

# Vertical stack
type: vertical-stack
cards:
  - type: entities
    entities: []
```

### Conditional Cards

```yaml
type: conditional
conditions:
  - condition: state
    entity: person.owner
    state: home
  - condition: numeric_state
    entity: sensor.temperature
    above: 70
card:
  type: entities
  entities:
    - climate.thermostat
```

### Custom Card Patterns

```yaml
# Mushroom card
type: custom:mushroom-entity-card
entity: light.living_room
icon_color: amber
fill_container: true
layout: horizontal

# Button card
type: custom:button-card
entity: light.living_room
name: Living Room
icon: mdi:lightbulb
color: auto
tap_action:
  action: toggle
styles:
  card:
    - border-radius: 20px

# Mini graph card
type: custom:mini-graph-card
entities:
  - sensor.temperature
hours_to_show: 24
points_per_hour: 2
show:
  labels: true
```

## Theme Variables

### Key CSS Variables

```yaml
# Colors
primary-color: "#03a9f4"
accent-color: "#ff9800"
primary-background-color: "#ffffff"
secondary-background-color: "#f5f5f5"
primary-text-color: "#212121"
secondary-text-color: "#727272"

# Cards
ha-card-background: "#ffffff"
ha-card-border-radius: "8px"
ha-card-box-shadow: "0 2px 4px rgba(0,0,0,0.1)"

# States
state-icon-active-color: "#ffc107"
state-icon-color: "#9e9e9e"
```

### Card-Mod Styling

```yaml
card_mod:
  style: |
    ha-card {
      background: transparent;
      box-shadow: none;
      border: 1px solid var(--divider-color);
    }
    .card-header {
      font-weight: bold;
      color: var(--primary-color);
    }
```

## Responsive Design

### Device Detection

```yaml
# Browser_mod popup
type: custom:state-switch
entity: browser_mod.browser_id
default: desktop
states:
  mobile:
    type: vertical-stack
    cards: []
  desktop:
    type: grid
    columns: 4
    cards: []
```

### View Visibility

```yaml
views:
  - title: Mobile Home
    path: mobile
    visible:
      - user: phone_user
    cards: []

  - title: Desktop Home
    path: desktop
    visible:
      - user: all
    cards: []
```

## HACS Card Dependencies

### Essential Cards
- `custom:button-card`
- `custom:mushroom-*`
- `custom:mini-graph-card`
- `custom:card-mod`
- `custom:layout-card`
- `custom:auto-entities`

### Installation
```bash
# Via HACS UI
1. Open HACS
2. Go to Frontend
3. Search for card name
4. Install and restart
```

## Best Practices

1. **Mobile First** - Design for smallest screen first
2. **Consistent Spacing** - Use grid for alignment
3. **Color Coding** - Use colors meaningfully
4. **Performance** - Limit cards per view
5. **Navigation** - Clear path structure
