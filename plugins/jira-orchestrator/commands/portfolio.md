---
name: jira-orchestrator:portfolio
intent: Portfolio Management
tags:
  - jira-orchestrator
  - command
  - portfolio
inputs: []
risk: medium
cost: medium
description: Portfolio Management
---

# Portfolio Management

## Dashboard
```bash
/jira:portfolio dashboard
/jira:portfolio dashboard projects=PORTAL,MOBILE period=2025-Q1
```
Activate portfolio-manager agent → Aggregate metrics → Display overview, health by project, velocity, resource utilization, top risks, milestones, strategic alignment

## Dependencies
```bash
/jira:portfolio dependencies
```
Activate dependency-mapper agent → Analyze cross-project dependencies → Show matrix, critical dependencies, blocking issues, risk levels, circular dependencies → Mermaid visualization

## Resources
```bash
/jira:portfolio resources projects=PROJ1,PROJ2
```
Activate portfolio-manager agent → Team allocation matrix → Over/under-utilized → Skill gap analysis → Recommendations

## Health
```bash
/jira:portfolio health
```
Calculate portfolio health (78/100) → Break down by project → Schedule health, quality health, risk health → Leading indicators, recommendations

## Alignment
```bash
/jira:portfolio alignment
```
Assess strategic alignment → Coverage by objective → Project contribution → Gap analysis → Scorecard, recommendations

## Report
```bash
/jira:portfolio report period=2025-Q1
```
Generate executive report → Executive summary → Portfolio overview → Project details → Cross-project analysis → Risks, financials, recommendations

## Metrics Included

**Portfolio Level:**
- Total issues, completion %, overall health, strategic alignment
- Velocity (SP/sprint), resource utilization, capacity allocation

**Project Level:**
- Health score (schedule, scope, quality, risk, team, stakeholder)
- Completion %, team size, status (on track, at risk)
- Issue count, burn rate, test coverage, bug ratio

**Dependencies:**
- Total dependencies, blocking, at-risk, critical path
- Circular dependency detection
- Risk by dependency type

**Resources:**
- Team allocation matrix (per project/person)
- Over/under-utilization (target: 15-30 SP)
- Skill gaps, hiring needs

**Strategic Alignment:**
- Weight-adjusted coverage per objective
- Project contribution to goals
- Gap analysis, recommendations

## Agents

- **portfolio-manager:** Dashboard, health, alignment, report
- **dependency-mapper:** Cross-project dependency analysis

## Output Artifacts

```
/jira-orchestrator/sessions/portfolio/
  ├── dashboard-${period}.md
  ├── dependencies-${period}.json/.mermaid
  ├── resources-${period}.md
  ├── health-${period}.md
  ├── alignment-${period}.md
  └── report-${period}.md
```

## Confluence Integration

Auto-publish to PORTFOLIO space, parent: Portfolio Management

## Common Workflows

**Weekly:** Dashboard → Dependencies → Health
**Monthly:** Generate report
**Quarterly:** Alignment + Resources + Report

## Best Practices

1. Run dashboard weekly
2. Check dependencies bi-weekly
3. Generate monthly reports
4. Review alignment quarterly
5. Analyze resources monthly

## Error Handling

- No projects specified → List all, prompt selection
- Insufficient data → Identify gaps, provide partial analysis with caveats

---

**⚓ Golden Armada** | *You ask - The Fleet Ships*
