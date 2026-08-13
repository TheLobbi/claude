---
name: ui:port
intent: Migrate an agent UI between protocols or SDKs, applying the mechanical field and API mappings and reporting what needs human judgment
tags:
  - mcp-apps-studio
  - command
  - migration
inputs:
  - from
  - to
risk: high
cost: medium
description: Move between OpenAI Apps SDK, MCP Apps, mcp-ui, A2UI, and AG-UI — introduces the adapter layer, applies the field mappings, dual-writes aliases during rollout, and flags every non-portable capability
---

# /ui:port

Ports are mechanical when an adapter layer exists and a rewrite when it does not.
This command establishes the adapter first, then migrates.

## Usage

```
/ui:port --from openai-apps-sdk --to mcp-apps
/ui:port --from mcp-ui --to mcp-apps
/ui:port --from mcp-apps --to a2ui
/ui:port --add ag-ui                        # additive, keeps the existing stack
/ui:port --a2ui-version 0.9-to-1.0
/ui:port --plan                             # report only, no changes
```

## Flags

| Flag | Effect |
|---|---|
| `--from` / `--to` | `openai-apps-sdk`, `mcp-apps`, `mcp-ui`, `a2ui`, `ag-ui`. |
| `--add <protocol>` | Layer a protocol on rather than replacing (AG-UI onto MCP Apps). |
| `--plan` | Produce the migration report without editing anything. |
| `--dual-write` | Keep legacy aliases alongside standard fields (default during rollout). |
| `--drop-aliases` | Remove legacy aliases. Run only once every supported host is verified. |
| `--a2ui-version <a-to-b>` | A2UI spec version migration. |

## Supported paths

| From → To | Nature |
|---|---|
| OpenAI Apps SDK → MCP Apps | Mechanical. De-risking, not rewriting — ChatGPT already implements MCP Apps. |
| mcp-ui legacy actions → `ui/*` bridge | Mostly mechanical. `intent`, `externalUrl`, `remoteDom` need decisions. |
| MCP Apps → A2UI | Reimplementation. The tool layer survives; the View does not. |
| A2UI v0.9 → v1.0 | Mechanical plus a theme-stripping pass. |
| + AG-UI | Additive. Wrap the agent in an event stream; keep the widget. |

## Order of operations

1. **Adapter first.** Route every host call through a `HostBridge` module so the
   port is one file, not every component. Runs `/ui:bridge --adapter` if needed.
2. **Server mapping.** Apply `_meta` field renames, dual-writing legacy aliases.
3. **View mapping.** Swap the API surface; keep feature-detected fallbacks for
   anything with no standard equivalent.
4. **Re-derive CSP.** Origins change with delivery mode — an `externalUrl`
   resource that becomes inline HTML has a completely different allowlist.
5. **Verify both.** No regression on the origin host; actually works on the new one.
6. **Drop aliases** only after step 5 passes everywhere.

## What has no equivalent

The command will not silently drop these — it reports each with options.

| Capability | Situation |
|---|---|
| `requestCheckout`, `uploadFile`, `selectFiles`, `getFileDownloadUrl`, `requestModal` | ChatGPT-only. Keep feature-detected. |
| `setWidgetState` durability | Portable substitute is `updateModelContext` for the model-visible slice; durable state moves to your server. |
| mcp-ui `intent` | Map to a generic `handle_intent` tool, or keep the post as an mcp-ui-host fallback. |
| mcp-ui `externalUrl` | Inline the app or serve it as the resource HTML; CSP changes. |
| mcp-ui `remoteDom` | Genuine rewrite. Usually the signal that A2UI is the right target. |
| A2UI theme properties (v0.9) | Removed in v1.0. Strip colors; move intent into catalog `instructions`. |

## Output

```
PORT PLAN   openai-apps-sdk → mcp-apps        12 files

ADAPTER
  ⚠ 18 direct window.openai.* calls across 7 components
       → introducing src/bridge.ts first; port becomes a 1-file change

SERVER (server.ts)
  _meta["openai/outputTemplate"]      → _meta.ui.resourceUri          (dual-write)
  _meta["openai/widgetCSP"]           → _meta.ui.csp
  connect_domains / resource_domains  → connectDomains / resourceDomains
  text/html+skybridge                 → text/html;profile=mcp-app  (RESOURCE_MIME_TYPE)

VIEW
  window.openai.toolOutput            → app.ontoolresult
  window.openai.callTool              → app.callServerTool
  window.openai.sendFollowUpMessage   → app.sendMessage
  window.openai.notifyIntrinsicHeight → app.sendSizeChanged
  window.openai.theme                 → app.getHostContext()?.theme

KEEP FEATURE-DETECTED (no standard equivalent)
  requestCheckout (checkout.tsx:44)   uploadFile (attach.tsx:19)
  setWidgetState (list.tsx:31)  — model-visible slice moves to updateModelContext

NEEDS A DECISION
  · Durable filter prefs currently in widget state → server storage, or accept loss?
  · `isChatGPT` branch at app.tsx:51 → which capability was it actually testing?

CSP
  ⚠ re-derive after the port — resourceDomains should collapse to [] once bundled

Run without --plan to apply. --drop-aliases only after verifying both hosts.
```

## Related

- Skill `ui-porting-migration` — every mapping table.
- Skill `protocol-selection` — whether the port is the right move at all.
- `/ui:bridge --adapter` — the prerequisite.
- `/ui:audit` — run after, on both hosts.
