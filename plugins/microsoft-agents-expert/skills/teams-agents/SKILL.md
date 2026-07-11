---
description: Build Teams-native agents with the Teams SDK (formerly Teams AI Library v2) — App class, activity routing, adaptive cards, streaming, AI-generated labels, feedback, message extensions, Teams-as-MCP-server, and the bring-your-own-AI pattern with Agent Framework.
model: sonnet
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Teams Agents — Teams SDK

The **Teams AI Library is now renamed to Teams SDK** (branded "Teams AI Library v2" in some
docs) — rebuilt from the ground up for Teams-native agents. **GA for JavaScript and C#;
Python is developer preview. v1 is deprecated.**
Docs: https://learn.microsoft.com/microsoftteams/platform/teams-ai-library/welcome/overview
· Repos: microsoft/teams.ts, microsoft/teams.py

## Packages and CLI

- npm: **`@microsoft/teams.apps`** (the `App` class), `@microsoft/teams.api`
  (`MessageActivity` and friends), `@microsoft/teams.common`
- CLI: `npm i -g @microsoft/teams.cli@preview` → `teams new my-agent --template echo`

**Bring your own AI.** The SDK deprecated its own AI packages (`@microsoft/teams.ai`
ChatPrompt/Model, old `@microsoft/teams.mcp`, `@microsoft/teams.a2a`). The documented
pattern: run the agent loop with the OpenAI SDK or **Microsoft Agent Framework**
(`skills/agent-framework`) and wire MCP/A2A directly — Teams SDK handles activity routing
and Teams affordances.

## Minimal agent

```typescript
import { App } from '@microsoft/teams.apps';

const app = new App();
app.on('message', async ({ send, activity }) => {
  await send({ type: 'typing' });
  await send(`you said "${activity.text}"`);
});
app.start(process.env.PORT || 3978).catch(console.error);
```

## Agent Framework loop streaming into Teams (Python preview)

```python
@app.on_message
async def handle_message(ctx: ActivityContext[MessageActivity]):
    async for chunk in agent.run(ctx.activity.text or "", stream=True):
        if chunk.text:
            ctx.stream.emit(chunk.text)
    ctx.stream.emit(MessageActivityInput().add_ai_generated().add_feedback(mode="custom"))
```

## Teams-specific capabilities

| Capability | Notes |
|---|---|
| Adaptive Cards | Dialogs, message extensions, link unfurling — validate card JSON against the schema |
| Streaming | `ctx.stream.emit(...)` for progressive responses |
| AI-generated label | `.addAiGenerated()` — required UX for AI output in Teams |
| Feedback controls | `.addFeedback('custom')` — thumbs/feedback affordances on agent messages |
| Citations | Attach sources to generated answers |
| Prompt starters | Suggested first prompts in the agent's Teams surface |
| Proactive messages | Agent-initiated notifications to users/channels |
| Meetings | Meeting-aware agents (join context, transcripts where permitted) |
| Teams as MCP server | Expose Teams to agents: `notify` / `ask` / `request_approval` reach humans |
| Bot-to-bot A2A | Agent-to-agent conversations across Teams bots |

## Relationship to the M365 Agents SDK

Teams SDK is Teams-centric (collaborative, multi-user, meetings, real-time). To extend the
same agent to Outlook, M365 Copilot, and other channels, use the **M365 Agents SDK**
(`skills/m365-agents-sdk`) — which also ships `microsoft-agents-hosting-teams` for the
Teams surface. Both build and publish through the **Microsoft 365 Agents Toolkit**.

Rule of thumb: Teams-only experience → Teams SDK; multi-channel custom engine agent →
M365 Agents SDK, adding Teams affordances through its Teams hosting package.

## Practices

- Always attach the AI-generated label and feedback controls to model-generated messages —
  reviewers and store validation look for both.
- Stream long responses; Teams users perceive non-streaming agents as hung.
- Keep card payloads small and versioned; test dark mode and mobile rendering.
- Migrating from Teams AI v1 or Teams Toolkit projects: the toolkit is now the
  **Microsoft 365 Agents Toolkit** — see `/msagent-migrate` for the project-structure map.
