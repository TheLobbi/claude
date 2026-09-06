---
name: home-assistant-architect:ha-camera
intent: /ha-camera Command
tags:
  - home-assistant-architect
  - command
  - ha-camera
inputs: []
risk: medium
cost: medium
description: Configure cameras, NVR systems, and video analytics.
---

# /ha-camera Command

Configure cameras, NVR systems, and video analytics.

## Usage

```bash
# Add camera
/ha-camera add <type> <ip-address>

# Setup NVR
/ha-camera nvr <system>

# Configure detection
/ha-camera detect <camera> <objects>

# Create alerts
/ha-camera alert <camera> <event>
```

## Arguments

### Camera Types
- `rtsp` - Generic RTSP camera
- `onvif` - ONVIF-compatible camera
- `doorbell` - Video doorbell
- `ptz` - PTZ camera

### NVR Systems
- `frigate` - Frigate NVR (recommended)
- `synology` - Synology Surveillance
- `unifi` - UniFi Protect
- `blueiris` - Blue Iris

### Detection Objects
- `person` - Human detection
- `car` - Vehicle detection
- `animal` - Pet detection (dog, cat)
- `package` - Package detection
- `face` - Face recognition

## Examples

```bash
# Add RTSP camera
/ha-camera add rtsp 192.168.1.100 --user admin --pass secret

# Setup Frigate NVR
/ha-camera nvr frigate --coral usb

# Configure person detection
/ha-camera detect front_door person,car

# Create person alert
/ha-camera alert front_door person --notify mobile

# Add PTZ camera with presets
/ha-camera add ptz 192.168.1.103 --presets driveway,entrance
```

## Configuration Options

### Camera Settings
- Resolution (1080p, 4K)
- FPS for detection
- Substream for display
- IR/night vision

### Detection Settings
- Min/max object area
- Confidence threshold
- Motion masks
- Detection zones

### Recording Settings
- Continuous vs motion
- Pre/post capture seconds
- Retention days
- Event retention

## Output

Returns:
- Frigate configuration
- Home Assistant camera YAML
- Automation for alerts
- Dashboard cards
- Docker Compose additions

## Agent Delegation

This command delegates to:
- `ha-camera-nvr` for camera and NVR setup
- `ha-security-auditor` for security review
- `ha-dashboard-designer` for camera dashboard
