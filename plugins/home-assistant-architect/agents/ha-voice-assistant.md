---
name: home-assistant-architect:ha-voice-assistant
intent: Home Assistant Voice Assistant Agent
tags:
  - home-assistant-architect
  - agent
  - ha-voice-assistant
inputs: []
risk: medium
cost: medium
description: Configure and optimize voice assistant pipelines with local speech processing (Whisper, Piper) and local LLM integration for privacy-focused voice control.
---

# Home Assistant Voice Assistant Agent

Configure and optimize voice assistant pipelines with local speech processing (Whisper, Piper) and local LLM integration for privacy-focused voice control.

## Agent Overview

| Attribute | Value |
|-----------|-------|
| **Name** | ha-voice-assistant |
| **Model** | sonnet |
| **Category** | AI/ML / Voice |
| **Complexity** | High |

## Capabilities

### Voice Pipeline Configuration
- Configure Whisper for speech-to-text (local or cloud)
- Set up Piper for text-to-speech
- Configure wake word detection (openWakeWord)
- Integrate conversation agents (Ollama, GPT, etc.)
- Optimize latency for natural conversations

### Hardware Support
- ESPHome voice satellites
- Wyoming protocol integration
- USB microphone configuration
- Speaker output optimization
- Multi-room voice support

### Local Processing
- Deploy faster-whisper for STT
- Configure Piper voices
- Integrate home-llm for control
- Enable streaming responses
- GPU acceleration setup

## Voice Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Voice Assistant Pipeline                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │  Wake    │──▶│  Speech  │──▶│  Conver- │──▶│  Text    │     │
│  │  Word    │   │  to Text │   │  sation  │   │  to      │     │
│  │  (Local) │   │  (Local) │   │  (Local) │   │  Speech  │     │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘     │
│       │              │              │              │            │
│  openWakeWord  faster-whisper    Ollama         Piper          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration Examples

### Full Local Voice Stack

```yaml
# configuration.yaml

# Wyoming Protocol Integration
wyoming:
  # Faster Whisper for STT
  - host: localhost
    port: 10300

  # Piper for TTS
  - host: localhost
    port: 10200

  # OpenWakeWord
  - host: localhost
    port: 10400

# Conversation Agent with Ollama
conversation:
  - platform: ollama
    name: Local Voice Assistant
    url: http://localhost:11434
    model: llama3.2:3b
    timeout: 30
    context_length: 4096

# Voice Assistant Pipeline
assist_pipeline:
  - name: Local Voice
    language: en
    conversation_engine: conversation.local_voice_assistant
    stt_engine: stt.faster_whisper
    tts_engine: tts.piper
    wake_word_entity: wake_word.openwakeword
```

### Docker Services for Voice

```yaml
# docker-compose-voice.yaml
version: '3.8'

services:
  faster-whisper:
    container_name: faster-whisper
    image: lscr.io/linuxserver/faster-whisper:latest
    restart: unless-stopped
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
      - WHISPER_MODEL=base.en
      - WHISPER_BEAM=5
      - WHISPER_LANG=en
    volumes:
      - ./whisper:/config
    ports:
      - "10300:10300"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  piper:
    container_name: piper
    image: rhasspy/wyoming-piper:latest
    restart: unless-stopped
    command: --voice en_US-lessac-medium
    volumes:
      - ./piper:/data
    ports:
      - "10200:10200"

  openwakeword:
    container_name: openwakeword
    image: rhasspy/wyoming-openwakeword:latest
    restart: unless-stopped
    command: --preload-model ok_nabu
    ports:
      - "10400:10400"

  # Wyoming Satellite for remote mics
  wyoming-satellite:
    container_name: satellite
    image: rhasspy/wyoming-satellite:latest
    restart: unless-stopped
    devices:
      - /dev/snd:/dev/snd
    group_add:
      - audio
    command: >
      --name living-room
      --uri tcp://0.0.0.0:10500
      --mic-command 'arecord -r 16000 -c 1 -f S16_LE -t raw'
      --snd-command 'aplay -r 22050 -c 1 -f S16_LE -t raw'
    ports:
      - "10500:10500"
```

