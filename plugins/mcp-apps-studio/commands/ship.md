---
name: ui:ship
intent: Take an agent UI from requirement to deployed and verified — protocol choice, scaffold, tools, component, hardening, audit, and host registration in one loop
tags:
  - mcp-apps-studio
  - command
  - delivery
inputs:
  - requirement
  - flags
risk: high
cost: high
description: The full loop — choose the protocol, scaffold, design the tool surface, build the View, harden CSP, audit against every target host, and verify it renders in each one before calling it done
---

# /ui:ship

One command from "we want users to approve expenses in chat" to a widget
rendering in every target host, with the audit clean.

## Usage

```
/ui:ship "let users approve expense reports inline with bulk actions"
/ui:ship --host chatgpt,m365-copilot "seat picker with checkout"
/ui:ship --protocol mcp-apps --into ./apps/approvals
/ui:ship --stop-after audit          # build and review, do not deploy
/ui:ship --existing                  # run the loop over an app that already exists
```

## Flags

| Flag | Effect |
|---|---|
| `--host <list>` | Target hosts. Drives portability checks and packaging. Default `claude,chatgpt`. |
| `--protocol` | Skip the protocol decision. |
| `--into <dir>` | Target directory. |
| `--existing` | Skip scaffolding; run design → harden → audit → verify over current code. |
| `--stop-after <stage>` | `protocol`, `scaffold`, `tools`, `component`, `harden`, `audit`, `verify`. |
| `--strict` | Advisories block progression. |

## The loop

**1 · Protocol** — `/ui:protocol`. Resolves who renders, whether native widgets
are required, and whether the agent is long-running. Records the decision and
what would change it.

**2 · Scaffold** — `/ui:new`. Server, View, build config, adapter module,
boundary schemas, versioned resource URI. Decoupled tools and text fallbacks by
construction.

**3 · Tools** — `/ui:tool`. Names, descriptions with trigger situations and
prerequisites, constrained schemas, the data/render split, `visibility: ["app"]`
on View-only helpers. Runs `--discovery` so the model actually reaches for it.

**4 · Component** — `/ui:component`. Display mode, all four states, host theme
and safe areas, WCAG AA, keyboard reach, feature-detected affordances.

**5 · Harden** — `/ui:csp` and `/ui:state`. Minimal derived CSP in the right
place, boundary validation, URL allowlists, host-mediated navigation, state in
the right tier, remount survival.

**6 · Audit** — `/ui:audit --host <targets>`. Everything, ranked, plus the
per-host portability matrix. Blocking findings stop the loop.

**7 · Verify** — `/ui:preview`. Inspector for shape, basic-host for the bridge,
then each real host. `/ui:copilot` runs automatically if Copilot is a target.

It does not report success until the widget has rendered and functioned in
**every** host in `--host`, and the text-only path completes the workflow
without the widget.

## Progress

```
/ui:ship --host chatgpt,m365-copilot "approve expense reports inline"

1 PROTOCOL   MCP Apps + Apps SDK extensions (feature-detected)
             rejected: A2UI (ChatGPT renders MCP Apps resources, not surfaces)
2 SCAFFOLD   ./expenses-ui — 9 files, react + ts, ui://expenses/v1.html
3 TOOLS      list_expenses (data) · approve_expense (data) · render_expenses (render)
             set_page (app-only)   discovery 5/5 phrasings resolve correctly
4 COMPONENT  inline card · 4 states · contrast 7.1:1 · 44 KB inlined
5 HARDEN     connectDomains ["https://api.expenses.example"] · resourceDomains []
             boundary schema ✓ · openLink ✓ · state tiers ✓ · remount survives ✓
6 AUDIT      0 blocking · 2 advisory (bundle 44 KB ok, empty-state copy thin)
             portability: requestModal not used ✓ · frameDomains not used ✓
7 VERIFY     Inspector ✓ · basic-host ✓ · ChatGPT ✓ · M365 Copilot ✓
             text-only fallback ✓ — approval completes without the widget

SHIPPED      2 advisories open — see docs/ui-audit.md
```

## Stops for a human

- The protocol decision when the requirement genuinely supports two answers.
- A capability that exists on one target host and not another, where the
  fallback is a product decision rather than a technical one.
- Any blocking audit finding that needs judgment (durable state placement, an
  ambiguous host-name branch).
- Anything that would deploy or register with an external service.

It will not paper over a host gap by silently dropping the feature.

## Related

- Every other `/ui:*` command — this composes them.
- Skill `protocol-selection` — stage 1.
- Skill `host-capability-matrix` — stages 6 and 7.
