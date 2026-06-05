# MCP Tools Reference — MCP server v5.0.0 (plugin v8.1)

22 tools in the plugin's MCP server. All tools are lazy-loaded on call; none consume context when idle beyond their metadata. With Claude Code's default Tool Search, even these tool *schemas* are deferred until `ToolSearch` matches them to a task — set `"alwaysLoad": true` on the server entry to override.

## Reference tools (15, `cc_docs_*`)

| Tool | Signature | Use |
|---|---|---|
| `cc_docs_search` | `(query)` | Full-text search across plugin skills/commands/agents |
| `cc_docs_list_topics` | `()` | List all documentation topics |
| `cc_docs_full_reference` | `(topic)` | Full content for a named topic |
| `cc_docs_env_vars` | `()` | Environment variables catalog |
| `cc_docs_settings_schema` | `()` | `.claude/settings.json` schema |
| `cc_docs_troubleshoot` | `(issue)` | Symptom → diagnostic section |
| `cc_docs_resolve_task` | `(task)` | Task → recommended commands/agents/skills/workflow |
| `cc_docs_model_recommend` | `(task, budget?)` | Model selection with cost |
| `cc_docs_checklist` | `(task_type)` | Checklist for named task type |
| `cc_docs_compare` | `(items[])` | Side-by-side comparison of 2-3 topics |
| `cc_docs_autonomy_plan` | `(task, repo_signals?)` | Autonomy plan for a task |
| `cc_docs_workflow_pack_recommend` | `(task)` | Shortlist workflow packs |
| `cc_docs_hook_pack_recommend` | `(signals?)` | Shortlist hook packs from repo signals |
| `cc_docs_team_topology_recommend` | `(task, complexity, team_size)` | Shortlist team topologies |
| `cc_docs_schedule_recommend` | `(task, requires_local_files?)` | Schedule blueprint + deployment profile |

## KB artifact tools (7, `cc_kb_*`)

All return one artifact ≤ 2 KB. Caller names the artifact. Use `*_recommend` tools above to get a shortlist of names.

| Tool | Signature | Returns |
|---|---|---|
| `cc_kb_hook_recipe` | `(name)` | Hook pack: script + event + matcher + settings.json snippet + verify |
| `cc_kb_topology_kit` | `(name)` | Topology: composition, file ownership, coordination, cost, anti-patterns |
| `cc_kb_workflow_pack` | `(name)` | Workflow pack: phases, steps, exit criteria, anti-patterns |
| `cc_kb_channel_server` | `(name)` | Channel server TypeScript implementation |
| `cc_kb_lsp_config` | `(language)` | LSP config: install, verify, diagnostics hook, notes |
| `cc_kb_pattern_template` | `(name)` | Agentic pattern: 5-layer wiring, cost, anti-patterns |
| `cc_kb_autonomy_profile` | `(profile)` | Profile: permissions, gates, session init, memory rules |

## Available KB artifacts (v8.0.0 — fully extracted)

### Hooks (13)

`auto-format-after-edit`, `direnv-reload-on-cwd-change`, `inject-context`, `lessons-learned-capture`, `on-stop`, `post-compact-context-restoration`, `protect-sensitive-files`, `security-guard`, `session-init`, `stop-until-tests-pass`, `task-completed-quality-gate`, `task-created-governance`, `teammate-idle-enforcement`

### Topologies (5)

`architect-implementer-reviewer`, `competing-hypotheses-debug`, `docs-migration-sprint`, `frontend-backend-test-squad`, `security-performance-test-review-board`

### Workflows (7)

`fix-bug-from-trace`, `generate-claude-md`, `migration-plan-before-edits`, `refactor-safely`, `repo-review-before-merge`, `tdd-implementation`, `understand-codebase`

### Channels (4)

`ci-webhook`, `discord-bridge`, `fakechat`, `mobile-approval`

### LSP (19)

`bash`, `csharp`, `dockerfile`, `elixir`, `go`, `graphql`, `java`, `php`, `prisma`, `python`, `ruby`, `rust`, `sql`, `svelte`, `tailwind`, `terraform`, `typescript`, `vue`, `yaml`

### Patterns (14)

`blackboard`, `eval-optimizer`, `evaluation-monitoring`, `guardrails`, `memory-management`, `multi-agent`, `orchestrator-workers`, `parallelization`, `planning`, `prompt-chaining`, `react`, `reflection`, `routing`, `tool-use`

### Autonomy (4)

`aggressive`, `balanced`, `conservative`, `unattended-review`

## Validation

Run `node mcp-server/test/tools.test.js` — every artifact is loaded, rendered, and size-checked (≤ 2 KB cap enforced).

## Total: 66 KB artifacts across 7 categories, all lazy-loaded on tool call.
