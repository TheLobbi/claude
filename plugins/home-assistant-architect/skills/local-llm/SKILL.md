---
name: local-llm
description: "Deploy and integrate local LLMs with Ollama, LocalAI, and Home Assistant for privacy-focused voice assistants and automation."
---

# Local LLM Integration Skill

Deploy and integrate local LLMs with Ollama, LocalAI, and Home Assistant for privacy-focused voice assistants and automation.

## Activation Triggers

Activate this skill when:
- Setting up Ollama or LocalAI
- Configuring local voice assistants
- Integrating LLMs with Home Assistant
- Optimizing local model performance
- Building LLM-powered automations

## Ollama Installation

### Ubuntu/Debian
```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start as service
sudo systemctl enable ollama
sudo systemctl start ollama

# Pull models
ollama pull llama3.2:3b
ollama pull fixt/home-3b-v3  # HA-optimized
```

### Docker
```yaml
# docker-compose.yaml
services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ./ollama:/root/.ollama
    # GPU support (NVIDIA)
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

## Ollama API

### Generate Completion
```python
import httpx

async def generate(prompt: str, model: str = "llama3.2:3b") -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_ctx": 2048,
                    "top_p": 0.9
                }
            },
            timeout=60.0
        )
        return response.json()["response"]
```

### Chat Completion
```python
async def chat(messages: list, model: str = "llama3.2:3b") -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:11434/api/chat",
            json={
                "model": model,
                "messages": messages,
                "stream": False
            },
            timeout=60.0
        )
        return response.json()["message"]["content"]

# Usage
response = await chat([
    {"role": "system", "content": "You are a helpful home assistant."},
    {"role": "user", "content": "Turn on the living room lights."}
])
```

### Streaming
```python
async def stream_generate(prompt: str, model: str = "llama3.2:3b"):
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            "http://localhost:11434/api/generate",
            json={"model": model, "prompt": prompt},
            timeout=60.0
        ) as response:
            async for line in response.aiter_lines():
                if line:
                    chunk = json.loads(line)
                    yield chunk.get("response", "")
```

## Home Assistant Integration

### Ollama Conversation Agent
```yaml
# configuration.yaml
ollama:
  url: http://localhost:11434
  model: llama3.2:3b
  context_window: 4096
  keep_alive: 5m
  prompt_template: |
    You are a helpful home assistant AI. You can control smart home devices.

    When asked to control devices, respond with the action you're taking.
    Be concise and helpful.

conversation:
  - platform: ollama
    name: Local Assistant
```

### Home-LLM Integration
```yaml
# For the home-llm custom component
# Install via HACS

# configuration.yaml
home_llm:
  backend: ollama
  model: fixt/home-3b-v3
  url: http://localhost:11434
  max_tokens: 256
  temperature: 0.3
```

## Custom HA Agent with Function Calling

```python
import json
import re
from homeassistant.core import HomeAssistant

SYSTEM_PROMPT = """You are a home automation AI assistant.

When the user asks to control a device, respond with a JSON action block:
```json
{"action": "service_call", "domain": "light", "service": "turn_on", "target": {"entity_id": "light.living_room"}, "data": {"brightness_pct": 100}}
```

For information queries, respond naturally.
For device control, always include the JSON block.

Available entities:
{entities}
"""

async def process_command(
    hass: HomeAssistant,
    user_input: str,
    model: str = "llama3.2:3b"
) -> str:
    # Get available entities
    entities = []
    for state in hass.states.async_all():
        if state.domain in ["light", "switch", "climate", "cover", "lock"]:
            entities.append(f"- {state.entity_id}: {state.name}")

    system_prompt = SYSTEM_PROMPT.format(entities="\n".join(entities[:50]))

    # Call Ollama
    response = await chat([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_input}
    ], model=model)

    # Extract and execute JSON actions
    json_match = re.search(r'```json\s*({.*?})\s*```', response, re.DOTALL)
    if json_match:
        try:
            action = json.loads(json_match.group(1))
            if action.get("action") == "service_call":
                await hass.services.async_call(
                    action["domain"],
                    action["service"],
                    action.get("data", {}),
                    target=action.get("target")
                )
        except Exception as e:
            return f"Error executing action: {e}"

    return response
```

## Model Recommendations

| Use Case | Model | RAM | VRAM | Speed |
|----------|-------|-----|------|-------|
| Fast responses | llama3.2:1b | 2GB | 2GB | Very Fast |
| Voice assistant | llama3.2:3b | 4GB | 4GB | Fast |
| HA control | fixt/home-3b-v3 | 4GB | 4GB | Fast |
| General chat | llama3.2:8b | 8GB | 8GB | Medium |
| Complex tasks | mistral:7b | 8GB | 8GB | Medium |
| Reasoning | deepseek-r1:7b | 8GB | 8GB | Slow |

## Custom Modelfile

```dockerfile
# ha-assistant.modelfile
FROM llama3.2:3b

# System prompt for HA
SYSTEM """You are a helpful home automation assistant.

When asked to control devices, provide clear confirmation of actions.
When asked about device states, check current status and report accurately.
Be concise and helpful. Avoid unnecessary explanations.

Format device control responses as:
"Done! [What was changed]"

Format status queries as:
"The [device] is currently [state]."
"""

# Optimize for fast responses
PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER num_ctx 2048
PARAMETER stop "<|eot_id|>"

# Template
TEMPLATE """{{ if .System }}<|start_header_id|>system<|end_header_id|>

{{ .System }}<|eot_id|>{{ end }}{{ if .Prompt }}<|start_header_id|>user<|end_header_id|>

{{ .Prompt }}<|eot_id|>{{ end }}<|start_header_id|>assistant<|end_header_id|>

{{ .Response }}<|eot_id|>"""
```

```bash
# Create the model
ollama create ha-assistant -f ha-assistant.modelfile

# Test it
ollama run ha-assistant "Turn on the kitchen lights"
```

## Performance Optimization

### GPU Configuration
```bash
# Check GPU availability
nvidia-smi

# Set GPU layers in Ollama
export OLLAMA_NUM_GPU=35

# For AMD GPUs
export HSA_OVERRIDE_GFX_VERSION=10.3.0
```

### Memory Management
```bash
# Limit VRAM usage
export OLLAMA_GPU_MEMORY_FRACTION=0.8

# Keep model in memory
curl http://localhost:11434/api/generate \
  -d '{"model": "llama3.2:3b", "keep_alive": "10m"}'
```

### Quantization
| Format | Size | Speed | Quality |
|--------|------|-------|---------|
| Q4_0 | Smallest | Fastest | Lower |
| Q4_K_M | Small | Fast | Good |
| Q5_K_M | Medium | Medium | Better |
| Q8_0 | Large | Slower | Best |
| F16 | Largest | Slowest | Original |

## LocalAI Alternative

```yaml
# docker-compose.yaml
services:
  localai:
    image: localai/localai:latest-aio-cpu
    container_name: localai
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - ./models:/models
    environment:
      - MODELS_PATH=/models
```

LocalAI provides OpenAI-compatible API:
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8080/v1",
    api_key="not-needed"
)

response = client.chat.completions.create(
    model="llama3.2:3b",
    messages=[
        {"role": "user", "content": "Turn on the lights"}
    ]
)
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Model not loading | Check VRAM, use smaller quantization |
| Slow responses | Enable GPU, reduce context length |
| Out of memory | Use Q4 quantization, reduce batch |
| Connection refused | Check ollama service status |
| Timeout errors | Increase client timeout, use streaming |
