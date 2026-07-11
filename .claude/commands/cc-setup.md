# /cc-setup — Full Repo Analysis & 4-Layer Claude Code Deployment

Analyze the current repository, detect its tech stack, and deploy a complete Claude Code
configuration using the **4-layer extension stack**: CLAUDE.md (routing OS), Skills (capability
packs), Hooks (guardrails & automation), and Agents (specialized workers). Also configures
MCP servers, LSP hints, memory architecture, and cost optimization.

## Usage

```bash
/cc-setup                        # Full interactive setup
/cc-setup --auto                 # Non-interactive, best-guess defaults
/cc-setup --dry-run              # Show what would be configured without writing
/cc-setup --mcp-only             # Only detect and install MCP servers
/cc-setup --audit                # Audit existing setup, score it, suggest improvements
/cc-setup --preset power-user    # Use a curated preset
```

---

## The 4-Layer Extension Stack

The most effective Claude Code setups use all four layers together. `/cc-setup` deploys all of them
based on detected project characteristics.

| Layer | What | Where | Loaded |
|-------|------|-------|--------|
| **CLAUDE.md** | Routing OS — project rules, build commands, architecture constraints | `CLAUDE.md` + `.claude/rules/*.md` + per-directory `CLAUDE.md` | Always (session start) |
| **Skills** | Modular capability packs — domain playbooks, workflow recipes | `.claude/skills/*/SKILL.md` | Frontmatter always; body on activation |
| **Hooks** | Guardrails & automation — format, lint, notify, enforce, capture | `.claude/settings.json` → hooks + `.claude/hooks/*.sh` | On lifecycle events |
| **Agents** | Specialized workers — distinct system prompts, models, tool access | `.claude/agents/*.md` | On invocation or auto-trigger |

---

## Phase 1: Repo Analysis (read-only)

Scan the repo to build a project fingerprint. All detection is non-destructive.

### 1.1 Language & Framework Detection

```bash
# Languages
DETECT_MAP=(
  "package.json:Node.js"
  "tsconfig.json:TypeScript"
  "requirements.txt:Python"
  "pyproject.toml:Python"
  "Pipfile:Python"
  "go.mod:Go"
  "Cargo.toml:Rust"
  "pom.xml:Java/Maven"
  "build.gradle:Java/Gradle"
  "build.gradle.kts:Kotlin/Gradle"
  "Gemfile:Ruby"
  "composer.json:PHP"
  "*.csproj:C#/.NET"
  "Package.swift:Swift"
  "mix.exs:Elixir"
  "deno.json:Deno"
  "Makefile:Make"
)

# Frameworks
FRAMEWORK_MAP=(
  "next.config.*:Next.js"
  "nuxt.config.*:Nuxt.js"
  "vite.config.*:Vite"
  "angular.json:Angular"
  "svelte.config.*:SvelteKit"
  "remix.config.*:Remix"
  "astro.config.*:Astro"
  "gatsby-config.*:Gatsby"
  "nest-cli.json:NestJS"
  "manage.py:Django"
  "app.py+flask:Flask"
  "main.py+fastapi:FastAPI"
  "config/routes.rb:Rails"
  "src/main/+spring:Spring Boot"
  "expo-env.d.ts:Expo/React Native"
  "tauri.conf.json:Tauri"
  "electron-builder.*:Electron"
)
```

### 1.2 Infrastructure Detection

```bash
INFRA_MAP=(
  "Dockerfile:Docker"
  "docker-compose*:Docker Compose"
  "kubernetes/:Kubernetes"
  "helm/:Helm"
  "terraform/:Terraform"
  "pulumi/:Pulumi"
  ".github/workflows/:GitHub Actions"
  "Jenkinsfile:Jenkins"
  ".gitlab-ci.yml:GitLab CI"
  ".circleci/:CircleCI"
  "serverless.yml:Serverless"
  "cdk.json:AWS CDK"
  "*.bicep:Azure Bicep"
  "ansible/:Ansible"
  "fly.toml:Fly.io"
  "vercel.json:Vercel"
  "netlify.toml:Netlify"
  "railway.json:Railway"
  "render.yaml:Render"
  "wrangler.toml:Cloudflare Workers"
  ".harness/:Harness"
)
```

