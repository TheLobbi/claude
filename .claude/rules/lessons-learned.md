# Lessons Learned - Auto-Captured

This file is automatically updated by hooks when errors occur.
Claude reads this at the start of each session to avoid repeating mistakes.

## Error Patterns and Fixes

<!-- Entries are auto-appended by the PostToolUseFailure hook -->
<!-- After fixing an issue, update the Status from NEEDS_FIX to RESOLVED and add the fix description -->

### Error: git checkout <old-sha> -- . re-added deleted files (2026-04-21T22:30:00Z)
- **Tool:** Bash
- **Input:** `git stash; git checkout 733ee9c -- .; pnpm check:plugin-schema; git checkout HEAD -- .`
- **Error:** `git checkout <sha> -- .` restored all files from that commit into the working tree AND index, including files that had been `git rm`'d at HEAD. A follow-up `git checkout HEAD -- .` did not un-stage or un-restore them — they remained as "new file:" entries, inflating the next commit.
- **Status:** RESOLVED
- **Fix:** Ran `git reset HEAD` to unstage, then `rm -rf <files>` on the restored working-tree copies. Working tree returned to clean HEAD state.
- **Prevention:** To diff/test against an older commit without mutating HEAD, use `git worktree add ../tmp-baseline <sha>` and run the comparison in the temp worktree — never `git checkout <sha> -- .` on the live worktree. If you must, record the exact file set at HEAD first (e.g. `git ls-files > /tmp/head-files`) and prune anything extra after reverting.


### Error: Bash failure (2026-02-24T08:18:00Z)
- **Tool:** Bash
- **Input:** `python3 << 'PYEOF' ... (background agent writing scripts to old rosa-microsoft-deploy path)`
- **Error:** FileNotFoundError: rosa-microsoft-deploy directory no longer exists (renamed to tvs-microsoft-deploy)
- **Status:** RESOLVED
- **Fix:** Background agent retained old path from initial prompt. Scripts already exist at tvs-microsoft-deploy/scripts/.
- **Prevention:** Stop all background agents before renaming directories. Background agents cannot detect mid-flight path changes.

### Error: Bash redirection in for loop
- **Tool:** Bash
- **Status:** RESOLVED
- **Fix:** `for f in "$dir"*.md 2>/dev/null` causes syntax error in bash eval
- **Prevention:** Use `find` or `ls | while read` instead of glob with redirection in for-in

### Error: Bash escapes `!=` in inline python
- **Tool:** Bash
- **Status:** RESOLVED
- **Fix:** Bash escapes `!` inside double-quoted strings. Use heredoc (`<< 'PYEOF'`) for multi-line python instead of inline `-c "..."`.
- **Prevention:** Always use heredoc for python scripts with `!=` or `!` operators.

### Error: EISDIR on directory path
- **Tool:** Read
- **Status:** RESOLVED
- **Fix:** Use `ls` or `Glob` for directories, `Read` for files only
- **Prevention:** Always check if path is a file before using Read tool

### Error: mcp__firecrawl__firecrawl_scrape failure (2026-02-28T01:18:10Z)
- **Tool:** mcp__firecrawl__firecrawl_scrape
- **Input:** `N/A`
- **Error:** Tool 'firecrawl_scrape' execution failed: Maximum number of redirects exceeded
- **Status:** RESOLVED
- **Fix:** Firecrawl hit redirect limit on target URL. Likely a redirect loop or bot-protection on the target site.
- **Prevention:** If firecrawl fails with redirect errors, try Perplexity MCP for the same information, or target a direct docs URL rather than a marketing/landing page.

### Error: git add on already-deleted files
- **Tool:** Bash
- **Status:** RESOLVED
- **Fix:** Files deleted with `git rm` are already staged; explicit `git add` fails with "pathspec did not match"
- **Prevention:** After `git rm`, use `git add -u` or just commit directly — don't re-add deleted files

### Error: Bash failure (2026-03-31T10:00:51Z)
- **Tool:** Bash
- **Input:** `cd C:/Users/MarkusAhling/pro/claude && git push origin main 2>&1`
- **Error:** Exit code 1
To https://github.com/markus41/claude.git
 ! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'https://github.com/markus41/claude.git'
hint: Updates were rejected because the tip of your current branch is behind
```
[...input truncated for brevity]

### Error: Bash failure (2026-03-28T16:19:59Z)
- **Tool:** Bash
- **Input:** `cd "c:/Users/MarkusAhling/pro/claude" && git stash pop 2>&1`
- **Error:** Exit code 1
Auto-merging .claude/rules/lessons-learned.md
CONFLICT (content): Merge conflict in .claude/rules/lessons-learned.md
Auto-merging plugins/claude-code-expert/.claude-plugin/plugin.json
CONFLICT (content): Merge conflict in plugins/claude-code-expert/.claude-plugin/plugin.json
```
[...input truncated for brevity]
Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
	modified:   .claude/CLAUDE.md
	new file:   .claude/rules/infra.md
	new file:   .claude/rules/memory-decisions.md
	new file:   .claude/rules/memory-patterns.md
	new file:   .claude/rules/memory-preferences.md
	new file:   .claude/rules/memory-profile.md
	new file:   .claude/rules/product.md
	new file:   .claude/rules/review.md
	new file:   .claude/rules/security.md
	new file:   .claude/sync-state.json
	new file:   .claude/templates/design-doc.md
	new file:   .claude/templates/incident-report.md
	new file:   .claude/templates/pr-description.md
	new file:   .claude/templates/test-plan.md
	modified:   .gitignore
	modified:   README.md
	new file:   docs/context/api-contracts.md
	new file:   docs/context/api-guidelines.md
	new file:   docs/context/architecture-deployment.md
	new file:   docs/context/architecture-runtime.md
	new file:   docs/context/architecture.md
	new file:   docs/context/changelog.md
	new file:   docs/context/compliance.md
	new file:   docs/context/constraints.md
	new file:   docs/context/data-migrations.md
	new file:   docs/context/data-model.md
	new file:   docs/context/decisions/adr-template.md
	new file:   docs/context/domain-glossary.md
	new file:   docs/context/ops-and-runbooks.md
	new file:   docs/context/performance.md
	new file:   docs/context/personas-and-use-cases.md
	new file:   docs/context/plan.md
	new file:   docs/context/project-overview.md
	new file:   docs/context/security-rules.md
	new file:   docs/context/test-inventory.md
	new file:   docs/context/testing-strategy.md
	new file:   docs/context/ux-flows.md
	new file:   docs/context/ux-principles.md
	new file:   docs/context/vision-and-roadmap.md
	modified:   plugins/claude-code-expert/CHANGELOG.md
	modified:   plugins/claude-code-expert/CLAUDE.md
	modified:   plugins/claude-code-expert/README.md
	new file:   plugins/claude-code-expert/commands/cc-sync.md
	new file:   plugins/claude-code-expert/skills/project-sync/SKILL.md

