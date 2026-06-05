---
name: exec:customize
intent: Customize automation workflows, scoring weights, and agent behaviors
tags:
  - customization
  - configuration
  - tuning
inputs: []
risk: medium
cost: medium
description: Customize automation workflows, scoring weights, and agent behaviors
model: sonnet
---

# Executive Automation Customization

Tailor your automation platform to your organization's unique needs. Adjust scoring weights, workflow behaviors, agent personalities, and operational parameters with surgical precision.

## Customization Targets

**Available Customization Areas:**

1. **Scoring Algorithms** - Fine-tune prioritization and decision weights
2. **Workflow Configurations** - Modify automation flow behaviors
3. **Agent Behaviors** - Adjust AI agent prompts and decision-making
4. **Templates** - Customize document and communication templates
5. **Integration Settings** - Configure external system connections
6. **Approval Thresholds** - Set decision-making boundaries
7. **Notification Preferences** - Control alert and reporting behaviors

---

## Command Execution

```bash
# Interactive customization
/exec:customize target={{target}}

# Direct customization
/exec:customize target={{target}} name={{name}} interactive=false

# Examples:
/exec:customize target=scoring
/exec:customize target=workflow name=pr-review-workflow
/exec:customize target=agent name=strategic-analyst
/exec:customize target=templates name=weekly-report
```

---

## 1. Scoring Algorithm Customization

### Priority Scoring Weights

**Default Configuration:**
```yaml
priority_scoring:
  business_impact:
    weight: 0.35
    factors:
      - revenue_potential: 0.4
      - strategic_alignment: 0.3
      - competitive_advantage: 0.2
      - market_timing: 0.1

  urgency:
    weight: 0.25
    factors:
      - deadline_proximity: 0.4
      - stakeholder_pressure: 0.3
      - dependency_blocking: 0.2
      - regulatory_compliance: 0.1

  feasibility:
    weight: 0.20
    factors:
      - technical_complexity: 0.3
      - resource_availability: 0.3
      - risk_level: 0.2
      - cost_effectiveness: 0.2

  strategic_fit:
    weight: 0.20
    factors:
      - vision_alignment: 0.4
      - capability_building: 0.3
      - innovation_potential: 0.2
      - stakeholder_buy_in: 0.1
```

**Customization Options:**

- Adjust primary category weights (must sum to 1.0)
- Modify factor weights within categories
- Add custom scoring factors
- Define industry-specific criteria
- Set minimum threshold scores
- Configure multi-stage scoring gates

### Decision Confidence Thresholds

```yaml
confidence_thresholds:
  auto_approve: 0.90      # Decisions above this are auto-approved
  recommend: 0.75         # Confident recommendation
  escalate: 0.60          # Needs human review
  reject: 0.40            # Auto-reject below this

  risk_adjusted:
    high_risk_decision: 0.95
    medium_risk_decision: 0.85
    low_risk_decision: 0.75
```

### ROI Calculation Models

```yaml
roi_models:
  standard:
    formula: (benefit - cost) / cost
    time_horizon: 12_months
    discount_rate: 0.10

  strategic:
    formula: weighted_benefit / total_cost
    intangible_weight: 0.30
    time_horizon: 36_months

  innovation:
    formula: (market_potential + learning_value) / investment
    risk_adjustment: 0.20
```

---

## 2. Workflow Configuration

### Workflow Node Behaviors

**PR Review Workflow Example:**
```yaml
workflow: pr-review-workflow
nodes:
  initial_assessment:
    agent: code-quality-analyst
    timeout: 300s
    retry_on_failure: 2
    confidence_threshold: 0.80

  security_scan:
    agent: security-auditor
    parallel: true
    blocking: true
    escalate_on:
      - critical_vulnerabilities
      - secret_exposure
      - dependency_risks

  business_logic_review:
    agent: domain-expert
    conditional: changes_affect_core_logic
    expertise_required: senior

  final_decision:
    agent: integration-coordinator
    inputs:
      - initial_assessment
      - security_scan
      - business_logic_review
    decision_logic: consensus_weighted
```

**Customizable Workflow Properties:**

- Agent assignment per node
- Execution timeouts and retries
- Parallel vs sequential processing
- Conditional node execution
- Escalation triggers
- Input/output mappings
- Decision aggregation logic

### Workflow Templates

Create custom workflow templates for your organization:

