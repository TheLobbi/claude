---
name: exec:score
intent: Calculate automation potential scores using 6-factor weighted algorithm
tags:
  - scoring
  - automation
  - analysis
inputs: []
risk: medium
cost: medium
description: Calculate automation potential scores using 6-factor weighted algorithm
model: sonnet
---

# Automation Potential Scoring Engine

Calculate detailed automation scores for executive responsibilities using a 6-factor weighted algorithm. Transform your responsibility map into actionable automation priorities.

## What This Command Does

The `/exec:score` command analyzes mapped responsibilities and calculates comprehensive automation potential scores based on six critical factors:

1. **Repetitiveness (20%)** - Task frequency and pattern consistency
2. **Rule-Based Nature (25%)** - Clarity of decision-making rules
3. **Data Availability (15%)** - Accessibility of required information
4. **Integration Complexity (15%)** - Technical implementation difficulty
5. **Human Judgment Required (15%)** - Level of discretion needed
6. **Error Tolerance (10%)** - Impact and recoverability of mistakes

Each responsibility receives:
- Overall automation score (0-100)
- Factor-by-factor breakdown
- Automation tier classification
- Priority ranking
- ROI estimates
- Risk assessment

## Scoring Methodology

### Factor 1: Repetitiveness (Weight: 0.20)

Measures how often and consistently a task repeats.

**Scoring Criteria:**
- **90-100**: Daily or multiple times per day
- **70-89**: Weekly with consistent patterns
- **50-69**: Monthly or quarterly with predictable cadence
- **30-49**: Irregular but recurring (triggered by events)
- **0-29**: Ad-hoc or one-time activities

**Analysis Questions:**
- How often does this task occur?
- Is the frequency predictable?
- Are there seasonal or cyclical patterns?
- Can the timing be anticipated?

**Example Scores:**
- Daily standup reports: 95
- Weekly performance reviews: 80
- Quarterly board presentations: 60
- Crisis communications: 25

### Factor 2: Rule-Based Nature (Weight: 0.25)

Evaluates whether the task follows clear, codifiable rules.

**Scoring Criteria:**
- **90-100**: Completely rule-based, no exceptions
- **70-89**: Mostly rules with minor judgment calls
- **50-69**: Mix of rules and interpretation
- **30-49**: Primarily judgment-based with some guidelines
- **0-29**: Highly subjective, creative, or strategic

**Analysis Questions:**
- Can the decision process be written as an algorithm?
- How many exceptions exist to the rules?
- Is domain expertise required to apply the rules?
- Are the rules documented and stable?

**Example Scores:**
- Expense report approval (within policy): 95
- Budget variance analysis: 75
- Team performance evaluations: 45
- Strategic vision development: 10

### Factor 3: Data Availability (Weight: 0.15)

Assesses whether required data is accessible and structured.

**Scoring Criteria:**
- **90-100**: All data in structured systems (APIs available)
- **70-89**: Most data structured, some manual sources
- **50-69**: Mix of structured and unstructured data
- **30-49**: Mostly manual data collection required
- **0-29**: Data is unavailable, restricted, or doesn't exist

**Analysis Questions:**
- Where does the required data live?
- Is the data in a machine-readable format?
- Are APIs or integrations available?
- How much manual data entry is needed?

**Example Scores:**
- Sales pipeline reporting (from CRM): 95
- Customer satisfaction analysis (from surveys): 80
- Market trend analysis (mixed sources): 55
- Competitive intelligence (ad-hoc research): 30

### Factor 4: Integration Complexity (Weight: 0.15)

Measures the technical difficulty of implementing automation.

**Scoring Criteria:**
- **90-100**: Single system, standard APIs
- **70-89**: 2-3 systems with documented integrations
- **50-69**: Multiple systems, some custom integration
- **30-49**: Complex enterprise systems, legacy tech
- **0-29**: Highly fragmented, proprietary, or unsupported

**Analysis Questions:**
- How many systems need to be connected?
- Are integration capabilities well-documented?
- Is custom development required?
- What is the technical debt risk?

**Example Scores:**
- Email automation (single platform): 95
- CRM to email marketing sync: 75
- ERP to BI to CRM pipeline: 50
- Legacy system data extraction: 25

### Factor 5: Human Judgment Required (Weight: 0.15)

Inverse score - lower judgment requirements = higher automation potential.

**Scoring Criteria:**
- **90-100**: Zero judgment, purely mechanical
- **70-89**: Minimal judgment on edge cases
- **50-69**: Moderate judgment, AI could assist
- **30-49**: Significant expertise and context required
- **0-29**: Critical judgment, nuanced decision-making

