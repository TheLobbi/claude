# Jira Orchestrator - Installation Checklist

Use this checklist to ensure successful installation and setup.

## Pre-Installation

- [ ] Claude Code CLI installed (`claude --version`)
- [ ] Git installed (`git --version`)
- [ ] Node.js and npm installed (`node --version`, `npm --version`)
- [ ] Active Jira account with API access
- [ ] Access to at least one Jira project

## Installation Steps

### 1. Download Plugin

- [ ] Clone or download plugin to local directory
- [ ] Navigate to plugin directory
- [ ] Verify directory structure exists

```bash
cd C:\Users\MarkusAhling\pro\alpha-0.1\claude\jira-orchestrator
ls -la
```

**Expected:** See directories: agents/, commands/, skills/, hooks/, scripts/

### 2. Run Installation Script

- [ ] Make scripts executable
- [ ] Run installation script
- [ ] Review installation output
- [ ] Check for errors

```bash
bash scripts/make-executable.sh
bash scripts/install.sh
```

**Expected:** See "Installation complete!" message

### 3. Generate Jira API Token

- [ ] Visit: https://id.atlassian.com/manage-profile/security/api-tokens
- [ ] Click "Create API token"
- [ ] Label: "Claude Code Jira Orchestrator"
- [ ] Copy token (save securely)

**Important:** You can only view the token once!

### 4. Set Environment Variables

- [ ] Add JIRA_API_TOKEN to shell profile
- [ ] Add JIRA_SITE_URL to shell profile
- [ ] Add JIRA_USER_EMAIL to shell profile
- [ ] Reload shell profile

**Bash (~/.bashrc):**
```bash
export JIRA_API_TOKEN="your_token_here"
export JIRA_SITE_URL="https://yourcompany.atlassian.net"
export JIRA_USER_EMAIL="your.email@company.com"
```

**Reload:**
```bash
source ~/.bashrc
```

**Verify:**
```bash
echo $JIRA_API_TOKEN
echo $JIRA_SITE_URL
echo $JIRA_USER_EMAIL
```

### 5. Verify Environment

- [ ] Check all variables set
- [ ] Verify no typos in variable names
- [ ] Confirm site URL format (no trailing slash)

```bash
bash scripts/check-env.sh
```

**Expected:**
```
JIRA_API_TOKEN=SET
JIRA_SITE_URL=SET
JIRA_USER_EMAIL=SET
ENV_STATUS=COMPLETE
```

### 6. Verify MCP Server

- [ ] Check MCP server installed
- [ ] Verify server name is "atlassian"
- [ ] Confirm server in Claude MCP list

```bash
bash scripts/check-mcp.sh
claude mcp list
```

**Expected:**
```
MCP_INSTALLED=true
MCP_NAME=atlassian
```

**And claude mcp list shows:** `atlassian`

### 7. Verify Plugin Structure

- [ ] Check all directories exist
- [ ] Verify hooks configuration
- [ ] Confirm hook scripts present

```bash
bash scripts/verify-plugin.sh
```

**Expected:**
```
DIR_AGENTS=EXISTS
DIR_COMMANDS=EXISTS
DIR_SKILLS=EXISTS
DIR_HOOKS=EXISTS
DIR_SCRIPTS=EXISTS
HOOKS_CONFIG=EXISTS
HOOK_COUNT=5
PLUGIN_STATUS=VALID
```

### 8. Run Post-Install Verification

- [ ] Run post-install script
- [ ] Review verification results
- [ ] Address any issues found

```bash
bash scripts/post-install.sh
```

**Expected:** All checks pass with green checkmarks

### 9. Run Setup Wizard

- [ ] Execute setup command
- [ ] Complete all wizard steps
- [ ] Verify Jira connection
- [ ] Test with sample issue

```bash
claude /jira:setup
```

**Expected:**
- All phases complete successfully
- Connection to Jira verified
- Projects listed
- Test issue fetched

### 10. Test Basic Functionality

- [ ] List available commands
- [ ] Check orchestration status
- [ ] Test triage on a real issue

```bash
# List commands
claude /jira:help

# Check status
claude /jira:status

# Test triage
claude /jira:triage PROJECT-123
```

**Replace PROJECT-123 with a real issue key you have access to**

## Verification Checklist

### Environment

