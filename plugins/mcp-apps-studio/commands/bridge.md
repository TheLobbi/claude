---
name: ui:bridge
intent: Implement, repair, or harden the host communication layer — the ui/* JSON-RPC bridge, window.openai extensions, mcp-ui actions, and the adapter that keeps components protocol-agnostic
tags:
  - mcp-apps-studio
  - command
  - bridge
inputs:
  - target
  - flags
risk: medium
cost: medium
description: Get the View talking to the host correctly — handler ordering, lifecycle coverage, feature-detected capabilities, and a single adapter module so components never touch a host API directly
---

# /ui:bridge

The bridge is where the subtle bugs live: a handler registered one line too
late, a capability assumed present, a `postMessage` accepted from the wrong
source. This command owns that layer.

## Usage

```
/ui:bridge                        # audit the existing bridge
/ui:bridge --adapter              # extract host calls into a HostBridge module
/ui:bridge --lifecycle            # verify handler coverage and ordering
/ui:bridge --capabilities         # add feature detection with real fallbacks
/ui:bridge --raw                  # emit a dependency-free postMessage bridge
/ui:bridge --fix
```

## Flags

| Flag | Effect |
|---|---|
| `--adapter` | Introduce `bridge.ts` and route every host call through it. |
| `--lifecycle` | Check `ontoolinput` / `ontoolresult` / `onteardown` / `onhostcontextchanged` coverage and that all handlers precede `connect()`. |
| `--capabilities` | Wrap every optional API in a detection guard with a defined fallback. |
| `--raw` | Generate a zero-dependency JSON-RPC-over-postMessage bridge (for hosts or frameworks where the SDK is not an option). |
| `--protocol` | `mcp-apps` (default), `mcp-ui`, `openai-apps-sdk`. |
| `--fix` | Apply mechanical findings. |

## What it checks

**Ordering** — the top failure mode.

```ts
// ✗ the first tool-result is lost
app.connect();
app.ontoolresult = render;

// ✓
app.ontoolresult = render;
app.ontoolinput  = skeleton;
app.onteardown   = flush;
app.connect();
```

**Coverage** — every lifecycle event either handled or explicitly declined:
`ontoolinput`, `ontoolinputpartial`, `ontoolresult`, `ontoolcancelled`,
`onteardown`, `onhostcontextchanged`.

**Message hygiene** — for hand-rolled bridges:

```ts
window.addEventListener("message", (event) => {
  if (event.source !== window.parent) return;      // required
  const msg = event.data;
  if (!msg || msg.jsonrpc !== "2.0") return;       // required
  // …correlate by msg.id, resolve/reject the pending promise
}, { passive: true });
```

Missing either guard means any frame on the page can drive your View.

**Capabilities** — no unguarded call to `requestDisplayMode`, `sendLog`,
`setWidgetState`, `requestModal`, `uploadFile`, `getFileDownloadUrl`,
`requestCheckout`, `onteardown`, or `onhostcontextchanged`. Each guard needs a
real fallback path, not a swallowed `try/catch`.

**No host-name branching.** `if (isChatGPT)` is a permanent fork; it gets
rewritten to a capability test.

**Correct channel.** `ui/message` when the *user* should say something next;
`ui/update-model-context` when the model just needs to *know* something. Mixing
these produces a spammy transcript or a model that has no idea what the user
selected.

## The adapter

`--adapter` produces one module that every component imports:

```ts
export interface HostBridge {
  onToolInput(cb: (input: unknown) => void): void;
  onToolResult(cb: (result: ToolResult) => void): void;
  callTool(name: string, args: unknown): Promise<ToolResult>;
  sendMessage(text: string): Promise<void>;
  updateModelContext(ctx: unknown): Promise<void>;
  openLink(url: string): Promise<void>;
  setSize(w: number, h: number): void;
  requestDisplayMode(mode: DisplayMode): Promise<DisplayMode>;
  getContext(): HostContext | undefined;
  capabilities(): Capabilities;
}
```

This is what makes `/ui:port` a one-file change instead of a rewrite. It also
makes the View unit-testable — inject a fake bridge and assert the DOM.

## Output

```
BRIDGE  src/mcp-app.tsx

ORDERING
  ✗ app.ontoolresult assigned AFTER app.connect() (line 34)
       → the initial tool-result is dropped; widget renders empty until a manual refresh

COVERAGE
  ✓ ontoolinput   ✓ ontoolresult   ✗ onteardown (polling interval leaks)
  ⚠ onhostcontextchanged absent — acceptable, host support is not universal

CAPABILITIES
  ✗ window.openai.requestModal called unguarded (line 88) — undefined in Copilot
  ✗ host-name branch `if (isChatGPT)` (line 51)  FIX  test for the capability
  ✓ setWidgetState guarded with ?.

HYGIENE
  ✗ message listener does not check event.source === window.parent

ADAPTER
  ⚠ 14 direct app.* calls across 6 components  FIX  --adapter

4 blocking · 2 advisory   --fix applies 3.
```

## Related

- Skill `mcp-apps-protocol` — every method and notification.
- Skill `host-capability-matrix` — what to guard and why.
- Skill `ui-porting-migration` — the adapter's payoff.
