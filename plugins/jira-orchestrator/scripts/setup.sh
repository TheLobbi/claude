#!/bin/bash
# ============================================================================
# JIRA ORCHESTRATOR PLUGIN - SETUP SCRIPT
# ============================================================================
# This script sets up the jira-orchestrator plugin for use with Claude Code
# Run this script after installing the plugin
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================================================
# ENVIRONMENT SETUP
# ============================================================================

setup_env() {
  log_info "Setting up environment configuration..."

  if [ ! -f "$PROJECT_ROOT/.env" ]; then
    if [ -f "$PLUGIN_DIR/.env.example" ]; then
      cp "$PLUGIN_DIR/.env.example" "$PROJECT_ROOT/.env"
      log_success "Created .env from template. Please configure your values."
    else
      log_error "No .env.example found in plugin directory."
      return 1
    fi
  else
    log_info ".env already exists. Checking for missing variables..."
    # Check for required variables
    local required_vars=(
      "ATLASSIAN_CLOUD_ID"
      "JIRA_DEFAULT_PROJECT"
    )

    for var in "${required_vars[@]}"; do
      if ! grep -q "^${var}=" "$PROJECT_ROOT/.env"; then
        log_warn "Missing required variable: $var"
      fi
    done
  fi
}

# ============================================================================
# CLAUDE.MD MANAGEMENT
# ============================================================================

CLAUDE_MD_PATH="$PROJECT_ROOT/.claude/CLAUDE.md"

generate_claude_md() {
  cat << 'CLAUDE_MD_EOF'
# Jira Orchestrator - Claude Code Configuration

## Plugin Overview

This project uses the **jira-orchestrator** plugin for Atlassian integration.

## MCP Configuration

**Required:** Atlassian MCP SSE must be configured:
```bash
claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp/authv2
```

## Available Tools

### Jira Operations
- `mcp__atlassian__getJiraIssue` - Get issue details
- `mcp__atlassian__createJiraIssue` - Create new issues
- `mcp__atlassian__editJiraIssue` - Update issues
- `mcp__atlassian__transitionJiraIssue` - Change issue status
- `mcp__atlassian__addCommentToJiraIssue` - Add comments
- `mcp__atlassian__searchJiraIssuesUsingJql` - Search with JQL

### Confluence Operations
- `mcp__atlassian__getConfluencePage` - Get page content
- `mcp__atlassian__createConfluencePage` - Create pages
- `mcp__atlassian__updateConfluencePage` - Update pages
- `mcp__atlassian__searchConfluenceUsingCql` - Search with CQL

## Issue Hierarchy

This project uses strict hierarchy:
```
Initiative -> Epic -> Story -> Task -> Subtask
```

## CRITICAL: Issue Validation

**Before ANY Jira write operation:**
1. Always validate the issue key exists
2. Check neighboring issues (off-by-one errors are common)
3. Verify issue summary matches intent
4. Never claim to be working on an issue without validation

Use the `issue-validator` agent before all write operations.

## Commands

- `/jira triage <issue-key>` - Triage an issue
- `/jira transition <issue-key> <status>` - Transition issue
- `/harness-pipeline trigger <pipeline> --jira <issue-key>` - Run pipeline
- `/pr-fix <pr-url>` - Fix issues from PR comments and re-review

## Environment Variables

Required in `.env`:
- `ATLASSIAN_CLOUD_ID` - Your Atlassian cloud ID
- `JIRA_DEFAULT_PROJECT` - Default project key

Optional:
- `HARNESS_API_KEY` - For CI/CD integration
- `HARNESS_ACCOUNT_ID` - Harness account

## Safety Rules

1. Never modify issues without explicit user confirmation
2. Always validate issue keys before operations
3. Check hierarchy before creating child issues
4. Log all Jira operations for audit

## Documentation

Full documentation: See `lib/` directory in the plugin.
CLAUDE_MD_EOF
}

