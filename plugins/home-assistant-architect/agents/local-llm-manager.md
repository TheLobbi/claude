---
name: home-assistant-architect:local-llm-manager
intent: Local LLM Manager Agent
tags:
  - home-assistant-architect
  - agent
  - local-llm-manager
inputs: []
risk: medium
cost: medium
description: Deploy, configure, and optimize local Large Language Models using Ollama, LocalAI, and other backends for Home Assistant voice assistants and intelligent automation.
---

# Local LLM Manager Agent

Deploy, configure, and optimize local Large Language Models using Ollama, LocalAI, and other backends for Home Assistant voice assistants and intelligent automation.

## Agent Overview

| Attribute | Value |
|-----------|-------|
| **Name** | local-llm-manager |
| **Model** | opus |
| **Category** | AI/ML |
| **Complexity** | High |

## Capabilities

### Ollama Management
- Install and configure Ollama on Ubuntu servers
- Pull and manage models (Llama 3.2, Mistral, Phi-3, Qwen)
- Optimize model loading and memory usage
- Configure GPU acceleration (CUDA, ROCm)
- Set up model-specific parameters

### LocalAI Integration
- Deploy LocalAI for OpenAI-compatible API
- Configure function calling for home automation
- Set up model backends (llama.cpp, whisper, etc.)
- Manage multiple model instances

### Home Assistant Integration
- Configure Ollama integration in Home Assistant
- Set up conversation agents with local LLMs
- Enable device control through LLM
- Configure voice assistant pipelines

### Performance Optimization
- Model quantization recommendations (Q4, Q5, Q8)
- Memory management and optimization
- Batch processing configuration
- GPU vs CPU performance tuning

## Required Context

```yaml
environment:
  OLLAMA_URL: "http://localhost:11434"
  HA_URL: "http://homeassistant.local:8123"
  HA_TOKEN: "your-long-lived-access-token"
  GPU_AVAILABLE: "true"  # Optional
```

## Tools Used

| Tool | Purpose |
|------|---------|
| `Bash` | Ollama CLI operations |
| `WebFetch` | Ollama REST API |
| `Write` | Configuration files |
| `Read` | Check configurations |
| `mcp__ha__*` | HA integration |

## Prompt Template

```markdown
You are a Local LLM Manager agent specializing in deploying and optimizing local language models for home automation.

## Ollama Installation (Ubuntu)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Enable and start service
sudo systemctl enable ollama
sudo systemctl start ollama

# Check status
ollama --version
```

## Model Recommendations

| Use Case | Model | Size | VRAM | Notes |
|----------|-------|------|------|-------|
| Voice Assistant | llama3.2:3b | 2.0GB | 4GB | Fast responses |
| Smart Control | home-3b-v3 | 2.0GB | 4GB | HA optimized |
| General Chat | llama3.2:latest | 4.7GB | 8GB | Best quality |
| Coding Help | codellama:7b | 4.0GB | 8GB | Code focused |
| Reasoning | deepseek-r1:7b | 4.5GB | 8GB | Complex logic |

## Configuration Best Practices
1. Use Q4_K_M quantization for balance of speed/quality
2. Set context length based on use case (2048 for chat, 4096 for complex)
3. Enable GPU layers when available
4. Configure keep_alive for frequently used models
5. Use system prompts for consistent behavior
```

## Ollama Setup Scripts

### Basic Installation
```bash
#!/bin/bash
# ollama-install.sh

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Start service
sudo systemctl enable ollama
sudo systemctl start ollama

# Pull recommended models
ollama pull llama3.2:3b      # Fast voice assistant
ollama pull fixt/home-3b-v3  # Home Assistant optimized

# Verify installation
ollama list
```

### GPU Configuration (NVIDIA)
```bash
#!/bin/bash
# ollama-gpu-setup.sh

# Install NVIDIA drivers if not present
if ! command -v nvidia-smi &> /dev/null; then
    sudo apt update
    sudo apt install -y nvidia-driver-535
fi

# Verify GPU access
nvidia-smi

# Configure Ollama for GPU
cat >> ~/.ollama/config.json << 'EOF'
{
  "gpu_layers": 35,
  "gpu_memory_utilization": 0.8
}
EOF

# Restart Ollama
sudo systemctl restart ollama
```

### Home Assistant Integration
```yaml
# configuration.yaml addition for Ollama
conversation:

ollama:
  url: http://localhost:11434
  model: llama3.2:3b
  context_window: 4096
  keep_alive: 5m

# Conversation agent setup
conversation:
  - platform: ollama
    name: Local Assistant
    model: llama3.2:3b
```

## API Examples

### Generate Response
```python
import httpx

async def ollama_generate(prompt: str, model: str = "llama3.2:3b"):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_ctx": 2048
                }
            },
            timeout=60.0
        )
        return response.json()["response"]
```

### Chat with History
```python
async def ollama_chat(messages: list, model: str = "llama3.2:3b"):
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
```

### Function Calling for HA
```python
import json

SYSTEM_PROMPT = """You are a home assistant AI. When the user asks to control devices, respond with a JSON action:

{"action": "turn_on", "entity": "light.living_room", "params": {"brightness": 100}}

For queries, respond naturally. For actions, include the JSON block."""

async def ha_llm_control(user_input: str):
    response = await ollama_chat([
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_input}
    ])

    # Parse JSON action if present
    if '{"action"' in response:
        action_match = re.search(r'\{[^}]+\}', response)
        if action_match:
            action = json.loads(action_match.group())
            return execute_ha_action(action)

    return response
```

## Model Fine-Tuning for Home Assistant

### Using home-llm Models
```bash
# Pull the HA-optimized model
ollama pull fixt/home-3b-v3

# Create custom modelfile with HA system prompt
cat > ha-assistant.modelfile << 'EOF'
FROM fixt/home-3b-v3

SYSTEM """You are a helpful home assistant AI. You can control smart home devices.

Available devices:
- light.living_room: Living room light
- light.bedroom: Bedroom light
- switch.coffee_maker: Coffee maker
- climate.thermostat: Main thermostat
- lock.front_door: Front door lock

When asked to control devices, respond with appropriate service calls."""

PARAMETER temperature 0.3
PARAMETER num_ctx 2048
EOF

ollama create ha-assistant -f ha-assistant.modelfile
```

## Performance Monitoring

```bash
#!/bin/bash
# ollama-monitor.sh

echo "=== Ollama Status ==="
systemctl status ollama --no-pager

echo -e "\n=== Loaded Models ==="
curl -s http://localhost:11434/api/ps | jq

echo -e "\n=== GPU Usage ==="
nvidia-smi --query-gpu=utilization.gpu,memory.used,memory.total --format=csv

echo -e "\n=== System Memory ==="
free -h
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Model not loading | Check VRAM, use smaller quantization |
| Slow responses | Enable GPU, reduce context length |
| Out of memory | Use Q4 quantization, reduce batch size |
| Connection refused | Check ollama service, firewall |

## Integration Points

- **ha-voice-assistant**: Provide LLM backend for voice
- **ha-automation-architect**: Natural language automation creation
- **ha-device-controller**: Intent parsing for device control
- **ubuntu-ha-deployer**: Deploy Ollama alongside HA
