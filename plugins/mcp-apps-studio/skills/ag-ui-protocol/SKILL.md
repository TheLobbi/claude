---
name: ag-ui-protocol
description: This skill should be used when integrating AG-UI — the full event taxonomy (lifecycle, text message, tool call, state, activity, reasoning, custom), RunAgentInput, SSE and binary transports, AbstractAgent/HttpAgent, STATE_DELTA JSON Patch, generative UI, human-in-the-loop interrupts, and CopilotKit frontends.
version: 1.0.0
trigger_phrases: [ag-ui, agui, RunAgentInput, HttpAgent, AbstractAgent, StateSnapshot, StateDelta, TextMessageChunk, ToolCallChunk, EventEncoder, copilotkit, agent event stream]
categories: [protocol, ag-ui, streaming, reference]
author: mcp-apps-studio
created: 2026-08-13
updated: 2026-08-13
---

# AG-UI — Agent User Interaction Protocol

AG-UI standardizes the **event stream between a long-running agent backend and
a user-facing frontend**. It is not a widget format. Where MCP Apps answers
"how does a tool render a card in a chat host", AG-UI answers "how does my app
show what the agent is doing, share state with it, and let the user interrupt".

Built on plain HTTP and WebSockets. Deliberately transport-agnostic and
deliberately tolerant of event-shape drift, so existing frameworks can adapt
their native formats with minimal work.

Use AG-UI when you own the frontend. Use MCP Apps when someone else's chat host
is the frontend. They compose: an MCP Apps View can drive an AG-UI stream inside
itself for a long-running sub-task.

## Core interface

```ts
run(input: RunAgentInput) -> Observable<BaseEvent>
```

`RunAgentInput` carries thread and run identifiers, message history
(role/content), available tools (name, description, parameters), context, and
forwarded properties.

`BaseEvent` — every event has:

```ts
{ type: string, timestamp?: number, rawEvent?: unknown }
```

`rawEvent` preserves the original framework event when AG-UI is a translation
layer. Keep it; it is what makes debugging a wrapped agent tractable.

## Event taxonomy

### Lifecycle

| Event | Fields |
|---|---|
| `RunStarted` | `threadId`, `runId`, `parentRunId?`, `input?` |
| `RunFinished` | `outcome?` (discriminated union), `result?` |
| `RunError` | `message`, `code?` |
| `StepStarted` | `stepName` |
| `StepFinished` | `stepName` |

`parentRunId` is how sub-agents nest. A frontend that ignores it will flatten a
delegation tree into noise.

### Text messages

| Event | Fields |
|---|---|
| `TextMessageStart` | `messageId`, `role` |
| `TextMessageContent` | `messageId`, `delta` |
| `TextMessageEnd` | `messageId` |
| `TextMessageChunk` | `messageId?`, `role?`, `delta?` |

`*Chunk` is the compact form: emit it alone and the middleware synthesizes
start/content/end. Use the explicit triple when you need precise boundaries.

### Tool calls

| Event | Fields |
|---|---|
| `ToolCallStart` | `toolCallId`, `toolCallName`, `parentMessageId?` |
| `ToolCallArgs` | `toolCallId`, `delta` |
| `ToolCallEnd` | `toolCallId` |
| `ToolCallResult` | `messageId`, `toolCallId`, `content`, `role?` |
| `ToolCallChunk` | `toolCallId?`, `toolCallName?`, `parentMessageId?`, `delta?` |

`ToolCallArgs` streams partial JSON. Render optimistically but treat it as
incomplete until `ToolCallEnd`.

### State

| Event | Fields |
|---|---|
| `StateSnapshot` | `snapshot` — the complete state |
| `StateDelta` | `delta` — RFC 6902 JSON Patch operations |
| `MessagesSnapshot` | `messages` — full conversation history |

Snapshot on connect and after any desync; delta for everything in between. A
frontend that only handles snapshots works but wastes bandwidth; one that only
handles deltas breaks on reconnect. Handle both.

### Activity

| Event | Fields |
|---|---|
| `ActivitySnapshot` | `messageId`, `activityType`, `content`, `replace?` |
| `ActivityDelta` | `messageId`, `activityType`, `patch` (RFC 6902) |