```yaml
workflow_templates:
  strategic_initiative:
    stages:
      - discovery: { duration: 2_weeks, agent: strategic-analyst }
      - feasibility: { duration: 1_week, agent: technical-architect }
      - planning: { duration: 2_weeks, agent: program-manager }
      - approval: { gates: [executive, finance, technical] }
      - execution: { monitoring: continuous }

  incident_response:
    stages:
      - detection: { auto_trigger: true, agent: monitoring-agent }
      - triage: { sla: 15_minutes, agent: incident-commander }
      - mitigation: { parallel_teams: true }
      - resolution: { verification_required: true }
      - post_mortem: { deadline: 48_hours }
```

---

## 3. Agent Behavior Customization

### Agent Personality Profiles

**Strategic Analyst Agent Example:**
```yaml
agent: strategic-analyst
personality:
  decision_style: analytical
  risk_tolerance: moderate
  communication_style: executive_brief
  time_horizon: long_term

behavior:
  always_consider:
    - competitive_landscape
    - market_trends
    - organizational_capabilities
    - risk_mitigation_strategies

  prioritize:
    - strategic_alignment: high
    - innovation_potential: high
    - short_term_gains: low

  escalate_when:
    - conflicts_with_vision
    - requires_board_approval
    - market_timing_critical

prompts:
  system_context: |
    You are a senior strategic analyst with 15+ years of experience
    in technology strategy and business transformation. You think
    long-term, prioritize sustainable competitive advantage, and
    balance innovation with pragmatic execution.

  analysis_framework: |
    Apply Porter's Five Forces, SWOT analysis, and scenario planning
    to evaluate strategic decisions. Consider both quantitative metrics
    and qualitative factors like organizational readiness.
```

**Customizable Agent Properties:**

- Decision-making frameworks
- Risk tolerance levels
- Communication preferences
- Expertise domains
- Escalation criteria
- Collaboration patterns
- Learning and adaptation rates

### Agent Collaboration Rules

```yaml
collaboration_rules:
  strategic_decisions:
    required_agents:
      - strategic-analyst
      - financial-controller
      - technical-architect
    optional_agents:
      - market-researcher
      - risk-manager
    decision_method: consensus

  technical_decisions:
    lead_agent: technical-architect
    advisors:
      - security-auditor
      - performance-engineer
    decision_method: lead_with_veto_power
```

---

## 4. Template Customization

### Communication Templates

**Weekly Executive Report:**
```markdown
# Executive Summary - Week of {{week_start}}

## Key Highlights
{{#each highlights}}
- **{{category}}**: {{description}} (Impact: {{impact}})
{{/each}}

## Strategic Initiatives Progress
{{#each initiatives}}
### {{name}} ({{status}})
- **Progress**: {{progress_percentage}}%
- **Timeline**: {{timeline_status}}
- **Risks**: {{risk_summary}}
- **Next Steps**: {{next_actions}}
{{/each}}

## Metrics Dashboard
| Metric | Current | Target | Trend |
|--------|---------|--------|-------|
{{#each metrics}}
| {{name}} | {{current}} | {{target}} | {{trend_icon}} |
{{/each}}

## Decisions Made
{{#each decisions}}
- **{{title}}** (Confidence: {{confidence}}%)
  - Rationale: {{rationale}}
  - Expected Impact: {{impact}}
{{/each}}

## Items Requiring Your Attention
{{#each escalations}}
- **{{priority}}**: {{description}}
  - Context: {{context}}
  - Recommendation: {{recommendation}}
  - Decision Required By: {{deadline}}
{{/each}}

---
*Generated by Brookside BI Executive Automation Platform*
*Report ID: {{report_id}} | Generated: {{timestamp}}*
```

**Customizable Template Elements:**

- Section ordering and visibility
- Metric selection and formatting
- Tone and language style
- Branding and visual identity
- Data aggregation methods
- Chart and visualization types

### Decision Documentation Templates

```yaml
decision_template:
  header:
    - decision_id
    - timestamp
    - decision_maker
    - confidence_score

  context:
    - background
    - stakeholders
    - constraints
    - alternatives_considered

  analysis:
    - scoring_breakdown
    - risk_assessment
    - financial_impact
    - strategic_alignment

  decision:
    - recommendation
    - rationale
    - implementation_plan
    - success_metrics

  approval:
    - approval_chain
    - conditions
    - review_schedule
```

---

## 5. Integration Settings

### External System Connections

