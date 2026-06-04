# lobbi-workflow-engine Context Summary

## Plugin purpose
Design and automate multi-step approval workflows, intelligent routing, escalation policies, and SLA tracking for insurance agencies, mortgage companies, and financial services firms.

## Skill index
- `skills/approval-chain/SKILL.md` — Multi-step approval chain design with supervisor/manager/exec levels
- `skills/routing-rules/SKILL.md` — Attribute-based routing logic for documents and requests
- `skills/escalation-policy/SKILL.md` — Time-triggered escalation when approvals stall
- `skills/sla-tracker/SKILL.md` — SLA measurement configs and breach alerting
- `skills/notification-template/SKILL.md` — Email/Teams notification templates for workflow events
- `skills/workflow-audit/SKILL.md` — Audit trail specifications for FINRA/state regulatory requirements

## Agent index
- `agents/workflow-architect.md` — Designs end-to-end approval workflows from business requirements
- `agents/rule-designer.md` — Writes routing rules and conditional business logic
- `agents/escalation-manager.md` — Defines escalation paths, SLAs, and notification sequences

## When-to-load guidance
Load this summary first. Open specific skill files when the user asks for implementation details on a specific workflow component.

## When to open deeper docs
| Signal | Open docs | Why |
| --- | --- | --- |
| You need setup or usage details | README.md | Install steps and command/usage reference. |
| You are changing plugin behavior | the relevant commands/, agents/, or skills/ file | Source of truth for behavior. |
| You need the full inventory | commands/, agents/, skills/ directories | Complete list beyond this summary. |
