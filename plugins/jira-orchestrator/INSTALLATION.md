# Golden Armada - Installation Guide

Complete installation and setup guide for the Golden Armada - Lobbi Autonomous DevOps Orchestration plugin.

## Prerequisites

Before installing, ensure you have:

- [ ] Claude Code CLI installed and configured
- [ ] Git installed
- [ ] Node.js and npm/npx installed (for MCP server)
- [ ] Active Jira account with API access
- [ ] Access to a Jira project

## Quick Install

### Step 1: Install Plugin

```bash
# Clone or download the plugin
cd C:\Users\MarkusAhling\pro\alpha-0.1\claude\jira-orchestrator

# Run installation script
bash scripts/install.sh
```

### Step 2: Configure Environment

Generate a Jira API token:

1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Label it: "Claude Code Golden Armada"
4. Copy the token

Add environment variables to your shell profile:

**Bash (~/.bashrc):**
```bash
export JIRA_API_TOKEN="your_token_here"
export JIRA_SITE_URL="https://yourcompany.atlassian.net"
export JIRA_USER_EMAIL="your.email@company.com"
```

**Zsh (~/.zshrc):**
```zsh
export JIRA_API_TOKEN="your_token_here"
export JIRA_SITE_URL="https://yourcompany.atlassian.net"
export JIRA_USER_EMAIL="your.email@company.com"
```

**PowerShell (Profile.ps1):**
```powershell
$env:JIRA_API_TOKEN = "your_token_here"
$env:JIRA_SITE_URL = "https://yourcompany.atlassian.net"
$env:JIRA_USER_EMAIL = "your.email@company.com"
```

Reload your shell:

```bash
source ~/.bashrc  # or ~/.zshrc
```

### Step 3: Run Setup Wizard

```bash
claude /jira:setup
```

This interactive wizard will:
- Verify environment variables
- Test Jira connection
- Verify MCP server
- Check plugin structure
- Run a test issue fetch

### Step 4: Start Using

```bash
# Work on an issue with full orchestration
claude /jira:work ISSUE-KEY

# Or analyze an issue first
claude /jira:triage ISSUE-KEY
```

## Detailed Installation

### Installing Claude Code CLI

If you don't have Claude Code CLI installed:

```bash
# Install via npm (example - check official docs)
npm install -g @anthropic/claude-code

# Verify installation
claude --version
```

**Official Documentation:** https://docs.anthropic.com/claude/docs/claude-code

### Installing the Plugin

#### Option 1: From Git Repository

```bash
# Clone the repository
git clone https://github.com/your-org/jira-orchestrator.git
cd jira-orchestrator

# Run installation
bash scripts/install.sh
```

#### Option 2: Manual Installation

1. Download plugin files to Claude plugins directory
2. Run installation script
3. Follow setup instructions

```bash
# Make scripts executable
bash scripts/make-executable.sh

# Run installation
bash scripts/install.sh
```

### Atlassian MCP Server

The plugin automatically installs the Atlassian MCP server during setup.

**What it does:**
- Adds the `atlassian` MCP server to Claude Code
- Configures it to use: `npx -y mcp-remote https://mcp.atlassian.com/v1/mcp/authv2`
- Enables Jira tool access

**Verify Installation:**

```bash
claude mcp list
# Should show: atlassian
```

**Manual Installation (if auto-install fails):**

```bash
claude mcp add atlassian -- npx -y mcp-remote https://mcp.atlassian.com/v1/mcp/authv2
```

### Environment Variables

#### JIRA_API_TOKEN

Your Jira API token for authentication.