Unmerged paths:
  (use "git restore --staged <file>..." to unstage)
  (use "git add <file>..." to mark resolution)
	both modified:   .claude/rules/lessons-learned.md
	both modified:   plugins/claude-code-expert/.claude-plugin/plugin.json
	both modified:   plugins/claude-code-expert/CONTEXT_SUMMARY.md
	both modified:   plugins/claude-code-expert/commands/cc-setup.md

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	.claude/worktrees/

The stash entry is kept in case you need it again.
- **Status:** RESOLVED
- **Fix:** git stash pop encountered merge conflicts because the stashed changes conflicted with changes pulled from remote. The conflicts were in lessons-learned.md and claude-code-expert files. Resolved by manually editing the conflict markers in each file, then git add + git commit to complete the merge.
- **Prevention:** Before git stash pop, check if the pulled remote changes overlap with stashed files. If conflicts likely, resolve them one file at a time.

### Error: mcp__github__get_file_contents failure (2026-03-26T03:56:45Z)
- **Tool:** mcp__github__get_file_contents
- **Input:** `N/A`
- **Error:** Access denied: repository "mathews-tom/agentic-design-patterns" is not configured for this session. Allowed repositories: markus41/claude
- **Status:** RESOLVED
- **Fix:** WebFetch returned HTTP error (404/403/503) or content limit exceeded. URL was unavailable, moved, or access-restricted.
- **Prevention:** Use MCP tools instead of WebFetch: Perplexity MCP for knowledge queries, Firecrawl MCP for page scraping, Context7 MCP for library docs.

### Error: Bash failure (2026-03-08T09:15:54Z)
- **Tool:** Bash
- **Input:** `gh pr list --head claude/plugin-dev-2nziX --json number,title,url 2>&1`
- **Error:** Exit code 127
/bin/bash: line 1: gh: command not found

/bin/bash: line 1: gh: command not found
- **Status:** RESOLVED
- **Fix:** GitHub CLI (gh) was not installed, not authenticated, or restricted to allowed repos in the containerized environment.
- **Prevention:** In the current Windows environment, authenticate with: ! gh auth login. Only use GitHub MCP for allowed repos (markus41/claude).

### Error: mcp__github__resolve_review_thread failure (2026-03-27T06:10:34Z)
- **Tool:** mcp__github__resolve_review_thread
- **Input:** `N/A`
- **Error:** GitHub GraphQL error: GraphQL error: Could not resolve to a node with the global id of 'PRT_kwDOOYmw3s6XJG7l'.
- **Status:** RESOLVED
- **Fix:** WebFetch returned HTTP error (404/403/503) or content limit exceeded. URL was unavailable, moved, or access-restricted.
- **Prevention:** Use MCP tools instead of WebFetch: Perplexity MCP for knowledge queries, Firecrawl MCP for page scraping, Context7 MCP for library docs.

### Error: Bash failure (2026-03-14T16:34:26Z)
- **Tool:** Bash
- **Input:** `for f in commands/*.md; do echo "=== $(basename $f) ===" && grep -c "^| \`--" "$f" && echo "---"; done`
- **Error:** Exit code 1
=== analyze.md ===
0
=== auto-diagram.md ===
0
```
[...input truncated for brevity]

### Error: heredoc grep confusion
- **Tool:** Bash
- **Status:** RESOLVED
- **Fix:** Complex heredoc scripts with pipes caused grep to treat shell arguments as file paths
- **Prevention:** Use simple sequential `cmd | grep` pipes, not embedded in heredoc blocks

### Error: JSON structure assumption
- **Tool:** Bash
- **Status:** RESOLVED
- **Fix:** commands.minimal.json `commands` field is a flat list, not a dict of categories. Check structure before assuming dict.
- **Prevention:** Always inspect JSON structure with `type()` check before calling `.items()` on it.

### Error: WebFetch failure (2026-03-26T03:55:55Z)
- **Tool:** WebFetch
- **Input:** `N/A`
- **Error:** maxContentLength size of 10485760 exceeded
- **Status:** RESOLVED
- **Fix:** File exceeded token limit. Use Read with offset/limit parameters to read specific sections, or Grep for targeted content search.
- **Prevention:** Before reading a large file, use Grep to search for specific content, or Read with offset/limit to access specific sections.

### Error: Exit code from ls on non-existent directory
- **Tool:** Bash
- **Status:** RESOLVED
- **Fix:** `2>/dev/null` suppresses stderr but exit code still propagates
- **Prevention:** Use `ls ... || true` when directory may not exist

### Error: Bash failure (2026-02-23T02:31:39Z)
- **Tool:** Bash
- **Input:** `ls /home/user/claude/.claude/tools/plugin-cli/src/ 2>/dev/null && echo "---" && ls /home/user/claude/.claude/tools/plugin-cli/src/commands/ 2>/dev/null`
- **Error:** Exit code 2
bundler.ts
cli.ts
doctor.ts
linter.ts
```
[...input truncated for brevity]
bundler.ts
cli.ts
doctor.ts
linter.ts
scaffolder.ts
template-engine.ts
types.ts
validator.ts
---
- **Status:** RESOLVED
- **Fix:** Path from old Linux containerized environment (/home/user/claude/ or /tmp/claude-0/). Project now runs on Windows at C:/Users/MarkusAhling/pro/claude. These paths no longer exist.
- **Prevention:** Always use absolute Windows paths (C:/Users/MarkusAhling/pro/claude/...). Never use /home/user/claude/ paths.

### Error: Read failure (2026-03-08T19:57:35Z)
- **Tool:** Read
- **Input:** `C:\Users\MarkusAhling\.claude\plugins\cache\temp_local_1772999716991_weywmo\.claude-plugin\plugin.json`
- **Error:** File does not exist. Note: your current working directory is c:\Users\MarkusAhling\pro\claude.
- **Status:** RESOLVED
- **Fix:** Firecrawl hit redirect limit on target URL. Likely a redirect loop or bot-protection on the target site.
- **Prevention:** If firecrawl fails with redirect errors, try Perplexity MCP for the same information, or target a direct docs URL rather than a marketing/landing page.