**Analysis Questions:**
- Does this require human intuition or empathy?
- Are there legal or ethical considerations?
- Is there reputational risk in automation?
- Can AI provide decision support vs. full automation?

**Example Scores:**
- Data entry and validation: 95
- Standard contract review: 70
- Employee conflict resolution: 35
- Strategic partnership negotiations: 15

### Factor 6: Error Tolerance (Weight: 0.10)

Evaluates the impact and recoverability of automation errors.

**Scoring Criteria:**
- **90-100**: Errors easily detected and corrected
- **70-89**: Errors low-impact, simple rollback
- **50-69**: Moderate impact, manual intervention needed
- **30-49**: High impact, difficult recovery
- **0-29**: Critical impact, irreversible consequences

**Analysis Questions:**
- What happens if the automation fails?
- How quickly can errors be detected?
- Is there a review mechanism before final action?
- What are the financial/legal/brand risks?

**Example Scores:**
- Internal status reports: 90
- Marketing email sends (with preview): 75
- Financial reconciliation (with review): 55
- Customer refund processing: 40
- Public press releases: 20

## Automation Tier Classification

Based on the overall score, responsibilities are classified into tiers:

### Tier 1: Full Automation (Score: 80-100)
- **Characteristics**: High repetition, clear rules, excellent data, low risk
- **Implementation**: End-to-end automation with monitoring
- **Human Role**: Exception handling and oversight
- **Examples**:
  - Daily KPI dashboard generation
  - Automated expense report routing
  - Standard meeting scheduling
  - Data backup and archival

### Tier 2: Partial Automation (Score: 60-79)
- **Characteristics**: Regular tasks with some variability
- **Implementation**: Automate 60-80% of the workflow
- **Human Role**: Review outputs, handle exceptions
- **Examples**:
  - Budget variance reporting (auto-generate, human review)
  - Contract drafting (template-based with customization)
  - Performance review data aggregation
  - Customer escalation triage

### Tier 3: Assisted Automation (Score: 40-59)
- **Characteristics**: Significant judgment required, AI can assist
- **Implementation**: Decision support tools, partial automation
- **Human Role**: Primary decision-maker with AI recommendations
- **Examples**:
  - Strategic hiring decisions (AI-sourced candidates)
  - Customer retention strategies (AI-identified patterns)
  - Product roadmap prioritization (data-driven insights)
  - Crisis communication planning (AI-drafted options)

### Tier 4: Manual with Augmentation (Score: 20-39)
- **Characteristics**: High judgment, low repetition, or high risk
- **Implementation**: Keep manual, add data/research tools
- **Human Role**: Fully responsible, use AI for preparation
- **Examples**:
  - Board presentations (AI research assistance)
  - Key partnership negotiations
  - Organizational restructuring decisions
  - Brand positioning strategy

### Tier 5: Fully Manual (Score: 0-19)
- **Characteristics**: Irreplaceable human judgment, creativity, or relationships
- **Implementation**: No automation recommended
- **Human Role**: Complete ownership
- **Examples**:
  - Executive team building and culture
  - Crisis leadership and decision-making
  - Strategic vision and innovation
  - High-stakes stakeholder relationships

## ROI Calculation

For each scored responsibility, the command estimates ROI based on:

**Time Savings:**
```
Annual Hours Saved = (Current Hours per Instance) × (Instances per Year) × (Automation %)
Automation % = Score / 100 × Efficiency Factor
```

**Cost Savings:**
```
Annual Cost Savings = (Annual Hours Saved) × (Loaded Hourly Rate)
Loaded Hourly Rate = (Annual Compensation + Benefits + Overhead) / 2080
```

**Implementation Cost:**
```
One-Time Cost = (Development Hours) × (Developer Rate) + (Tool Licenses) + (Training)
Development Hours = Base Hours × (100 - Integration Complexity Score) / 50
```

**ROI Calculation:**
```
Simple ROI = (Annual Savings - Annual Recurring Costs) / One-Time Cost
Payback Period = One-Time Cost / (Annual Savings - Annual Recurring Costs)
3-Year NPV = Present Value of 3 Years of Savings - Total Costs
```

**Risk-Adjusted ROI:**
```
Risk Factor = 1 - (Error Impact × Implementation Risk)
Error Impact = (100 - Error Tolerance Score) / 100
Implementation Risk = (100 - Integration Complexity Score) / 200
Risk-Adjusted ROI = Simple ROI × Risk Factor
```

