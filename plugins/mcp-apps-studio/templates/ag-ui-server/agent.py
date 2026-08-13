"""__APP_TITLE__ — AG-UI agent endpoint.

AG-UI carries the event stream between a long-running agent and a frontend you
own. The contract that matters most:

    RunStarted → content events → RunFinished OR RunError

A stream that ends without a terminal event leaves the frontend spinning
forever. That hides in error paths — an HTTP 500 is not a RunError. Every
exception path here emits one.
"""

from __future__ import annotations

import uuid
from typing import AsyncIterator

from ag_ui.core import (
    RunAgentInput,
    RunErrorEvent,
    RunFinishedEvent,
    RunStartedEvent,
    StateDeltaEvent,
    StateSnapshotEvent,
    StepFinishedEvent,
    StepStartedEvent,
    TextMessageChunkEvent,
    ToolCallArgsEvent,
    ToolCallEndEvent,
    ToolCallResultEvent,
    ToolCallStartEvent,
)
from ag_ui.encoder import EventEncoder
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse

app = FastAPI(title="__APP_TITLE__")


async def run_agent(payload: RunAgentInput, accept: str) -> AsyncIterator[str]:
    # Pass the request's real Accept header — that is how the encoder chooses
    # between text SSE and the binary protocol. Hardcoding it forfeits the
    # binary transport on clients that could use it.
    encoder = EventEncoder(accept=accept)
    message_id = str(uuid.uuid4())

    yield encoder.encode(
        RunStartedEvent(thread_id=payload.thread_id, run_id=payload.run_id)
    )

    try:
        # Snapshot on connect; deltas thereafter. The frontend must handle both —
        # delta-only breaks on reconnect, snapshot-only wastes bandwidth.
        yield encoder.encode(
            StateSnapshotEvent(snapshot={"phase": "starting", "findings": []})
        )

        yield encoder.encode(StepStartedEvent(step_name="research"))

        async for token in stream_tokens(payload):
            yield encoder.encode(
                TextMessageChunkEvent(message_id=message_id, role="assistant", delta=token)
            )

        # RFC 6902 JSON Patch. Apply in order; on a failed patch the frontend
        # should request a snapshot rather than diverge silently.
        yield encoder.encode(
            StateDeltaEvent(delta=[{"op": "replace", "path": "/phase", "value": "researched"}])
        )
        yield encoder.encode(StepFinishedEvent(step_name="research"))

        # Tool calls stream partial JSON in ToolCallArgs. Render optimistically;
        # do not act on the arguments until ToolCallEnd.
        tool_call_id = str(uuid.uuid4())
        yield encoder.encode(
            ToolCallStartEvent(
                tool_call_id=tool_call_id,
                tool_call_name="summarize",
                parent_message_id=message_id,
            )
        )
        yield encoder.encode(
            ToolCallArgsEvent(tool_call_id=tool_call_id, delta='{"style":"brief"}')
        )
        yield encoder.encode(ToolCallEndEvent(tool_call_id=tool_call_id))
        yield encoder.encode(
            ToolCallResultEvent(
                message_id=str(uuid.uuid4()),
                tool_call_id=tool_call_id,
                content="Summary produced.",
            )
        )

        yield encoder.encode(
            RunFinishedEvent(thread_id=payload.thread_id, run_id=payload.run_id)
        )

    except Exception as exc:  # noqa: BLE001 — every failure must terminate the stream
        yield encoder.encode(RunErrorEvent(message=str(exc), code="agent_error"))


async def stream_tokens(payload: RunAgentInput) -> AsyncIterator[str]:
    """Replace with your real agent. Yields text deltas."""
    last = payload.messages[-1].content if payload.messages else ""
    for word in f"Working on: {last}".split():
        yield word + " "


@app.post("/agent")
async def agent_endpoint(payload: RunAgentInput, request: Request) -> StreamingResponse:
    accept = request.headers.get("accept", "text/event-stream")
    return StreamingResponse(run_agent(payload, accept), media_type=accept)


# Sub-agents nest through parent_run_id. A frontend with no nesting information
# flattens a delegation tree into noise — set it whenever you delegate.
#
# When AG-UI wraps an existing framework (LangGraph, CrewAI, Microsoft Agent
# Framework, Google ADK, Pydantic AI, LlamaIndex), preserve `raw_event` on every
# translated event. It is the only way to debug a wrapped stream.