### Error: Bash failure (2026-03-27T06:09:58Z)
- **Tool:** Bash
- **Input:** `node scripts/check-plugin-context.mjs 2>&1`
- **Error:** Exit code 1
❌ aws-eks-helm-keycloak: plugin manifest is missing required "contextEntry" field
❌ claude-code-templating-plugin: plugin manifest is missing required "contextEntry" field
❌ cowork-marketplace: plugin manifest is missing required "contextEntry" field
❌ deployment-pipeline: plugin manifest is missing required "contextEntry" field
```
[...input truncated for brevity]

### Error: Python iterating dict keys as objects
- **Tool:** Bash (python3 -c)
- **Status:** RESOLVED
- **Fix:** `plugins.index.json` has `"installed"` as dict (keys=names), not list of objects
- **Prevention:** Check JSON structure before assuming list/dict shape. Use `for k, v in d.items()`

### Error: Bash failure (2026-02-28T02:07:55Z)
- **Tool:** Bash
- **Input:** `bash plugins/cowork-marketplace/scripts/bundle-export.sh creative-frontend 2>&1`
- **Error:** Exit code 1
=== Bundle: Creative Frontend Studio ===
ID: creative-frontend
Description: 263+ design styles meet 11 animation skills. Build stunning, accessible frontends with design tokens, component libraries, white-labeling, Framer Motion, GSAP, Three.js, and Lottie.
Category: design
```
[...input truncated for brevity]
  OK: react-animation-studio (12C 6A 11S)
  OK: frontend-design-system (8C 6A 4S)

Merged totals: 20 commands, 12 agents, 15 skills

Exporting to: /home/user/claude/exports/creative-frontend
  Created: .claude-plugin/plugin.json
  Copied: commands/animate-3d.md (from react-animation-studio)
  Copied: commands/animate-audit.md (from react-animation-studio)
  Copied: commands/animate-background.md (from react-animation-studio)
  Copied: commands/animate-component.md (from react-animation-studio)
  Copied: commands/animate-effects.md (from react-animation-studio)
  Copied: commands/animate-export.md (from react-animation-studio)
  Copied: commands/animate-preset.md (from react-animation-studio)
  Copied: commands/animate-scroll.md (from react-animation-studio)
  Copied: commands/animate-sequence.md (from react-animation-studio)
  Copied: commands/animate-text.md (from react-animation-studio)
  Copied: commands/animate-transition.md (from react-animation-studio)
  Copied: commands/animate.md (from react-animation-studio)
  Copied: commands/audit.md (from frontend-design-system)
  Copied: commands/component.md (from frontend-design-system)
  Copied: commands/convert.md (from frontend-design-system)
  Copied: commands/keycloak.md (from frontend-design-system)
  Copied: commands/palette.md (from frontend-design-system)
  Copied: commands/style.md (from frontend-design-system)
  Copied: commands/theme.md (from frontend-design-system)
  Copied: commands/tokens.md (from frontend-design-system)
  Copied: agents/animation-architect.md (from react-animation-studio)
  Copied: agents/creative-effects-artist.md (from react-animation-studio)
  Copied: agents/interaction-specialist.md (from react-animation-studio)
  Copied: agents/motion-designer.md (from react-animation-studio)
  Copied: agents/performance-optimizer.md (from react-animation-studio)
  Copied: agents/transition-engineer.md (from react-animation-studio)
  Copied: agents/accessibility-auditor.md (from frontend-design-system)
  Copied: agents/component-designer.md (from frontend-design-system)
  Copied: agents/design-architect.md (from frontend-design-system)
  Copied: agents/responsive-specialist.md (from frontend-design-system)
  Copied: agents/style-implementer.md (from frontend-design-system)
  Copied: agents/theme-engineer.md (from frontend-design-system)
  Copied: skills/3d-animations/ (from react-animation-studio)
  Copied: skills/accent-animations/ (from react-animation-studio)
  Copied: skills/background-animations/ (from react-animation-studio)
  Copied: skills/creative-effects/ (from react-animation-studio)
  Copied: skills/css-animations/ (from react-animation-studio)
  Copied: skills/framer-motion/ (from react-animation-studio)
  Copied: skills/gsap/ (from react-animation-studio)
  Copied: skills/scroll-animations/ (from react-animation-studio)
  Copied: skills/spring-physics/ (from react-animation-studio)
  Copied: skills/svg-animations/ (from react-animation-studio)
  Copied: skills/text-animations/ (from react-animation-studio)
  Copied: skills/component-patterns/ (from frontend-design-system)
  Copied: skills/css-generation/ (from frontend-design-system)
  Copied: skills/design-styles/ (from frontend-design-system)
  Copied: skills/keycloak-theming/ (from frontend-design-system)
  File "<stdin>", line 45
    for plugin in "react-animation-studio
                  ^
SyntaxError: unterminated string literal (detected at line 45)

=== Bundle: Creative Frontend Studio ===
ID: creative-frontend
Description: 263+ design styles meet 11 animation skills. Build stunning, accessible frontends with design tokens, component libraries, white-labeling, Framer Motion, GSAP, Three.js, and Lottie.
Category: design

  OK: react-animation-studio (12C 6A 11S)
  OK: frontend-design-system (8C 6A 4S)

Merged totals: 20 commands, 12 agents, 15 skills

