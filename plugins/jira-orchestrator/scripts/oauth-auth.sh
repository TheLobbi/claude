#!/bin/bash
# =============================================================================
# Jira Orchestrator - OAuth 2.1 Authentication Script
# =============================================================================
# This script handles OAuth/SSO authentication for the Atlassian MCP Server.
# No API tokens needed - uses browser-based OAuth 2.1 with your organization's SSO.
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Jira Orchestrator - OAuth 2.1 / SSO Authentication        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# -----------------------------------------------------------------------------
# Step 1: Check Prerequisites
# -----------------------------------------------------------------------------
echo -e "${CYAN}Step 1: Checking prerequisites...${NC}"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "  Please install Node.js from https://nodejs.org"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check for npx
if ! command -v npx &> /dev/null; then
    echo -e "${RED}✗ npx is not installed${NC}"
    echo "  npx comes with npm, please install Node.js"
    exit 1
fi
echo -e "${GREEN}✓ npx found${NC}"

# Check for Claude Code CLI
if command -v claude &> /dev/null; then
    echo -e "${GREEN}✓ Claude Code CLI found${NC}"
    CLAUDE_CLI=true
else
    echo -e "${YELLOW}! Claude Code CLI not found in PATH${NC}"
    echo "  Will use npx directly for MCP connection"
    CLAUDE_CLI=false
fi

echo ""

# -----------------------------------------------------------------------------
# Step 2: Add Atlassian MCP Server
# -----------------------------------------------------------------------------
echo -e "${CYAN}Step 2: Adding Atlassian MCP Server...${NC}"
echo ""

MCP_URL="https://mcp.atlassian.com/v1/mcp/authv2"

if [ "$CLAUDE_CLI" = true ]; then
    echo -e "${BLUE}Adding Atlassian MCP server via Claude CLI...${NC}"
    echo ""

    # Check if already exists
    if claude mcp list 2>/dev/null | grep -q "atlassian"; then
        echo -e "${YELLOW}! Atlassian MCP server already configured${NC}"
        echo ""
        read -p "Do you want to reconfigure it? (y/N): " reconfigure
        if [[ "$reconfigure" =~ ^[Yy]$ ]]; then
            echo "Removing existing configuration..."
            claude mcp remove atlassian 2>/dev/null || true
        else
            echo "Keeping existing configuration."
            echo ""
        fi
    fi

    # Add the MCP server
    if ! claude mcp list 2>/dev/null | grep -q "atlassian"; then
        echo -e "${BLUE}Running: claude mcp add atlassian -- npx -y mcp-remote $MCP_URL${NC}"
        echo ""
        claude mcp add atlassian -- npx -y mcp-remote "$MCP_URL"
        echo ""
        echo -e "${GREEN}✓ Atlassian MCP server added${NC}"
    fi
else
    echo -e "${YELLOW}Claude CLI not available. Manual configuration required.${NC}"
    echo ""
    echo "Add this to your Claude Code settings (settings.json or .mcp.json):"
    echo ""
    echo -e "${CYAN}{"
    echo '  "mcpServers": {'
    echo '    "atlassian": {'
    echo '      "command": "npx",'
    echo '      "args": ["-y", "mcp-remote", "'"$MCP_URL"'"]'
    echo '    }'
    echo '  }'
    echo -e "}${NC}"
    echo ""
fi

# -----------------------------------------------------------------------------
# Step 3: OAuth Authentication
# -----------------------------------------------------------------------------
echo ""
echo -e "${CYAN}Step 3: OAuth 2.1 Authentication${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "The Atlassian Remote MCP Server uses OAuth 2.1 with browser-based SSO."
echo ""
echo -e "${GREEN}How it works:${NC}"
echo "  1. When you first use a Jira/Confluence tool, a browser window opens"
echo "  2. Log in with your Atlassian account (uses your org's SSO if configured)"
echo "  3. Authorize the MCP server to access your Jira and Confluence"
echo "  4. Tokens are securely stored and automatically refreshed"
echo ""
echo -e "${GREEN}No API tokens or environment variables needed!${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# -----------------------------------------------------------------------------
# Step 4: Test Connection (Optional)
# -----------------------------------------------------------------------------
echo -e "${CYAN}Step 4: Test Connection${NC}"
echo ""
read -p "Would you like to test the connection now? (Y/n): " test_conn
if [[ ! "$test_conn" =~ ^[Nn]$ ]]; then
    echo ""
    echo -e "${BLUE}Initiating OAuth flow...${NC}"
    echo "A browser window should open for authentication."
    echo ""

    # Create a simple test script that triggers the MCP connection
    cat > /tmp/test-atlassian-mcp.mjs << 'EOF'
import { spawn } from 'child_process';

console.log('Starting Atlassian MCP connection test...');
console.log('If a browser window opens, please authenticate.');
console.log('');

const proc = spawn('npx', ['-y', 'mcp-remote', 'https://mcp.atlassian.com/v1/mcp/authv2'], {
    stdio: 'inherit'
});

// Give it 30 seconds to authenticate
setTimeout(() => {
    console.log('\nTest complete! If you authenticated successfully, you are ready to use the plugin.');
    proc.kill();
    process.exit(0);
}, 30000);

proc.on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
});
EOF

    echo -e "${YELLOW}Starting MCP connection (will timeout in 30 seconds)...${NC}"
    echo ""
    node /tmp/test-atlassian-mcp.mjs || true
    rm -f /tmp/test-atlassian-mcp.mjs
fi

# -----------------------------------------------------------------------------
# Step 5: Summary
# -----------------------------------------------------------------------------
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Setup Complete!                             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Authentication: OAuth 2.1 / SSO${NC}"
echo "  - No API tokens required"
echo "  - Uses your organization's SSO"
echo "  - Tokens automatically managed"
echo ""
echo -e "${CYAN}Available Commands:${NC}"
echo "  /jira:work <ISSUE-KEY>      - Start orchestrated work on an issue"
echo "  /jira:triage <ISSUE-KEY>    - Triage and classify an issue"
echo "  /jira:confluence <KEY> read - Read linked Confluence pages"
echo "  /jira:status                - Check orchestration status"
echo ""
echo -e "${CYAN}First Use:${NC}"
echo "  When you run a command, your browser will open for authentication."
echo "  After logging in once, you won't need to authenticate again."
echo ""
echo -e "${GREEN}You're all set! Try: /jira:work YOUR-ISSUE-KEY${NC}"
echo ""