**Jira Integration:**
```yaml
integrations:
  jira:
    enabled: true
    base_url: https://your-org.atlassian.net
    auth_method: api_token

    sync_settings:
      sync_interval: 15_minutes
      bidirectional: true
      conflict_resolution: jira_wins

    field_mapping:
      priority:
        jira_field: priority
        exec_field: calculated_priority
        transform: jira_to_exec_priority_map

      status:
        jira_field: status
        exec_field: workflow_stage
        transform: status_mapping

    automation_rules:
      - trigger: issue_created
        condition: project = "EXEC"
        action: run_workflow(pr-review-workflow)

      - trigger: priority_changed
        condition: priority >= "High"
        action: escalate_to_executive
```

**GitHub Integration:**
```yaml
integrations:
  github:
    enabled: true
    organizations:
      - your-org

    pr_automation:
      auto_review: true
      auto_merge_threshold: 0.95
      require_human_review_when:
        - files_changed > 50
        - confidence < 0.85
        - security_issues_found

    workflow_triggers:
      - event: pull_request
        workflow: pr-review-workflow

      - event: release
        workflow: deployment-decision
```

### Data Pipeline Configuration

```yaml
data_pipelines:
  metrics_aggregation:
    source: multiple
    frequency: hourly
    transformations:
      - normalize_scores
      - calculate_trends
      - aggregate_by_category
    destination: analytics_db

  reporting:
    source: analytics_db
    frequency: daily
    outputs:
      - executive_dashboard
      - weekly_report
      - monthly_summary
```

---

## 6. Approval Thresholds

### Decision Authority Matrix

```yaml
approval_thresholds:
  financial:
    under_10k:
      auto_approve: true
      notification: team_lead

    10k_to_50k:
      approver: director
      review_time: 24_hours
      escalate_if_delayed: true

    50k_to_250k:
      approvers:
        - vp_finance
        - vp_operations
      decision_method: both_required
      review_time: 72_hours

    over_250k:
      approvers:
        - cfo
        - ceo
      board_notification: true
      review_time: 1_week

  strategic:
    low_impact:
      auto_approve: confidence > 0.85

    medium_impact:
      approver: vp_strategy
      advisory_committee: true

    high_impact:
      approvers: executive_committee
      board_approval_required: true

  technical:
    standard_changes:
      auto_approve: confidence > 0.90
      post_implementation_review: true

    architectural_changes:
      approver: chief_architect
      review_board: architecture_council

    security_changes:
      approvers:
        - ciso
        - chief_architect
      external_audit: if_critical
```

### Escalation Paths

```yaml
escalation_paths:
  by_urgency:
    critical:
      immediate_notification:
        - on_call_executive
        - incident_commander
      escalate_after: 15_minutes
      next_level: c_suite

    high:
      notification: director
      escalate_after: 4_hours
      next_level: vp

    medium:
      notification: manager
      escalate_after: 24_hours
      next_level: director

  by_category:
    security_incident:
      path: [security_team, ciso, ceo, board]
      auto_escalate: critical_severity

    financial_irregularity:
      path: [finance_team, controller, cfo, audit_committee]
      external_notification: if_material
```

---

## 7. Notification Preferences

### Alert Configuration

```yaml
notifications:
  channels:
    email:
      enabled: true
      digest_mode: true
      digest_frequency: daily
      immediate_alerts:
        - critical_decisions
        - security_incidents
        - approval_required

    slack:
      enabled: true
      channels:
        general: "#exec-automation"
        urgent: "#exec-urgent"
        reports: "#exec-reports"
      mention_on:
        - requires_action
        - high_priority_decision

    teams:
      enabled: false

    sms:
      enabled: true
      only_for:
        - critical_security
        - system_failure
        - urgent_approval

  preferences_by_role:
    executive:
      frequency: digest
      digest_time: "08:00"
      immediate_only:
        - requires_my_approval
        - critical_incidents

    director:
      frequency: real_time
      quiet_hours: "22:00-07:00"

    manager:
      frequency: real_time
      categories:
        - team_decisions
        - workflow_completions
```

### Report Scheduling