**Generate:**
1. Visit: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Name it (e.g., "Claude Code Jira Orchestrator")
4. Copy the token immediately (you can't view it again)

**Security:**
- Store securely (never commit to git)
- Regenerate if compromised
- Use separate tokens for different tools

#### JIRA_SITE_URL

Your Jira instance URL.

**Format:**
```
https://yourcompany.atlassian.net
```

**Important:**
- No trailing slash
- Use https://
- Include full domain

**Find Your Site URL:**
- Look at your Jira URL in browser
- Should be visible in Jira settings
- Ask your Jira administrator

#### JIRA_USER_EMAIL

The email address associated with your Jira account.

**Must match:**
- The email used to create the API token
- Your Jira login email
- The account that will be making API calls

### Directory Structure

After installation, the plugin directory should look like:

```
jira-orchestrator/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata
├── agents/                  # Orchestration agents
├── commands/                # Slash commands
│   └── setup.md            # Setup wizard
├── skills/                  # Specialized skills
├── hooks/                   # Event hooks
│   ├── hooks.json          # Hook configuration
│   └── scripts/            # Hook shell scripts
├── scripts/                # Installation scripts
│   ├── install.sh          # Main installation
│   ├── post-install.sh     # Verification
│   ├── check-mcp.sh        # MCP checker
│   ├── check-env.sh        # Environment checker
│   └── verify-plugin.sh    # Plugin structure checker
├── sessions/               # Active orchestrations
│   ├── active/            # Current sessions
│   └── completed/         # Finished sessions
├── logs/                   # Installation and operation logs
├── cache/                  # Temporary cache
├── README.md              # Main documentation
└── INSTALLATION.md        # This file
```

## Verification

### Run Post-Install Verification

```bash
bash scripts/post-install.sh
```

This checks:
- ✓ MCP server installed
- ✓ Environment variables set
- ✓ Plugin structure valid
- ✓ Hook scripts executable
- ✓ Hooks configuration present

### Manual Verification

#### Check MCP Server

```bash
claude mcp list
# Expected: Shows "atlassian"
```

#### Check Environment

```bash
bash scripts/check-env.sh
# Expected: All variables show "SET"
```

#### Check Plugin Structure

```bash
bash scripts/verify-plugin.sh
# Expected: All directories show "EXISTS"
```

#### Test Jira Connection

```bash
# Run setup wizard
claude /jira:setup

# Or test with a real issue
claude /jira:triage PROJECT-123
```

## Troubleshooting

### Installation Issues

#### Claude CLI Not Found

**Error:** `command not found: claude`

**Solution:**
1. Install Claude Code CLI
2. Add to PATH
3. Verify: `which claude`

#### MCP Server Installation Failed

**Error:** `Failed to add Atlassian MCP server`

**Solution:**
1. Check npm/npx available: `which npx`
2. Try manual installation:
   ```bash
   claude mcp add atlassian -- npx -y mcp-remote https://mcp.atlassian.com/v1/mcp/authv2
   ```
3. Check internet connection
4. Review installation log: `cat logs/install-*.log`

#### Permissions Error

**Error:** `Permission denied` when running scripts

**Solution:**
1. Make scripts executable:
   ```bash
   bash scripts/make-executable.sh
   ```
2. Or manually:
   ```bash
   chmod +x scripts/*.sh
   chmod +x hooks/scripts/*.sh
   ```

### Configuration Issues

#### Environment Variables Not Set

**Error:** Variables show as MISSING

**Solution:**
1. Add to shell profile (~/.bashrc or ~/.zshrc)
2. Reload shell: `source ~/.bashrc`
3. Verify: `echo $JIRA_API_TOKEN`
4. Check for typos in variable names

#### Invalid API Token

**Error:** Authentication failed

**Solution:**
1. Generate new token: https://id.atlassian.com/manage-profile/security/api-tokens
2. Update environment variable
3. Reload shell
4. Test connection: `claude /jira:setup`

#### Wrong Site URL

**Error:** Cannot reach Jira site

**Solution:**
1. Verify URL format (no trailing slash)
2. Check URL in browser
3. Ensure https:// included
4. Verify site is accessible
5. Update JIRA_SITE_URL variable

### Connection Issues

#### Cannot Connect to Jira

**Error:** Connection timeout or refused

**Solutions:**
1. Verify site URL is correct
2. Check internet connection
3. Test URL in browser: `$JIRA_SITE_URL`
4. Check firewall/proxy settings
5. Verify Jira site is up

#### Authentication Failed

**Error:** 401 Unauthorized

**Solutions:**
1. Verify API token is valid
2. Check email matches Jira account
3. Regenerate API token
4. Verify user has Jira access
5. Check token hasn't expired

#### Permission Denied

**Error:** 403 Forbidden

**Solutions:**
1. Verify user has project access
2. Check required permissions:
   - Browse projects
   - View issues
   - Edit issues
   - Transition issues
3. Contact Jira administrator for access

### Plugin Issues

#### Hooks Not Triggering

**Error:** Hooks don't fire

**Solutions:**
1. Verify hooks.json exists
2. Check hook scripts executable
3. Review hooks configuration
4. Test with: `claude /jira:setup`

#### Commands Not Found

**Error:** `/jira:setup` command not recognized

**Solutions:**
1. Verify commands directory exists
2. Check setup.md exists
3. Reload plugin
4. Check plugin is installed correctly

## Upgrading

To upgrade the plugin:

```bash
# Pull latest changes
git pull origin main

# Re-run installation
bash scripts/install.sh

# Verify upgrade
bash scripts/post-install.sh
```

## Uninstalling

To remove the plugin:

```bash
# Remove MCP server
claude mcp remove atlassian

# Remove environment variables from shell profile
# (Manually edit ~/.bashrc or ~/.zshrc)

# Remove plugin directory
rm -rf jira-orchestrator/
```

## Getting Help

### Check Logs

```bash
# View latest installation log
cat logs/install-*.log | tail -50

# View latest post-install log
cat logs/post-install-*.log | tail -50

# List all logs
ls -lt logs/
```

### Run Diagnostics

```bash
# Check MCP server
bash scripts/check-mcp.sh

# Check environment
bash scripts/check-env.sh

# Check plugin structure
bash scripts/verify-plugin.sh

# Full setup wizard
claude /jira:setup
```

### Common Commands

```bash
# List available commands
claude /jira:help

# Check orchestration status
claude /jira:status

# Test with an issue
claude /jira:triage ISSUE-KEY
```

### Support Resources

- [Plugin README](README.md) - Main documentation
- [Hooks Documentation](hooks/README.md) - Hook system
- [Scripts README](scripts/README.md) - Installation scripts
- [Command Docs](commands/) - Individual commands

## Best Practices

### Security

- Never commit API tokens to git
- Use separate tokens for different tools
- Rotate tokens regularly
- Store tokens securely
- Use environment variables, not hardcoded values

### Environment Setup

- Use shell profile for persistent variables
- Document variables for team members
- Test variables after setting: `echo $VAR_NAME`
- Reload shell after changes

### Installation

- Run post-install verification
- Check logs for errors
- Test with a real issue before relying on plugin
- Keep plugin updated

### Troubleshooting

- Start with setup wizard: `/jira:setup`
- Check logs in logs/ directory
- Run verification scripts
- Test each component individually

## Next Steps

After successful installation:

1. **Test with an Issue**
   ```bash
   claude /jira:triage PROJECT-123
   ```

2. **Learn the Commands**
   ```bash
   claude /jira:help
   ```

3. **Start Orchestrating**
   ```bash
   claude /jira:work PROJECT-123
   ```

4. **Read Documentation**
   - [Main README](README.md)
   - [Hooks Guide](hooks/README.md)
   - [Agent Documentation](agents/)

5. **Explore Features**
   - Automatic issue detection
   - Code review gates
   - Documentation reminders
   - Session resume
   - Status tracking

## Conclusion

Your Golden Armada plugin should now be installed and ready to use!

If you encounter any issues:
1. Run `/jira:setup` for diagnostics
2. Check logs for errors
3. Review troubleshooting section
4. Consult plugin documentation

Happy orchestrating!

---

**⚓ Golden Armada** | *You ask - The Fleet Ships*

## Integration Contract Validation (Setup + CI)

Run integration validation as part of setup and CI checks:

```bash
npm run setup
npm run validate:integrations
npm run ci
```

The validator writes a machine-readable report to `sessions/reports/integration-health.json` and exits non-zero when `error`-severity issues are detected.

For fixture authoring and remediation workflow details, see `docs/ADVANCED-INTEGRATION-VALIDATION.md`.
