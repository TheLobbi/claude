# Changelog

## [2.1.0] - 2026-07-11

### Changed

- Migrated all Claude model references to the current generation: `claude-sonnet-4-5`/`claude-sonnet-4-6` -> `claude-sonnet-5`, `claude-opus-4-5` -> `claude-opus-4-8`, `claude-haiku-4`/`claude-haiku-3-5-20250305` -> `claude-haiku-4-5` across the MCP server (`agents/__init__.py`, `langchain_tools.py`, `langgraph_engine.py`, `server.py`, `state_schemas.py`), commands, docs, and skills.

### Fixed

- Removed `temperature` arguments from `ChatAnthropic` calls targeting Sonnet 5 / Opus 4.8 — non-default sampling parameters return a 400 on these models.
- `langchain-integrations` skill: fixed `ChatAnthronic` typo, removed the invalid `thinking-budget-2024-11-01` beta header, and replaced the removed `budget_tokens` extended-thinking config with adaptive thinking (`{"type": "adaptive"}`).

## [2.0.1] - 2026-06-04

### Changed
- Refreshed all Claude Code model references to the June 2026 generation:
  - **Agent/command frontmatter**: pinned `model: claude-sonnet-4-5`
    (incl. `claude-sonnet-4-5-20250929`) and `claude-haiku-4-0` → bare aliases
    (`sonnet` / `haiku`), which auto-resolve to the latest generation.
  - **LangGraph code examples** (`skills/langchain-integrations`, agent bodies):
    `ChatAnthropic(model="claude-sonnet-4-5")` and `claude-opus-4-5` → current IDs
    `claude-sonnet-4-6` / `claude-opus-4-8`.
  - **MCP server overview + agent docs**: model-assignment tables and prose
    (`Sonnet 4.5` → `Sonnet 4.6`, `Opus 4.5` → `Opus 4.8`).
- Renamed the built-in `Task tool` → `Agent tool` in `commands/deploy` and
  `commands/orchestrate` to match current Claude Code terminology.

No agent logic or workflow behavior changed.
