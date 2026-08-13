# __APP_TITLE__ — AG-UI server

Streams agent events to a frontend you own: progress, shared state, reasoning
steps, and human-in-the-loop interrupts.

This is **not** a widget format. If the requirement is a card inside someone
else's chat host, use `/ui:new --protocol mcp-apps` instead.

## Run

```bash
pip install -r requirements.txt
uvicorn agent:app --reload --port 8000     # POST http://localhost:8000/agent
```

## Frontend

CopilotKit speaks AG-UI natively — point its React components at `/agent` and
you have a working chat UI without building one. A custom frontend subscribes to
the event stream and reduces events into its own store.

Keep AG-UI shared state in a **separate store slice** from local UI state, or an
agent update will clobber the user's scroll position and selection.

## The contract

`RunStarted` → content events → `RunFinished` **or** `RunError`.

A stream that ends without a terminal event leaves the frontend spinning
forever. This hides in error paths: an HTTP 500 is not a `RunError`. Every
exception path in `agent.py` emits one — keep it that way.

## Event families

| Family | Events |
|---|---|
| Lifecycle | `RunStarted`, `RunFinished`, `RunError`, `StepStarted`, `StepFinished` |
| Text | `TextMessageStart/Content/End`, `TextMessageChunk` |
| Tool calls | `ToolCallStart/Args/End/Result`, `ToolCallChunk` |
| State | `StateSnapshot`, `StateDelta` (RFC 6902), `MessagesSnapshot` |
| Activity | `ActivitySnapshot`, `ActivityDelta` |
| Reasoning | `ReasoningStart/MessageStart/MessageContent/MessageEnd/End`, `ReasoningEncryptedValue` |
| Special | `Raw`, `Custom` |

`*Chunk` is the compact form — the middleware synthesizes start/content/end from
it. Use the explicit triple only when you need precise boundaries, and **never
mix both for one message** or the frontend renders it twice.

## Things that will bite you

- **Handle both `StateSnapshot` and `StateDelta`.** Delta-only breaks on
  reconnect; snapshot-only wastes bandwidth every tick. On a failed patch,
  request a snapshot rather than diverging silently.
- **`ToolCallArgs` streams incomplete JSON.** Render optimistically; do not act
  until `ToolCallEnd`.
- **Set `parent_run_id` for sub-agents.** Without it a delegation tree renders
  flat.
- **Preserve `raw_event`** when translating from a framework. It is the only way
  to debug a wrapped stream.
- **`ReasoningEncryptedValue` round-trips verbatim.** Never parse it, never drop
  it, never log its contents.
- **Pass the real `Accept` header** into `EventEncoder` — it selects SSE vs the
  binary protocol.

## Human-in-the-loop

Interrupts pause, approve, edit, and retry **without losing run state**. The
agent emits an interrupt, the frontend renders the affordance, the user's
decision resumes the same run. Do not implement this as cancel-and-restart —
that is not what the protocol offers and it loses everything.

Run `/ui:agui --hitl` to wire it in.