Activity is the "what is the agent doing right now" channel — progress bars,
sub-task lists, live status.

### Reasoning

| Event | Fields |
|---|---|
| `ReasoningStart` | `messageId` |
| `ReasoningMessageStart` | `messageId`, `role` |
| `ReasoningMessageContent` | `messageId`, `delta` |
| `ReasoningMessageEnd` | `messageId` |
| `ReasoningMessageChunk` | `messageId`, `delta?` |
| `ReasoningEnd` | `messageId` |
| `ReasoningEncryptedValue` | `subtype`, `entityId`, `encryptedValue` |

`ReasoningEncryptedValue` carries provider-encrypted reasoning you must pass
back verbatim on the next turn. Never drop it, never try to parse it.

### Special

| Event | Fields |
|---|---|
| `Raw` | `event`, `source?` |
| `Custom` | `name`, `value` |
| `MetaEvent` (draft) | `metaType`, `payload` |

`Custom` is the open extension point — use it for domain events your frontend
knows about and the protocol does not.

## Server implementation

**Python** — `ag_ui.core` (event types), `ag_ui.encoder` (SSE):

```python
from ag_ui.core import RunStartedEvent, TextMessageChunkEvent, RunFinishedEvent
from ag_ui.encoder import EventEncoder

async def stream(input: RunAgentInput, accept: str):
    encoder = EventEncoder(accept=accept)
    yield encoder.encode(RunStartedEvent(thread_id=input.thread_id, run_id=input.run_id))
    async for token in agent(input):
        yield encoder.encode(TextMessageChunkEvent(message_id=mid, delta=token))
    yield encoder.encode(RunFinishedEvent(thread_id=input.thread_id, run_id=input.run_id))
```

Pass the request's `Accept` header into `EventEncoder` — that is how it chooses
between text SSE and the binary protocol.

**TypeScript** — `@ag-ui/core` (types), `@ag-ui/client` (`HttpAgent`,
`AbstractAgent`):

```ts
import { AbstractAgent } from "@ag-ui/client";

class MyAgent extends AbstractAgent {
  run(input: RunAgentInput): Observable<BaseEvent> { /* emit events */ }
}
```

`HttpAgent` connects to any endpoint that accepts a POST and streams events
back. Extend `AbstractAgent` when you are wrapping a framework.

Ordering contract, always: `RunStarted` → content events → `RunFinished` or
`RunError`. A stream that ends without a terminal event leaves the frontend
spinning forever.

## Capabilities the protocol gives you

- Live token/event streaming with cancel and resume.
- Streaming tool output for long-running effects.
- Shared state, typed, read-only or read-write, event-sourced with conflict
  resolution.
- Generative UI — static (typed components the frontend already has) and
  declarative.
- Thinking-step visualization from traces and tool events.
- **Frontend tool calls** — typed handoff where the *frontend* executes the tool.
- Backend tool rendering as first-class events.
- **Human-in-the-loop interrupts** — pause, approve, edit, retry without losing state.
- Agent steering — redirect a running agent with live user guidance.
- Multimodal: files, images, audio, transcripts, voice, annotations.
- Sub-agents with nested delegation and scoped state.

## Frontend

CopilotKit speaks AG-UI natively — point its React components at your endpoint
and you get a working chat UI without building one. Custom frontends subscribe
to the observable and reduce events into their own store.

SDKs exist for Kotlin, Go, Dart, Java, and Rust in addition to TypeScript and
Python. Framework integrations include LangGraph, CrewAI, Microsoft Agent
Framework, Google ADK, AWS, Pydantic AI, and LlamaIndex.

## Why not just REST

REST and GraphQL assume a bounded request with a deterministic response. Agents
are long-running, nondeterministic, and compose. AG-UI makes state updates and
side effects first-class protocol elements instead of things you bolt on with
polling.

## Related

- `protocol-selection` — when AG-UI is the answer and when it is not.
- `a2ui-protocol` — declarative UI payloads that can ride an AG-UI stream.
- `ui-state-architecture` — reconciling AG-UI shared state with UI state.
