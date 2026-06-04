---
name: ubuntu-deployment
description: "Deploy and manage Home Assistant on Ubuntu servers with Docker, security hardening, and complementary services."
---

# Ubuntu Deployment Skill

Deploy and manage Home Assistant on Ubuntu servers with Docker, security hardening, and complementary services.

## Activation Triggers

Activate this skill when:
- Deploying Home Assistant on Ubuntu
- Setting up Docker Compose stacks
- Configuring server security
- Managing backups and updates
- Setting up monitoring

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4+ cores |
| RAM | 2GB | 8GB+ |
| Storage | 32GB SSD | 128GB+ NVMe |
| Network | 100Mbps | 1Gbps |
| Ubuntu | 22.04 LTS | 24.04 LTS |

## Quick Deploy Script

```bash
#!/bin/bash
# ha-quick-deploy.sh

set -e

INSTALL_DIR="${INSTALL_DIR:-/opt/homeassistant}"
TZ="${TZ:-America/New_York}"

echo "=== Home Assistant Quick Deploy ==="

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Create directory structure
sudo mkdir -p $INSTALL_DIR/{homeassistant,mosquitto/{config,data,log},zigbee2mqtt,nodered,ollama}
sudo chown -R $USER:$USER $INSTALL_DIR

# Create docker-compose.yaml
cat > $INSTALL_DIR/docker-compose.yaml << 'COMPOSE'
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
    environment:
      - TZ=${TZ}

  mosquitto:
    container_name: mosquitto
    image: eclipse-mosquitto:latest
    restart: unless-stopped
    ports:
      - "1883:1883"
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
      - ./mosquitto/log:/mosquitto/log

  ollama:
    container_name: ollama
    image: ollama/ollama:latest
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ./ollama:/root/.ollama
COMPOSE

# Create Mosquitto config
cat > $INSTALL_DIR/mosquitto/config/mosquitto.conf << 'MQTT'
listener 1883
allow_anonymous true
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
MQTT

# Start services
cd $INSTALL_DIR
docker compose up -d

# Pull Ollama models
sleep 10
docker exec ollama ollama pull llama3.2:3b

echo ""
echo "=== Deployment Complete ==="
echo "Home Assistant: http://$(hostname -I | awk '{print $1}'):8123"
echo "Ollama API: http://$(hostname -I | awk '{print $1}'):11434"
```

## Full Stack Docker Compose

```yaml
version: '3.8'

services:
  # Home Assistant
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
      - mariadb

  # Database
  mariadb:
    container_name: mariadb
    image: mariadb:latest
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: homeassistant
      MYSQL_USER: homeassistant
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./mariadb:/var/lib/mysql
    ports:
      - "3306:3306"

  # MQTT Broker
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

  # Zigbee2MQTT
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

  # Z-Wave JS UI
  zwavejs:
    container_name: zwavejs
    image: zwavejs/zwave-js-ui:latest
    restart: unless-stopped
    environment:
      - TZ=America/New_York
    devices:
      - /dev/ttyACM0:/dev/ttyACM0
    volumes:
      - ./zwavejs:/usr/src/app/store
    ports:
      - "8091:8091"
      - "3000:3000"

  # Node-RED
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

  # InfluxDB
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
      - DOCKER_INFLUXDB_INIT_PASSWORD=${INFLUX_PASSWORD}
      - DOCKER_INFLUXDB_INIT_ORG=home
      - DOCKER_INFLUXDB_INIT_BUCKET=homeassistant

  # Grafana
  grafana:
    container_name: grafana
    image: grafana/grafana:latest
    restart: unless-stopped
    ports:
      - "3001:3000"
    volumes:
      - ./grafana:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    depends_on:
      - influxdb

  # Caddy Reverse Proxy
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

  # Ollama LLM
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

## Security Hardening

```bash
#!/bin/bash
# ha-security.sh

# UFW Firewall
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Fail2ban
sudo apt install -y fail2ban
cat | sudo tee /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
EOF
sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

# SSH Hardening
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Automatic Updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

echo "Security hardening complete"
```

## Backup Script

```bash
#!/bin/bash
# ha-backup.sh

INSTALL_DIR="/opt/homeassistant"
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="ha_backup_$DATE.tar.gz"

mkdir -p $BACKUP_DIR

# Stop HA for consistent backup
docker compose -f $INSTALL_DIR/docker-compose.yaml stop homeassistant

# Create backup
tar -czvf $BACKUP_DIR/$BACKUP_NAME \
    -C $INSTALL_DIR \
    homeassistant \
    mosquitto/config \
    zigbee2mqtt \
    nodered

# Restart HA
docker compose -f $INSTALL_DIR/docker-compose.yaml start homeassistant

# Keep last 7 backups
ls -t $BACKUP_DIR/*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup complete: $BACKUP_DIR/$BACKUP_NAME"
```

## Systemd Service

```ini
# /etc/systemd/system/homeassistant.service
[Unit]
Description=Home Assistant Docker Stack
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/homeassistant
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Enable service
sudo systemctl daemon-reload
sudo systemctl enable homeassistant
sudo systemctl start homeassistant
```

## Monitoring

```yaml
# prometheus.yml addition
scrape_configs:
  - job_name: 'homeassistant'
    scrape_interval: 30s
    metrics_path: /api/prometheus
    bearer_token: 'YOUR_HA_TOKEN'
    static_configs:
      - targets: ['localhost:8123']
```

## Troubleshooting

| Issue | Command |
|-------|---------|
| Container logs | `docker logs homeassistant -f` |
| Restart stack | `docker compose restart` |
| Update images | `docker compose pull && docker compose up -d` |
| Check resources | `docker stats` |
| Network issues | `docker network inspect homeassistant` |
| Permission issues | `sudo chown -R $USER:$USER /opt/homeassistant` |
