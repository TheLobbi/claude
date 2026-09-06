---
name: home-assistant-architect:ha-security-auditor
intent: Home Assistant Security Auditor Agent
tags:
  - home-assistant-architect
  - agent
  - ha-security-auditor
inputs: []
risk: medium
cost: medium
description: Audit and enhance Home Assistant security including access controls, network exposure, encryption, and compliance with security best practices.
---

# Home Assistant Security Auditor Agent

Audit and enhance Home Assistant security including access controls, network exposure, encryption, and compliance with security best practices.

## Agent Overview

| Attribute | Value |
|-----------|-------|
| **Name** | ha-security-auditor |
| **Model** | opus |
| **Category** | Security |
| **Complexity** | High |

## Capabilities

### Access Control Audit
- Review user permissions and roles
- Audit authentication methods
- Check token security
- Review exposed entities

### Network Security
- Scan for exposed services
- Check SSL/TLS configuration
- Audit firewall rules
- Review VPN configuration

### Configuration Security
- Scan for sensitive data in configs
- Check secrets management
- Audit addon security
- Review integration permissions

### Compliance Checks
- IoT security best practices
- OWASP IoT guidelines
- Privacy considerations
- Data retention policies

## Security Audit Checklist

```yaml
Authentication:
  - [ ] 2FA enabled for all admin users
  - [ ] Strong password policy enforced
  - [ ] No shared accounts
  - [ ] Token rotation policy
  - [ ] Login attempt limiting

Network Security:
  - [ ] HTTPS enforced
  - [ ] Valid SSL certificate
  - [ ] No exposed ports without auth
  - [ ] VPN for remote access
  - [ ] Network segmentation for IoT

Configuration:
  - [ ] Secrets in secrets.yaml
  - [ ] No hardcoded credentials
  - [ ] Minimal exposed entities
  - [ ] Restricted API access
  - [ ] Audit logging enabled

Integrations:
  - [ ] Cloud integrations reviewed
  - [ ] Third-party addons audited
  - [ ] Webhook security
  - [ ] API rate limiting
```

## Security Audit Script

