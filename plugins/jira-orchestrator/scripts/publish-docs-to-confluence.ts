/**
 * Publish Jira Orchestrator documentation to Confluence using MCP Atlassian tools.
 * 
 * This script uses the official Atlassian MCP (HTTP transport) tools to:
 * 1. Get accessible Atlassian resources (to find cloud ID)
 * 2. Get Confluence spaces
 * 3. Create the documentation page
 * 
 * Usage:
 *   This script is designed to be executed by Claude with MCP tools available.
 *   The actual MCP tool calls should be made directly.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const DOC_PATH = join(__dirname, '..', 'docs', 'CONFLUENCE-DOCUMENTATION.md');
const PAGE_TITLE = 'Jira Orchestrator - Complete Documentation';
const SPACE_KEY = process.env.CONFLUENCE_SPACE_KEY || 'GA';

/**
 * Read the documentation markdown content
 */
export function readDocumentation(): string {
  try {
    return readFileSync(DOC_PATH, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read documentation: ${error}`);
  }
}

/**
 * Publishing workflow:
 * 
 * Step 1: Get accessible Atlassian resources
 *   Tool: mcp__atlassian__getAccessibleAtlassianResources
 *   Returns: { cloudId, sites: [...] }
 * 
 * Step 2: Get Confluence spaces
 *   Tool: mcp__atlassian__getConfluenceSpaces
 *   Parameters: { cloudId: "<from-step-1>" }
 *   Returns: { results: [{ id, key, name, ... }] }
 * 
 * Step 3: Find target space
 *   Filter spaces by key === SPACE_KEY
 *   Get space.id
 * 
 * Step 4: Create Confluence page
 *   Tool: mcp__atlassian__createConfluencePage
 *   Parameters: {
 *     cloudId: "<from-step-1>",
 *     spaceId: "<from-step-3>",
 *     title: PAGE_TITLE,
 *     body: "<markdown-content>",
 *     contentFormat: "markdown",
 *     parentId: "<optional-parent-page-id>"
 *   }
 * 
 * Step 5: Add labels (optional)
 *   Add labels: "jira-orchestrator", "documentation", "golden-armada"
 */

export const PUBLISHING_INSTRUCTIONS = `
# Publishing Instructions

## Step 1: Get Cloud ID
Use: mcp__atlassian__getAccessibleAtlassianResources
This will return your cloud ID needed for subsequent calls.

## Step 2: Get Confluence Spaces
Use: mcp__atlassian__getConfluenceSpaces
Parameters: { cloudId: "<from-step-1>" }
Find space with key: "${SPACE_KEY}"

## Step 3: Create Page
Use: mcp__atlassian__createConfluencePage
Parameters:
  - cloudId: "<from-step-1>"
  - spaceId: "<space-id-from-step-2>"
  - title: "${PAGE_TITLE}"
  - body: "<markdown-content-from-file>"
  - contentFormat: "markdown"
  - parentId: "<optional-if-nesting-under-parent>"

## Step 4: Verify
Check the returned page URL and verify the page was created successfully.
`;

if (require.main === module) {
  console.log('Documentation Publishing Script');
  console.log('================================\n');
  console.log(`Documentation file: ${DOC_PATH}`);
  console.log(`Page title: ${PAGE_TITLE}`);
  console.log(`Target space: ${SPACE_KEY}\n`);
  
  try {
    const content = readDocumentation();
    console.log(`✓ Read ${content.length} characters of documentation\n`);
    console.log(PUBLISHING_INSTRUCTIONS);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}