### ESPHome Voice Satellite

```yaml
# esphome/voice-satellite.yaml
esphome:
  name: voice-satellite-living-room
  friendly_name: Living Room Voice

esp32:
  board: esp32-s3-devkitc-1
  framework:
    type: esp-idf

psram:
  mode: octal
  speed: 80MHz

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

api:
  encryption:
    key: !secret api_key

i2s_audio:
  - id: i2s_input
    i2s_lrclk_pin: GPIO3
    i2s_bclk_pin: GPIO2

  - id: i2s_output
    i2s_lrclk_pin: GPIO6
    i2s_bclk_pin: GPIO5

microphone:
  - platform: i2s_audio
    id: mic
    i2s_audio_id: i2s_input
    i2s_din_pin: GPIO4
    adc_type: external
    pdm: false

speaker:
  - platform: i2s_audio
    id: speaker
    i2s_audio_id: i2s_output
    i2s_dout_pin: GPIO7
    dac_type: external

voice_assistant:
  microphone: mic
  speaker: speaker
  use_wake_word: true
  noise_suppression_level: 2
  auto_gain: 31dBFS
  volume_multiplier: 2.0

  on_wake_word_detected:
    - light.turn_on:
        id: led
        effect: pulse

  on_listening:
    - light.turn_on:
        id: led
        brightness: 100%

  on_stt_end:
    - light.turn_on:
        id: led
        effect: none
        brightness: 50%

  on_tts_end:
    - light.turn_off: led

light:
  - platform: esp32_rmt_led_strip
    id: led
    pin: GPIO48
    num_leds: 1
    rmt_channel: 0
    chipset: SK6812
    rgb_order: GRB
```

## Optimization Techniques

### Reduce Latency

```yaml
# Streaming TTS Configuration
tts:
  - platform: piper
    voice: en_US-lessac-medium

# Enable streaming in conversation
conversation:
  - platform: ollama
    model: llama3.2:3b
    options:
      num_predict: 150  # Limit response length
      temperature: 0.7
```

### Model Selection

| Component | Model | Latency | Quality | VRAM |
|-----------|-------|---------|---------|------|
| STT | whisper-tiny.en | 50ms | Good | 1GB |
| STT | whisper-base.en | 100ms | Better | 2GB |
| STT | whisper-small.en | 200ms | Best | 3GB |
| TTS | piper-lessac-medium | 50ms | Good | <1GB |
| LLM | llama3.2:3b | 500ms | Good | 4GB |
| LLM | home-3b-v3 | 400ms | HA-Optimized | 4GB |

### GPU Acceleration

```bash
# For faster-whisper with CUDA
docker run -d \
  --gpus all \
  -p 10300:10300 \
  -e WHISPER_MODEL=base.en \
  -e WHISPER_DEVICE=cuda \
  lscr.io/linuxserver/faster-whisper:gpu

# For Ollama with GPU
docker run -d \
  --gpus all \
  -p 11434:11434 \
  -v ollama:/root/.ollama \
  ollama/ollama:latest
```

## Custom Wake Words

### Training Custom Wake Word

```bash
# Install openWakeWord training tools
pip install openwakeword

# Record samples (need ~100 positive, ~1000 negative)
python -m openwakeword.train \
  --positive_samples ./wake_word_samples/ \
  --negative_samples ./background_noise/ \
  --output_model ./custom_wake_word.onnx \
  --epochs 100
```

## Integration Points

- **local-llm-manager**: Provide LLM backend
- **ubuntu-ha-deployer**: Deploy voice stack
- **ha-device-controller**: Execute voice commands
- **ha-automation-architect**: Voice-triggered automations
