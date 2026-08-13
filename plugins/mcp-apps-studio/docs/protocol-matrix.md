# Protocol matrix

The five agent-UI protocols side by side. Use `/ui:protocol` to apply this to a
specific requirement.

## What each one is for

| Protocol | One line |
|---|---|
| **MCP Apps** | An MCP server ships an HTML UI that a chat host renders in a sandboxed iframe. |
| **mcp-ui** | The same, plus `externalUrl`/`remoteDom` delivery and a legacy action protocol for older hosts. |
| **OpenAI Apps SDK** | MCP Apps plus ChatGPT-only capabilities layered on `window.openai`. |
| **A2UI** | The agent streams a JSON *description* of UI; the client renders it with its own native widgets. |
| **AG-UI** | The agent streams *events* — progress, state, reasoning, interrupts — to a frontend you own. |

## Discriminating axes

| Axis | MCP Apps | mcp-ui | Apps SDK | A2UI | AG-UI |
|---|---|---|---|---|---|
| Who renders | Chat host, iframe | Chat host, iframe | ChatGPT, iframe | Your client, native widgets | Your frontend |
| UI is | HTML/JS you author | HTML/JS/URL/DOM script | HTML/JS you author | JSON data | Events → your components |
| Portability | High | High + legacy hosts | ChatGPT-first | Very high | You own it |
| Design control | Total | Total | Total, within ChatGPT rules | The client's | Total |
| Injection surface | Sandboxed script | Sandboxed script | Sandboxed script | **None — data only** | None |
| Non-web surfaces | No | No | No | **Yes** | Depends |
| Streaming granularity | Tool input → result | Tool input → result | Tool input → result | Per component / data path | Per token / event |
| Long-running agents | Poor fit | Poor fit | Poor fit | Partial | **Purpose-built** |
| Human-in-the-loop | Via tool calls | Via actions | Via tool calls | Via actions | **First-class interrupts** |

## Wire format at a glance

### MCP Apps

```
resource   uri: ui://weather/v1.html
           mimeType: text/html;profile=mcp-app
tool       _meta: { ui: { resourceUri: "ui://weather/v1.html" } }
bridge     JSON-RPC 2.0 over postMessage
           View → host: ui/initialize, tools/call, resources/read, ui/message,
                        ui/update-model-context, ui/size-changed, ui/open-link,
                        ui/request-display-mode
           host → View: ui/notifications/{tool-input, tool-input-partial,
                        tool-result, initialized, tool-cancelled, teardown,
                        host-context-changed}
```

### mcp-ui

```
resource   createUIResource({ uri, content: { type: 'rawHtml' | 'externalUrl' | 'remoteDom', … } })
actions    postMessage { type: 'tool' | 'prompt' | 'link' | 'intent' | 'notify', payload }
async      messageId → ui-message-received → ui-message-response { response, error }
lifecycle  ui-lifecycle-iframe-ready, ui-lifecycle-iframe-render-data,
           ui-request-render-data
```

### OpenAI Apps SDK

```
standard   _meta.ui.resourceUri            ← prefer this
alias      _meta["openai/outputTemplate"]  ← legacy, still honored
extensions window.openai.{requestCheckout, uploadFile, selectFiles,
                          getFileDownloadUrl, requestModal,
                          widgetState, setWidgetState}
```

### A2UI

```
messages   createSurface · updateComponents · updateDataModel · deleteSurface
           callRendererFunction · agentFunctionResponse
components flat adjacency list; every surface has a canonical Surface → "root"
data       JSON Pointer paths; two-way binding on inputs; upsert semantics
actions    action.event (agent round trip) | action.functionCall (local)
schemas    common_types.json · agent_to_renderer.json · catalogs/*/catalog.json
```

### AG-UI

```
interface  run(input: RunAgentInput) -> Observable<BaseEvent>
lifecycle  RunStarted · RunFinished | RunError · StepStarted · StepFinished
text       TextMessageStart/Content/End · TextMessageChunk
tools      ToolCallStart/Args/End/Result · ToolCallChunk
state      StateSnapshot · StateDelta (RFC 6902) · MessagesSnapshot
activity   ActivitySnapshot · ActivityDelta
reasoning  ReasoningStart/MessageStart/MessageContent/MessageEnd/End
           ReasoningEncryptedValue
special    Raw · Custom · MetaEvent (draft)
```

## Valid combinations

| Combination | When |
|---|---|
| MCP Apps + Apps SDK extensions | Anything shipping to ChatGPT. Portable core, ChatGPT affordances feature-detected. |
| MCP Apps + mcp-ui | One server, both resource shapes, to reach hosts on either side of the extension's adoption. |
| AG-UI + A2UI | Fully-owned frontend. AG-UI carries the stream; A2UI payloads ride inside it. |
| AG-UI + MCP Apps | An MCP Apps View that opens an AG-UI stream for a long-running sub-task. |

## Quick answers

| Requirement | Choice |
|---|---|
| "Show a chart when my MCP tool returns data" | MCP Apps |
| "Ship an app in the ChatGPT directory" | MCP Apps + Apps SDK |
| "Add a widget to an M365 Copilot declarative agent" | MCP Apps (check the Copilot matrix) |
| "Render agent UI in our Flutter app" | A2UI |
| "Our design system must own every pixel" | A2UI |
| "Show agent progress and let users approve steps" | AG-UI |
| "We already host the dashboard as a web app" | mcp-ui `externalUrl` |
| "The host should render it with its own components" | mcp-ui `remoteDom` or A2UI |
| "Model output must never become executable markup" | A2UI |

## Anti-patterns

- **`window.openai` first.** Trades portability for capability the standard
  already covers.
- **A2UI for a ChatGPT widget.** ChatGPT renders MCP Apps resources, not A2UI
  surfaces.
- **AG-UI for one card.** The event machinery buys nothing on a single
  request/response.
- **MCP Apps for a 20-minute run.** One `tool-result`, no vocabulary for
  progress or interrupts.
- **`externalUrl` by default.** Costs an origin in CSP, a network hop, and an
  independent deploy.
- **A UI resource on every tool.** The most common performance defect in shipped
  apps.

## Keeping the exit cheap

1. Tools work without UI — always return `content` and `structuredContent`.
2. Bridge calls live behind one adapter module, not sprayed through components.
3. Feature-detect, never host-detect.
4. Version resource URIs.

With those four, `/ui:port` makes a protocol change a one-file edit.
