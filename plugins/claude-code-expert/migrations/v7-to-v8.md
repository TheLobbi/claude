# v7.6.0 → v8.0.0 Migration Matrix

Generated: 2026-04-16 · Phase 0 deliverable · See ULTRAPLAN.md §3

Legend: **→ skill:X** = content folded into skills-v8/X/SKILL.md · **→ MCP:tool_name** = content becomes MCP KB artifact(s) served by the named tool · **→ DELETE** = removed entirely (obsolete or covered elsewhere) · **→ CMD:Y** = becomes part of command Y · **KEEP** = unchanged

---

## Skills (49 → 14)

| v7 skill | Disposition | v8 destination | Notes |
|---|---|---|---|
| agentic-patterns | KEEP+shrink | skills-v8/agentic-patterns | Move 13 pattern templates → MCP:cc_kb_pattern_template; keep workflow |
| agent-lifecycle | MERGE | skills-v8/agent-teams | Lifecycle = a section of teams |
| agent-sdk | DELETE | — | External skill `claude-api` in productivity plugin already covers |
| agent-teams | MERGE | skills-v8/agent-teams | Absorb into single agent-teams skill |
| agent-teams-advanced | MERGE | skills-v8/agent-teams | Topology specifics → MCP:cc_kb_topology_kit |
| agent-team-topologies | MERGE | skills-v8/agent-teams + MCP:cc_kb_topology_kit | 5 kits → 5 JSON KB artifacts |
| autonomy-profiles | KEEP+shrink | skills-v8/autonomy + MCP:cc_kb_autonomy_profile | 4 profiles → 4 JSON KB artifacts |
| channels | MERGE | skills-v8/mcp | Channels = a flavor of MCP servers |
| channels-bootstrap | DELETE (content → MCP) | MCP:cc_kb_channel_server | 4 TypeScript server files → 4 .ts.txt KB artifacts |
| channels-user-guide | MERGE | skills-v8/mcp | User-facing content folded |
| checkpointing | DELETE | — | Native `schedule` + memory overlay supersedes |
| cicd-integration | DELETE (content → MCP) | MCP:cc_kb_workflow_pack | ci-cd recipes → workflow pack KB artifacts |
| cli-reference | DELETE (content → MCP) | MCP:cc_docs_full_reference | Already covered; enrich |
| common-workflows | DELETE (content → MCP) | MCP:cc_kb_workflow_pack | 7 packs → 7 JSON KB artifacts |
| computer-use | DELETE | — | MCP server `computer-use` ships its own instructions |
| configuration | DELETE (content → MCP) | MCP:cc_docs_settings_schema | Already covered; enrich |
| context-anchoring | MERGE | skills-v8/deep-code-intelligence | Anchoring = workflow step |
| context-budgeting | KEEP+shrink | skills-v8/context-budgeting | ≤250 lines; refs → references/compact-strategies.md |
| context-management | MERGE | skills-v8/context-budgeting | /compact and /clear are the same concern |
| cost-optimization | MERGE | skills-v8/model-routing | Cost lives with routing |
| council-review | DELETE | — | Content is in commands/cc-council.md + agents/cc-council-coordinator.md |
| deep-code-intelligence | KEEP+shrink | skills-v8/deep-code-intelligence | Evidence format → references/evidence-table-format.md |
| enterprise-security | MERGE | skills-v8/security-compliance | Combined skill |
| extended-thinking | DELETE | — | Covered by model-routing + external `extended-thinking` skill |
| git-integration | DELETE | — | Git MCP or built-ins cover it |
| hook-policy-engine | MERGE | skills-v8/hooks + MCP:cc_kb_hook_recipe | Pack table → skill; 8 pack scripts → KB |
| hook-script-library | DELETE (content → MCP) | MCP:cc_kb_hook_recipe | 6 scripts → 6 JSON KB artifacts |
| hooks-system | MERGE | skills-v8/hooks | Authoring workflow stays; recipes → MCP |
| ide-integrations | DELETE | — | MCP:cc_kb_lsp_config + plugin doctoring covers |
| lsp-integration | DELETE (content → MCP) | MCP:cc_kb_lsp_config | 18 language configs → 18 KB entries |
| mcp-servers | KEEP+shrink | skills-v8/mcp | Prompts coverage stays; server configs → MCP |
| memory-instructions | SPLIT | skills-v8/prompt-engineering + skills-v8/cc-second-brain | CLAUDE.md prose → prompt-engineering; engram conventions → cc-second-brain |
| model-routing | KEEP+shrink | skills-v8/model-routing | Cost table → references/cost-table.md |
| permissions-security | MERGE | skills-v8/security-compliance | Combined skill |
| plugin-development | KEEP+shrink | skills-v8/plugin-development | Manifest schema → references/manifest-schema.md |
| project-sync | KEEP+shrink | skills-v8/claude-code-sync | Sync workflow |
| prompt-engineering | KEEP+shrink | skills-v8/prompt-engineering | CLAUDE.md patterns → references/claude-md-patterns.md |
| research-routing | DELETE | — | Covered by agents/cc-research-orchestrator.md + external tools |
| runtime-selection | DELETE | — | Covered by commands/cc-help.md routing table |
| scheduled-tasks | DELETE | — | Use native `schedule` skill + MCP:cc_docs_schedule_recommend |
| self-healing-advanced | DELETE | — | Covered by commands/cc-debug.md + hooks |
| session-analytics | MERGE | skills-v8/context-budgeting | Analytics = context discipline |
| settings-deep-dive | DELETE (content → MCP) | MCP:cc_docs_settings_schema | Schema already a tool; enrich |
| slash-commands | DELETE | — | Covered by commands/cc-help.md routing |
| teams-collaboration | MERGE | skills-v8/agent-teams | Collaboration = teams topic |
| testing-workflows | DELETE | — | Native `testing` skill in productivity plugin covers |
| tools-reference | DELETE (content → MCP) | MCP:cc_docs_full_reference | Already covered |
| troubleshooting | DELETE | — | Covered by commands/cc-debug.md + agents/cc-debugger.md |
| worked-examples | DELETE | — | Tutorial content moves to docs/ and external `anthropic-skills` |
| **(new)** | CREATE | skills-v8/cc-second-brain | Engram conventions + consolidator usage |
| **(new)** | CREATE | skills-v8/claude-code-setup | Was: commands/cc-setup.md workflow body |

