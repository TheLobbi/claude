---
name: supply-chain-security
description: This skill should be used when triaging dependency advisories, code-scanning alerts, or committed secrets — reachability analysis, revoke-first remediation, provenance, and maintenance risk signals.
version: 1.0.0
trigger_phrases: [dependabot, CodeQL, CVE, advisory, reachability, secret scanning, committed secret, SLSA, provenance]
categories: [security, supply-chain, dependencies, triage]
author: github-orchestrator
created: 2026-08-11
updated: 2026-08-11
---

# Supply Chain Security

## Rank by reachability, not CVSS

CVSS describes a vulnerability in the abstract. Reachability describes your
exposure. A critical CVE in a package whose vulnerable function you never call
is a batch-with-the-next-upgrade item. A medium CVE on your auth path is not.

| Tier | Definition |
| --- | --- |
| Reachable — exposed | A call path exists from a network-facing entry point to the vulnerable symbol |
| Reachable — internal | A path exists from internal or CLI entry points only |
| Present, unreachable | Installed; the vulnerable symbol is never called |
| Dev-only | `devDependencies` — not shipped, still in the CI supply chain |
| Transitive, unreachable | Pulled in by another package, never invoked |

**Print the path.** The ranking is only trustworthy if it is auditable:

```
src/api/webhook.ts:41  handler(req)              ← unauthenticated route
  → src/billing/invoice.ts:88  buildInvoice(req.body)
    → lodash.merge(defaults, untrusted)          ← vulnerable symbol
```

If you cannot construct a path, say **"no path found"** — not "probably
unreachable". The reader needs to know whether you looked or guessed.

## Committed secrets — revoke first

**A secret pushed to a remote is compromised.** Removing the commit does not
un-compromise it: it lives in forks, clones, CI caches, mirrors, and the events
API.

1. **Revoke.** Rotate at the source. Everything else is theatre until this is done.
2. **Remove.** Delete from the tree, replace with an env or vault reference.
3. **Rewrite history** — only with explicit approval, only after revocation, and
   knowing it invalidates every open PR and clone. Usually not worth it.
4. **Audit** the credential's activity during the exposure window.

**Never print a secret value** — not in output, logs, commits, issues, PR
comments, or telemetry. Type, file, line, and first-seen commit only.

### Reducing false positives

Test fixtures with obviously fake values (`sk_test_`, `AKIAIOSFODNN7EXAMPLE`) ·
placeholders in `.env.example` · public identifiers that look secret (publishable
keys, client ids) · high entropy from hashes, UUIDs, or base64 assets.

Report uncertain findings as "possible", with the reason — a wrong secret alert
costs a rotation nobody needed.

## Verifying code-scanning alerts

Static analysis produces false positives, and a fix for a false positive is
churn plus risk. Attempt to construct a concrete exploitation path for each
alert. Dismiss as false positive **only with the reasoning recorded** — the
sanitizer the analyzer missed, the framework escaping it did not model. A
silently dismissed alert is indistinguishable from an ignored one.

## Maintenance risk

A current version of an abandoned package is still a liability:

| Signal | Why |
| --- | --- |
| Last publish > 24 months | No fix is coming |
| Single maintainer, no org | Bus factor and account-takeover risk |
| **Recent maintainer change** | The most common compromise vector |
| Install scripts (`postinstall`) | Arbitrary code at install time |
| Deprecated by author | Migration is inevitable |
| High fan-in transitive | Large blast radius |

Recent maintainer change **plus** an install script is a security finding, not a
maintenance note.

## Provenance

Are artifacts built in CI with attestation, or uploaded from a laptop? Are
third-party actions pinned to a commit SHA — a tag is mutable, and a compromised
tag is a supply-chain compromise with your name on the commit. Are registry
credentials scoped to publish only what they should?

## Never

Never post vulnerability details publicly before a fix ships. Never suppress an
alert without a recorded justification and an accepter. Never auto-merge a
security fix that changes behavior without review — a rushed patch that breaks
auth is worse than the bug it fixed.

## See also

- `../commands/security.md` · `../commands/deps.md`