## Risk Assessment Matrix

Each responsibility is evaluated for automation risk:

### Technical Risk (Low/Medium/High)
- **Low**: Score 80+, proven integrations, simple workflows
- **Medium**: Score 50-79, custom integration, moderate complexity
- **High**: Score <50, complex systems, unproven technology

### Business Risk (Low/Medium/High)
- **Low**: Error Tolerance 80+, low customer/revenue impact
- **Medium**: Error Tolerance 50-79, moderate stakeholder impact
- **High**: Error Tolerance <50, high brand/legal/financial risk

### Change Management Risk (Low/Medium/High)
- **Low**: Clear value, minimal workflow disruption
- **Medium**: Moderate training required, some resistance expected
- **High**: Significant process change, cultural resistance

## Output Format

The command generates a comprehensive JSON report:

```json
{
  "metadata": {
    "input_file": "path/to/mapped-responsibilities.json",
    "weights_profile": "default",
    "threshold": 50,
    "generated_at": "2025-12-17T10:30:00Z",
    "total_responsibilities": 45,
    "scored_responsibilities": 38
  },
  "weights": {
    "repetitiveness": 0.20,
    "rule_based": 0.25,
    "data_availability": 0.15,
    "integration_complexity": 0.15,
    "human_judgment": 0.15,
    "error_tolerance": 0.10
  },
  "scored_responsibilities": [
    {
      "responsibility_id": "exec_001",
      "title": "Daily KPI Dashboard Distribution",
      "category": "Reporting",
      "overall_score": 87,
      "automation_tier": "Full Automation",
      "factor_scores": {
        "repetitiveness": 95,
        "rule_based": 90,
        "data_availability": 85,
        "integration_complexity": 80,
        "human_judgment": 90,
        "error_tolerance": 85
      },
      "weighted_contributions": {
        "repetitiveness": 19.0,
        "rule_based": 22.5,
        "data_availability": 12.75,
        "integration_complexity": 12.0,
        "human_judgment": 13.5,
        "error_tolerance": 8.5
      },
      "roi_analysis": {
        "current_annual_hours": 156,
        "automation_percentage": 87,
        "estimated_hours_saved": 136,
        "hourly_rate": 125,
        "annual_cost_savings": 17000,
        "implementation_cost": 8500,
        "recurring_annual_cost": 1200,
        "simple_roi": 1.86,
        "payback_months": 6.5,
        "three_year_npv": 39800,
        "risk_adjusted_roi": 1.72
      },
      "risk_assessment": {
        "technical_risk": "Low",
        "business_risk": "Low",
        "change_management_risk": "Low",
        "overall_risk": "Low",
        "mitigation_required": false
      },
      "recommendations": {
        "priority": "High",
        "implementation_timeline": "1-2 months",
        "recommended_approach": "Full end-to-end automation with scheduled execution",
        "tools_suggested": ["Power BI", "Zapier", "Email automation"],
        "success_metrics": ["Delivery time <5min", "Zero manual intervention", "95%+ accuracy"]
      }
    }
  ],
  "summary": {
    "tier_distribution": {
      "full_automation": 12,
      "partial_automation": 15,
      "assisted_automation": 8,
      "manual_augmented": 3,
      "fully_manual": 0
    },
    "total_potential_savings": {
      "annual_hours": 2847,
      "annual_cost": 356000,
      "implementation_cost": 187000,
      "blended_roi": 1.43,
      "average_payback_months": 8.2
    },
    "risk_summary": {
      "low_risk_count": 20,
      "medium_risk_count": 15,
      "high_risk_count": 3
    },
    "top_priorities": [
      {
        "responsibility_id": "exec_001",
        "title": "Daily KPI Dashboard Distribution",
        "score": 87,
        "roi": 1.86,
        "priority_rank": 1
      }
    ]
  }
}
```

## Usage Examples

### Basic Scoring (Latest Map)
```bash
/exec:score
```
Uses the most recent responsibility map from `exec:map` output, applies default weights, shows all scores ≥50.

### Score with Custom Threshold
```bash
/exec:score threshold=70
```
Only shows high-potential automation opportunities (score ≥70).

### Score Specific File
```bash
/exec:score input=output/mapped-2025-12-15.json
```
Scores a specific responsibility map file.

### Custom Weighting Profile
```bash
/exec:score weights=config/conservative-weights.json
```
Uses custom factor weights (e.g., higher weight on error tolerance for risk-averse organizations).

### Full Analysis Pipeline
```bash
/exec:map input=my-role.md
/exec:score
/exec:workflow threshold=80
```
Map responsibilities, score them, then generate workflows for high-scoring items.