```yaml
reports:
  executive_summary:
    frequency: weekly
    day: monday
    time: "06:00"
    recipients:
      - c_suite
      - vp_team
    format: pdf
    delivery: email

  metrics_dashboard:
    frequency: daily
    time: "08:00"
    recipients:
      - all_directors
    format: interactive_link
    delivery: slack

  monthly_review:
    frequency: monthly
    day: 1
    time: "07:00"
    recipients:
      - board_of_directors
      - executive_team
    format: presentation
    delivery: email_and_portal

  ad_hoc_reports:
    enabled: true
    request_method: slack_command
    generation_time: on_demand
    max_concurrent: 5
```

---

## Interactive Customization Mode

When running with `interactive=true`, the command will guide you through:

1. **Assessment** - Review current configuration
2. **Recommendations** - AI-suggested optimizations based on usage patterns
3. **Step-by-Step Editing** - Guided modification of settings
4. **Validation** - Check configuration consistency
5. **Testing** - Dry-run with new settings
6. **Rollout** - Gradual deployment with rollback capability

**Interactive Session Example:**
```
> /exec:customize target=scoring interactive=true

Analyzing current scoring configuration...
Current weights: Impact (35%), Urgency (25%), Feasibility (20%), Strategic (20%)

Based on your decision history, I notice:
- Strategic alignment appears underweighted (80% of escalations cite strategic concerns)
- Urgency may be overweighted (only 15% of urgent items deliver expected value)

Recommended adjustments:
1. Increase strategic_fit weight from 20% to 30%
2. Decrease urgency weight from 25% to 20%
3. Add "organizational_readiness" factor to feasibility

Would you like to:
[1] Apply recommended changes
[2] Customize manually
[3] See detailed analysis
[4] Cancel

Your choice:
```

---

## Customization Best Practices

**Brookside BI Recommendations:**

1. **Start Conservative** - Make incremental adjustments rather than wholesale changes
2. **Monitor Impact** - Track decision quality metrics before and after customization
3. **Document Rationale** - Record why you made specific configuration choices
4. **Version Control** - Keep configuration history for rollback capability
5. **Test in Sandbox** - Validate changes in non-production environment first
6. **Gradual Rollout** - Apply to subset of workflows before full deployment
7. **Stakeholder Alignment** - Ensure customizations reflect organizational consensus
8. **Regular Review** - Revisit configurations quarterly as business evolves

---

## Configuration Validation

All customizations are automatically validated for:

- Mathematical consistency (weights sum to 1.0)
- Logical coherence (no conflicting rules)
- Performance impact (simulation testing)
- Security implications (privilege escalation checks)
- Compliance requirements (audit trail maintenance)

**Validation Output Example:**
```
Validating scoring configuration...
✓ All weights sum to 1.0
✓ No circular dependencies detected
✓ Performance impact: <2% overhead
⚠ Warning: Lowering auto_approve threshold increases manual review volume by ~15%
✓ Audit trail configured correctly
✓ RBAC permissions validated

Configuration is valid and ready to apply.
Estimated impact: 147 decisions/month will change classification
Rollback plan: Automatic if error rate exceeds 5% in first 24 hours
```

---

## Advanced Customization

### Custom Scoring Functions

Define Python-based scoring functions for complex logic:

```python
def custom_strategic_score(decision_data: dict) -> float:
    """
    Custom strategic scoring that considers market timing
    and competitive positioning with exponential weighting
    for time-sensitive opportunities.
    """
    base_score = decision_data.get('strategic_alignment', 0.5)
    market_timing = decision_data.get('market_timing_factor', 0.5)
    competitive_advantage = decision_data.get('competitive_advantage', 0.5)

    # Exponential boost for time-sensitive strategic opportunities
    if market_timing > 0.8 and competitive_advantage > 0.7:
        return min(1.0, base_score * 1.5)

    return (base_score * 0.5) + (market_timing * 0.3) + (competitive_advantage * 0.2)
```

### Machine Learning Integration

Enable continuous learning from decision outcomes:

```yaml
ml_configuration:
  enabled: true
  model_type: gradient_boosted_trees

  training_data:
    source: decision_history
    minimum_samples: 1000
    features:
      - all_scoring_factors
      - contextual_metadata
      - stakeholder_feedback
    target: decision_success_score

  retraining:
    frequency: monthly
    validation_split: 0.2
    performance_threshold: 0.85

  deployment:
    shadow_mode_duration: 2_weeks
    cutover_threshold: 0.90_confidence
    rollback_triggers:
      - accuracy_drop > 5%
      - escalation_rate_increase > 20%
```

---

*Brookside BI Executive Automation Platform - Configuration as Strategy*
