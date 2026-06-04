---
name: ha-core
description: "Core Home Assistant API integration patterns, authentication, and entity management."
---

# Home Assistant Core Skill

Core Home Assistant API integration patterns, authentication, and entity management.

## Activation Triggers

Activate this skill when working with:
- Home Assistant REST API
- WebSocket API connections
- Entity state management
- Service calls
- Event bus subscriptions

## Authentication

### Long-Lived Access Token

```python
import httpx

class HAClient:
    def __init__(self, url: str, token: str):
        self.url = url.rstrip('/')
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    async def get_states(self) -> list:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.url}/api/states",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    async def get_state(self, entity_id: str) -> dict:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.url}/api/states/{entity_id}",
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    async def call_service(
        self,
        domain: str,
        service: str,
        data: dict = None,
        target: dict = None
    ) -> dict:
        payload = {}
        if data:
            payload.update(data)
        if target:
            payload["target"] = target

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/api/services/{domain}/{service}",
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            return response.json()
```

### TypeScript Client

```typescript
interface HAState {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

class HomeAssistantClient {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, '');
    this.token = token;
  }

  private get headers(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async getStates(): Promise<HAState[]> {
    const response = await fetch(`${this.url}/api/states`, {
      headers: this.headers
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async callService(
    domain: string,
    service: string,
    data?: Record<string, any>,
    target?: { entity_id?: string | string[] }
  ): Promise<any> {
    const response = await fetch(
      `${this.url}/api/services/${domain}/${service}`,
      {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ ...data, target })
      }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
}
```

## WebSocket API

### Real-Time State Updates

```python
import asyncio
import json
import websockets

class HAWebSocket:
    def __init__(self, url: str, token: str):
        self.url = url.replace('http', 'ws') + '/api/websocket'
        self.token = token
        self.message_id = 0
        self.ws = None

    async def connect(self):
        self.ws = await websockets.connect(self.url)
        # Wait for auth_required
        await self.ws.recv()
        # Send auth
        await self.ws.send(json.dumps({
            "type": "auth",
            "access_token": self.token
        }))
        # Wait for auth_ok
        result = json.loads(await self.ws.recv())
        if result["type"] != "auth_ok":
            raise Exception("Authentication failed")

    async def subscribe_events(self, event_type: str = None):
        self.message_id += 1
        msg = {
            "id": self.message_id,
            "type": "subscribe_events"
        }
        if event_type:
            msg["event_type"] = event_type
        await self.ws.send(json.dumps(msg))
        return self.message_id

    async def subscribe_state_changes(self, entity_id: str = None):
        self.message_id += 1
        msg = {
            "id": self.message_id,
            "type": "subscribe_trigger",
            "trigger": {
                "platform": "state"
            }
        }
        if entity_id:
            msg["trigger"]["entity_id"] = entity_id
        await self.ws.send(json.dumps(msg))
        return self.message_id

    async def listen(self):
        async for message in self.ws:
            yield json.loads(message)

# Usage
async def monitor_states():
    ws = HAWebSocket("http://homeassistant.local:8123", "token")
    await ws.connect()
    await ws.subscribe_events("state_changed")

    async for event in ws.listen():
        if event.get("type") == "event":
            data = event["event"]["data"]
            print(f"{data['entity_id']}: {data['new_state']['state']}")
```

## Entity Domains

| Domain | Description | Common Services |
|--------|-------------|-----------------|
| `light` | Lighting control | turn_on, turn_off, toggle |
| `switch` | On/off switches | turn_on, turn_off, toggle |
| `climate` | HVAC systems | set_temperature, set_hvac_mode |
| `cover` | Blinds, doors | open, close, set_position |
| `lock` | Smart locks | lock, unlock |
| `media_player` | Media devices | play, pause, volume_set |
| `fan` | Fans | turn_on, set_speed |
| `vacuum` | Robot vacuums | start, stop, return_to_base |
| `camera` | Security cameras | snapshot, record |
| `sensor` | Sensors | (read-only) |
| `binary_sensor` | Binary sensors | (read-only) |

## Service Call Patterns

### Light Control

```python
# Turn on with brightness
await ha.call_service("light", "turn_on", {
    "brightness_pct": 75,
    "color_temp_kelvin": 4000,
    "transition": 2
}, target={"entity_id": "light.living_room"})

# RGB color
await ha.call_service("light", "turn_on", {
    "rgb_color": [255, 100, 50]
}, target={"entity_id": "light.accent"})
```

### Climate Control

```python
# Set temperature
await ha.call_service("climate", "set_temperature", {
    "temperature": 72,
    "hvac_mode": "heat"
}, target={"entity_id": "climate.thermostat"})

# Set preset
await ha.call_service("climate", "set_preset_mode", {
    "preset_mode": "away"
}, target={"entity_id": "climate.thermostat"})
```

### Media Player

```python
# Play media
await ha.call_service("media_player", "play_media", {
    "media_content_id": "spotify:playlist:abc123",
    "media_content_type": "playlist"
}, target={"entity_id": "media_player.living_room"})

# Volume control
await ha.call_service("media_player", "volume_set", {
    "volume_level": 0.5
}, target={"entity_id": "media_player.living_room"})
```

## Error Handling

```python
from httpx import HTTPStatusError

async def safe_service_call(ha, domain, service, data, target):
    try:
        result = await ha.call_service(domain, service, data, target)
        return {"success": True, "result": result}
    except HTTPStatusError as e:
        if e.response.status_code == 401:
            return {"success": False, "error": "Authentication failed"}
        elif e.response.status_code == 404:
            return {"success": False, "error": "Service or entity not found"}
        else:
            return {"success": False, "error": str(e)}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

## Best Practices

1. **Use area and label targeting** for group operations
2. **Implement retry logic** for network failures
3. **Cache entity states** to reduce API calls
4. **Use WebSocket** for real-time monitoring
5. **Validate entity_ids** before service calls
6. **Handle unavailable states** gracefully