Exporting to: /home/user/claude/exports/creative-frontend
  Created: .claude-plugin/plugin.json
  Copied: commands/animate-3d.md (from react-animation-studio)
  Copied: commands/animate-audit.md (from react-animation-studio)
  Copied: commands/animate-background.md (from react-animation-studio)
  Copied: commands/animate-component.md (from react-animation-studio)
  Copied: commands/animate-effects.md (from react-animation-studio)
  Copied: commands/animate-export.md (from react-animation-studio)
  Copied: commands/animate-preset.md (from react-animation-studio)
  Copied: commands/animate-scroll.md (from react-animation-studio)
  Copied: commands/animate-sequence.md (from react-animation-studio)
  Copied: commands/animate-text.md (from react-animation-studio)
  Copied: commands/animate-transition.md (from react-animation-studio)
  Copied: commands/animate.md (from react-animation-studio)
  Copied: commands/audit.md (from frontend-design-system)
  Copied: commands/component.md (from frontend-design-system)
  Copied: commands/convert.md (from frontend-design-system)
  Copied: commands/keycloak.md (from frontend-design-system)
  Copied: commands/palette.md (from frontend-design-system)
  Copied: commands/style.md (from frontend-design-system)
  Copied: commands/theme.md (from frontend-design-system)
  Copied: commands/tokens.md (from frontend-design-system)
  Copied: agents/animation-architect.md (from react-animation-studio)
  Copied: agents/creative-effects-artist.md (from react-animation-studio)
  Copied: agents/interaction-specialist.md (from react-animation-studio)
  Copied: agents/motion-designer.md (from react-animation-studio)
  Copied: agents/performance-optimizer.md (from react-animation-studio)
  Copied: agents/transition-engineer.md (from react-animation-studio)
  Copied: agents/accessibility-auditor.md (from frontend-design-system)
  Copied: agents/component-designer.md (from frontend-design-system)
  Copied: agents/design-architect.md (from frontend-design-system)
  Copied: agents/responsive-specialist.md (from frontend-design-system)
  Copied: agents/style-implementer.md (from frontend-design-system)
  Copied: agents/theme-engineer.md (from frontend-design-system)
  Copied: skills/3d-animations/ (from react-animation-studio)
  Copied: skills/accent-animations/ (from react-animation-studio)
  Copied: skills/background-animations/ (from react-animation-studio)
  Copied: skills/creative-effects/ (from react-animation-studio)
  Copied: skills/css-animations/ (from react-animation-studio)
  Copied: skills/framer-motion/ (from react-animation-studio)
  Copied: skills/gsap/ (from react-animation-studio)
  Copied: skills/scroll-animations/ (from react-animation-studio)
  Copied: skills/spring-physics/ (from react-animation-studio)
  Copied: skills/svg-animations/ (from react-animation-studio)
  Copied: skills/text-animations/ (from react-animation-studio)
  Copied: skills/component-patterns/ (from frontend-design-system)
  Copied: skills/css-generation/ (from frontend-design-system)
  Copied: skills/design-styles/ (from frontend-design-system)
  Copied: skills/keycloak-theming/ (from frontend-design-system)
  File "<stdin>", line 45
    for plugin in "react-animation-studio
                  ^
SyntaxError: unterminated string literal (detected at line 45)
- **Status:** RESOLVED
- **Fix:** Bundle export script failed with Python syntax error inside a heredoc. Multi-line string literals in heredocs conflict with shell parsing.
- **Prevention:** Avoid multi-line Python string literals inside bash heredocs. Write Python scripts to temp files instead, then execute them.

### Error: Bash failure (2026-02-23T02:40:30Z)
- **Tool:** Bash
- **Input:** `python3 -c "
import json, os
idx = json.load(open('.claude/registry/index.json'))
print('=== SKILL REFERENCES IN QUICKLOOKUP ===')
broken = 0
for trigger, target in idx['quickLookup']['byTrigger'].items():
```
[...input truncated for brevity]
Traceback (most recent call last):
  File "<string>", line 3, in <module>
FileNotFoundError: [Errno 2] No such file or directory: '.claude/registry/index.json'
- **Status:** RESOLVED
- **Fix:** .claude/registry/index.json does not exist. The registry uses separate files: commands.index.json, plugins.index.json, skills.index.json. There is no monolithic index.json.
- **Prevention:** Use the correct registry file paths: .claude/registry/commands.index.json, plugins.index.json, skills.index.json.

### Error: Bash failure (2026-04-07T01:37:08Z)
- **Tool:** Bash
- **Input:** `npx tsc --noEmit --target ES2022 --module nodenext --moduleResolution nodenext --strict --esModuleInterop --skipLibCheck --isolatedModules --ignoreConfig --noResolve plugins/scrapin-aint-easy/src/algorithms/algo-graph.ts 2>&1`
- **Error:** Exit code 2
plugins/scrapin-aint-easy/src/algorithms/algo-graph.ts(6,18): error TS2307: Cannot find module 'pino' or its corresponding type declarations.
plugins/scrapin-aint-easy/src/algorithms/algo-graph.ts(7,50): error TS2307: Cannot find module '../core/graph.js' or its corresponding type declarations.
plugins/scrapin-aint-easy/src/algorithms/algo-graph.ts(8,59): error TS2307: Cannot find module '../core/vector.js' or its corresponding type declarations.
plugins/scrapin-aint-easy/src/algorithms/algo-graph.ts(9,71): error TS2307: Cannot find module './algo-sources.js' or its corresponding type declarations.
```
[...input truncated for brevity]

### Error: Task failure (2026-02-25T22:24:47Z)
- **Tool:** Task
- **Input:** `N/A`
- **Error:** Cannot resume agent a92e05248d6041d21: it is still running. Use TaskStop to stop it first, or wait for it to complete.
- **Status:** RESOLVED
- **Fix:** Cannot resume an agent that is still running. Must wait for it to complete or call TaskStop first.
- **Prevention:** Check agent status before resuming. Use TaskGet to verify status. Only resume completed or stopped agents.

### Error: Bash failure (2026-02-23T03:28:16Z)
- **Tool:** Bash
- **Input:** `npx tsc --noEmit plugins/marketplace-pro/src/devstudio/types.ts plugins/marketplace-pro/src/devstudio/server.ts --target ES2020 --module ESNext --moduleResolution bundler --strict --skipLibCheck --allowImportingTsExtensions --noUnusedLocals --noUnusedParameters --lib ES2020 --isolatedModules --noEmit 2>&1`
- **Error:** Exit code 2
plugins/marketplace-pro/src/devstudio/server.ts(27,3): error TS6196: 'ValidationSeverity' is declared but never used.
plugins/marketplace-pro/src/devstudio/server.ts(1259,15): error TS6133: 'relativePath' is declared but its value is never read.

plugins/marketplace-pro/src/devstudio/server.ts(27,3): error TS6196: 'ValidationSeverity' is declared but never used.
plugins/marketplace-pro/src/devstudio/server.ts(1259,15): error TS6133: 'relativePath' is declared but its value is never read.
- **Status:** RESOLVED
- **Fix:** TypeScript strict mode (noUnusedLocals/noUnusedParameters) flagged unused variables/imports. Remove or prefix with _ to suppress.
- **Prevention:** Remove unused imports before committing. Prefix intentionally-unused variables with _ to satisfy strict mode.

### Error: Bash failure (2026-02-23T03:22:20Z)
- **Tool:** Bash
- **Input:** `npx tsc --noEmit --strict ... plugins/marketplace-pro/src/composition/engine.ts`
- **Error:** Cannot find module 'fs' or its corresponding type declarations
- **Status:** RESOLVED
- **Fix:** Same as federation module — root tsconfig lacks @types/node. Plugin TS files are reference implementations not compiled by root build.
- **Prevention:** Do not type-check plugin Node.js TS files with the root tsconfig.

### Error: Bash failure (2026-04-07T01:35:44Z)
- **Tool:** Bash
- **Input:** `npx tsc --noEmit --target ES2022 --module nodenext --moduleResolution nodenext --strict --esModuleInterop --skipLibCheck --isolatedModules plugins/scrapin-aint-easy/src/algorithms/algo-sources.ts 2>&1`
- **Error:** Exit code 1
error TS5112: tsconfig.json is present but will not be loaded if files are specified on commandline. Use '--ignoreConfig' to skip this error.
- **Status:** RESOLVED
- **Fix:** When a tsconfig.json exists in the plugin directory, you cannot specify individual files on the tsc command line (TS5112). Run `npx tsc --noEmit` from the plugin directory to use its tsconfig, or use `--ignoreConfig` (which was invalid — use the whole-project check instead).
- **Prevention:** For plugins with their own tsconfig.json, always run `cd plugin-dir && npx tsc --noEmit` rather than passing individual file paths to tsc.
```
[...input truncated for brevity]

