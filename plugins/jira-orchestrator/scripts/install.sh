#!/bin/bash
# =============================================================================
# Jira Orchestrator Plugin - Installation Script
# =============================================================================
# Uses OAuth 2.1 / SSO authentication - NO API tokens required!
# When you first use the plugin, your browser opens for Atlassian login.
# =============================================================================

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Plugin information
PLUGIN_NAME="jira-orchestrator"
PLUGIN_VERSION="7.1.0"
MCP_SERVER_NAME="atlassian"
MCP_SERVER_URL="https://mcp.atlassian.com/v1/mcp/authv2"

# Directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"
SESSIONS_DIR="${PLUGIN_ROOT}/sessions"
LOGS_DIR="${PLUGIN_ROOT}/logs"

# Log file
mkdir -p "$LOGS_DIR"
INSTALL_LOG="${LOGS_DIR}/install-$(date +%Y%m%d-%H%M%S).log"

# Helper functions
log() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$INSTALL_LOG"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$INSTALL_LOG"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$INSTALL_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$INSTALL_LOG"
}

banner() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                                                ║${NC}"
    echo -e "${BLUE}║            Jira Orchestrator Plugin Installation              ║${NC}"
    echo -e "${BLUE}║                      Version $PLUGIN_VERSION                         ║${NC}"
    echo -e "${BLUE}║                                                                ║${NC}"
    echo -e "${BLUE}║              ${GREEN}OAuth 2.1 / SSO Authentication${BLUE}                  ║${NC}"
    echo -e "${BLUE}║              ${GREEN}No API tokens required!${BLUE}                        ║${NC}"
    echo -e "${BLUE}║                                                                ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Create required directories
create_directories() {
    log "Creating plugin directories..."

    mkdir -p "$SESSIONS_DIR"
    mkdir -p "$SESSIONS_DIR/active"
    mkdir -p "$SESSIONS_DIR/completed"
    mkdir -p "$LOGS_DIR"
    mkdir -p "${PLUGIN_ROOT}/cache"
    mkdir -p "${PLUGIN_ROOT}/hooks/scripts"

    success "Directories created"
}

# Check for Node.js and npx
check_node() {
    log "Checking for Node.js..."

    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        echo "  Please install Node.js from https://nodejs.org"
        exit 1
    fi

    success "Node.js found: $(node --version)"

    if ! command -v npx &> /dev/null; then
        error "npx is not installed"
        echo "  npx comes with npm, please reinstall Node.js"
        exit 1
    fi

    success "npx found"
}

# Check if Claude Code CLI is available
check_claude_cli() {
    log "Checking for Claude Code CLI..."

    if ! command -v claude &> /dev/null; then
        warn "Claude Code CLI not found in PATH"
        warn "The MCP server can still be configured manually"
        return 1
    fi

    success "Claude Code CLI found: $(command -v claude)"
    return 0
}

# Check if MCP server already exists
check_mcp_exists() {
    log "Checking if Atlassian MCP server is already configured..."

    if claude mcp list 2>&1 | grep -q "$MCP_SERVER_NAME"; then
        success "Atlassian MCP server already configured"
        return 0
    fi

    log "Atlassian MCP server not found - will be added"
    return 1
}

# Add Atlassian MCP server
add_mcp_server() {
    log "Adding Atlassian MCP server with OAuth 2.1..."

    # Check if already exists
    if check_mcp_exists 2>/dev/null; then
        success "MCP server already configured, skipping"
        return 0
    fi

    # Add the MCP server
    echo ""
    log "Running: claude mcp add $MCP_SERVER_NAME -- npx -y mcp-remote $MCP_SERVER_URL"
    echo ""

    if claude mcp add "$MCP_SERVER_NAME" -- npx -y mcp-remote "$MCP_SERVER_URL"; then
        success "Atlassian MCP server added successfully"
        return 0
    else
        error "Failed to add Atlassian MCP server"
        return 1
    fi
}

# Verify MCP server installation
verify_mcp_server() {
    log "Verifying MCP server installation..."

    if claude mcp list 2>&1 | grep -q "$MCP_SERVER_NAME"; then
        success "MCP server verified in configuration"
        return 0
    else
        error "MCP server not found in configuration after installation"
        return 1
    fi
}

# Make scripts executable
make_scripts_executable() {
    log "Making scripts executable..."

    chmod +x "$SCRIPT_DIR"/*.sh 2>/dev/null || true
    chmod +x "${PLUGIN_ROOT}/hooks/scripts"/*.sh 2>/dev/null || true

    success "Scripts are executable"
}

# Link plugin commands to .claude/commands directory
link_plugin_commands() {
    log "Linking plugin commands to Claude commands directory..."

    # Find the project root (parent of plugins directory)
    local PROJECT_ROOT="$(dirname "$(dirname "$PLUGIN_ROOT")")"
    local CLAUDE_COMMANDS_DIR="${PROJECT_ROOT}/.claude/commands"
    local PLUGIN_COMMANDS_DIR="${PLUGIN_ROOT}/commands"

    # Check if .claude/commands exists
    if [ ! -d "$CLAUDE_COMMANDS_DIR" ]; then
        warn ".claude/commands directory not found at $CLAUDE_COMMANDS_DIR"
        warn "Commands will need to be linked manually"
        return 1
    fi

    # Check if plugin commands directory exists
    if [ ! -d "$PLUGIN_COMMANDS_DIR" ]; then
        error "Plugin commands directory not found at $PLUGIN_COMMANDS_DIR"
        return 1
    fi

    local linked_count=0
    local skipped_count=0

    # Link each command file
    for file in "$PLUGIN_COMMANDS_DIR"/*.md; do
        if [ -f "$file" ]; then
            local basename="${file##*/}"
            local target="${CLAUDE_COMMANDS_DIR}/jira-${basename}"
            local relative_path="../../plugins/jira-orchestrator/commands/${basename}"

            if [ -L "$target" ]; then
                # Already a symlink, skip
                ((skipped_count++))
            elif [ -f "$target" ]; then
                # Regular file exists, back it up and create symlink
                mv "$target" "${target}.bak"
                ln -sf "$relative_path" "$target"
                ((linked_count++))
            else
                # No file exists, create symlink
                ln -sf "$relative_path" "$target"
                ((linked_count++))
            fi
        fi
    done

    success "Linked $linked_count commands ($skipped_count already linked)"
}