### 1.3 Database & Service Detection

```bash
SERVICE_MAP=(
  "prisma/:Prisma"
  "drizzle.config.*:Drizzle ORM"
  "knexfile.*:Knex"
  ".env*DATABASE_URL*postgres:PostgreSQL"
  ".env*DATABASE_URL*mysql:MySQL"
  ".env*MONGO:MongoDB"
  ".env*REDIS:Redis"
  "supabase/:Supabase"
  "firebase.json:Firebase"
  ".env*STRIPE:Stripe"
  ".env*SENTRY:Sentry"
  ".env*SLACK:Slack"
  ".env*OPENAI:OpenAI"
  ".env*ANTHROPIC:Anthropic"
  "keycloak:Keycloak"
  ".env*AUTH0:Auth0"
  ".env*TWILIO:Twilio"
  ".env*SENDGRID:SendGrid"
  ".env*LINEAR:Linear"
  ".env*NOTION:Notion"
)
```

### 1.4 Test Framework Detection

```bash
TEST_MAP=(
  "jest.config*:Jest"
  "vitest.config*:Vitest"
  "cypress.config*:Cypress"
  "playwright.config*:Playwright"
  "pytest.ini:Pytest"
  "conftest.py:Pytest"
  "setup.cfg+[tool:pytest]:Pytest"
  ".mocharc*:Mocha"
  "karma.conf*:Karma"
  "*.test.go:Go testing"
  "*_test.rs:Rust testing"
  "phpunit.xml:PHPUnit"
  ".rspec:RSpec"
)
```

### 1.5 Package Manager & Monorepo Detection

```bash
PM_MAP=(
  "pnpm-lock.yaml:pnpm"
  "pnpm-workspace.yaml:pnpm workspaces"
  "yarn.lock:yarn"
  "package-lock.json:npm"
  "bun.lockb:bun"
  "poetry.lock:poetry"
  "Pipfile.lock:pipenv"
  "uv.lock:uv"
  "Cargo.lock:cargo"
  "go.sum:go modules"
)

MONOREPO_MAP=(
  "lerna.json:Lerna"
  "nx.json:Nx"
  "turbo.json:Turborepo"
  "rush.json:Rush"
  "pnpm-workspace.yaml:pnpm workspaces"
)
```

### 1.6 Codebase Scale Assessment

```bash
# Determine project scale for configuration decisions
# Small: <10k LOC, <50 files → minimal config
# Medium: 10k-100k LOC → standard config
# Large: 100k+ LOC → split CLAUDE.md, memory MCP, subagents
# Monorepo: multiple packages → per-directory CLAUDE.md
```

### 1.7 Existing Configuration Audit

```bash
# Check what's already configured
EXISTING=(
  "CLAUDE.md:Root instructions"
  ".claude/settings.json:Settings"
  ".claude/settings.local.json:Local settings"
  ".mcp.json:MCP servers"
  ".claude/rules/:Rules directory"
  ".claude/skills/:Skills directory"
  ".claude/agents/:Agents directory"
  ".claude/hooks/:Hooks directory"
)
# Score existing setup: 0-100 based on coverage of 4 layers
```

---

## Phase 2: Layer 1 — CLAUDE.md as Routing OS

Generate CLAUDE.md as a **routing file** (under 150 lines), not a knowledge dump. Point to
detailed specs in `.claude/rules/` and `docs/`.

### 2.1 Root CLAUDE.md Template

```markdown
# Project Instructions

## Build & Test
- Install: `{detected_install_cmd}`
- Build: `{detected_build_cmd}`
- Test: `{detected_test_cmd}`
- Lint: `{detected_lint_cmd}`
- Type Check: `{detected_typecheck_cmd}`

## Tech Stack
{detected_stack_summary}

## Key Paths
- Source: {src_dir}
- Tests: {test_dir}
- Docs: {docs_dir}
- Config: {config_files}

## Architecture
{one_paragraph_architecture_summary}

## Decision Trees
- Auth/identity tasks → check `{auth_dir}` first
- Database/migration tasks → check `{db_dir}` first
- Infrastructure tasks → check `{infra_dir}` first
- API changes → check `{api_dir}` first

## Conventions
- {detected_conventions_from_eslint_prettier_editorconfig}

## Don't Touch
- {auto_generated_files}
- {vendor_directories}
- {lock_files}
```

