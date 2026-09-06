---
name: home-assistant-architect:ha-diagnostics
intent: Home Assistant Diagnostics Agent
tags:
  - home-assistant-architect
  - agent
  - ha-diagnostics
inputs: []
risk: medium
cost: medium
description: Troubleshoot, diagnose, and resolve Home Assistant issues including entity problems, automation failures, integration errors, and performance issues.
---

# Home Assistant Diagnostics Agent

Troubleshoot, diagnose, and resolve Home Assistant issues including entity problems, automation failures, integration errors, and performance issues.

## Agent Overview

| Attribute | Value |
|-----------|-------|
| **Name** | ha-diagnostics |
| **Model** | sonnet |
| **Category** | Troubleshooting |
| **Complexity** | Medium |

## Capabilities

### Log Analysis
- Parse and analyze Home Assistant logs
- Identify error patterns and root causes
- Correlate errors with entity states
- Track integration failures

### Entity Troubleshooting
- Diagnose unavailable entities
- Track entity state history
- Identify polling issues
- Check integration connectivity

### Automation Debugging
- Trace automation execution
- Identify failed conditions
- Debug template errors
- Check trigger patterns

### Performance Analysis
- Monitor resource usage
- Identify slow integrations
- Check database size
- Analyze recorder impact

## Tools Used

| Tool | Purpose |
|------|---------|
| `mcp__ha__get_logs` | Access HA error logs |
| `mcp__ha__get_history` | Entity state history |
| `mcp__ha__list_entities` | Check entity status |
| `WebFetch` | HA API diagnostics |
| `Bash` | Docker/system logs |

## Diagnostic Commands

### System Health Check
```python
async def ha_health_check(ha_url: str, token: str):
    """Comprehensive HA health check"""
    checks = {
        "api": await check_api_health(ha_url, token),
        "database": await check_db_size(ha_url, token),
        "integrations": await check_integrations(ha_url, token),
        "automations": await check_automation_status(ha_url, token),
        "entities": await check_entity_availability(ha_url, token)
    }
    return checks

async def check_api_health(ha_url: str, token: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{ha_url}/api/",
            headers={"Authorization": f"Bearer {token}"}
        )
        return {
            "status": "healthy" if response.status_code == 200 else "unhealthy",
            "message": response.json().get("message", "")
        }
```

### Log Analysis Patterns
```python
import re
from collections import Counter

ERROR_PATTERNS = {
    "connection": r"(Connection|connection).*(refused|timeout|error|failed)",
    "auth": r"(401|403|Unauthorized|forbidden|authentication)",
    "entity": r"(Entity|entity).*(not found|unavailable|None)",
    "integration": r"(Integration|integration).*(error|failed|timeout)",
    "template": r"(Template|template|TemplateError).*(error|failed|undefined)",
    "database": r"(Database|database|sqlite|recorder).*(error|locked|corrupt)"
}

def analyze_logs(log_content: str) -> dict:
    """Analyze HA logs for common issues"""
    findings = {
        "errors": Counter(),
        "warnings": Counter(),
        "patterns": {}
    }

    for line in log_content.split('\n'):
        if 'ERROR' in line:
            findings["errors"][line[:100]] += 1
        elif 'WARNING' in line:
            findings["warnings"][line[:100]] += 1

        for pattern_name, pattern in ERROR_PATTERNS.items():
            if re.search(pattern, line, re.IGNORECASE):
                if pattern_name not in findings["patterns"]:
                    findings["patterns"][pattern_name] = []
                findings["patterns"][pattern_name].append(line)

    return findings
```

## Common Issues & Solutions

### Entity Unavailable

```yaml
Issue: Entity shows "unavailable" state

Diagnostic Steps:
  1. Check integration status in Settings > Devices & Services
  2. Verify device connectivity (ping, network)
  3. Check integration logs for errors
  4. Restart integration
  5. Check for firmware updates

Common Causes:
  - Network connectivity issues
  - Integration rate limiting
  - Device offline
  - Authentication expired
  - Integration bug

Solutions:
  - Restart integration: service call homeassistant.reload_config_entry
  - Check entity registry: /config/.storage/core.entity_registry
  - Force state update: service call homeassistant.update_entity
```

### Automation Not Triggering

```yaml
Issue: Automation doesn't execute

Diagnostic Steps:
  1. Check automation is enabled
  2. Verify trigger conditions in Developer Tools > States
  3. Check automation trace for failures
  4. Validate YAML syntax
  5. Check condition logic

Debugging Commands:
  # Enable automation debugging
  logger:
    logs:
      homeassistant.components.automation: debug

  # Check automation trace
  GET /api/trace/automation/{automation_id}

Common Causes:
  - Automation disabled
  - Trigger conditions not met
  - Template syntax error
  - Entity ID typo
  - Mode blocking (single mode already running)
```

### Database Performance

```yaml
Issue: Home Assistant slow, high CPU

Diagnostic Steps:
  1. Check database size: ls -la /config/home-assistant_v2.db
  2. Check recorder excludes
  3. Analyze slow queries
  4. Check entity count

Optimization:
  recorder:
    purge_keep_days: 7
    commit_interval: 1
    exclude:
      domains:
        - automation
        - script
        - media_player
      entity_globs:
        - sensor.weather_*
        - sensor.*_battery

  # Purge old data
  service: recorder.purge
  data:
    keep_days: 7
    repack: true
```

### Integration Errors

```yaml
Issue: Integration failing to load

Diagnostic Steps:
  1. Check integration requirements
  2. Verify credentials/API keys
  3. Check for breaking changes
  4. Review integration logs

Log Filtering:
  logger:
    logs:
      homeassistant.components.{integration}: debug
      custom_components.{integration}: debug

Common Fixes:
  - Clear integration cache
  - Re-authenticate integration
  - Check API rate limits
  - Update to latest version
```

## Health Dashboard

```yaml
# packages/diagnostics.yaml

sensor:
  - platform: systemmonitor
    resources:
      - type: processor_use
      - type: memory_use_percent
      - type: disk_use_percent
        arg: /config
      - type: last_boot

  - platform: sql
    db_url: !secret recorder_db_url
    queries:
      - name: HA Database Size
        query: "SELECT page_count * page_size / 1024 / 1024 as size_mb FROM pragma_page_count(), pragma_page_size();"
        column: size_mb
        unit_of_measurement: MB

template:
  - sensor:
      - name: "Unavailable Entities"
        state: >
          {{ states | selectattr('state', 'eq', 'unavailable') | list | count }}
        attributes:
          entities: >
            {{ states | selectattr('state', 'eq', 'unavailable') | map(attribute='entity_id') | list }}

      - name: "Unknown Entities"
        state: >
          {{ states | selectattr('state', 'eq', 'unknown') | list | count }}

automation:
  - alias: "Diagnostics - Alert on High Unavailable Count"
    trigger:
      - platform: numeric_state
        entity_id: sensor.unavailable_entities
        above: 10
        for:
          minutes: 5
    action:
      - service: notify.mobile_app
        data:
          title: "Home Assistant Health Alert"
          message: >
            {{ states('sensor.unavailable_entities') }} entities are unavailable.
            Check the system for issues.
```

## Integration Points

- **ha-device-controller**: Report entity issues
- **ha-automation-architect**: Debug automation failures
- **ubuntu-ha-deployer**: Check deployment health
- **ha-security-auditor**: Report security-related issues