- [ ] JIRA_API_TOKEN is set and valid
- [ ] JIRA_SITE_URL is correct format (https://company.atlassian.net)
- [ ] JIRA_USER_EMAIL matches Jira account
- [ ] Variables persist after shell restart
- [ ] No typos in variable names

### MCP Server

- [ ] Atlassian MCP server installed
- [ ] Server appears in `claude mcp list`
- [ ] Server name is exactly "atlassian"
- [ ] npx command works: `which npx`

### Plugin Structure

- [ ] agents/ directory exists with agent files
- [ ] commands/ directory exists with command files
- [ ] skills/ directory exists with skill files
- [ ] hooks/ directory exists with hooks.json
- [ ] hooks/scripts/ directory exists with .sh files
- [ ] scripts/ directory exists with installation scripts
- [ ] sessions/ directory created for tracking
- [ ] logs/ directory created for logging

### Hooks

- [ ] hooks.json file exists
- [ ] 5+ hooks registered in hooks.json
- [ ] Hook scripts are executable (chmod +x)
- [ ] Hook scripts exist in hooks/scripts/
- [ ] Scripts reference correct paths

### Connection

- [ ] Can connect to Jira site
- [ ] Authentication succeeds
- [ ] User information retrieved
- [ ] Projects can be listed
- [ ] Test issue can be fetched
- [ ] No 401/403 errors

### Commands

- [ ] /jira:setup command works
- [ ] /jira:work command available
- [ ] /jira:triage command available
- [ ] /jira:status command available
- [ ] /jira:review command available
- [ ] /jira:pr command available
- [ ] /jira:docs command available
- [ ] /jira:sync command available
- [ ] /jira:cancel command available

### Agents

- [ ] triage-agent.md exists
- [ ] code-reviewer.md exists
- [ ] pr-creator.md exists
- [ ] documentation-writer.md exists
- [ ] Other agents present

### Logs

- [ ] Installation log created
- [ ] Post-install log created
- [ ] Logs directory contains files
- [ ] Logs readable and detailed

## Common Issues

### ❌ MCP Server Not Found

**Problem:** `bash scripts/check-mcp.sh` returns MCP_INSTALLED=false

**Solution:**
```bash
# Try manual installation
claude mcp add atlassian -- npx -y mcp-remote https://mcp.atlassian.com/v1/mcp/authv2

# Verify
claude mcp list
```

### ❌ Environment Variables Missing

**Problem:** `bash scripts/check-env.sh` shows MISSING

**Solution:**
1. Add to ~/.bashrc or ~/.zshrc
2. Source the file: `source ~/.bashrc`
3. Verify: `echo $JIRA_API_TOKEN`

### ❌ Authentication Failed

**Problem:** Cannot connect to Jira

**Solution:**
1. Verify API token is correct
2. Check email matches Jira account
3. Confirm site URL format
4. Generate new API token

### ❌ Permission Denied

**Problem:** Scripts won't execute

**Solution:**
```bash
bash scripts/make-executable.sh
# Or manually:
chmod +x scripts/*.sh
chmod +x hooks/scripts/*.sh
```

### ❌ Hooks Not Working

**Problem:** Hooks don't trigger

**Solution:**
1. Verify hooks.json exists
2. Check scripts executable
3. Test with setup: `claude /jira:setup`

## Success Criteria

Installation is successful when:

✅ All environment variables set and valid
✅ Atlassian MCP server installed and working
✅ Plugin structure complete and verified
✅ Hooks configured and scripts executable
✅ Jira connection successful
✅ Can fetch user info and projects
✅ Can retrieve test issue
✅ Setup wizard completes without errors
✅ All commands available and working
✅ All agents present
✅ Logs created successfully

## Post-Installation

After successful installation:

### 1. Document Your Setup

Record for your team:
- Jira site URL
- Where API tokens are stored
- Project keys you work with
- Any custom configuration

### 2. Test with Real Work

```bash
# Pick a real issue
claude /jira:work TEAM-123

# Let it run through full orchestration
# Verify each phase completes
```

### 3. Learn the Features

- Read [README.md](README.md)
- Review [hooks/README.md](hooks/README.md)
- Explore agents in agents/
- Try all commands

### 4. Configure for Your Team

- Set up team conventions
- Configure hooks for your workflow
- Customize agents if needed
- Set up shared documentation

### 5. Monitor and Maintain

- Check logs regularly
- Rotate API tokens periodically
- Update plugin as needed
- Report issues or improvements

## Next Steps

- [ ] Read main README.md
- [ ] Review hooks documentation
- [ ] Test full orchestration workflow
- [ ] Try all available commands
- [ ] Customize for your team
- [ ] Set up documentation templates
- [ ] Configure issue tracking
- [ ] Set up team conventions

## Resources

| Resource | Location |
|----------|----------|
| Main Documentation | [README.md](README.md) |
| Installation Guide | [INSTALLATION.md](INSTALLATION.md) |
| Hooks Documentation | [hooks/README.md](hooks/README.md) |
| Scripts Guide | [scripts/README.md](scripts/README.md) |
| Commands | [commands/](commands/) |
| Agents | [agents/](agents/) |
| Skills | [skills/](skills/) |

## Support

If you need help:

1. Run diagnostics: `claude /jira:setup`
2. Check logs: `cat logs/*.log`
3. Run verification: `bash scripts/post-install.sh`
4. Review troubleshooting in [INSTALLATION.md](INSTALLATION.md)
5. Check command help: `claude /jira:help`

## Completion

When everything checks out:

🎉 **Installation Complete!**

You're ready to start using Jira Orchestrator.

Try it:
```bash
claude /jira:work YOUR-ISSUE-KEY
```

Happy orchestrating! 🚀