### Error: WebFetch failure (2026-03-08T07:35:15Z)
- **Tool:** WebFetch
- **Input:** `N/A`
- **Error:** Request failed with status code 404
- **Status:** RESOLVED
- **Fix:** WebFetch returned HTTP error (404/403/503) or content limit exceeded. URL was unavailable, moved, or access-restricted.
- **Prevention:** Use MCP tools instead of WebFetch: Perplexity MCP for knowledge queries, Firecrawl MCP for page scraping, Context7 MCP for library docs.

### Error: Task resume on running agent
- **Tool:** Task
- **Status:** RESOLVED
- **Fix:** Cannot resume a still-running agent — must wait for completion or stop it first
- **Prevention:** Check agent status before attempting resume

### Error: Git push rejected (remote ahead)
- **Tool:** Bash
- **Status:** RESOLVED
- **Fix:** Use `git stash && git pull --rebase origin <branch> && git stash pop` when local has uncommitted changes and remote is ahead.
- **Prevention:** Always `git pull --rebase` before pushing. If unstaged changes exist, stash first.

### Error: Bash failure (2026-02-24T08:11:40Z)
- **Tool:** Bash
- **Input:** `python3 << 'PYEOF'
content = r'''#!/usr/bin/env bash
# seed_keyvault.sh - Seed Azure Key Vault secrets from environment variables
#
# Reads expected variables from .env.template comments and stores each
# one in the kv-rosa-holdings Key Vault using Azure CLI.
```
[...input truncated for brevity]
set -euo pipefail

VAULT_NAME="kv-rosa-holdings"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --vault-name) VAULT_NAME="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# Expected secrets derived from .env.template
SECRETS=(
    "FABRIC-TOKEN:FABRIC_TOKEN"
    "FABRIC-CAPACITY-ID:FABRIC_CAPACITY_ID"
    "GRAPH-TOKEN:GRAPH_TOKEN"
    "TVS-DATAVERSE-ENV-URL:TVS_DATAVERSE_ENV_URL"
    "CONSULTING-DATAVERSE-ENV-URL:CONSULTING_DATAVERSE_ENV_URL"
    "STRIPE-SECRET-KEY:STRIPE_SECRET_KEY"
    "STRIPE-WEBHOOK-SECRET:STRIPE_WEBHOOK_SECRET"
    "FIREBASE-PROJECT-ID:FIREBASE_PROJECT_ID"
    "FIREBASE-SERVICE-ACCOUNT:FIREBASE_SERVICE_ACCOUNT"
    "PAYLOCITY-CLIENT-ID:PAYLOCITY_CLIENT_ID"
    "PAYLOCITY-CLIENT-SECRET:PAYLOCITY_CLIENT_SECRET"
    "PAYLOCITY-COMPANY-ID:PAYLOCITY_COMPANY_ID"
    "FLOW-ENVIRONMENT-ID:FLOW_ENVIRONMENT_ID"
    "APPINSIGHTS-CONNECTION-STRING:APPINSIGHTS_CONNECTION_STRING"
)

echo "=== Seeding Key Vault: ${VAULT_NAME} ==="
echo ""

SUCCESS=0
SKIPPED=0
FAILED=0

for entry in "${SECRETS[@]}"; do
    KV_NAME="${entry%%:*}"
    ENV_VAR="${entry##*:}"
    VALUE="${!ENV_VAR:-}"

    if [[ -z "$VALUE" ]]; then
        echo "  SKIP: ${KV_NAME} (${ENV_VAR} not set)"
        SKIPPED=$((SKIPPED + 1))
        continue
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        echo "  DRY-RUN: Would set ${KV_NAME} from ${ENV_VAR}"
        SUCCESS=$((SUCCESS + 1))
        continue
    fi

    if az keyvault secret set \
        --vault-name "${VAULT_NAME}" \
        --name "${KV_NAME}" \
        --value "${VALUE}" \
        --output none 2>/dev/null; then
        echo "  OK: ${KV_NAME}"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "  FAIL: ${KV_NAME}"
        FAILED=$((FAILED + 1))
    fi
done

echo ""
echo "=== Summary ==="
echo "  Stored:  ${SUCCESS}"
echo "  Skipped: ${SKIPPED}"
echo "  Failed:  ${FAILED}"

if [[ "$FAILED" -gt 0 ]]; then
    exit 1
