---
name: linear:agent
intent: Configure and operate Linear agents (AIG) — agent interaction, agent signals, OAuth actor authorization
tags:
  - linear-orchestrator
  - command
  - agent
  - aig
inputs:
  - action
risk: high
cost: low
description: Linear agents + AIG (linear.app/developers/agents, agent-interaction, agent-signals, aig)
---

# /linear:agent

Linear's agent surface (https://linear.app/docs/agents-in-linear, https://linear.app/developers/agents) lets external apps act as first-class assignees, post via OAuth Actor Authorization, and emit/consume agent signals.

## Actions

### `register --name <str> --webhook <url>`
- Registers an agent app via OAuth admin flow
- Required scopes: `read`, `write`, `agents:create`, `agents:signal`
- Records `agentId` for later use

### `list`
- Returns all agents installed in the workspace

### `signal --agent <id> --kind <kind> --payload <json>`
- Emits an agent signal (https://linear.app/developers/agent-signals)
- Kinds: `progress`, `completion`, `request_input`, `error`
- Linear renders signals as inline indicators on the issue

### `interact --issue <id> --action <type>`
- Used when an agent is assigned to an issue
- Triggers Linear's "Agent is working on this..." UI
- See: https://linear.app/developers/agent-interaction

### `revoke <agentId>`
- Revokes the agent's OAuth tokens; soft-deletes the agent

## OAuth Actor Authorization
When posting on behalf of a user (vs. as the app):
- Set `actor=user` when exchanging OAuth code
- Use `linear-actor-token` header on subsequent calls (https://linear.app/developers/oauth-actor-authorization)
- Tokens are short-lived (5 min) — refresh aggressively

## AIG (Agent Intelligence Gateway)
- Linear's gateway for agent-to-agent comms (https://linear.app/developers/aig)
- Used to coordinate between this plugin's agents and the Linear MCP server
- See `lib/aig.ts` for the wrapper

## Security
- **Never** check actor tokens into source control
- Rotate `agents:signal` scope keys quarterly
- Revoke agents on user offboarding
