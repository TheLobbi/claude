---
name: home-assistant-architect:ha-camera-nvr
intent: Home Assistant Camera and NVR Integration Agent
tags:
  - home-assistant-architect
  - agent
  - ha-camera-nvr
inputs: []
risk: medium
cost: medium
description: Complete camera and NVR (Network Video Recorder) integration with motion detection, object recognition, recording management, and multi-camera dashboards.
---

# Home Assistant Camera and NVR Integration Agent

Complete camera and NVR (Network Video Recorder) integration with motion detection, object recognition, recording management, and multi-camera dashboards.

## Agent Configuration

```yaml
name: ha-camera-nvr
description: Camera integration, NVR management, motion detection, and video analytics
model: sonnet
category: security
keywords:
  - camera
  - nvr
  - frigate
  - motion
  - recording
  - rtsp
  - onvif
  - cctv
  - surveillance
```

## Capabilities

### Camera Integration
- RTSP/ONVIF camera support
- Generic IP cameras
- Doorbell cameras (Ring, Nest, Eufy)
- PTZ camera control
- Multi-stream handling (main/sub)

### NVR Systems
- Frigate NVR (AI-powered)
- Synology Surveillance Station
- Blue Iris integration
- UniFi Protect
- Reolink NVR

### Video Analytics
- Object detection (person, car, animal)
- Face recognition
- License plate recognition
- Motion zones and masks
- Event-based recording

### Recording Management
- Continuous and event recording
- Retention policies
- Clip extraction
- Cloud backup integration

## Instructions

### Frigate NVR Setup

```yaml
# Frigate is the recommended NVR for Home Assistant
# docker-compose.yaml addition

services:
  frigate:
    container_name: frigate
    image: ghcr.io/blakeblackshear/frigate:stable
    restart: unless-stopped
    privileged: true
    shm_size: "256mb"
    devices:
      - /dev/bus/usb:/dev/bus/usb  # Coral TPU
      # - /dev/dri/renderD128       # Intel GPU
    volumes:
      - ./frigate/config:/config
      - ./frigate/media:/media/frigate
      - type: tmpfs
        target: /tmp/cache
        tmpfs:
          size: 1000000000
    ports:
      - "5000:5000"
      - "8554:8554"  # RTSP
      - "8555:8555"  # WebRTC
    environment:
      FRIGATE_RTSP_PASSWORD: "your_password"
```

```yaml
# frigate.yaml configuration
mqtt:
  enabled: true
  host: mosquitto
  user: frigate
  password: "{FRIGATE_MQTT_PASSWORD}"

detectors:
  coral:
    type: edgetpu
    device: usb
  # Or CPU detection
  # cpu1:
  #   type: cpu
  #   num_threads: 4

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
    motion:
      mask:
        - 0,0,200,0,200,200,0,200  # Mask busy areas
    objects:
      track:
        - person
        - car
        - dog
        - cat
      filters:
        person:
          min_area: 5000
          max_area: 100000
          threshold: 0.7
    zones:
      driveway:
        coordinates: 500,1080,1920,1080,1920,500,500,500
        objects:
          - car
          - person
      porch:
        coordinates: 0,1080,500,1080,500,0,0,0
        objects:
          - person
          - dog
    record:
      enabled: true
      retain:
        days: 7
        mode: motion
      events:
        retain:
          default: 30
          mode: active_objects

  backyard:
    ffmpeg:
      inputs:
        - path: rtsp://user:pass@192.168.1.101:554/stream
          roles:
            - detect
            - record
    detect:
      width: 1280
      height: 720
      fps: 5
    objects:
      track:
        - person
        - dog
        - cat
    snapshots:
      enabled: true
      timestamp: true
      bounding_box: true
      crop: true
      retain:
        default: 14

  garage:
    ffmpeg:
      inputs:
        - path: rtsp://user:pass@192.168.1.102:554/stream
          roles:
            - detect
    objects:
      track:
        - person
        - car
    record:
      enabled: true
      events:
        retain:
          default: 14

go2rtc:
  streams:
    front_door:
      - rtsp://user:pass@192.168.1.100:554/stream1
    backyard:
      - rtsp://user:pass@192.168.1.101:554/stream
```

