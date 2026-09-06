---
name: home-assistant-architect:ubuntu-ha-deployer
intent: Ubuntu Home Assistant Deployer Agent
tags:
  - home-assistant-architect
  - agent
  - ubuntu-ha-deployer
inputs: []
risk: medium
cost: medium
description: Deploy, configure, and manage Home Assistant on Ubuntu servers with Docker, including complementary services like MQTT, Zigbee2MQTT, and monitoring.
---

# Ubuntu Home Assistant Deployer Agent

Deploy, configure, and manage Home Assistant on Ubuntu servers with Docker, including complementary services like MQTT, Zigbee2MQTT, and monitoring.

## Agent Overview

| Attribute | Value |
|-----------|-------|
| **Name** | ubuntu-ha-deployer |
| **Model** | sonnet |
| **Category** | DevOps / IoT |
| **Complexity** | High |

## Capabilities

### Deployment Methods
- Docker Compose deployment (recommended)
- Home Assistant Supervised installation
- Home Assistant Core with venv
- Full Home Assistant OS in VM

### Stack Components
- Home Assistant Core
- MQTT Broker (Mosquitto)
- Zigbee2MQTT for Zigbee devices
- Z-Wave JS UI for Z-Wave devices
- Node-RED for advanced flows
- InfluxDB + Grafana monitoring
- Nginx/Caddy reverse proxy

### Security Configuration
- UFW firewall rules
- Fail2ban protection
- SSL/TLS with Let's Encrypt
- VPN access (WireGuard, Tailscale)
- Network segmentation

### Maintenance
- Backup and restore
- Update management
- Log rotation
- Health monitoring

## Required Context

```yaml
environment:
  SERVER_IP: "192.168.1.100"
  DOMAIN: "home.example.com"  # Optional
  SSH_KEY: "~/.ssh/id_rsa"
```

## Docker Compose Stack

```yaml
# docker-compose.yaml
version: '3.8'

services:
  homeassistant:
    container_name: homeassistant
    image: ghcr.io/home-assistant/home-assistant:stable
    restart: unless-stopped
    privileged: true
    network_mode: host
    volumes:
      - ./homeassistant:/config
      - /etc/localtime:/etc/localtime:ro
      - /run/dbus:/run/dbus:ro
    environment:
      - TZ=America/New_York
    depends_on:
      - mosquitto

  mosquitto:
    container_name: mosquitto
    image: eclipse-mosquitto:latest
    restart: unless-stopped
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
      - ./mosquitto/log:/mosquitto/log

  zigbee2mqtt:
    container_name: zigbee2mqtt
    image: koenkk/zigbee2mqtt:latest
    restart: unless-stopped
    volumes:
      - ./zigbee2mqtt:/app/data
      - /run/udev:/run/udev:ro
    ports:
      - "8080:8080"
    environment:
      - TZ=America/New_York
    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0
    depends_on:
      - mosquitto

  zwavejs:
    container_name: zwavejs
    image: zwavejs/zwave-js-ui:latest
    restart: unless-stopped
    tty: true
    stop_signal: SIGINT
    environment:
      - TZ=America/New_York
    devices:
      - /dev/ttyACM0:/dev/ttyACM0
    volumes:
      - ./zwavejs:/usr/src/app/store
    ports:
      - "8091:8091"
      - "3000:3000"

  nodered:
    container_name: nodered
    image: nodered/node-red:latest
    restart: unless-stopped
    ports:
      - "1880:1880"
    volumes:
      - ./nodered:/data
    environment:
      - TZ=America/New_York
    depends_on:
      - homeassistant

  influxdb:
    container_name: influxdb
    image: influxdb:2.7
    restart: unless-stopped
    ports:
      - "8086:8086"
    volumes:
      - ./influxdb/data:/var/lib/influxdb2
      - ./influxdb/config:/etc/influxdb2
    environment:
      - DOCKER_INFLUXDB_INIT_MODE=setup
      - DOCKER_INFLUXDB_INIT_USERNAME=admin
      - DOCKER_INFLUXDB_INIT_PASSWORD=supersecretpassword
      - DOCKER_INFLUXDB_INIT_ORG=home
      - DOCKER_INFLUXDB_INIT_BUCKET=homeassistant
      - DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=your-super-secret-token

  grafana:
    container_name: grafana
    image: grafana/grafana:latest
    restart: unless-stopped
    ports:
      - "3001:3000"
    volumes:
      - ./grafana:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    depends_on:
      - influxdb

  caddy:
    container_name: caddy
    image: caddy:latest
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile
      - ./caddy/data:/data
      - ./caddy/config:/config
    depends_on:
      - homeassistant

  ollama:
    container_name: ollama
    image: ollama/ollama:latest
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ./ollama:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

networks:
  default:
    name: homeassistant
```

## Installation Scripts

