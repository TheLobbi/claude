# cowork-marketplace Context Summary

## Plugin purpose
Browse, install, update, launch, and export cowork marketplace items backed by real plugin agents, skills, and commands. Supports 20 catalog items across 5 types, 9 pre-packaged bundles, and dual compatibility with Claude Code and Claude Desktop Cowork.

## Command index
- `commands/browse.md`
- `commands/bundle-export.md`
- `commands/bundles.md`
- `commands/collections.md`
- `commands/details.md`
- `commands/export.md`
- `commands/install.md`
- `commands/launch.md`
- `commands/stats.md`
- `commands/update.md`

## Agent index
- `agents/export-packager.md`
- `agents/marketplace-curator.md`
- `agents/session-orchestrator.md`

## Skill index
- `skills/cowork-sessions/`
- `skills/plugin-catalog/`
- `skills/plugin-packaging/`

## Catalog summary (v2.1.0)
20 items across 5 types backed by 20 installed plugins:
- 3 Templates, 4 Workflows, 3 Agent Configs, 7 Skill Packs, 3 Blueprints

### Claude Code Expert Suite bundle (accurate totals)
Commands: 21 | Agents: 26 | Skills: 49

## When to open deeper docs
| Signal | Open docs |
|---|---|
| Need to browse or install a catalog item | `commands/browse.md`, `commands/install.md` |
| Need to export or bundle plugins | `commands/export.md`, `commands/bundle-export.md` |
| Need catalog knowledge or stats | `skills/plugin-catalog/SKILL.md`, `commands/stats.md` |
| Need to launch a cowork session | `commands/launch.md`, `skills/cowork-sessions/SKILL.md` |

## When to open deeper docs
| Signal | Open docs | Why |
| --- | --- | --- |
| You need setup or usage details | README.md | Install steps and command/usage reference. |
| You are changing plugin behavior | the relevant commands/, agents/, or skills/ file | Source of truth for behavior. |
| You need the full inventory | commands/, agents/, skills/ directories | Complete list beyond this summary. |