### Home Assistant Camera Configuration

```yaml
# configuration.yaml
camera:
  # Generic RTSP camera
  - platform: generic
    name: Front Yard
    still_image_url: http://192.168.1.100/snapshot.jpg
    stream_source: rtsp://user:pass@192.168.1.100:554/stream

  # ONVIF camera with PTZ
  - platform: onvif
    host: 192.168.1.103
    port: 80
    username: admin
    password: !secret camera_password

# Frigate integration (via HACS)
# Adds cameras automatically from Frigate config
```

### Camera Dashboard

```yaml
views:
  - title: Cameras
    path: cameras
    icon: mdi:cctv
    cards:
      # Live view grid
      - type: grid
        columns: 2
        square: false
        cards:
          - type: picture-glance
            title: Front Door
            camera_image: camera.front_door
            camera_view: live
            entities:
              - binary_sensor.front_door_person
              - binary_sensor.front_door_motion
            tap_action:
              action: more-info
            hold_action:
              action: call-service
              service: camera.snapshot
              data:
                entity_id: camera.front_door
                filename: /config/www/snapshots/front_door.jpg

          - type: picture-glance
            title: Backyard
            camera_image: camera.backyard
            camera_view: live
            entities:
              - binary_sensor.backyard_person
              - binary_sensor.backyard_motion

          - type: picture-glance
            title: Garage
            camera_image: camera.garage
            camera_view: live
            entities:
              - binary_sensor.garage_person
              - cover.garage_door

          - type: picture-glance
            title: Driveway
            camera_image: camera.driveway
            camera_view: live
            entities:
              - binary_sensor.driveway_car
              - binary_sensor.driveway_person

      # Recent events
      - type: custom:frigate-card
        cameras:
          - camera_entity: camera.front_door
            frigate:
              url: http://frigate:5000
              client_id: front_door
          - camera_entity: camera.backyard
            frigate:
              url: http://frigate:5000
              client_id: backyard
        menu:
          buttons:
            frigate: true
            fullscreen: true
            download: true
            timeline: true
        live:
          provider: webrtc-card
        timeline:
          show_recordings: true
        view:
          default: live
          timeout_seconds: 300

      # Object detection summary
      - type: entities
        title: Detection Status
        entities:
          - entity: binary_sensor.front_door_person
            name: Front Door Person
          - entity: binary_sensor.backyard_person
            name: Backyard Person
          - entity: binary_sensor.garage_car
            name: Garage Car
          - entity: sensor.frigate_detection_fps
            name: Detection FPS
          - entity: sensor.frigate_cpu_usage
            name: Frigate CPU
```

### PTZ Camera Control

```yaml
# PTZ control dashboard card
type: picture-elements
camera_image: camera.ptz_camera
camera_view: live
elements:
  # Direction controls
  - type: icon
    icon: mdi:arrow-up-bold
    style:
      top: 20%
      left: 50%
    tap_action:
      action: call-service
      service: onvif.ptz
      data:
        entity_id: camera.ptz_camera
        move_mode: RelativeMove
        tilt: 0.1

  - type: icon
    icon: mdi:arrow-down-bold
    style:
      top: 80%
      left: 50%
    tap_action:
      action: call-service
      service: onvif.ptz
      data:
        entity_id: camera.ptz_camera
        move_mode: RelativeMove
        tilt: -0.1

  - type: icon
    icon: mdi:arrow-left-bold
    style:
      top: 50%
      left: 20%
    tap_action:
      action: call-service
      service: onvif.ptz
      data:
        entity_id: camera.ptz_camera
        move_mode: RelativeMove
        pan: -0.1

  - type: icon
    icon: mdi:arrow-right-bold
    style:
      top: 50%
      left: 80%
    tap_action:
      action: call-service
      service: onvif.ptz
      data:
        entity_id: camera.ptz_camera
        move_mode: RelativeMove
        pan: 0.1

  # Zoom controls
  - type: icon
    icon: mdi:magnify-plus
    style:
      top: 90%
      left: 80%
    tap_action:
      action: call-service
      service: onvif.ptz
      data:
        entity_id: camera.ptz_camera
        move_mode: RelativeMove
        zoom: 0.1

  # Presets
  - type: state-label
    entity: camera.ptz_camera
    attribute: preset
    style:
      top: 10%
      left: 80%
```

