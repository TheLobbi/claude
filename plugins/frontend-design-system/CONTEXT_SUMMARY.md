# frontend-design-system Context Summary

## Plugin purpose
Design styles with multi-tenant Keycloak theming and Chakra UI v3 output for AI-powered frontend development. Ships the `design-styles` MCP server (`mcp-server/`) and wires the official `chakra-ui` MCP server

## Command index
- `commands/audit.md`
- `commands/component.md`
- `commands/convert.md`
- `commands/keycloak.md`
- `commands/palette.md`
- `commands/style.md`
- `commands/theme.md`
- `commands/tokens.md`

## Agent index
- `agents/accessibility-auditor.md`
- `agents/component-designer.md`
- `agents/design-architect.md`
- `agents/responsive-specialist.md`
- `agents/style-implementer.md`
- `agents/theme-engineer.md`

## Skill index
- `skills/agentic-patterns/SKILL.md`
- `skills/chakra-ui-v3/SKILL.md`
- `skills/component-patterns/SKILL.md`
- `skills/css-generation/SKILL.md`
- `skills/design-styles/SKILL.md`
- `skills/keycloak-theming/SKILL.md`

## When-to-load guidance
- Load this summary first for routing, scope checks, and high-level capability matching.
- Open specific command/agent files only when the user asks for those workflows.
- Defer `skills/**` and long `README.md` documents until implementation details are needed.

## When to open deeper docs
Use this table to decide when to move beyond this summary.

| Signal | Open docs | Why |
| --- | --- | --- |
| You need setup, install, or execution details | `README.md`, `INSTALLATION.md`, or setup guides | Captures exact commands and prerequisites. |
| You are changing implementation behavior | `CONTEXT.md` and relevant source folders | Contains architecture, conventions, and deeper implementation context. |
| You are validating security, compliance, or rollout risk | `SECURITY*.md`, workstream/review docs | Provides controls, risk notes, and release constraints. |
| The summary omits edge cases you need | Any referenced deep-dive docs linked above | Ensures decisions are based on complete plugin-specific details. |