## Custom Weighting Profiles

Create custom weight configurations for different scenarios:

### Default Profile (Balanced)
```json
{
  "profile_name": "default",
  "description": "Balanced approach across all factors",
  "weights": {
    "repetitiveness": 0.20,
    "rule_based": 0.25,
    "data_availability": 0.15,
    "integration_complexity": 0.15,
    "human_judgment": 0.15,
    "error_tolerance": 0.10
  }
}
```

### Conservative Profile (Risk-Averse)
```json
{
  "profile_name": "conservative",
  "description": "Prioritizes error tolerance and data quality",
  "weights": {
    "repetitiveness": 0.15,
    "rule_based": 0.20,
    "data_availability": 0.20,
    "integration_complexity": 0.10,
    "human_judgment": 0.15,
    "error_tolerance": 0.20
  }
}
```

### Aggressive Profile (Fast Implementation)
```json
{
  "profile_name": "aggressive",
  "description": "Prioritizes quick wins and high-volume tasks",
  "weights": {
    "repetitiveness": 0.30,
    "rule_based": 0.25,
    "data_availability": 0.15,
    "integration_complexity": 0.20,
    "human_judgment": 0.05,
    "error_tolerance": 0.05
  }
}
```

## Interpreting Results

### High Score (80-100): Automation Gold Mine
**Action:** Prioritize for immediate implementation
- Clear ROI with low risk
- Proven technology and integrations
- High volume or time-intensive
- Minimal change management risk

**Implementation Path:**
1. Select automation tools (week 1)
2. Build and test workflow (weeks 2-4)
3. Pilot with monitoring (week 5)
4. Full rollout (week 6+)

### Medium-High Score (60-79): Strategic Automation
**Action:** Plan carefully, implement in phases
- Good ROI but requires investment
- May need custom integration
- Moderate risk requiring safeguards
- Training and change management needed

**Implementation Path:**
1. Detailed requirements gathering (weeks 1-2)
2. Proof of concept (weeks 3-6)
3. Iterative development (weeks 7-12)
4. Phased rollout with checkpoints (weeks 13+)

### Medium Score (40-59): Augmentation Focus
**Action:** Use AI assistance, not full automation
- Human judgment remains critical
- AI can provide research, drafts, or recommendations
- Keep human in the loop for all decisions
- Focus on time-to-insight, not full replacement

**Implementation Path:**
1. Identify decision support needs
2. Implement AI research/analysis tools
3. Create human review workflows
4. Measure quality and time improvements

### Low Score (<40): Manual Excellence
**Action:** Keep human-driven, optimize processes
- These tasks define executive value
- Automation may reduce quality or introduce risk
- Focus on enablement tools, not replacement
- Invest in skill development instead

**Implementation Path:**
1. Streamline manual processes
2. Provide better data access tools
3. Eliminate administrative friction
4. Invest in executive development

## Best Practices

1. **Score Regularly**: Re-score quarterly as technology and data availability evolves
2. **Validate Assumptions**: Test factor scores with actual time tracking data
3. **Consider Context**: Adjust weights based on organizational risk tolerance
4. **Pilot First**: Start with high-score, low-risk items to prove value
5. **Measure Outcomes**: Track actual vs. estimated time savings
6. **Iterate Weights**: Refine your weighting profile based on results
7. **Involve Stakeholders**: Review scores with teams who execute the work
8. **Document Decisions**: Track why certain items weren't automated

## Brookside BI Philosophy

At Brookside BI, we believe automation should amplify human potential, not replace human judgment. Our scoring methodology is designed to:

- **Identify Quick Wins**: Find high-impact, low-risk automation opportunities
- **Protect Value**: Preserve activities where human insight creates differentiation
- **Manage Risk**: Ensure automation doesn't introduce new vulnerabilities
- **Drive ROI**: Focus on measurable business outcomes
- **Enable Growth**: Free executives to focus on strategic, creative, and relationship work

The `/exec:score` command embodies this philosophy by providing rigorous, data-driven analysis while keeping human judgment at the center of strategic decisions.

---

**Next Steps:**
- Run `/exec:score` on your mapped responsibilities
- Review the tier distribution and top priorities
- Use `/exec:workflow` to generate automation blueprints for high-scoring items
- Start with 1-2 "Full Automation" tier items for quick wins
- Build momentum and expand your automation portfolio

**Questions? Need custom weighting profiles?**
Contact Brookside BI for personalized automation strategy consulting.