### 2.2 Per-Directory CLAUDE.md (for large codebases / monorepos)

For projects with 100k+ LOC or monorepo structure, create smaller `CLAUDE.md` in each
major directory:

```markdown
# src/auth/CLAUDE.md
This directory handles authentication and authorization.
- Uses Keycloak for OIDC
- JWT validation middleware in middleware.ts
- Role-based access control in rbac.ts
- Tests in __tests__/ using vitest
```

### 2.3 Rules Files

Generate `.claude/rules/` files based on detected stack:

| File | Generated When | Content |
|------|---------------|---------|
| `code-style.md` | Always | Language conventions from linter configs (ESLint, Prettier, Black, etc.) |
| `git-workflow.md` | Always | Commit format, branch strategy (from git history analysis) |
| `testing.md` | Test framework detected | Test conventions, coverage requirements, TDD guidance |
| `architecture.md` | Always | Project structure, module boundaries, import rules |
| `self-healing.md` | Always | Error capture and learning loop protocol |
| `lessons-learned.md` | Always | Empty starter for auto-captured errors |
| `docker-k8s.md` | Docker/K8s detected | Image tagging, pull policies, Helm conventions |
| `security.md` | Auth/payment detected | Credential handling, OWASP rules, secret management |
| `api.md` | API routes detected | REST/GraphQL conventions, versioning, error formats |

### 2.4 Split Memory Architecture

Instead of one MEMORY.md, generate split memory files:

```
.claude/rules/
├── memory-profile.md      # Project identity, team info, domains
├── memory-preferences.md  # User workflow preferences, tool choices
├── memory-decisions.md    # Architecture Decision Records (ADRs)
├── memory-patterns.md     # Recurring code patterns and solutions
└── memory-sessions.md     # Recent session summaries (auto-rotated)
```

All files in `.claude/rules/` are auto-loaded every session, giving persistent context
without relying on MEMORY.md's 200-line limit.

---

## Phase 3: Layer 2 — Skills as Capability Packs

Auto-generate skills based on detected stack. Skills use the 3-tier loading system:
frontmatter (always loaded) → body (on activation) → reference files (on demand).

### 3.1 Auto-Generated Skills

| Detected Stack | Skill Created | Purpose |
|----------------|--------------|---------|
| Prisma | `prisma-ops` | Migration workflows, schema changes, seed scripts |
| Docker | `docker-ops` | Build, push, compose up/down, multi-stage patterns |
| Kubernetes | `k8s-ops` | Deploy, rollback, port-forward, log tailing |
| Helm | `helm-ops` | Chart install/upgrade, values management |
| Terraform | `terraform-ops` | Plan, apply, import, state management |
| Next.js | `nextjs-patterns` | App Router conventions, SSR/ISR, API routes |
| FastAPI | `fastapi-patterns` | Endpoint patterns, Pydantic models, async |
| Jest/Vitest | `test-patterns` | Test structure, mocking, coverage targets |
| GitHub Actions | `ci-cd-ops` | Workflow authoring, secrets, matrix builds |
| Stripe | `stripe-ops` | Payment flows, webhook handling, testing |
| Keycloak | `keycloak-ops` | Realm config, client setup, user federation |
| PostgreSQL | `db-ops` | Migrations, queries, indexing, backups |
| MongoDB | `mongo-ops` | Schema design, aggregation, Atlas management |

### 3.2 Skill Template

```markdown
---
description: "{stack_name} operations — auto-invoke when working on {file_patterns}"
model: claude-sonnet-5
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Glob
  - Grep
---

# {Stack Name} Operations

## When to Use
{auto_trigger_conditions}

## Common Workflows
{stack_specific_workflows}

## Patterns & Templates
{code_templates}

## Common Pitfalls
{known_issues_and_fixes}

## Reference
See: {links_to_docs}
```

### 3.3 Progressive Disclosure for Cost Savings

Skills use the 3-tier system to avoid loading everything into context:
- **Tier 1 (frontmatter)**: ~50 tokens — always loaded, used for routing decisions
- **Tier 2 (body)**: ~500-2000 tokens — loaded when skill activates
- **Tier 3 (reference files)**: ~5000+ tokens — loaded only when Claude needs specifics