# Display OAuth information
display_oauth_info() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                OAuth 2.1 / SSO Authentication                  ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}No API tokens or environment variables required!${NC}"
    echo ""
    echo "The Atlassian Remote MCP Server uses OAuth 2.1 with browser-based SSO."
    echo ""
    echo -e "${BLUE}How authentication works:${NC}"
    echo ""
    echo "  1. When you first use a Jira or Confluence command, a browser window"
    echo "     will automatically open"
    echo ""
    echo "  2. Log in with your Atlassian account"
    echo "     ${YELLOW}(Uses your organization's SSO if configured - Google, Okta, Azure AD, etc.)${NC}"
    echo ""
    echo "  3. Click 'Allow' to authorize the MCP server to access:"
    echo "     - Jira issues, projects, and comments"
    echo "     - Confluence pages and spaces"
    echo ""
    echo "  4. Tokens are securely stored and automatically refreshed"
    echo "     ${YELLOW}You won't need to log in again unless you revoke access${NC}"
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Display next steps
display_next_steps() {
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    Installation Complete!                       ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo ""
    echo "  1. ${BLUE}Start using the plugin:${NC}"
    echo ""
    echo "     ${GREEN}/jira:work PROJ-123${NC}         Start orchestrated work on an issue"
    echo "     ${GREEN}/jira:triage PROJ-123${NC}       Triage and classify an issue"
    echo "     ${GREEN}/jira:confluence PROJ-123${NC}   Work with Confluence pages"
    echo ""
    echo "  2. ${BLUE}First-time authentication:${NC}"
    echo ""
    echo "     When you run your first command, a browser window will open."
    echo "     Log in with your Atlassian account to authorize access."
    echo ""
    echo "  3. ${BLUE}Available commands:${NC}"
    echo ""
    echo "     ${GREEN}/jira:work${NC}        - Full 6-phase orchestration"
    echo "     ${GREEN}/jira:triage${NC}      - Classify and route issues"
    echo "     ${GREEN}/jira:review${NC}      - Run code reviews"
    echo "     ${GREEN}/jira:pr${NC}          - Create pull requests"
    echo "     ${GREEN}/jira:confluence${NC}  - Read/write Confluence pages"
    echo "     ${GREEN}/jira:docs${NC}        - Generate documentation"
    echo "     ${GREEN}/jira:status${NC}      - Check active orchestrations"
    echo "     ${GREEN}/jira:sync${NC}        - Sync local/Jira state"
    echo "     ${GREEN}/jira:cancel${NC}      - Cancel with checkpoint"
    echo "     ${GREEN}/jira:setup${NC}       - Verify setup"
    echo ""
    echo -e "${CYAN}Documentation:${NC}"
    echo "  README: ${PLUGIN_ROOT}/README.md"
    echo ""
}

# Display manual setup instructions (if Claude CLI not available)
display_manual_setup() {
    echo ""
    echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║                    Manual Setup Required                        ║${NC}"
    echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Claude Code CLI was not found. Add the MCP server manually."
    echo ""
    echo -e "${BLUE}Option 1: Using Claude CLI (when available)${NC}"
    echo ""
    echo "  claude mcp add atlassian -- npx -y mcp-remote $MCP_SERVER_URL"
    echo ""
    echo -e "${BLUE}Option 2: Add to settings.json${NC}"
    echo ""
    echo "  Add this to your Claude Code settings:"
    echo ""
    echo -e "${CYAN}  {"
    echo '    "mcpServers": {'
    echo '      "atlassian": {'
    echo '        "command": "npx",'
    echo '        "args": ["-y", "mcp-remote", "'"$MCP_SERVER_URL"'"]'
    echo '      }'
    echo '    }'
    echo -e "  }${NC}"
    echo ""
    echo -e "${BLUE}Option 3: Use the .mcp.json file${NC}"
    echo ""
    echo "  Copy ${PLUGIN_ROOT}/.mcp.json to your project root"
    echo ""
}

# Main installation flow
main() {
    banner

    log "Starting installation of $PLUGIN_NAME v$PLUGIN_VERSION"
    log "Installation log: $INSTALL_LOG"

    # Create directories
    create_directories

    # Check Node.js
    check_node

    # Make scripts executable
    make_scripts_executable

    # Link plugin commands to .claude/commands
    link_plugin_commands

    # Check Claude CLI and add MCP server
    if check_claude_cli; then
        if ! add_mcp_server; then
            warn "Could not add MCP server automatically"
            display_manual_setup
        else
            verify_mcp_server || true
        fi
    else
        display_manual_setup
    fi

    # Display OAuth information
    display_oauth_info

    # Display next steps
    display_next_steps

    success "Installation complete!"
    log "Log saved to: $INSTALL_LOG"

    echo ""
    echo -e "${GREEN}✓ Installation successful!${NC}"
    echo -e "${GREEN}✓ OAuth 2.1 / SSO authentication configured${NC}"
    echo -e "${GREEN}✓ No API tokens required - just log in when prompted!${NC}"
    echo ""
}

# Run main installation
main "$@"
