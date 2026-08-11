---
name: gh:security
intent: Triage CodeQL, Dependabot, and secret-scanning alerts ranked by reachability rather than raw severity
tags:
  - github-orchestrator
  - command
  - security
inputs:
  - scope
  - flags
risk: high
cost: high
description: Rank security alerts by whether the vulnerable code is actually reachable from an entry point, then remediate, suppress with justification, or escalate
---

# /gh:security

CVSS scores describe a vulnerability in the abstract. What matters is whether
*your* code can reach it. This command ranks by reachability first.

## Usage

```
/gh:security                      # triage all open alerts
/gh:security --triage GHSA-xxxx   # one advisory
/gh:security --secrets            # secret-scanning alerts only
/gh:security --codeql             # code-scanning alerts only
/gh:security --deps               # Dependabot alerts only
/gh:security --remediate          # apply the safe remediations
```

## Reachability ranking

For each dependency alert:

| Tier | Meaning | Priority |
| --- | --- | --- |
| **Reachable — exposed** | A call path exists from a network-facing entry point to the vulnerable symbol | Fix now |
| **Reachable — internal** | A call path exists, but only from internal/CLI entry points | Fix this cycle |
| **Present, unreachable** | The package is installed, the vulnerable symbol is never called | Batch with the next upgrade |
| **Dev-only** | `devDependencies`, not shipped | Batch; note it does still affect CI supply chain |
| **Transitive, unreachable** | Pulled in by another package, symbol never invoked | Batch |

The analysis names the actual path, so the ranking is auditable:

```
GHSA-xxxx  lodash  prototype pollution in `merge`
  REACHABLE — EXPOSED
  src/api/webhook.ts:41  handler(req)
    → src/billing/invoice.ts:88   buildInvoice(req.body)
      → lodash.merge(defaults, untrusted)     ← vulnerable symbol, attacker-controlled
  Fix: lodash 4.17.21. No API change. → /gh:deps --upgrade lodash
```

## Secret scanning

Any confirmed secret is handled in this order, and the order is not negotiable:

1. **Revoke first.** A secret in git history is compromised the moment it is
   pushed. Rotating is the fix; removing the commit is not.
2. **Then** remove it from the working tree and replace with an env/vault reference.
3. **Then** consider history rewrite — only with explicit human approval, and
   only after revocation, since a rewrite alone leaves the secret in forks,
   caches, and clones.

The plugin never prints a discovered secret value in output, a comment, or a
commit message — only its location and type.

## Code scanning (CodeQL)

Alerts are verified before they are acted on. Static analysis produces false
positives, and a "fix" for a false positive is churn plus risk. Each alert is
handed to `supply-chain-auditor` with the instruction to construct a concrete
exploitation path; alerts with no constructible path are dismissed as
`false positive` **with the reasoning recorded**, not silently closed.

## Suppression

Suppressing an alert requires a written justification stored with the
suppression — never a bare `// nosec` or a dismissed alert with no reason. The
justification must state why the code is unreachable or the risk is accepted,
and who accepted it.

## Never

- Never post vulnerability details on a public issue or PR before a fix ships.
- Never include a secret value, token, or key in any output or artifact.
- Never auto-merge a security fix that changes behavior without review — a
  rushed patch that breaks auth is worse than the vulnerability it fixed.

## Output

```
Security triage — 23 open alerts

REACHABLE, EXPOSED (2)     ← fix now
  GHSA-xxxx  lodash 4.17.15 → 4.17.21   prototype pollution   path shown above
  CodeQL     src/api/search.ts:62       SQL built by string concat, req.query.q

REACHABLE, INTERNAL (3)    ← this cycle
PRESENT, UNREACHABLE (11)  ← batch with next upgrade
DEV-ONLY (5)
DISMISSED (2)              ← false positives, reasoning recorded

Secrets: 1 confirmed
  AWS access key, .github/workflows/deploy.yml:31, first pushed 2026-06-02
  → REVOKE FIRST. Value not printed. Rotation runbook: docs/…
```

## Related

- [`security-sweep`](../workflows/security-sweep.json) — declarative form
- [`/gh:deps`](deps.md) — the upgrade side
- [`/gh:audit`](audit.md) — configuration posture, not alerts
- [`supply-chain-security`](../skills/supply-chain-security/SKILL.md)