fi
'''

with open('/home/user/claude/plugins/rosa-microsoft-deploy/scripts/seed_keyvault.sh', 'w') as f:
    f.write(content)

import os
os.chmod('/home/user/claude/plugins/rosa-microsoft-deploy/scripts/seed_keyvault.sh', 0o755)
print("Created seed_keyvault.sh (executable)")
PYEOF`
- **Error:** Exit code 1
Traceback (most recent call last):
  File "<stdin>", line 92, in <module>
FileNotFoundError: [Errno 2] No such file or directory: '/home/user/claude/plugins/rosa-microsoft-deploy/scripts/seed_keyvault.sh'

Traceback (most recent call last):
  File "<stdin>", line 92, in <module>
FileNotFoundError: [Errno 2] No such file or directory: '/home/user/claude/plugins/rosa-microsoft-deploy/scripts/seed_keyvault.sh'
- **Status:** RESOLVED
- **Fix:** Background agents were writing to old `rosa-microsoft-deploy` path after mid-build rename to `tvs-microsoft-deploy`. Files exist at new path.
- **Prevention:** When renaming a plugin mid-build, stop/wait for all background agents before renaming. Background agents retain old paths from their initial prompt.

### Error: Bash failure (2026-03-08T09:18:54Z)
- **Tool:** Bash
- **Input:** `proxy_url=$(env | grep GLOBAL_AGENT_HTTP_PROXY | cut -d= -f2-) && https_proxy="$proxy_url" http_proxy="$proxy_url" curl -s -X PATCH "https://api.github.com/repos/markus41/claude/pulls/88" \
  -H "Accept: application/vnd.github+json" \
  -d "$(python3 -c "
import json
body = '''## Summary

Comprehensive Claude Code Expert plugin providing knowledge base and three operational commands:

- **`/cc-setup`** — Full-stack project analyzer and Claude Code configuration generator. Detects tech stack, package manager, monorepo structure, and auto-generates CLAUDE.md, hooks, agents, MCP config, and settings.json with a 0-100 audit score.
- **`/cc-memory`** — Three-tier memory system: structured rules (Tier 1), auto-memory files (Tier 2), and MCP-backed semantic memory (Tier 3). Includes rotation, multi-repo support, and lifecycle hooks.
- **`/cc-orchestrate`** — Multi-agent orchestration templates (builder-validator, qa-swarm, feature-squad, research-council, refactor-pipeline, pr-review-board, docs-sprint, continuous-monitor) with cost/model guidance.

### Knowledge Base (30 skills)
Covers SDK internals, CLI mechanics, permissions model, MCP protocol, hooks system, agent patterns, prompt engineering, cost optimization, and more.

### Latest Changes (code review fixes)
- **Security**: Fixed heredoc injection in lessons-learned-capture.sh (sanitized inputs, flock for atomic writes)
- **Security**: Fixed JSON injection in security-guard.sh (use jq for safe JSON construction)
- **Security**: Added path traversal protection in auto-format.sh (realpath validation)
- **Correctness**: Moved error capture hook from PostToolUse to PostToolUseFailure
- **Correctness**: Fixed tsc single-file mode (now runs whole-project check filtered by changed file)
- **Correctness**: Removed nonexistent npm packages, restructured around official @modelcontextprotocol/server-memory
- **Correctness**: Replaced WebSearch/WebFetch with MCP tools in research-council template
- **Completeness**: Added missing on-stop.sh implementation, PostToolUseFailure to events table
- **Accuracy**: Corrected 7 MCP package names to verified npm registry names
- **Accuracy**: Fixed agent count mismatches in orchestration comparison table

## Test plan
- [ ] Verify `/cc-setup --audit` runs against a sample project without errors
- [ ] Verify `/cc-memory --dry-run` shows correct tier recommendations
- [ ] Verify `/cc-orchestrate --dry-run --template builder-validator` produces valid plan
- [ ] Confirm all hook scripts in cc-setup.md output valid JSON
- [ ] Confirm MCP package names resolve on npm registry