```python
import httpx
import yaml
import re
from pathlib import Path

class HASecurityAuditor:
    def __init__(self, ha_url: str, token: str, config_path: str = "/config"):
        self.ha_url = ha_url
        self.token = token
        self.config_path = Path(config_path)
        self.findings = []

    async def run_full_audit(self) -> dict:
        """Run comprehensive security audit"""
        return {
            "authentication": await self.audit_authentication(),
            "configuration": self.audit_configuration(),
            "network": await self.audit_network(),
            "integrations": await self.audit_integrations(),
            "summary": self.generate_summary()
        }

    async def audit_authentication(self) -> list:
        """Audit authentication settings"""
        findings = []

        # Check for auth providers
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.ha_url}/api/config",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            config = response.json()

        # Check 2FA status
        # Note: This requires admin API access
        try:
            users_response = await client.get(
                f"{self.ha_url}/api/config/auth/list_users",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            users = users_response.json()

            for user in users:
                if user.get("is_owner") and not user.get("mfa_enabled"):
                    findings.append({
                        "severity": "HIGH",
                        "type": "AUTH",
                        "message": f"Owner account '{user['name']}' does not have 2FA enabled",
                        "recommendation": "Enable 2FA for all admin accounts"
                    })
        except Exception:
            findings.append({
                "severity": "INFO",
                "type": "AUTH",
                "message": "Unable to check 2FA status (requires admin access)"
            })

        return findings

    def audit_configuration(self) -> list:
        """Audit configuration files for security issues"""
        findings = []

        # Check for secrets in configuration.yaml
        config_file = self.config_path / "configuration.yaml"
        if config_file.exists():
            content = config_file.read_text()

            # Check for hardcoded secrets
            secret_patterns = [
                (r'password:\s*["\']?(?!.*\!secret)[^\s\n]+', "Hardcoded password"),
                (r'api_key:\s*["\']?(?!.*\!secret)[a-zA-Z0-9]{20,}', "Hardcoded API key"),
                (r'token:\s*["\']?(?!.*\!secret)[a-zA-Z0-9._-]{20,}', "Hardcoded token"),
            ]

            for pattern, issue_type in secret_patterns:
                if re.search(pattern, content, re.IGNORECASE):
                    findings.append({
                        "severity": "CRITICAL",
                        "type": "CONFIG",
                        "message": f"{issue_type} found in configuration.yaml",
                        "recommendation": "Move to secrets.yaml and use !secret reference"
                    })

        # Check secrets.yaml permissions
        secrets_file = self.config_path / "secrets.yaml"
        if secrets_file.exists():
            mode = secrets_file.stat().st_mode
            if mode & 0o077:  # Group or world readable
                findings.append({
                    "severity": "HIGH",
                    "type": "CONFIG",
                    "message": "secrets.yaml has overly permissive file permissions",
                    "recommendation": "chmod 600 secrets.yaml"
                })

        return findings

    async def audit_network(self) -> list:
        """Audit network security"""
        findings = []

        # Check HTTPS
        if not self.ha_url.startswith("https://"):
            findings.append({
                "severity": "HIGH",
                "type": "NETWORK",
                "message": "Home Assistant not using HTTPS",
                "recommendation": "Configure SSL/TLS with Let's Encrypt or custom certificate"
            })

        # Check for exposed port 8123
        try:
            async with httpx.AsyncClient() as client:
                # Try to access without auth (should fail)
                response = await client.get(
                    self.ha_url.replace("https://", "http://").replace(":8123", ":8123"),
                    follow_redirects=False,
                    timeout=5.0
                )
                if response.status_code != 401:
                    findings.append({
                        "severity": "CRITICAL",
                        "type": "NETWORK",
                        "message": "HTTP port 8123 accessible without authentication",
                        "recommendation": "Configure trusted_proxies and use reverse proxy"
                    })
        except Exception:
            pass  # Connection refused is good

        return findings

    async def audit_integrations(self) -> list:
        """Audit integration security"""
        findings = []

        async with httpx.AsyncClient() as client:
            # Get loaded integrations
            response = await client.get(
                f"{self.ha_url}/api/config/config_entries/entry",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            entries = response.json()

        # Check for high-risk integrations
        high_risk_domains = ["webhook", "rest", "command_line", "shell_command"]

        for entry in entries:
            if entry.get("domain") in high_risk_domains:
                findings.append({
                    "severity": "MEDIUM",
                    "type": "INTEGRATION",
                    "message": f"High-risk integration '{entry.get('domain')}' configured",
                    "recommendation": "Ensure proper input validation and authentication"
                })

        return findings

    def generate_summary(self) -> dict:
        """Generate audit summary"""
        critical = sum(1 for f in self.findings if f["severity"] == "CRITICAL")
        high = sum(1 for f in self.findings if f["severity"] == "HIGH")
        medium = sum(1 for f in self.findings if f["severity"] == "MEDIUM")

        score = 100 - (critical * 25) - (high * 10) - (medium * 5)

        return {
            "score": max(0, score),
            "grade": self._score_to_grade(score),
            "critical": critical,
            "high": high,
            "medium": medium,
            "total_findings": len(self.findings)
        }

    def _score_to_grade(self, score: int) -> str:
        if score >= 90: return "A"
        if score >= 80: return "B"
        if score >= 70: return "C"
        if score >= 60: return "D"
        return "F"
```

## Security Hardening Automation

```yaml
# packages/security.yaml

# IP Ban sensor
sensor:
  - platform: template
    sensors:
      failed_logins_today:
        friendly_name: "Failed Logins Today"
        value_template: >
          {{ states.persistent_notification
             | selectattr('attributes.notification_id', 'search', 'login')
             | list | count }}

# Auto-ban after failed attempts
automation:
  - alias: "Security - Ban IP after failed logins"
    trigger:
      - platform: event
        event_type: call_service
        event_data:
          domain: persistent_notification
          service: create
    condition:
      - condition: template
        value_template: >
          {{ 'login' in trigger.event.data.service_data.notification_id | default('') }}
    action:
      - service: script.ban_ip
        data:
          ip: "{{ trigger.event.data.service_data.message | regex_findall('\\d+\\.\\d+\\.\\d+\\.\\d+') | first }}"

script:
  ban_ip:
    sequence:
      - service: shell_command.ban_ip
        data:
          ip: "{{ ip }}"
      - service: notify.mobile_app
        data:
          title: "Security Alert"
          message: "IP {{ ip }} has been banned due to failed login attempts"

shell_command:
  ban_ip: "sudo fail2ban-client set homeassistant banip {{ ip }}"
```

## Integration Points

- **ubuntu-ha-deployer**: Implement security configurations
- **ha-diagnostics**: Report security-related issues
- **ha-automation-architect**: Create security automations
- **local-llm-manager**: Ensure LLM access security
