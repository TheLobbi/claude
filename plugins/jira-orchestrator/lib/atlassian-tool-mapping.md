# Atlassian MCP SSE Tool Mapping

## Official Tools (mcp__atlassian__*)

This plugin ONLY uses the official Atlassian MCP SSE connector:
```bash
claude mcp add --transport http atlassian https://mcp.atlassian.com/v1/mcp/authv2
```

## Tool Reference

### Jira Issue Operations

| Operation | Official Tool |
|-----------|---------------|
| Get Issue | `mcp__atlassian__getJiraIssue` |
| Create Issue | `mcp__atlassian__createJiraIssue` |
| Edit Issue | `mcp__atlassian__editJiraIssue` |
| Transition Issue | `mcp__atlassian__transitionJiraIssue` |
| Get Transitions | `mcp__atlassian__getTransitionsForJiraIssue` |
| Add Comment | `mcp__atlassian__addCommentToJiraIssue` |
| Add Worklog | `mcp__atlassian__addWorklogToJiraIssue` |
| Get Remote Links | `mcp__atlassian__getJiraIssueRemoteIssueLinks` |

### Jira Search & Project

| Operation | Official Tool |
|-----------|---------------|
| Search (JQL) | `mcp__atlassian__searchJiraIssuesUsingJql` |
| Search (Unified) | `mcp__atlassian__search` |
| Get Projects | `mcp__atlassian__getVisibleJiraProjects` |
| Get Issue Types | `mcp__atlassian__getJiraProjectIssueTypesMetadata` |
| Get Issue Type Fields | `mcp__atlassian__getJiraIssueTypeMetaWithFields` |
| Lookup Account ID | `mcp__atlassian__lookupJiraAccountId` |

### Confluence Operations

| Operation | Official Tool |
|-----------|---------------|
| Get Spaces | `mcp__atlassian__getConfluenceSpaces` |
| Get Page | `mcp__atlassian__getConfluencePage` |
| Get Pages in Space | `mcp__atlassian__getPagesInConfluenceSpace` |
| Create Page | `mcp__atlassian__createConfluencePage` |
| Update Page | `mcp__atlassian__updateConfluencePage` |
| Get Footer Comments | `mcp__atlassian__getConfluencePageFooterComments` |
| Get Inline Comments | `mcp__atlassian__getConfluencePageInlineComments` |
| Create Footer Comment | `mcp__atlassian__createConfluenceFooterComment` |
| Create Inline Comment | `mcp__atlassian__createConfluenceInlineComment` |
| Get Descendants | `mcp__atlassian__getConfluencePageDescendants` |
| Search (CQL) | `mcp__atlassian__searchConfluenceUsingCql` |

### Common Operations

| Operation | Official Tool |
|-----------|---------------|
| Get User Info | `mcp__atlassian__atlassianUserInfo` |
| Get Cloud Resources | `mcp__atlassian__getAccessibleAtlassianResources` |
| Fetch by ARI | `mcp__atlassian__fetch` |

## DEPRECATED - Do NOT Use

The following are DEPRECATED and must NOT be used:
- `mcp__MCP_DOCKER__*` - Old custom Docker MCP (REMOVED)
- `mcp__harness__*` - Use Harness REST API with PAT instead

## Harness Integration

Harness operations use REST API with PAT (NOT MCP):
- See `lib/harness-rest-api.md` for REST API patterns
- Scope: Development, CI/CD, Repository, Pipeline operations ONLY