update_claude_md() {
  log_info "Checking CLAUDE.md configuration..."

  # Create .claude directory if it doesn't exist
  mkdir -p "$(dirname "$CLAUDE_MD_PATH")"

  if [ ! -f "$CLAUDE_MD_PATH" ]; then
    log_info "CLAUDE.md not found. Creating new configuration..."
    generate_claude_md > "$CLAUDE_MD_PATH"
    log_success "Created CLAUDE.md at $CLAUDE_MD_PATH"
  else
    log_info "CLAUDE.md exists. Checking for jira-orchestrator section..."

    if grep -q "jira-orchestrator" "$CLAUDE_MD_PATH"; then
      log_info "jira-orchestrator section already exists."
    else
      log_info "Adding jira-orchestrator section to existing CLAUDE.md..."

      # Append plugin info to existing CLAUDE.md
      cat << 'APPEND_EOF' >> "$CLAUDE_MD_PATH"

---

## Jira Orchestrator Plugin

**MCP Required:**
```bash
claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp/authv2
```

**Issue Hierarchy:** Initiative -> Epic -> Story -> Task -> Subtask

**Critical:** Always use `issue-validator` agent before Jira write operations.

**Commands:** `/jira triage`, `/jira transition`, `/pr-fix`
APPEND_EOF

      log_success "Updated CLAUDE.md with jira-orchestrator configuration."
    fi
  fi
}

# ============================================================================
# MCP VERIFICATION
# ============================================================================

verify_mcp() {
  log_info "Verifying MCP configuration..."

  if command -v claude &> /dev/null; then
    if claude mcp list 2>/dev/null | grep -q "atlassian"; then
      log_success "Atlassian MCP is configured."
    else
      log_warn "Atlassian MCP not found. Run:"
      echo "  claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp/authv2"
    fi
  else
    log_warn "Claude CLI not found. Cannot verify MCP configuration."
  fi
}

# ============================================================================
# COMMAND REFERENCE GENERATION
# ============================================================================

COMMANDS_REF_PATH="$PROJECT_ROOT/.claude/commands-reference.md"

generate_commands_reference() {
  log_info "Generating commands reference..."

  if [ -f "$PLUGIN_DIR/lib/commands-reference.md" ]; then
    mkdir -p "$(dirname "$COMMANDS_REF_PATH")"
    cp "$PLUGIN_DIR/lib/commands-reference.md" "$COMMANDS_REF_PATH"
    log_success "Commands reference generated at $COMMANDS_REF_PATH"
  else
    log_warn "Commands reference template not found. Generating minimal version..."

    cat << 'CMD_REF_EOF' > "$COMMANDS_REF_PATH"
# Jira Orchestrator - Commands Reference

## Quick Reference

| Command | Description | Flags |
|---------|-------------|-------|
| `/jira triage <key>` | Triage issue | `-d`, `-c`, `-i`, `-o` |
| `/jira transition <key> <status>` | Change status | `-m`, `-a`, `-f` |
| `/jira create <type>` | Create issue | `-p`, `--parent`, `-s`, `-d` |
| `/jira search [query]` | Search issues | `-j`, `-p`, `-s`, `-t`, `-n` |
| `/jira comment <key>` | Add comment | `-m`, `-v` |
| `/pr-fix <pr>` | Fix PR issues | `-j`, `-s`, `-c`, `--dry-run` |
| `/pr-create` | Create PR | `-t`, `-b`, `-j`, `-d`, `-r` |
| `/harness-pipeline <action>` | CI/CD pipelines | `-p`, `-b`, `-j`, `-e`, `-w` |
| `/doc create` | Create docs | `-t`, `-j`, `-s`, `-p` |
| `/council review` | Multi-agent review | `-t`, `-a`, `-f`, `-o` |
| `/validate issue <key>` | Validate issue | `-n`, `-h`, `-t` |

## Global Flags

- `--help` / `-h` - Show help
- `--verbose` / `-v` - Verbose output
- `--quiet` / `-q` - Suppress output
- `--no-interactive` - Disable prompts
- `--cloud-id` - Override cloud ID
- `--project` - Override project

For full documentation, see: lib/commands-reference.md
CMD_REF_EOF

    log_success "Minimal commands reference created."
  fi
}

# ============================================================================
# MAIN SETUP
# ============================================================================

main() {
  echo "============================================"
  echo "  JIRA ORCHESTRATOR PLUGIN SETUP"
  echo "============================================"
  echo ""

  setup_env
  update_claude_md
  generate_commands_reference
  verify_mcp

  echo ""
  log_success "Setup complete!"
  echo ""
  echo "Next steps:"
  echo "  1. Configure .env with your Atlassian Cloud ID"
  echo "  2. Ensure Atlassian MCP is configured"
  echo "  3. Review commands reference at $COMMANDS_REF_PATH"
  echo "  4. Run '/jira triage <issue-key>' to test"
  echo ""
}

main "$@"