https://claude.ai/code/session_01RHkFCLRJesijm9pue6sWUg
'''
print(json.dumps({'body': body}))
")" 2>&1 | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Updated PR #{d[\"number\"]}: {d[\"title\"]}')" 2>&1`
- **Error:** Exit code 1
/bin/bash: line 38: /cc-setup: No such file or directory
/bin/bash: line 38: /cc-memory: No such file or directory
/bin/bash: line 38: /cc-orchestrate: No such file or directory
/bin/bash: line 38: /cc-setup: No such file or directory
/bin/bash: line 38: /cc-memory: No such file or directory
/bin/bash: line 38: /cc-orchestrate: No such file or directory
Traceback (most recent call last):
  File "<string>", line 1, in <module>
KeyError: 'number'

/bin/bash: line 38: /cc-setup: No such file or directory
/bin/bash: line 38: /cc-memory: No such file or directory
/bin/bash: line 38: /cc-orchestrate: No such file or directory
/bin/bash: line 38: /cc-setup: No such file or directory
/bin/bash: line 38: /cc-memory: No such file or directory
/bin/bash: line 38: /cc-orchestrate: No such file or directory
Traceback (most recent call last):
  File "<string>", line 1, in <module>
KeyError: 'number'
- **Status:** RESOLVED
- **Fix:** The curl command used a local proxy (127.0.0.1:63703) specific to the containerized environment. The proxy was not authenticated and the GitHub API response was empty JSON, causing a KeyError. This proxy no longer exists.
- **Prevention:** Use gh CLI or GitHub MCP tools for GitHub API calls. Do not depend on container-specific local proxies.

### Error: Read failure (2026-03-31T05:00:30Z)
- **Tool:** Read
- **Input:** `C:\Users\MarkusAhling\.claude\projects\C--Users-MarkusAhling-pro-claude\memory\MEMORY.md`
- **Error:** File does not exist. Note: your current working directory is C:\Users\MarkusAhling\pro\claude.
- **Status:** RESOLVED
- **Fix:** File exceeded token limit. Use Read with offset/limit parameters to read specific sections, or Grep for targeted content search.
- **Prevention:** Before reading a large file, use Grep to search for specific content, or Read with offset/limit to access specific sections.
### Error: Bash failure (2026-04-21T17:27:06Z)
- **Tool:** Bash
- **Input:** `ls -1 /c/Dev/repos/claude/plugins/claude-code-expert/CONTEXT_SUMMARY.md 2>/dev/null`
- **Error:** Exit code 2
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Bash failure (2026-04-21T17:34:03Z)
- **Tool:** Bash
- **Input:** `cat /c/Dev/repos/claude/plugins/jira-orchestrator/.claude-plugin/plugin.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('permissions' in d, 'capabilities' in d)"`
- **Error:** Exit code 49
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: mcp__firecrawl__firecrawl_scrape failure (2026-04-21T17:45:59Z)
- **Tool:** mcp__firecrawl__firecrawl_scrape
- **Input:** `N/A`
- **Error:** Tool 'firecrawl_scrape' execution failed: Unauthorized: Invalid token
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: mcp__firecrawl__firecrawl_scrape failure (2026-04-21T17:46:00Z)
- **Tool:** mcp__firecrawl__firecrawl_scrape
- **Input:** `N/A`
- **Error:** Tool 'firecrawl_scrape' execution failed: Unauthorized: Invalid token
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: mcp__firecrawl__firecrawl_scrape failure (2026-04-21T17:46:00Z)
- **Tool:** mcp__firecrawl__firecrawl_scrape
- **Input:** `N/A`
- **Error:** Tool 'firecrawl_scrape' execution failed: Unauthorized: Invalid token
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: mcp__firecrawl__firecrawl_scrape failure (2026-04-21T17:46:01Z)
- **Tool:** mcp__firecrawl__firecrawl_scrape
- **Input:** `N/A`
- **Error:** Tool 'firecrawl_scrape' execution failed: Unauthorized: Invalid token
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Bash failure (2026-04-21T17:58:12Z)
- **Tool:** Bash
- **Input:** `for f in /c/Dev/repos/claude/plugins/project-management-plugin/agents/*.md; do
  echo "=== $(basename $f) ==="
  python3 -c "
import sys, re
content = open('$f').read()
m = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
if not m:
    print('ERROR: no frontmatter found')
    sys.exit(1)
import yaml
try:
    data = yaml.safe_load(m.group(1))
    invalid = [k for k in data if k not in ['name','description','model','effort','maxTurns','tools','disallowedTools','skills','memory','background','isolation']]
    if invalid:
        print(f'INVALID KEYS: {invalid}')
    else:
        print(f'OK — name={data[\"name\"]}, model={data[\"model\"]}, maxTurns={data.get(\"maxTurns\")}')
except Exception as e:
    print(f'YAML ERROR: {e}')
" 2>&1
done`
- **Error:** Exit code 49
=== checkpoint-manager.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
=== context-guardian.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
=== council-reviewer.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
=== deep-researcher.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
=== dependency-resolver.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
=== pattern-recognizer.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
=== pm-integrator.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
=== progress-monitor.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
=== project-interviewer.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
=== project-orchestrator.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
=== quality-reviewer.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
=== research-dispatcher.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
=== risk-assessor.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
=== scope-architect.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
=== task-decomposer.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.
=== task-executor.md ===
Python was not found; run without arguments to install from the Microsoft Store, or disable this shortcut from Settings > Apps > Advanced app settings > App execution aliases.

- **Status:** RESOLVED
- **Fix:** python3 is not installed on this Windows machine. Switched to Node.js (node -e) with forward-slash paths (C:/Dev/repos/...) which Node.js resolves correctly on Windows.
- **Prevention:** Never use python3 in Bash commands on this Windows environment. Use Node.js for scripting. Node.js v24 is confirmed available.

### Error: Bash failure (2026-04-21T17:58:19Z)
- **Tool:** Bash
- **Input:** `node -e "
const fs = require('fs');
const path = require('path');
const dir = '/c/Dev/repos/claude/plugins/project-management-plugin/agents';
const valid_keys = new Set(['name','description','model','effort','maxTurns','tools','disallowedTools','skills','memory','background','isolation']);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
let allOk = true;
for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) { console.log(file + ': ERROR no frontmatter'); allOk = false; continue; }
  const fm = m[1];
  // simple key extraction
  const keys = [...fm.matchAll(/^(\w+):/gm)].map(x => x[1]);
  const invalid = keys.filter(k => !valid_keys.has(k));
  if (invalid.length) { console.log(file + ': INVALID KEYS: ' + invalid.join(', ')); allOk = false; }
  else { console.log(file + ': OK (' + keys.join(', ') + ')'); }
}
if (allOk) console.log('\nAll 16 files: valid frontmatter keys');
"`
- **Error:** Exit code 1
node:fs:1569
  const result = binding.readdir(
                         ^

Error: ENOENT: no such file or directory, scandir 'C:\c\Dev\repos\claude\plugins\project-management-plugin\agents'
    at Object.readdirSync (node:fs:1569:26)
    at [eval]:6:18
    at runScriptInThisContext (node:internal/vm:219:10)
    at node:internal/process/execution:451:12
    at [eval]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:449:60)
    at evalFunction (node:internal/process/execution:283:30)
    at evalTypeScript (node:internal/process/execution:295:3)
    at node:internal/main/eval_string:71:3 {
  errno: -4058,
  code: 'ENOENT',
  syscall: 'scandir',
  path: 'C:\\c\\Dev\\repos\\claude\\plugins\\project-management-plugin\\agents'
}

Node.js v24.14.1

- **Status:** RESOLVED
- **Fix:** Passing /c/Dev/... MSYS-style paths to Node.js on Windows causes path doubling (C:cDev...). Solution: use C:/Dev/... forward-slash paths directly in node -e inline scripts.
- **Prevention:** In node -e inline scripts on Windows, always use C:/... forward-slash paths. Never use /c/... MSYS-style paths.

### Error: Bash failure (2026-04-21T17:58:28Z)
- **Tool:** Bash
- **Input:** `node -e "
const fs = require('fs');
const path = require('path');
const dir = 'C:\\\\Dev\\\\repos\\\\claude\\\\plugins\\\\project-management-plugin\\\\agents';
const valid_keys = new Set(['name','description','model','effort','maxTurns','tools','disallowedTools','skills','memory','background','isolation']);
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();
let allOk = true;
for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) { console.log(file + ': ERROR no frontmatter'); allOk = false; continue; }
  const fm = m[1];
  const keys = [...fm.matchAll(/^(\w+):/gm)].map(x => x[1]);
  const invalid = keys.filter(k => !valid_keys.has(k));
  if (invalid.length) { console.log(file + ': INVALID KEYS: ' + invalid.join(', ')); allOk = false; }
  else { console.log(file + ': OK (' + keys.join(', ') + ')'); }
}
if (allOk) console.log('\nAll 16 files: valid frontmatter keys');
"`
- **Error:** Exit code 1
node:fs:1569
  const result = binding.readdir(
                         ^

Error: ENOENT: no such file or directory, scandir 'C:\Dev\repos\claude\Deveposclaudepluginsproject-management-pluginagents'
    at Object.readdirSync (node:fs:1569:26)
    at [eval]:6:18
    at runScriptInThisContext (node:internal/vm:219:10)
    at node:internal/process/execution:451:12
    at [eval]-wrapper:6:24
    at runScriptInContext (node:internal/process/execution:449:60)
    at evalFunction (node:internal/process/execution:283:30)
    at evalTypeScript (node:internal/process/execution:295:3)
    at node:internal/main/eval_string:71:3 {
  errno: -4058,
  code: 'ENOENT',
  syscall: 'scandir',
  path: 'C:\\Dev\\repos\\claude\\Dev\reposclaudepluginsproject-management-pluginagents'
}

Node.js v24.14.1

- **Status:** RESOLVED
- **Fix:** Bash interprets backslash sequences inside double-quoted node -e strings, mangling the Windows path. Solution: use forward-slash paths (C:/Dev/repos/...) in a minified single-line node -e command — no backslash escaping needed.
- **Prevention:** Never embed backslash Windows paths in double-quoted bash strings for node -e. Use forward slashes or write a temp JS file.

### Error: Bash failure (2026-04-21T18:01:41Z)
- **Tool:** Bash
- **Input:** `cd "C:/Dev/repos/claude" && python3 -m json.tool ...`
- **Error:** Exit code 49 — Python was not found; Windows App Execution Alias intercepts `python3` and exits 49 when Python is not installed from the Store.
- **Status:** RESOLVED
- **Fix:** Used `node -e "JSON.parse(fs.readFileSync(f))"` instead. Node.js is always available in this environment; `python3` is not.
- **Prevention:** On this Windows environment, never use `python3` for JSON validation or scripting. Use `node -e` with `require('fs')` for JSON validation tasks instead.

### Error: Bash failure (2026-04-21T18:05:02Z)
- **Tool:** Bash
- **Input:** `cd C:/Dev/repos/claude && git diff .claude/agent-memory/MEMORY.md .claude/rules/lessons-learned.md --stat && ls plugins/project-management-plugin/ 2>/dev/null | head -20`
- **Error:** Exit code 128
fatal: option '--stat' must come before non-option arguments
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: Read failure (2026-06-10T21:36:17Z)
- **Tool:** Read
- **Input:** `/home/user/claude/plugins/jira-orchestrator/workflows`
- **Error:** EISDIR: illegal operation on a directory, read '/home/user/claude/plugins/jira-orchestrator/workflows'
- **Status:** NEEDS_FIX - Claude should document the fix here after resolving

### Error: mcp__github__actions_list failure (2026-06-23T16:04:05Z)
- **Tool:** mcp__github__actions_list
- **Input:** `N/A`
- **Error:** missing required parameter: method
- **Status:** RESOLVED
- **Fix:** The GitHub MCP `actions_list` tool requires a `method` parameter (e.g. `list_workflow_runs`, `list_workflows`). Re-called with `method: "list_workflow_runs"` plus `owner`/`repo`/`branch`.
- **Prevention:** GitHub MCP "read" tools are multiplexed behind a `method` discriminator (same as `pull_request_read`, `issue_read`, `actions_get`). Always pass `method`. Note: `list_workflow_runs` can return very large payloads — it may exceed the token limit and get saved to a file; parse that file with `node -e` rather than reading it inline.

### Error: Bash failure (2026-06-23T17:29:55Z)
- **Tool:** Bash
- **Input:** `cd /home/user/claude/site && node -e '
const http=require("http"),fs=require("fs"),p=require("path");
const types={".html":"text/html",".css":"text/css",".js":"text/javascript",".json":"application/json",".svg":"image/svg+xml",".xml":"application/xml",".txt":"text/plain"};
const s=http.createServer((req,res)=>{let f="."+req.url.split("?")[0];if(f==="./")f="./index.html";try{const b=fs.readFileSync(f);res.writeHead(200,{"Content-Type":types[p.extname(f)]||"text/plain"});res.end(b)}catch(e){res.writeHead(404);res.end("404")}});
s.listen(8100,async()=>{
  const get=u=>new Promise(r=>http.get("http://localhost:8100"+u,res=>{let d="";res.on("data",c=>d+=c);res.on("end",()=>r({c:res.statusCode,len:d.length}))}));
  for(const u of ["/","/assets/styles.css","/assets/app.js","/assets/og.svg","/data/plugins.json","/sitemap.xml","/robots.txt"]){
    const r=await get(u);console.log(String(r.c).padEnd(4),u,r.len,"bytes");
  }
  s.close();
});'
echo "=== index references theme/sort/stacks? ==="
grep -c 'themeToggle\|id="sort"\|id="stackGrid"\|skiplink\|canonical' site/index.html`
- **Error:** Exit code 2
200  / 17311 bytes
200  /assets/styles.css 26013 bytes
200  /assets/app.js 16914 bytes
200  /assets/og.svg 3682 bytes
200  /data/plugins.json 36002 bytes
200  /sitemap.xml 276 bytes
200  /robots.txt 79 bytes
=== index references theme/sort/stacks? ===
grep: site/index.html: No such file or directory
- **Status:** RESOLVED
- **Fix:** A previous Bash command ran `cd /home/user/claude/site` to start a local node server; the Bash tool's working directory persists across calls, so the later relative path `site/index.html` resolved to `site/site/index.html`. Re-ran with an absolute path / from the repo root.
- **Prevention:** The Bash tool shares one persistent cwd across calls. Avoid `cd` into a subdir for one-off commands — prefer absolute paths (or `node -e` with absolute paths, or `git -C <repo>`). If a server must run from a dir, start it with `(cd dir && …)` in a subshell so the parent cwd is unchanged, or `cd` back afterward.

### Error: Bash failure (2026-06-23T17:38:03Z)
- **Tool:** Bash
- **Input:** `grep -n 'card__details\|card.is-open\|card__detailsinner\|^\.kv\|card__desc' site/assets/styles.css`
- **Error:** Exit code 2
grep: site/assets/styles.css: No such file or directory
- **Status:** RESOLVED
- **Fix:** Same persistent-cwd cause as the entry above (shell still in `site/`). Switched to the Grep tool with an absolute path, which is also the preferred tool for content search.
- **Prevention:** Prefer the Grep/Glob tools over shell `grep`/`find`; when shelling out, use absolute paths because the Bash cwd persists between calls.
