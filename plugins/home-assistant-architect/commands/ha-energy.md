---
name: home-assistant-architect:ha-energy
intent: /ha-energy Command
tags:
  - home-assistant-architect
  - command
  - ha-energy
inputs: []
risk: medium
cost: medium
description: Configure and manage Home Assistant energy monitoring system.
---

# /ha-energy Command

Configure and manage Home Assistant energy monitoring system.

## Usage

```bash
# Setup energy monitoring
/ha-energy setup <type>

# Configure rates
/ha-energy rates <utility>

# Create automations
/ha-energy automation <type>

# Generate dashboard
/ha-energy dashboard
```

## Arguments

### Setup Types
- `solar` - Solar panel integration
- `battery` - Battery storage setup
- `grid` - Grid monitoring
- `ev` - EV charger integration
- `full` - Complete energy system

### Automation Types
- `tou` - Time-of-use optimization
- `solar-priority` - Solar self-consumption
- `ev-charging` - Smart EV charging
- `peak-shaving` - Peak demand reduction
- `backup` - Battery backup mode

## Examples

```bash
# Setup complete energy system
/ha-energy setup full

# Configure utility rates
/ha-energy rates pge_tou

# Create solar priority automation
/ha-energy automation solar-priority

# Generate energy dashboard
/ha-energy dashboard

# Setup EV smart charging
/ha-energy setup ev --charger wallbox
```

## Configuration Options

### Solar Setup
- Inverter type (Enphase, SolarEdge, Fronius)
- System capacity (kW)
- Net metering enabled

### Battery Setup
- Battery type (Powerwall, LG Chem)
- Capacity (kWh)
- Reserved percentage

### Rate Configuration
- Utility provider
- Rate schedule
- Export credits

## Output

Returns:
- Sensor configurations
- Template sensors for calculations
- Automations for optimization
- Dashboard cards
- Cost tracking templates

## Agent Delegation

This command delegates to:
- `ha-energy-management` for system setup
- `ha-energy-optimizer` for automation
- `ha-data-writer` for sensor creation
