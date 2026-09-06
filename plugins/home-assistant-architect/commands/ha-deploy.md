---
name: home-assistant-architect:ha-deploy
intent: Home Assistant Deploy Command
tags:
  - home-assistant-architect
  - command
  - ha-deploy
inputs: []
risk: medium
cost: medium
description: Deploy Home Assistant on Ubuntu server with Docker and complementary services.
---

# Home Assistant Deploy Command

Deploy Home Assistant on Ubuntu server with Docker and complementary services.

## Usage

```
/ha-deploy <action> [options]
```

## Actions

| Action | Description |
|--------|-------------|
| init | Initialize deployment directory |
| full | Full stack deployment |
| minimal | Minimal HA + MQTT deployment |
| update | Update all containers |
| backup | Create backup |
| restore | Restore from backup |
| status | Check deployment status |
| logs | View container logs |

## Examples

```bash
# Full deployment
/ha-deploy full --dir /opt/homeassistant

# Minimal deployment
/ha-deploy minimal

# Update containers
/ha-deploy update

# Create backup
/ha-deploy backup

# View logs
/ha-deploy logs homeassistant
```

## Implementation

```markdown
You are an Ubuntu HA Deployer. Deploy and manage Home Assistant on Ubuntu servers.

## Environment
- INSTALL_DIR: ${INSTALL_DIR:-/opt/homeassistant}
- TZ: ${TZ:-America/New_York}

## Full Stack Components

1. Home Assistant Core
2. MariaDB (recorder)
3. Mosquitto MQTT
4. Zigbee2MQTT
5. Z-Wave JS UI
6. Node-RED
7. InfluxDB + Grafana
8. Caddy (reverse proxy)
9. Ollama (LLM)

## Deployment Flow

1. Check system requirements
2. Install Docker and Docker Compose
3. Create directory structure
4. Generate docker-compose.yaml
5. Configure services
6. Start containers
7. Verify deployment
8. Pull Ollama models

## Directory Structure

```
/opt/homeassistant/
├── docker-compose.yaml
├── .env
├── homeassistant/
├── mosquitto/
│   ├── config/
│   ├── data/
│   └── log/
├── zigbee2mqtt/
├── zwavejs/
├── nodered/
├── influxdb/
├── grafana/
├── caddy/
└── ollama/
```

## Post-Deployment

1. Access HA at http://SERVER_IP:8123
2. Complete onboarding
3. Configure integrations:
   - MQTT (localhost:1883)
   - Zigbee2MQTT
   - InfluxDB
   - Ollama
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| --dir | Installation directory | /opt/homeassistant |
| --domain | Domain for SSL | none |
| --email | Email for Let's Encrypt | none |
| --no-gpu | Skip GPU setup | false |

## Output

Deployment status and access URLs.