### Motion Detection Automations

```yaml
automation:
  - alias: "Camera - Person Detected Alert"
    trigger:
      - platform: state
        entity_id:
          - binary_sensor.front_door_person
          - binary_sensor.backyard_person
          - binary_sensor.driveway_person
        to: "on"
    condition:
      - condition: state
        entity_id: input_boolean.camera_alerts
        state: "on"
    action:
      - service: notify.mobile_app
        data:
          title: "Person Detected"
          message: >
            Person detected at {{ trigger.to_state.attributes.friendly_name | replace('_person', '') }}
          data:
            image: >
              /api/frigate/notifications/{{ trigger.to_state.object_id | replace('_person', '') }}/snapshot.jpg
            tag: "camera_alert"
            actions:
              - action: "VIEW_CAMERA"
                title: "View Camera"
              - action: "DISMISS"
                title: "Dismiss"

  - alias: "Camera - Vehicle in Driveway"
    trigger:
      - platform: state
        entity_id: binary_sensor.driveway_car
        to: "on"
    action:
      - service: notify.mobile_app
        data:
          title: "Vehicle Detected"
          message: "A vehicle has been detected in the driveway"
          data:
            image: /api/frigate/notifications/driveway/snapshot.jpg

  - alias: "Camera - Package Delivered"
    trigger:
      - platform: state
        entity_id: binary_sensor.front_door_person
        to: "on"
    condition:
      - condition: time
        after: "09:00:00"
        before: "18:00:00"
    action:
      - delay:
          seconds: 30
      - condition: state
        entity_id: binary_sensor.front_door_person
        state: "off"
      - service: camera.snapshot
        target:
          entity_id: camera.front_door
        data:
          filename: "/config/www/snapshots/package_{{ now().strftime('%Y%m%d_%H%M%S') }}.jpg"
      - service: notify.mobile_app
        data:
          title: "Possible Package Delivery"
          message: "Someone was briefly at the front door"
```

### Recording Management

```yaml
# Frigate recording configuration
record:
  enabled: true
  retain:
    days: 7
    mode: motion  # all, motion, active_objects
  events:
    pre_capture: 5
    post_capture: 5
    retain:
      default: 30
      mode: active_objects
    objects:
      - person
      - car

# Manual clip creation
script:
  save_camera_clip:
    alias: "Save Camera Clip"
    sequence:
      - service: frigate.export_recording
        data:
          camera: "{{ camera }}"
          start_time: "{{ as_timestamp(now()) - 60 }}"
          end_time: "{{ as_timestamp(now()) }}"
          playback: realtime
```

### Camera Hardware Recommendations

| Use Case | Camera Type | Resolution | Features |
|----------|-------------|------------|----------|
| Front Door | Doorbell | 1080p+ | 2-way audio, HDR |
| Driveway | Bullet | 4K | IR, wide angle |
| Backyard | PTZ | 1080p+ | Pan/tilt/zoom |
| Indoor | Cube/Dome | 1080p | Privacy mode |
| Garage | Bullet | 1080p | Low light |

### Coral TPU Optimization

```yaml
# Frigate with Coral USB Accelerator
detectors:
  coral:
    type: edgetpu
    device: usb

# Multiple Coral devices
detectors:
  coral1:
    type: edgetpu
    device: usb:0
  coral2:
    type: edgetpu
    device: usb:1

# Coral M.2 or PCIe
detectors:
  coral:
    type: edgetpu
    device: pci
```

## Output Format

When configuring cameras:
1. Provide complete Frigate YAML configuration
2. Include Home Assistant camera and automation YAML
3. Note hardware requirements (Coral TPU recommended)
4. Specify RTSP stream URLs format
5. Include dashboard card configurations