This saves ~15,000 tokens per session (82% improvement) vs loading all domain knowledge
into CLAUDE.md.

---

## Phase 4: Layer 3 — Hooks for Guardrails & Automation

### 4.1 Hook Events Reference

| Event | When | Input | Output |
|-------|------|-------|--------|
| `PreToolUse` | Before any tool runs | `{tool_name, tool_input}` | `{decision: "approve"/"block", reason?}` |
| `PostToolUse` | After tool succeeds | `{tool_name, tool_input, tool_output}` | `{decision: "approve"/"block", reason?}` |
| `PostToolUseFailure` | After tool fails | `{tool_name, tool_input, error}` | `{decision: "approve"}` |
| `Notification` | Claude needs input | `{message}` | `{decision: "approve"}` |
| `Stop` | Agent finishes response | `{stop_reason}` | `{decision: "approve"}` |
| `UserPromptSubmit` | Prompt submitted | `{prompt}` | `{decision: "approve"/"block"}` + optional modified prompt |
| `SessionStart` | New session begins | `{}` | Context injection |

### 4.2 Generated Hook Configurations

#### Standard hooks (all projects):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/security-guard.sh"
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/auto-format.sh"
        }]
      }
    ],
    "PostToolUseFailure": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/lessons-learned-capture.sh"
        }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/on-stop.sh"
        }]
      }
    ],
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/inject-context.sh"
        }]
      }
    ],
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "bash .claude/hooks/session-init.sh"
        }]
      }
    ]
  }
}
```

#### Stack-specific hooks:

| Detected | Hook | Event | Action |
|----------|------|-------|--------|
| TypeScript | `auto-typecheck.sh` | PostToolUse (Write/Edit on *.ts) | Run `tsc --noEmit` |
| Prettier | `auto-format.sh` | PostToolUse (Write/Edit) | Run `prettier --write` |
| ESLint | `auto-lint.sh` | PostToolUse (Write/Edit on *.ts/*.js) | Run `eslint --fix` |
| Black | `auto-format-py.sh` | PostToolUse (Write/Edit on *.py) | Run `black` |
| Rust | `auto-clippy.sh` | PostToolUse (Write/Edit on *.rs) | Run `cargo clippy` |
| Docker | `no-latest-tag.sh` | PreToolUse (Bash with docker) | Block `:latest` tags |
| Git | `no-env-commit.sh` | PreToolUse (Bash with git add) | Block .env commits |

### 4.3 Generated Hook Scripts

#### security-guard.sh
```bash
#!/bin/bash
# Defense-in-depth guard — supplement to settings.json deny list.
# NOTE: This blocklist is NOT a security boundary. Use settings.json
# permissions as the primary control. This catches obvious mistakes.
INPUT=$(head -c 65536)
if ! printf '%s' "$INPUT" | jq -e . >/dev/null 2>&1; then
  echo '{"decision": "approve"}'
  exit 0
fi

TOOL_INPUT=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""')