### Full Deployment Script
```bash
#!/bin/bash
# ha-deploy.sh - Full Home Assistant Stack Deployment

set -e

# Configuration
INSTALL_DIR="/opt/homeassistant"
DOMAIN="${DOMAIN:-home.local}"
EMAIL="${EMAIL:-admin@example.com}"
TIMEZONE="${TZ:-America/New_York}"

echo "=== Home Assistant Ubuntu Deployment ==="
echo "Install directory: $INSTALL_DIR"
echo "Domain: $DOMAIN"
echo "Timezone: $TIMEZONE"

# Update system
echo "[1/10] Updating system..."
sudo apt update && sudo apt upgrade -y

# Install dependencies
echo "[2/10] Installing dependencies..."
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    jq \
    ufw

# Install Docker
echo "[3/10] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
fi

# Install Docker Compose
echo "[4/10] Installing Docker Compose..."
sudo apt install -y docker-compose-plugin

# Create directory structure
echo "[5/10] Creating directories..."
sudo mkdir -p $INSTALL_DIR/{homeassistant,mosquitto/{config,data,log},zigbee2mqtt,zwavejs,nodered,influxdb/{data,config},grafana,caddy/{data,config},ollama}
sudo chown -R $USER:$USER $INSTALL_DIR

# Configure Mosquitto
echo "[6/10] Configuring Mosquitto..."
cat > $INSTALL_DIR/mosquitto/config/mosquitto.conf << 'EOF'
listener 1883
allow_anonymous false
password_file /mosquitto/config/password.txt

listener 9001
protocol websockets
EOF

# Configure Caddy
echo "[7/10] Configuring Caddy..."
cat > $INSTALL_DIR/caddy/Caddyfile << EOF
$DOMAIN {
    reverse_proxy localhost:8123
}

z2m.$DOMAIN {
    reverse_proxy localhost:8080
}

nodered.$DOMAIN {
    reverse_proxy localhost:1880
}

grafana.$DOMAIN {
    reverse_proxy localhost:3001
}
EOF

# Configure UFW
echo "[8/10] Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8123/tcp  # HA direct access
sudo ufw --force enable

# Create Docker Compose file
echo "[9/10] Creating Docker Compose..."
# (Docker Compose content from above)

# Start services
echo "[10/10] Starting services..."
cd $INSTALL_DIR
docker compose up -d

echo ""
echo "=== Deployment Complete ==="
echo "Home Assistant: http://localhost:8123"
echo "Zigbee2MQTT: http://localhost:8080"
echo "Node-RED: http://localhost:1880"
echo "Grafana: http://localhost:3001"
echo "Ollama: http://localhost:11434"
echo ""
echo "Next steps:"
echo "1. Complete HA onboarding at http://localhost:8123"
echo "2. Configure Zigbee coordinator in Zigbee2MQTT"
echo "3. Set up MQTT integration in Home Assistant"
echo "4. Pull Ollama models: docker exec ollama ollama pull llama3.2:3b"
```

### Backup Script
```bash
#!/bin/bash
# ha-backup.sh - Backup Home Assistant and Stack

INSTALL_DIR="/opt/homeassistant"
BACKUP_DIR="/opt/backups/homeassistant"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="ha_backup_$DATE"

mkdir -p $BACKUP_DIR

echo "=== Backing up Home Assistant Stack ==="

# Stop containers for consistent backup
docker compose -f $INSTALL_DIR/docker-compose.yaml stop

# Create backup
tar -czvf $BACKUP_DIR/$BACKUP_NAME.tar.gz \
    -C $INSTALL_DIR \
    homeassistant \
    mosquitto \
    zigbee2mqtt \
    nodered \
    influxdb \
    grafana

# Restart containers
docker compose -f $INSTALL_DIR/docker-compose.yaml start

# Cleanup old backups (keep last 7)
ls -t $BACKUP_DIR/*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup complete: $BACKUP_DIR/$BACKUP_NAME.tar.gz"
```

### Security Hardening Script
```bash
#!/bin/bash
# ha-security.sh - Security hardening for HA server

echo "=== Security Hardening ==="

# SSH hardening
echo "[1/5] Hardening SSH..."
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Install and configure Fail2ban
echo "[2/5] Installing Fail2ban..."
sudo apt install -y fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[homeassistant]
enabled = true
filter = homeassistant
logpath = /opt/homeassistant/homeassistant/home-assistant.log
maxretry = 3
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

# Install automatic updates
echo "[3/5] Configuring automatic updates..."
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# Install Tailscale VPN
echo "[4/5] Installing Tailscale..."
curl -fsSL https://tailscale.com/install.sh | sh
echo "Run 'sudo tailscale up' to connect"

# AppArmor profiles
echo "[5/5] Configuring AppArmor..."
sudo apt install -y apparmor apparmor-utils
sudo aa-enforce /etc/apparmor.d/*

echo "=== Security hardening complete ==="
```

## Monitoring Configuration

### InfluxDB Integration for HA
```yaml
# configuration.yaml
influxdb:
  api_version: 2
  ssl: false
  host: localhost
  port: 8086
  token: your-super-secret-token
  organization: home
  bucket: homeassistant
  tags:
    source: HA
  tags_attributes:
    - friendly_name
  default_measurement: state
  exclude:
    entity_globs:
      - "sun.*"
    domains:
      - automation
      - script
```

## Integration Points

- **local-llm-manager**: Deploy Ollama alongside HA
- **ha-automation-architect**: Automate deployment tasks
- **ha-security-auditor**: Verify security configuration
- **ha-diagnostics**: Monitor deployment health
