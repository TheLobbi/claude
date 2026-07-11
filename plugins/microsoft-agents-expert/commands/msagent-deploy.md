---
name: msagent-deploy
intent: Deployment and channel publishing guidance for Microsoft agents
tags:
  - microsoft-agents-expert
  - deployment
  - publishing
inputs:
  - stack (agent-framework|m365-sdk|teams|copilot-studio|foundry)
  - target channels (m365-copilot|teams|web|api)
  - environment (dev|staging|prod)
risk: medium
cost: medium
description: Walk an agent from local dev to production - hosting, identity, channel registration, M365/Teams publishing, Copilot Studio environments, and Foundry deployment
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
---

# /msagent-deploy — Ship a Microsoft Agent to Production

Deployment is stack-specific; load the matching skill first, then walk the relevant path:

## Pro-code agents (Agent Framework / M365 Agents SDK / Teams)

1. **Hosting** — containerize or use Azure App Service/Container Apps; wire health checks;
   configuration via environment + Key Vault references, never baked-in secrets.
2. **Identity** — app registration (or managed identity), correct token audiences for the
   Activity protocol endpoint; Graph scopes admin-consented.
3. **Channel registration** — Azure Bot Service resource pointing at the messaging
   endpoint; per-channel enablement (Teams, M365 Copilot, web chat).
4. **M365/Teams publishing** — app manifest package, org catalog or store submission,
   admin approval flow; validate with the agents playground / test tool first.
5. **Rollout** — staged environments, versioned manifests, rollback = previous manifest +
   previous container tag.

## Copilot Studio agents

Environments + solutions ALM: build in dev solution → export managed solution → deploy via
pipeline to test/prod; channel publishing per environment; governance (DLP policies,
sharing limits) verified before go-live; monitor usage/credit consumption after launch.

## Foundry Agent Service

Project/resource setup, model deployment selection, agent + tool provisioning as code where
supported, Entra-based agent identity, network isolation options, and evaluation runs as a
pre-deploy gate.

## Deliverable

An ordered, environment-specific checklist with the exact artifacts to produce at each
step, plus a verification step per stage. Flag anything requiring tenant-admin action.