# Block destructive commands (hardcoded only — do not source from files)
BLOCKED_PATTERNS=(
  "rm -rf /"
  "sudo rm"
  "mkfs"
  "dd if="
  "> /dev/sd"
  "chmod -R 777"
  "curl.*| sh"
  "curl.*| bash"
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if printf '%s' "$TOOL_INPUT" | grep -qF "$pattern"; then
    jq -n --arg p "$pattern" '{"decision":"block","reason":("Blocked dangerous command: "+$p)}'
    exit 0
  fi
done

echo '{"decision": "approve"}'
```

#### auto-format.sh
```bash
#!/bin/bash
INPUT=$(head -c 65536)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# Validate file path — must exist, be a regular file, and be inside project
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo '{"decision": "approve"}'
  exit 0
fi

REAL=$(realpath "$FILE" 2>/dev/null) || { echo '{"decision": "approve"}'; exit 0; }
WORKDIR=$(realpath "$PWD")
if [[ "$REAL" != "$WORKDIR"/* ]]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Reject filenames starting with dash (flag injection)
BASENAME=$(basename "$REAL")
if [[ "$BASENAME" == -* ]]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Format based on file type
case "$REAL" in
  *.ts|*.tsx|*.js|*.jsx|*.json|*.css|*.scss|*.md)
    npx prettier --write "$REAL" 2>/dev/null ;;
  *.py)
    black "$REAL" 2>/dev/null || ruff format "$REAL" 2>/dev/null ;;
  *.rs)
    rustfmt "$REAL" 2>/dev/null ;;
  *.go)
    gofmt -w "$REAL" 2>/dev/null ;;
esac

echo '{"decision": "approve"}'
```

#### inject-context.sh
```bash
#!/bin/bash
# Inject dynamic context on every prompt submission
INPUT=$(head -c 65536)

CONTEXT="[Context] "
CONTEXT+="Date: $(date '+%Y-%m-%d %H:%M') | "
CONTEXT+="Branch: $(git branch --show-current 2>/dev/null) | "
CONTEXT+="Uncommitted: $(git status --porcelain 2>/dev/null | wc -l | tr -d ' ') files"

# Output context as stderr (shown to Claude as additional info)
echo "$CONTEXT" >&2
echo '{"decision": "approve"}'
```

#### session-init.sh
```bash
#!/bin/bash
# Load context at session start
echo "Session started at $(date '+%Y-%m-%d %H:%M')" >&2
echo "Branch: $(git branch --show-current 2>/dev/null)" >&2
echo "Last commit: $(git log --oneline -1 2>/dev/null)" >&2

# Check for pending memory updates
if [ -f ".claude/rules/memory-sessions.md" ]; then
  LINES=$(wc -l < .claude/rules/memory-sessions.md)
  if [ "$LINES" -gt 100 ]; then
    echo "WARNING: memory-sessions.md has $LINES lines — consider rotating" >&2
  fi
fi

echo '{"decision": "approve"}'
```

#### on-stop.sh
```bash
#!/bin/bash
# Runs when Claude finishes a response
# Use for notifications, memory updates, or cleanup
echo "Session turn completed at $(date '+%Y-%m-%d %H:%M')" >&2

# Remind about uncommitted changes
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$UNCOMMITTED" -gt 0 ]; then
  echo "Reminder: $UNCOMMITTED uncommitted files" >&2
fi

echo '{"decision": "approve"}'
```

#### lessons-learned-capture.sh
```bash
#!/bin/bash
# Registered on PostToolUseFailure — only fires on tool errors
INPUT=$(head -c 65536)
if ! printf '%s' "$INPUT" | jq -e . >/dev/null 2>&1; then
  echo '{"decision": "approve"}'
  exit 0
fi

TOOL=$(printf '%s' "$INPUT" | jq -r '.tool_name // ""')
ERROR=$(printf '%s' "$INPUT" | jq -r '.error // ""')

if [ -z "$ERROR" ] || [ "$ERROR" = "null" ]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Sanitize inputs — strip shell metacharacters to prevent injection
SAFE_TOOL=$(printf '%s' "$TOOL" | head -c 50 | tr -d '`$()\\!"'\''')
SAFE_ERROR=$(printf '%s' "$ERROR" | head -c 200 | tr -d '`$()\\!"'\''')
TIMESTAMP=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

# Use flock for atomic append (prevents interleaved writes)
(
  flock -x 200
  printf '\n### Error: %s failure (%s)\n- **Tool:** %s\n- **Error:** %s\n- **Status:** NEEDS_FIX - Claude should document the fix here after resolving\n' \
    "$SAFE_TOOL" "$TIMESTAMP" "$SAFE_TOOL" "$SAFE_ERROR" \
    >> .claude/rules/lessons-learned.md
) 200>/tmp/lessons-learned.lock

echo '{"decision": "approve"}'
```

---

## Phase 5: Layer 4 — Agents for Specialized Work

### 5.1 Auto-Generated Agent Templates

Based on project characteristics, generate agents with deliberate model assignments:

| Project Signal | Agent | Model | Purpose |
|----------------|-------|-------|---------|
| Any project | `code-reviewer` | opus | Security-aware code review |
| Any project | `test-writer` | sonnet | Generate and fix tests |
| API detected | `api-designer` | opus | API design review and suggestions |
| Docker/K8s | `infra-reviewer` | sonnet | Infrastructure config review |
| Frontend | `ui-reviewer` | sonnet | Accessibility, responsive, UX review |
| Auth detected | `security-auditor` | opus | Security vulnerability assessment |
| Large codebase | `architecture-advisor` | opus | Cross-cutting architectural decisions |

### 5.2 Agent Template

```markdown
---
name: {agent-name}
description: {what it does}
model: {claude-sonnet-5 or claude-opus-4-8}
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# {Agent Name}

## Role
{specific_role_description}

## When to Activate
{trigger_conditions — can be auto-triggered via hooks}

## Approach
{step_by_step_methodology}

## Output Format
{expected_output_structure}
```

### 5.3 Model Assignment Strategy

Use expensive models for reasoning, cheap models for execution:

| Task Type | Model | Cost/1M tokens | When |
|-----------|-------|----------------|------|
| Architecture, security review | Opus | ~$15/$75 | Complex reasoning, risk assessment |
| Code generation, implementation | Sonnet | ~$3/$15 | Standard development tasks |
| Research, fast lookups, docs | Haiku | ~$0.25/$1.25 | Information retrieval, simple Q&A |

---

## Phase 6: MCP Server Detection & Installation

### 6.1 Detection Matrix

| Detection Signal | MCP Server | Package | Transport |
|-----------------|-----------|---------|-----------|
| PostgreSQL connection | `postgres` | `@modelcontextprotocol/server-postgres` | stdio |
| SQLite files | `sqlite` | `@modelcontextprotocol/server-sqlite` | stdio |
| `.github/` directory | `github` | `@modelcontextprotocol/server-github` | stdio |
| Filesystem needs | `filesystem` | `@modelcontextprotocol/server-filesystem` | stdio |
| Playwright config | `playwright` | `@playwright/mcp` | stdio |
| Browser testing | `puppeteer` | `@modelcontextprotocol/server-puppeteer` | stdio |
| Sentry DSN | `sentry` | `@modelcontextprotocol/server-sentry` | stdio |
| Slack token | `slack` | `@modelcontextprotocol/server-slack` | stdio |
| Docker/K8s | `docker` | `@modelcontextprotocol/server-docker` | stdio |
| MongoDB connection | `mongodb` | `@modelcontextprotocol/server-mongodb` | stdio |
| Redis connection | `redis` | `@modelcontextprotocol/server-redis` | stdio |
| Supabase project | `supabase` | `@supabase/mcp-server-supabase` | stdio |
| Linear issues | `linear` | `@linear/mcp-server` | stdio |
| Notion workspace | `notion` | `@notionhq/mcp-server` | stdio |
| Vercel config | `vercel` | `@vercel/mcp-server` | stdio |
| Cloudflare config | `cloudflare` | `@cloudflare/mcp-server-cloudflare` | stdio |

### 6.2 Always-Recommended (Tier 1) — Install for Any Project

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"],
      "disabled": false
    }
  }
}
```

Context7 provides semantic codebase search and library documentation lookup.

### 6.3 Recommended if Web Research Needed (Tier 2)

```json
{
  "mcpServers": {
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": { "FIRECRAWL_API_KEY": "{key}" },
      "disabled": false
    }
  }
}
```

### 6.4 MCP Cost Warning

> **Important**: Each MCP server's tool descriptions consume context tokens even when idle.
> Loading too many servers globally can consume 75k+ tokens passively.
> **Rule**: Pick 2-3 core MCPs for daily use. Add project-specific ones via `.mcp.json`
> (project-scoped) rather than `~/.claude/mcp.json` (global).

### 6.5 MCP Prompts (Advanced)

MCP Prompts are the highest-leverage MCP primitive (above Tools and Resources). They let you
prime the agent with everything needed for complex workflows:

```json
{
  "prompts": {
    "deploy-checklist": {
      "description": "Run full deployment checklist",
      "messages": [
        {"role": "user", "content": "Run the deployment checklist: ..."}
      ]
    }
  }
}
```

Most engineers only use MCP Tools and miss this entirely.

---

## Phase 7: LSP Detection & IDE Configuration

### 7.1 LSP Server Matrix

| Language | LSP Server | Install |
|----------|-----------|---------|
| TypeScript/JS | `typescript-language-server` | `npm i -g typescript-language-server typescript` |
| Python | `pyright` / `pylsp` | `npm i -g pyright` / `pip install python-lsp-server` |
| Go | `gopls` | `go install golang.org/x/tools/gopls@latest` |
| Rust | `rust-analyzer` | `rustup component add rust-analyzer` |
| Java | `jdtls` | Eclipse JDT LS |
| C# | `omnisharp` | OmniSharp |
| Ruby | `solargraph` | `gem install solargraph` |
| PHP | `intelephense` | `npm i -g intelephense` |
| Elixir | `elixir-ls` | Via Mix |
| Svelte | `svelte-language-server` | `npm i -g svelte-language-server` |
| Vue | `vue-language-server` | `npm i -g @vue/language-server` |
| Tailwind | `tailwindcss-language-server` | `npm i -g @tailwindcss/language-server` |
| GraphQL | `graphql-language-service-cli` | `npm i -g graphql-language-service-cli` |
| Prisma | `prisma-language-server` | `npm i -g @prisma/language-server` |
| YAML | `yaml-language-server` | `npm i -g yaml-language-server` |
| Dockerfile | `dockerfile-language-server` | `npm i -g dockerfile-language-server-nodejs` |
| Bash | `bash-language-server` | `npm i -g bash-language-server` |
| SQL | `sql-language-server` | `npm i -g sql-language-server` |
| Terraform | `terraform-ls` | Via HashiCorp |

### 7.2 LSP Integration via Hooks

Claude Code doesn't use LSP directly, but LSP can power hooks:

```bash
# PostToolUse hook for TypeScript diagnostics
#!/bin/bash
INPUT=$(head -c 65536)
FILE=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // ""')
if [[ "$FILE" == *.ts ]] || [[ "$FILE" == *.tsx ]]; then
  # Run whole-project check — single-file tsc ignores tsconfig.json
  ERRORS=$(npx tsc --noEmit 2>&1 | grep -F "$FILE" | head -5)
  if [ -n "$ERRORS" ]; then
    echo "TypeScript errors related to $FILE:" >&2
    echo "$ERRORS" >&2
  fi
fi
echo '{"decision": "approve"}'
```

---

## Phase 8: Settings & Permissions

### 8.1 Generate settings.json

```json
{
  "permissions": {
    "allow": [
      "Read", "Write", "Edit", "Glob", "Grep",
      "Bash({package_manager} *)",
      "Bash(git *)",
      "Bash({test_cmd})",
      "Bash({build_cmd})",
      "Bash({lint_cmd})",
      "Bash({typecheck_cmd})"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(sudo *)",
      "Bash(curl * | sh)",
      "Bash(curl * | bash)"
    ]
  },
  "model": "claude-sonnet-5",
  "autoMemory": true,
  "autoCompact": true
}
```

### 8.2 Generate settings.local.json Template

```json
{
  "permissions": {
    "allow": []
  },
  "model": "claude-sonnet-5"
}
```

This file is `.gitignored` for personal overrides (e.g., different model preferences).

---

## Phase 9: Cost Optimization Setup

### 9.1 Model Cascading Configuration

Configure model routing based on task complexity:

| Context | Model | Trigger |
|---------|-------|---------|
| Plan mode (Shift+Tab) | Opus | Complex reasoning, architecture |
| Standard coding | Sonnet | Default for all implementation |
| Research subagents | Haiku | Information retrieval, lookups |
| Code review agents | Opus | Risk-sensitive analysis |
| Test writing agents | Sonnet | Pattern-based generation |

### 9.2 Context Budget Rules

- Keep CLAUDE.md under 150 lines (routing file, not knowledge dump)
- Run `/compact` every 20-30 exchanges
- Use `/clear` between unrelated tasks
- Delegate focused work to subagents (fresh context window)
- Skills use `context: fork` for heavy domain tasks
- Limit global MCP servers to 2-3 (rest in `.mcp.json`)

---

## Phase 10: Verification & Scoring

Run a final audit and produce a setup score:

```
=== Claude Code Setup Report ===

Layer 1 (CLAUDE.md):     ██████████ 100%  ✓ Root + 3 subdirectory + 6 rules
Layer 2 (Skills):        ████████░░  80%  ✓ 4/5 stack-matched skills
Layer 3 (Hooks):         ██████████ 100%  ✓ 6 hooks across 4 events
Layer 4 (Agents):        ██████░░░░  60%  ✓ 2/4 recommended agents

MCP Servers:             ████████░░  80%  ✓ 3/4 detected, 1 needs API key
LSP:                     ██████████ 100%  ✓ 2/2 detected, both installed
Memory:                  ██████████ 100%  ✓ Split memory with 5 files
Cost Optimization:       ████████░░  80%  ✓ Model cascading configured

Overall Score: 88/100 — Power User Setup
```

Scoring rubric:
- **0-25**: Minimal — CLAUDE.md only
- **26-50**: Basic — CLAUDE.md + some settings
- **51-75**: Intermediate — 2-3 layers configured
- **76-90**: Advanced — All 4 layers + MCP + memory
- **91-100**: Power User — Full stack with cost optimization

---

## Implementation Flow

When `/cc-setup` is invoked:

1. **Scan** — Glob/Grep the repo against all detection maps (Phase 1)
2. **Score existing** — Check what's already configured (Phase 1.7)
3. **Ask user** (unless `--auto`):
   - Confirm detected stack
   - Choose preset or customize each layer
   - Select MCP servers to install
   - Choose hook aggressiveness
4. **Generate Layer 1** — CLAUDE.md + rules + split memory files (Phase 2)
5. **Generate Layer 2** — Stack-specific skills (Phase 3)
6. **Generate Layer 3** — Hooks and hook scripts (Phase 4)
7. **Generate Layer 4** — Agent definitions (Phase 5)
8. **Configure MCP** — Install detected servers (Phase 6)
9. **Configure LSP** — Report and install recommendations (Phase 7)
10. **Generate settings** — Permissions, model, features (Phase 8)
11. **Apply cost optimizations** — Model cascading, context rules (Phase 9)
12. **Verify & score** — Audit everything, output report (Phase 10)

---

## Flags

| Flag | Description |
|------|-------------|
| `--auto` | Non-interactive mode with best-guess defaults |
| `--dry-run` | Show plan without writing files |
| `--mcp-only` | Only detect and configure MCP servers |
| `--hooks-only` | Only set up hooks |
| `--rules-only` | Only generate rules files |
| `--skills-only` | Only generate skills |
| `--agents-only` | Only generate agents |
| `--memory-only` | Only set up memory architecture |
| `--audit` | Audit existing config, score it, suggest improvements |
| `--force` | Overwrite existing configurations |
| `--preset <name>` | Use preset (see below) |
| `--skip-mcp` | Skip MCP server installation |
| `--skip-hooks` | Skip hook generation |
| `--skip-lsp` | Skip LSP detection |
| `--skip-skills` | Skip skill generation |
| `--skip-agents` | Skip agent generation |
| `--worktree` | Also set up git worktree for parallel development |

---

## Presets

### `developer` (default)
- Permissive permissions for local dev
- All 4 layers configured
- Standard hooks (security + format + error capture)
- 2-3 detected MCP servers + context7
- Split memory architecture
- Auto-memory and auto-compact enabled

### `power-user`
- Full 4-layer stack with maximum coverage
- All detected MCP servers
- Comprehensive hooks (6+ events)
- Model cascading (Opus for planning, Sonnet for coding, Haiku for research)
- Split memory + memory MCP server recommendation
- Auto-generated skills for every detected stack component
- Agent team templates (builder + validator + security)
- Git worktree setup for parallel development

### `ci-cd`
- Restrictive permissions (read-only + test/build)
- Minimal MCP servers (github only)
- Audit-only hooks
- Haiku model for cost efficiency
- No auto-memory, no auto-compact
- Headless-optimized settings

### `secure`
- Strict permissions (read + grep only by default)
- No MCP servers
- Comprehensive security hooks on every tool call
- No web access tools
- Security-auditor agent only
- Opus model for thorough analysis

### `minimal`
- Basic CLAUDE.md only
- Default permissions
- No MCP, no hooks, no rules, no skills, no agents
- Good starting point for small/personal projects

### `team`
- Shared CLAUDE.md with team conventions
- Project-scoped settings (no user-local overrides)
- Managed MCP configuration
- Standard hooks for consistency
- Agent templates for common team workflows
- `.gitignore` additions for local-only files