**Result**: 49 v7 skills → 14 v8 skills (32 DELETE, 15 MERGE/SPLIT into 12 keepers, 2 NEW).

---

## Commands (21 → 11)

| v7 command | Disposition | v8 destination | Notes |
|---|---|---|---|
| cc-agent | DELETE | — | Use Agent tool + `/cc-council` |
| cc-autonomy | KEEP | commands-v8/cc-autonomy | |
| cc-bootstrap | MERGE | commands-v8/cc-setup (--audit flag) | Bootstrap = audit subset of setup |
| cc-budget | DELETE | — | Covered by `/cc-intel` + MCP:cc_docs_compare |
| cc-channels | KEEP | commands-v8/cc-channels | |
| cc-cicd | DELETE | — | Covered by MCP:cc_kb_workflow_pack |
| cc-config | MERGE | commands-v8/cc-sync (--fix-drift flag) | Config drift = sync concern |
| cc-council | KEEP | commands-v8/cc-council | |
| cc-debug | MERGE | commands-v8/cc-debug | Absorbs cc-troubleshoot |
| cc-help | KEEP+upgrade | commands-v8/cc-help | Routing table |
| cc-hooks | KEEP | commands-v8/cc-hooks | |
| cc-intel | KEEP | commands-v8/cc-intel | |
| cc-learn | DELETE | — | Workflow packs via MCP:cc_kb_workflow_pack |
| cc-mcp | DELETE | — | Covered by `/cc-setup --mcp-only` |
| cc-memory | KEEP+refit | commands-v8/cc-memory | Now wraps engram (search/export/consolidate/edit-always/status) |
| cc-orchestrate | KEEP | commands-v8/cc-orchestrate | |
| cc-perf | DELETE | — | Covered by `/cc-intel` |
| cc-schedule | DELETE | — | Use native `schedule` + MCP:cc_docs_schedule_recommend |
| cc-setup | KEEP+upgrade | commands-v8/cc-setup | Absorbs cc-bootstrap via --audit |
| cc-sync | KEEP+upgrade | commands-v8/cc-sync | Absorbs cc-config via --fix-drift |
| cc-troubleshoot | MERGE | commands-v8/cc-debug | Debug and troubleshoot are one concern |

**Shim discipline (per §9 decision 1)**: deleted commands leave a stub `commands/cc-{name}.md` at v8.0 that prints "Renamed: use /cc-{replacement}" and runs the replacement. Stubs removed in v8.1.

**Result**: 21 v7 commands → 11 v8 commands + 10 shims (5 DELETE permanently, 5 MERGE into keepers with shim redirect).

---

## Agents (26 → 18)

