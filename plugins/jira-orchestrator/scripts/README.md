# Jira Orchestrator - Installation and Setup Scripts

This directory contains scripts for installing, configuring, and verifying the Jira Orchestrator plugin.

## Scripts

### Installation Scripts

#### `install.sh`

Main installation script that sets up the Jira Orchestrator plugin.

**What it does:**
- Creates required directories (sessions, logs, cache)
- Checks for Claude Code CLI
- Adds the Atlassian MCP server
- Verifies MCP server installation
- Checks environment variables
- Displays setup instructions

**Usage:**
```bash
./scripts/install.sh
```

**Requirements:**
- Claude Code CLI installed
- npm/npx available
- Internet connection

**Output:**
- Installation log: `logs/install-YYYYMMDD-HHMMSS.log`

#### `post-install.sh`

Post-installation verification script that checks everything is working.

**What it does:**
- Verifies MCP server is installed
- Checks environment variables
- Verifies plugin structure
- Checks hook scripts are executable
- Verifies hooks configuration
- Displays next steps

**Usage:**
```bash
./scripts/post-install.sh
```

**Output:**
- Verification log: `logs/post-install-YYYYMMDD-HHMMSS.log`

### Verification Scripts

#### `check-mcp.sh`

Checks if the Atlassian MCP server is installed.

**Usage:**
```bash
./scripts/check-mcp.sh
```

**Output:**
```bash
MCP_INSTALLED=true|false
MCP_NAME=atlassian
```

**Exit Codes:**
- `0` - MCP server found
- `1` - MCP server not found

#### `check-env.sh`

Checks if required environment variables are set.

**Usage:**
```bash
./scripts/check-env.sh
```

**Output:**
```bash
JIRA_API_TOKEN=SET|MISSING
JIRA_SITE_URL=SET|MISSING
JIRA_USER_EMAIL=SET|MISSING
SITE_URL=https://yourcompany.atlassian.net
USER_EMAIL=your.email@company.com
ENV_STATUS=COMPLETE|INCOMPLETE
```

**Exit Codes:**
- `0` - All variables set
- `1` - Some variables missing

#### `verify-plugin.sh`

Verifies plugin structure and components.

**Usage:**
```bash
./scripts/verify-plugin.sh
```

**Output:**
```bash
DIR_AGENTS=EXISTS|MISSING
DIR_COMMANDS=EXISTS|MISSING
DIR_SKILLS=EXISTS|MISSING
DIR_HOOKS=EXISTS|MISSING
DIR_SCRIPTS=EXISTS|MISSING
HOOKS_CONFIG=EXISTS|MISSING
HOOK_COUNT=5
HOOK_SCRIPTS=5
PLUGIN_STATUS=VALID|INCOMPLETE
```

**Exit Codes:**
- `0` - Plugin structure valid
- `1` - Plugin structure incomplete

## Installation Flow

```
1. install.sh
   ├── Create directories
   ├── Check Claude CLI
   ├── Add MCP server
   ├── Verify MCP server
   ├── Check environment
   └── Display instructions

2. post-install.sh
   ├── Verify MCP installed
   ├── Check environment
   ├── Verify plugin structure
   ├── Check hook scripts
   └── Display next steps

3. /jira:setup command
   ├── Run all verification scripts
   ├── Test Jira connection
   ├── Verify hooks working
   └── Test with sample issue
```

## Environment Variables

All scripts check for these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `JIRA_API_TOKEN` | Your Jira API token | `ATATT3xFf...` |
| `JIRA_SITE_URL` | Your Jira site URL | `https://yourcompany.atlassian.net` |
| `JIRA_USER_EMAIL` | Your Jira account email | `your.email@company.com` |

### Generating API Token

1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a label (e.g., "Claude Code Jira Orchestrator")
4. Copy the token (you won't be able to see it again)

### Setting Environment Variables

Add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):

```bash
export JIRA_API_TOKEN="your_token_here"
export JIRA_SITE_URL="https://yourcompany.atlassian.net"
export JIRA_USER_EMAIL="your.email@company.com"
```

Then reload your shell:

```bash
source ~/.bashrc  # or ~/.zshrc
```

## MCP Server

The plugin requires the Atlassian MCP server to interact with Jira.

**MCP Server Details:**
- Name: `atlassian`
- URL: `https://mcp.atlassian.com/v1/mcp/authv2`
- Command: `npx -y mcp-remote https://mcp.atlassian.com/v1/mcp/authv2`

**Manual Installation:**

If automatic installation fails, add manually:

```bash
claude mcp add atlassian -- npx -y mcp-remote https://mcp.atlassian.com/v1/mcp/authv2
```

**Verify Installation:**

```bash
claude mcp list
```

Should show `atlassian` in the list.

## Troubleshooting

### Installation Failed

**Problem:** `install.sh` exits with error

**Solutions:**
1. Check Claude CLI is installed: `which claude`
2. Check npm/npx available: `which npx`
3. Check internet connection
4. Review installation log: `cat logs/install-*.log`
5. Try manual MCP installation (see above)

### MCP Server Not Found

**Problem:** MCP server not showing in `claude mcp list`

**Solutions:**
1. Run installation script again: `./scripts/install.sh`
2. Try manual installation
3. Check Claude CLI version: `claude --version`
4. Update Claude CLI to latest version

### Environment Variables Not Set

**Problem:** `check-env.sh` shows variables as MISSING

**Solutions:**
1. Set variables in shell profile
2. Reload shell: `source ~/.bashrc`
3. Check variable is set: `echo $JIRA_API_TOKEN`
4. Generate new API token if expired

### Connection Failed

**Problem:** Cannot connect to Jira

**Solutions:**
1. Verify site URL format (no trailing slash)
2. Check API token is valid
3. Verify email matches Jira account
4. Test URL in browser: `$JIRA_SITE_URL`
5. Generate new API token

### Hooks Not Working

**Problem:** Hooks don't trigger

**Solutions:**
1. Verify hooks.json exists: `cat hooks/hooks.json`
2. Check hook scripts are executable: `ls -l hooks/scripts/`
3. Make scripts executable: `chmod +x hooks/scripts/*.sh`
4. Verify plugin is installed correctly
5. Check Claude CLI supports hooks

## Log Files

All scripts create log files in the `logs/` directory:

| Log File | Created By | Contents |
|----------|-----------|----------|
| `install-YYYYMMDD-HHMMSS.log` | install.sh | Installation steps and results |
| `post-install-YYYYMMDD-HHMMSS.log` | post-install.sh | Verification results |

**View latest installation log:**
```bash
cat logs/install-*.log | tail -1
```

**View all logs:**
```bash
ls -lt logs/
```

## Next Steps After Installation

1. **Configure Environment Variables** (if not done)
   - Set JIRA_API_TOKEN, JIRA_SITE_URL, JIRA_USER_EMAIL
   - Reload shell

2. **Run Setup Wizard**
   ```bash
   claude /jira:setup
   ```

3. **Test with an Issue**
   ```bash
   claude /jira:triage ISSUE-KEY
   ```

4. **Start Orchestrating**
   ```bash
   claude /jira:work ISSUE-KEY
   ```

## See Also

- [Plugin README](../README.md) - Main plugin documentation
- [Hooks README](../hooks/README.md) - Hooks documentation
- [Setup Command](../commands/setup.md) - Interactive setup wizard
- [Work Command](../commands/work.md) - Orchestration workflow

## Support

For issues or questions:
- Check troubleshooting section above
- Review log files
- Run verification scripts
- Consult plugin documentation
