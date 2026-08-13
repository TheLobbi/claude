---
name: ui:agui
intent: Implement or audit an AG-UI event stream — emitting the correct event sequence, SSE encoding, shared state snapshots and deltas, human-in-the-loop interrupts, and the frontend subscriber
tags:
  - mcp-apps-studio
  - command
  - ag-ui
inputs:
  - target
  - flags
risk: medium
cost: medium
description: Wire a long-running agent to a frontend — RunStarted through RunFinished, streamed text and tool calls, StateSnapshot/StateDelta, reasoning and activity events, interrupts, and CopilotKit or a custom subscriber
---

# /ui:agui

AG-UI answers "how does my frontend show what a long-running agent is doing,
share state with it, and let the user interrupt". It is not a widget format —
if you need a card inside someone else's chat host, you want `/ui:new
--protocol mcp-apps` instead.

## Usage

```
/ui:agui --server --lang python "research agent with live progress"
/ui:agui --wrap langgraph                  # emit AG-UI events from an existing framework
/ui:agui --frontend copilotkit
/ui:agui --frontend custom --framework react
/ui:agui --audit                           # check an existing stream
/ui:agui --hitl                            # add human-in-the-loop interrupts
```

## Flags

| Flag | Effect |
|---|---|
| `--server` | Scaffold the endpoint: `RunAgentInput` in, event stream out. |
| `--lang` | `python` (`ag_ui.core` + `ag_ui.encoder`) or `ts` (`@ag-ui/core`, `@ag-ui/client`). |
| `--wrap <framework>` | LangGraph, CrewAI, Microsoft Agent Framework, Google ADK, Pydantic AI, LlamaIndex. |
| `--frontend` | `copilotkit` or `custom`. |
| `--hitl` | Add pause/approve/edit/retry interrupts. |
| `--audit` | Verify event ordering, state handling, and terminal events. |

## Server

```python
from ag_ui.core import RunStartedEvent, TextMessageChunkEvent, RunFinishedEvent
from ag_ui.encoder import EventEncoder

async def stream(input: RunAgentInput, accept: str):
    encoder = EventEncoder(accept=accept)          # accept header picks SSE vs binary
    yield encoder.encode(RunStartedEvent(thread_id=input.thread_id, run_id=input.run_id))
    async for token in agent(input):
        yield encoder.encode(TextMessageChunkEvent(message_id=mid, delta=token))
    yield encoder.encode(RunFinishedEvent(thread_id=input.thread_id, run_id=input.run_id))
```

TypeScript wraps an existing agent by extending `AbstractAgent`:

```ts
class MyAgent extends AbstractAgent {
  run(input: RunAgentInput): Observable<BaseEvent> { /* emit events */ }
}
```

## What it enforces

**Ordering.** `RunStarted` → content events → `RunFinished` **or** `RunError`.
A stream that ends without a terminal event leaves the frontend spinning
forever — the single most common AG-UI defect.

**Chunk vs triple.** `TextMessageChunk` / `ToolCallChunk` are the compact form
and the middleware synthesizes start/content/end. Use the explicit triple only
when you need precise boundaries. Do not mix both for one message.

**State.** Emit `StateSnapshot` on connect and after any desync, `StateDelta`
(RFC 6902 JSON Patch) in between. The frontend must handle **both** — delta-only
breaks on reconnect, snapshot-only wastes bandwidth every tick. On a failed
patch, request a snapshot rather than diverging silently.

**Partial tool args.** `ToolCallArgs` streams incomplete JSON. Render
optimistically; do not act until `ToolCallEnd`.

**`parentRunId`.** Sub-agents nest through it. A frontend that ignores it
flattens a delegation tree into noise.

**`rawEvent` preserved.** When AG-UI is a translation layer over a framework,
`rawEvent` is the only way to debug the wrapped stream. Never strip it.

**`ReasoningEncryptedValue`.** Pass back verbatim on the next turn. Never parse
it, never drop it.

## Human-in-the-loop

`--hitl` wires pause/approve/edit/retry without losing run state: the agent
emits an interrupt, the frontend renders the approval affordance, the user's
decision resumes the same run. Combine with agent steering to let the user
redirect a run in flight.

## Frontend

CopilotKit speaks AG-UI natively — point its React components at the endpoint
and you have a working chat UI. A custom frontend subscribes to the observable
and reduces events into its own store; keep AG-UI shared state in a separate
slice from local UI state so an agent update cannot clobber scroll position.

## Audit output

```
AG-UI AUDIT  api/agent.py + web/src/agent-client.ts

EVENT FLOW
  ✓ RunStarted emitted with threadId and runId
  ✗ error path returns HTTP 500 with no RunError event
       → the frontend spins forever
  ⚠ TextMessageChunk and TextMessageStart/Content/End both used for one message

STATE
  ✓ StateSnapshot on connect
  ✗ frontend ignores StateDelta — full re-render on every tick
  ✗ failed JSON Patch swallowed → silent divergence   FIX  request a snapshot

STRUCTURE
  ⚠ parentRunId never set — sub-agent output renders flat
  ⚠ rawEvent stripped in the LangGraph adapter → wrapped stream is undebuggable

REASONING
  ✓ ReasoningEncryptedValue round-tripped verbatim

3 blocking · 3 advisory
```

## Related

- Skill `ag-ui-protocol` — the full event taxonomy.
- Skill `protocol-selection` — AG-UI vs MCP Apps.
- `/ui:a2ui` — declarative UI payloads that ride this stream.
