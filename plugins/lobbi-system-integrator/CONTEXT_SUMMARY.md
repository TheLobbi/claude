# lobbi-system-integrator Context Summary

## Plugin purpose
API and system integration for connecting insurance AMS, mortgage LOS, CRM, and financial services platforms via REST/SOAP APIs, webhooks, and middleware. Covers connector design, webhook orchestration, data field mapping, error handling, rate limit management, and integration testing.

## Skill index
- `skills/api-connector/SKILL.md` — REST and SOAP API connector design with auth and pagination
- `skills/webhook-orchestrator/SKILL.md` — Webhook event routing and retry logic design
- `skills/data-mapper/SKILL.md` — Field mapping specs between source and destination systems
- `skills/error-handler/SKILL.md` — Integration error classification, retry strategies, and dead-letter handling
- `skills/rate-limiter/SKILL.md` — Rate limit detection, throttling, and backoff strategy design
- `skills/integration-tester/SKILL.md` — Integration test plan design with mock and contract testing

## Agent index
- `agents/integration-architect.md` — Architects point-to-point and hub-and-spoke integration patterns
- `agents/api-specialist.md` — Designs API connector implementations and authentication flows
- `agents/integration-tester.md` — Creates integration test suites and validates data fidelity

## When-to-load guidance
Load this summary first. Open specific skill files based on the integration component being designed.

## When to open deeper docs
| Signal | Open docs | Why |
| --- | --- | --- |
| You need setup or usage details | README.md | Install steps and command/usage reference. |
| You are changing plugin behavior | the relevant commands/, agents/, or skills/ file | Source of truth for behavior. |
| You need the full inventory | commands/, agents/, skills/ directories | Complete list beyond this summary. |
