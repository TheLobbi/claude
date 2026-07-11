---
name: msagent-choose
intent: Recommend the right Microsoft agent stack for a described use case
tags:
  - microsoft-agents-expert
  - stack-selection
  - architecture
inputs:
  - use case description
  - audience (internal|customer-facing|both)
  - team profile (pro-code|low-code|mixed)
  - constraints (channels, compliance, budget, existing investments)
risk: low
cost: medium
description: Interview-driven stack selection across Copilot Studio, M365 Agents SDK, Teams AI Library, Agent Framework, and Foundry Agent Service, ending in a concrete recommendation with rationale
allowed-tools:
  - Read
  - Glob
  - Grep
---

# /msagent-choose — Pick the Right Microsoft Agent Stack

Recommend which Microsoft agent technology (or combination) fits the user's use case,
and justify the choice against the alternatives.

## Process

1. **Load the decision matrix** from `skills/agent-interop/SKILL.md` before answering.
2. **Gather the facts** (ask only for what's missing; batch questions):
   - What should the agent do? Single-turn Q&A, multi-step tasks, or autonomous/background work?
   - Who uses it, and where — Teams, M365 Copilot, web, email, API?
   - Who builds and maintains it — makers (low-code), engineers (pro-code), or both?
   - Existing investments: Bot Framework bots, Semantic Kernel / AutoGen code, Power Platform,
     Azure OpenAI deployments?
   - Constraints: data residency, tenant governance, model choice, cost ceiling.
3. **Map to the matrix** — the shortcuts:
   - Maker-built, M365-channel, fastest time-to-value → **Copilot Studio**
   - Pro-code agent that must ship into M365 Copilot / Teams channels → **M365 Agents SDK**
     (hosting an **Agent Framework** or custom engine)
   - Teams-first UX (cards, meetings, message extensions) → **Teams AI Library** on the
     M365 Agents SDK
   - Code-first orchestration, multi-agent workflows, provider flexibility → **Agent Framework**
   - Hosted/managed agent runtime with built-in tools, threads, and enterprise identity →
     **Foundry Agent Service**
   - Most real systems combine two: pick a build layer (Copilot Studio or Agent Framework)
     and a hosting/channel layer (Foundry, M365 Agents SDK).
4. **Deliver the recommendation**: chosen stack(s), one-paragraph rationale, what you ruled
   out and why, migration/interop notes if they have existing assets, and the first three
   concrete steps. Offer `/msagent-scaffold` as the follow-up.

## Output format

A short report: **Recommendation** → **Why** → **Ruled out** → **First steps**. No more than
a page unless the user asks for depth.
