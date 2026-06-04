---
name: camera-nvr
description: "Home Assistant camera integration and Frigate NVR patterns."
---

# Camera and NVR Skill

Home Assistant camera integration and Frigate NVR patterns.

## Activation Triggers

- Working with camera entities
- Configuring Frigate NVR
- Setting up motion detection
- Creating camera dashboards
- Recording management

## Core Patterns

### Frigate Configuration

```yaml
# frigate.yaml
mqtt:
  enabled: true
  host: mosquitto
  user: frigate
  password: "{FRIGATE_MQTT_PASSWORD}"

detectors:
  coral:
    type: edgetpu
    device: usb

cameras:
  front_door:
    ffmpeg:
      inputs:
        - path: rtsp://user:pass@192.168.1.100:554/stream1
          roles:
            - detect
            - record
        - path: rtsp://user:pass@192.168.1.100:554/stream2
          roles:
            - rtmp
    detect:
      width: 1920
      height: 1080
      fps: 5
    objects:
      track:
        - person
        - car
        - dog
      filters:
        person:
          min_area: 5000
          threshold: 0.7
    zones:
      porch:
        coordinates: 0,1080,500,1080,500,0,0,0
        objects:
          - person
    record:
      enabled: true
      retain:
        days: 7
        mode: motion
      events:
        retain:
          default: 30

go2rtc:
  streams:
    front_door:
      - rtsp://user:pass@192.168.1.100:554/stream1
```

### Camera YAML Configuration

```yaml
# Generic camera
camera:
  - platform: generic
    name: Front Yard
    still_image_url: http://192.168.1.100/snapshot.jpg
    stream_source: rtsp://user:pass@192.168.1.100:554/stream

  - platform: onvif
    host: 192.168.1.103
    port: 80
    username: admin
    password: !secret camera_password
```

### Motion Detection Automation

```yaml
automation:
  - alias: "Camera - Person Alert"
    trigger:
      - platform: state
        entity_id: binary_sensor.front_door_person
        to: "on"
    condition:
      - condition: state
        entity_id: input_boolean.camera_alerts
        state: "on"
    action:
      - service: notify.mobile_app
        data:
          title: "Person Detected"
          message: "Person at front door"
          data:
            image: /api/frigate/notifications/front_door/snapshot.jpg
            tag: camera_alert
            actions:
              - action: "VIEW_CAMERA"
                title: "View"
```

### Recording Management

```yaml
# Frigate recording settings
record:
  enabled: true
  retain:
    days: 7
    mode: motion
  events:
    pre_capture: 5
    post_capture: 5
    retain:
      default: 30
      mode: active_objects
```

### Camera Dashboard

```yaml
# Picture glance card
type: picture-glance
title: Front Door
camera_image: camera.front_door
camera_view: live
entities:
  - binary_sensor.front_door_person
  - binary_sensor.front_door_motion

# Frigate card
type: custom:frigate-card
cameras:
  - camera_entity: camera.front_door
    frigate:
      url: http://frigate:5000
      client_id: front_door
menu:
  buttons:
    frigate: true
    fullscreen: true
    download: true
live:
  provider: webrtc-card
```

### PTZ Control

```yaml
# PTZ service calls
service: onvif.ptz
data:
  entity_id: camera.ptz_camera
  move_mode: RelativeMove
  pan: 0.1  # -1 to 1
  tilt: 0.1
  zoom: 0.1

# Preset
service: onvif.ptz
data:
  entity_id: camera.ptz_camera
  preset: "1"
```

## Hardware Recommendations

| Use Case | Camera Type | Resolution |
|----------|-------------|------------|
| Doorbell | Video doorbell | 1080p+ |
| Driveway | Bullet camera | 4K |
| Backyard | PTZ camera | 1080p |
| Indoor | Cube/dome | 1080p |

### AI Acceleration

```yaml
# Coral USB
detectors:
  coral:
    type: edgetpu
    device: usb

# Coral M.2/PCIe
detectors:
  coral:
    type: edgetpu
    device: pci

# Intel OpenVINO
detectors:
  openvino:
    type: openvino
    device: GPU
```

## RTSP URL Formats

| Brand | URL Format |
|-------|------------|
| Hikvision | `rtsp://user:pass@ip:554/Streaming/Channels/101` |
| Dahua | `rtsp://user:pass@ip:554/cam/realmonitor?channel=1` |
| Reolink | `rtsp://user:pass@ip:554/h264Preview_01_main` |
| Amcrest | `rtsp://user:pass@ip:554/cam/realmonitor?channel=1` |
| Ubiquiti | `rtsp://ip:7447/camera_id` |