| v7 agent | Disposition | v8 destination | Notes |
|---|---|---|---|
| agent-lifecycle-manager | MERGE | agents/cc-team-orchestrator.md | Lifecycle = orchestrator concern |
| audit-reviewer | KEEP | agents/cc-audit-reviewer.md | |
| autonomy-planner | KEEP | agents/cc-autonomy-planner.md | |
| autonomy-reviewer | KEEP | agents/cc-autonomy-reviewer.md | |
| autonomy-verifier | KEEP | agents/cc-autonomy-verifier.md | |
| claude-code-architect | MERGE | agents/cc-principal-engineer-strategist.md + commands/cc-setup.md | CC-setup expertise is in the command |
| claude-code-debugger | MERGE | agents/cc-debugger.md | Generic debugger absorbs CC playbook |
| council-coordinator | KEEP | agents/cc-council-coordinator.md | |
| debugger | KEEP+upgrade | agents/cc-debugger.md | Absorbs claude-code-debugger |
| dependency-auditor | KEEP | agents/cc-dependency-auditor.md | |
| evaluator-optimizer | KEEP | agents/cc-evaluator-optimizer.md | |
| hooks-specialist | DELETE | — | skills-v8/hooks + MCP:cc_kb_hook_recipe covers |
| ide-integration-specialist | DELETE | — | MCP:cc_kb_lsp_config covers |
| implementer | KEEP | agents/cc-implementer.md | |
| mcp-configurator | DELETE | — | skills-v8/mcp + `/cc-setup --mcp-only` covers |
| migration-lead | KEEP | agents/cc-migration-lead.md | |
| pattern-router | KEEP | agents/cc-pattern-router.md | |
| permissions-security-advisor | MERGE | agents/cc-security-compliance-advisor.md | Combined role |
| plugin-architect | KEEP | agents/cc-plugin-architect.md | |
| principal-engineer-strategist | KEEP | agents/cc-principal-engineer-strategist.md | |
| release-coordinator | KEEP | agents/cc-release-coordinator.md | |
| research-orchestrator | KEEP | agents/cc-research-orchestrator.md | |
| sdk-guide | DELETE | — | External `claude-api` skill covers |
| security-compliance-advisor | KEEP+upgrade | agents/cc-security-compliance-advisor.md | Absorbs permissions-security-advisor |
| team-orchestrator | KEEP+upgrade | agents/cc-team-orchestrator.md | Absorbs agent-lifecycle-manager + teams-architect |
| teams-architect | MERGE | agents/cc-team-orchestrator.md | |
| **(new)** | CREATE | agents/cc-memory-consolidator.md | Opus, read-only engram, write memory/rules/ |

**Result**: 26 v7 agents → 18 v8 agents (9 DELETE/MERGE, 17 KEEP, 1 NEW).

---

## Other files

| v7 file | Disposition | v8 destination |
|---|---|---|
| CLAUDE.md | REWRITE | CLAUDE.md (≤120 lines, routing only, engram-aware) |
| CONTEXT_SUMMARY.md | DELETE | — (replaced by concise `plugin.json.context.summary`) |
| README.md | REWRITE | README.md (≤300 lines, reflects v8 shape) |
| CHANGELOG.md | APPEND | CHANGELOG.md (add `## [8.0.0]` entry) |
| .claude-plugin/plugin.json | REWRITE | version 8.0.0, new context block, ≤8 lazyLoadSections, ≤30 keywords |
| mcp-server/src/index.js | EXPAND | 15 → 22 tools; version 5.0.0; KB loaded from mcp-server/kb/ |
| mcp-server/kb/ | CREATE | Per-domain JSON and .ts.txt artifact files |
| memory/ | CREATE | rules/{cc-always,cc-patterns,DRAFT}.md + digests/ + conventions.md + consolidate.log |

---

## Reachability verification checklist (Phase 6 gate)

Every v7 asset marked DELETE or MERGE must have its content reachable through at least one of:
- [ ] A v8 skill body
- [ ] An MCP KB tool artifact
- [ ] An MCP reference tool (cc_docs_*)
- [ ] A v8 command body
- [ ] A v8 agent system prompt
- [ ] An external skill (documented in ULTRAPLAN.md §2.4 notes)

**Spot-check script** (runs at Phase 6 gate):
```bash
# Example: verify channels-bootstrap content is reachable
grep -r "HMAC-SHA256" mcp-server/kb/channels/ || fail "channel server content lost"
grep -r "topic_key" skills/cc-second-brain/ || fail "engram conventions lost"
grep -r "5 Whys" agents/cc-debugger.md || fail "debug hypothesis protocol lost"
# ... (one assertion per DELETE/MERGE row above)
```
