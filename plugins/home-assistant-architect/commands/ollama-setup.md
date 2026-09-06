---
name: home-assistant-architect:ollama-setup
intent: Ollama Setup Command
tags:
  - home-assistant-architect
  - command
  - ollama-setup
inputs: []
risk: medium
cost: medium
description: Setup and configure Ollama for local LLM integration with Home Assistant.
---

# Ollama Setup Command

Setup and configure Ollama for local LLM integration with Home Assistant.

## Usage

```
/ollama-setup <action> [options]
```

## Actions

| Action | Description |
|--------|-------------|
| install | Install Ollama on the system |
| pull | Pull a model |
| list | List available models |
| status | Check Ollama status |
| configure | Configure for Home Assistant |
| benchmark | Run performance benchmark |

## Examples

```bash
# Install Ollama
/ollama-setup install

# Pull recommended models
/ollama-setup pull llama3.2:3b
/ollama-setup pull fixt/home-3b-v3

# Check status
/ollama-setup status

# Configure for HA integration
/ollama-setup configure

# Run benchmark
/ollama-setup benchmark llama3.2:3b
```

## Implementation

```markdown
You are a Local LLM Manager. Set up and configure Ollama for Home Assistant integration.

## Environment
- OLLAMA_URL: ${OLLAMA_URL:-http://localhost:11434}

## Install Flow

1. Check if Ollama is already installed
2. Install using official script
3. Start and enable service
4. Verify installation
5. Pull recommended models

## Installation Script

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Enable service
sudo systemctl enable ollama
sudo systemctl start ollama

# Pull recommended models
ollama pull llama3.2:3b
ollama pull fixt/home-3b-v3
```

## Configuration for HA

Add to configuration.yaml:
```yaml
ollama:
  url: http://localhost:11434
  model: llama3.2:3b
  context_window: 4096
  keep_alive: 5m
```

## Benchmark Script

```python
import time
import httpx

async def benchmark(model: str):
    prompts = [
        "What is 2+2?",
        "Turn on the living room lights",
        "What's the weather like?",
    ]

    results = []
    for prompt in prompts:
        start = time.time()
        response = await generate(prompt, model)
        elapsed = time.time() - start
        results.append({
            "prompt": prompt,
            "response_length": len(response),
            "time_seconds": elapsed
        })

    return {
        "model": model,
        "avg_time": sum(r["time_seconds"] for r in results) / len(results),
        "results": results
    }
```

## Recommended Models

| Model | Use Case | Size |
|-------|----------|------|
| llama3.2:1b | Fast responses | 1.3GB |
| llama3.2:3b | Voice assistant | 2.0GB |
| fixt/home-3b-v3 | HA optimized | 2.0GB |
| mistral:7b | General chat | 4.1GB |
```

## Output

Status and configuration results.
