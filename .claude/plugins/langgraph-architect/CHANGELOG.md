# Changelog

All notable changes to the langgraph-architect plugin are documented in this file.

## [1.1.0] - 2026-07-11

### Changed

- Migrated all Claude model references to the current model generation:
  - `claude-3-5-sonnet-20241022`, `claude-sonnet-4-5` / `claude-sonnet-4-5-20250929`, and `claude-sonnet-4` → `claude-sonnet-5` (commands, agent definitions, skills, MCP lib, templates, examples)
  - `claude-opus-4-5` and `claude-3-opus-20240229` → `claude-opus-4-8` (orchestration-master agent, graph/orchestration pattern skills, research-assistant example docs)
- Removed `temperature` arguments from `ChatAnthropic(...)` call sites and example model configs that now target `claude-sonnet-5` / `claude-opus-4-8` — sampling parameters are rejected (HTTP 400) on current-generation models.
- Removed deprecated `budget_tokens` thinking-budget settings from agent definitions (node-specialist, tool-integrator, edge-designer, state-engineer) — fixed thinking budgets are replaced by adaptive thinking on current models.

### Notes

- Generic, provider-agnostic `temperature` plumbing (multi-provider CLI flags in cli-wrapper-specialist, the MCP server's optional config-override schema, and the model-less hello_world example config) was intentionally left in place, as it does not unconditionally target a Claude model.
