---
name: exec:dashboard
intent: Display automation status, metrics, and performance dashboard
tags:
  - dashboard
  - metrics
  - monitoring
  - analytics
  - performance
inputs: []
risk: medium
cost: medium
description: Display automation status, metrics, and performance dashboard
model: sonnet
---

# Executive Automation Dashboard

Display comprehensive automation metrics, status, and performance analytics for the Brookside BI executive automation platform.

## Command Usage

```bash
/exec:dashboard                          # Overview dashboard (week)
/exec:dashboard overview today           # Today's overview
/exec:dashboard workflows month          # Workflow metrics for month
/exec:dashboard agents week              # Agent performance this week
/exec:dashboard performance quarter      # Quarterly performance analysis
```

## Dashboard Implementation

### 1. Data Collection Phase

```bash
# Determine time period
case "$2" in
  today)
    START_DATE=$(date -d "today 00:00:00" +%s)
    END_DATE=$(date +%s)
    PERIOD_LABEL="Today"
    ;;
  week)
    START_DATE=$(date -d "7 days ago" +%s)
    END_DATE=$(date +%s)
    PERIOD_LABEL="Last 7 Days"
    ;;
  month)
    START_DATE=$(date -d "30 days ago" +%s)
    END_DATE=$(date +%s)
    PERIOD_LABEL="Last 30 Days"
    ;;
  quarter)
    START_DATE=$(date -d "90 days ago" +%s)
    END_DATE=$(date +%s)
    PERIOD_LABEL="Last 90 Days"
    ;;
  *)
    START_DATE=$(date -d "7 days ago" +%s)
    END_DATE=$(date +%s)
    PERIOD_LABEL="Last 7 Days"
    ;;
esac

# Collect metrics from automation logs
AUTOMATION_DIR="${PROJECT_ROOT}/exec-automator"
LOGS_DIR="${AUTOMATION_DIR}/logs"
METRICS_DIR="${AUTOMATION_DIR}/.metrics"
WORKFLOWS_DIR="${AUTOMATION_DIR}/workflows"
AGENTS_DIR="${AUTOMATION_DIR}/agents"

# Ensure metrics directory exists
mkdir -p "${METRICS_DIR}"

# Create temporary metrics file
METRICS_FILE="${METRICS_DIR}/dashboard_$(date +%Y%m%d_%H%M%S).json"
```

### 2. Overview Dashboard

When `view` is "overview" (default):

```
╔════════════════════════════════════════════════════════════════════════════╗
║                    BROOKSIDE BI - EXECUTIVE AUTOMATION                     ║
║                          Automation Command Center                          ║
╚════════════════════════════════════════════════════════════════════════════╝

Period: {PERIOD_LABEL} | Generated: {TIMESTAMP}

┌─────────────────────────────────────────────────────────────────────────────┐
│ AUTOMATION IMPACT SUMMARY                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Total Tasks Automated:           1,247        [████████████░░] 87%        │
│  Manual Tasks Remaining:            187        [██░░░░░░░░░░] 13%          │
│                                                                             │
│  Time Saved (Hours):               89.5        ▲ +12.3% vs prev period     │
│  Cost Reduction:                $12,450        ▲ +8.7% vs prev period      │
│  ROI (Return on Investment):       287%        ▲ +15% vs prev period       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WORKFLOW EXECUTION STATUS                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Active Workflows:                    42       ● Running                   │
│  Queued Workflows:                     8       ◐ Pending                   │
│  Completed (Success):                 856      ✓ Complete                  │
│  Failed/Retry:                         23      ✗ Error                     │
│                                                                             │
│  Overall Success Rate:             97.4%       [███████████░]              │
│  Avg Execution Time:               4.2s        ↓ -0.8s improvement         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TOP PERFORMING WORKFLOWS                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Email Triage & Response        347 runs | 99.1% success | 3.2s avg    │
│  2. Meeting Prep Automation        189 runs | 98.4% success | 5.7s avg    │
│  3. Report Generation              156 runs | 97.8% success | 8.1s avg    │
│  4. Document Processing            142 runs | 96.5% success | 6.3s avg    │
│  5. Calendar Optimization          128 runs | 99.2% success | 2.1s avg    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ AGENT UTILIZATION                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Communications Agent:     [████████████░] 78% | 423 tasks                │
│  Analytics Agent:          [███████░░░░░] 56% | 312 tasks                 │
│  Operations Agent:         [██████████░░] 67% | 387 tasks                 │
│  Strategy Agent:           [████░░░░░░░░] 34% | 156 tasks                 │
│  Research Agent:           [█████░░░░░░░] 45% | 289 tasks                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ SYSTEM HEALTH                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  API Availability:              99.8%          ● Operational               │
│  Average Response Time:         1.2s           ● Excellent                 │
│  Error Rate:                    0.3%           ● Healthy                   │
│  Queue Depth:                   8 tasks        ● Normal                    │
│  Resource Utilization:          42%            ● Optimal                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ COST ANALYSIS                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Total API Costs:              $1,234          Budget: $2,500 (49%)       │
│  Cost per Automation:           $1.02          Target: $1.50              │
│  Projected Monthly:            $5,320          ▼ -$450 vs last month      │
│                                                                             │
│  Cost Breakdown:                                                            │
│    Claude API (Sonnet):        $487   [████░░░░░░] 39%                    │
│    Claude API (Opus):          $356   [███░░░░░░░] 29%                    │
│    Claude API (Haiku):         $123   [█░░░░░░░░░] 10%                    │
│    Other Services:             $268   [██░░░░░░░░] 22%                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ RECENT ALERTS & NOTIFICATIONS                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✓ [INFO]  Email workflow optimized - 15% faster processing                │
│  ✓ [INFO]  New integration added: Slack notifications                      │
│  ⚠ [WARN]  API rate limit approaching (85% of quota)                       │
│  ✓ [INFO]  Weekly report generated successfully                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                        Use /exec:help for command reference
```

### 3. Workflows Dashboard

When `view` is "workflows":

```
╔════════════════════════════════════════════════════════════════════════════╗
║                          WORKFLOW ANALYTICS DASHBOARD                       ║
╚════════════════════════════════════════════════════════════════════════════╝

Period: {PERIOD_LABEL}

┌─────────────────────────────────────────────────────────────────────────────┐
│ WORKFLOW EXECUTION METRICS                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Total Workflows Executed:        929                                       │
│  Success Rate:                  97.4%    [███████████░]                    │
│  Average Duration:               4.2s    ↓ -0.8s improvement               │
│  Workflows per Day:               132    ▲ +15 vs prev period              │
│                                                                             │
│  Status Distribution:                                                       │
│    ✓ Completed Successfully:     905    [███████████░] 97.4%              │
│    ◐ In Progress:                 18    [░░░░░░░░░░░░]  1.9%              │
│    ⟳ Retrying:                     4    [░░░░░░░░░░░░]  0.4%              │
│    ✗ Failed:                       2    [░░░░░░░░░░░░]  0.2%              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WORKFLOW PERFORMANCE LEADERBOARD                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Workflow Name                  Runs  Success  Avg Time  Time Saved        │
│  ─────────────────────────────────────────────────────────────────────────  │
│  1. Email Triage & Response      347   99.1%     3.2s     23.4 hrs        │
│  2. Meeting Prep Automation      189   98.4%     5.7s     15.2 hrs        │
│  3. Report Generation            156   97.8%     8.1s     18.7 hrs        │
│  4. Document Processing          142   96.5%     6.3s     12.1 hrs        │
│  5. Calendar Optimization        128   99.2%     2.1s      8.9 hrs        │
│  6. Stakeholder Communications   98    97.9%     4.5s      7.3 hrs        │
│  7. Data Analysis & Insights     87    98.8%     9.2s      9.8 hrs        │
│  8. Contract Review              76    95.4%    12.3s      8.4 hrs        │
│  9. Budget Analysis              64    99.0%     7.8s      5.6 hrs        │
│  10. Board Report Prep           53    100.0%   15.2s      7.2 hrs        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WORKFLOW EXECUTION TIMELINE (Last 7 Days)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  200│                                    ██                                 │
│     │                          ██        ██                                 │
│  150│              ██          ██        ██                                 │
│     │              ██    ██    ██        ██                                 │
│  100│        ██    ██    ██    ██        ██    ██                          │
│     │  ██    ██    ██    ██    ██        ██    ██                          │
│   50│  ██    ██    ██    ██    ██        ██    ██                          │
│     │  ██    ██    ██    ██    ██        ██    ██                          │
│    0└──────────────────────────────────────────────────────────────────    │
│      Mon   Tue   Wed   Thu   Fri   Sat   Sun                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WORKFLOW CATEGORIES                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Communications:        387 runs  [████████░░] 41.7%  ▲ +23 vs prev       │
│  Analytics:             234 runs  [█████░░░░░] 25.2%  ▲ +18 vs prev       │
│  Operations:            178 runs  [████░░░░░░] 19.2%  ▼ -5 vs prev        │
│  Strategy:               89 runs  [██░░░░░░░░]  9.6%  ▲ +12 vs prev       │
│  Research:               41 runs  [█░░░░░░░░░]  4.4%  → Same               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ FAILURE ANALYSIS                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Total Failures:                    24                                      │
│  Failure Rate:                    2.6%                                      │
│  Auto-Recovered:                    18    (75.0%)                          │
│  Manual Intervention:                6    (25.0%)                          │
│                                                                             │
│  Top Failure Reasons:                                                       │
│    1. API Rate Limit:               12    [████████░░] 50.0%              │
│    2. Timeout:                       7    [█████░░░░░] 29.2%              │
│    3. Data Validation:               3    [██░░░░░░░░] 12.5%              │
│    4. Network Error:                 2    [█░░░░░░░░░]  8.3%              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WORKFLOW EFFICIENCY GAINS                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Manual Time (Estimated):         1,245 hours                              │
│  Automated Time:                    124 hours                              │
│  Time Saved:                      1,121 hours  (90.0% reduction)           │
│                                                                             │
│  Equivalent to:                    140 business days                        │
│  Cost Savings:                  $45,680  (@$40/hr baseline)                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                    Use /exec:workflow:list for detailed workflow info
```

### 4. Agents Dashboard

When `view` is "agents":

```
╔════════════════════════════════════════════════════════════════════════════╗
║                          AGENT PERFORMANCE DASHBOARD                        ║
╚════════════════════════════════════════════════════════════════════════════╝

Period: {PERIOD_LABEL}

┌─────────────────────────────────────────────────────────────────────────────┐
│ AGENT FLEET STATUS                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Total Agents Deployed:              12                                     │
│  Active Agents:                       9    ● Online                         │
│  Idle Agents:                         3    ◐ Standby                        │
│  Total Tasks Completed:           1,567                                     │
│  Average Response Time:            2.3s    ↓ -0.4s improvement             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ AGENT UTILIZATION & PERFORMANCE                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Agent Name                 Tasks  Utilization  Avg Time  Success Rate     │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  Communications Agent        423   [████████████░] 78%    2.1s    99.3%    │
│    Email Processing          234     ✓ 233 | ✗ 1                           │
│    Slack Integration         127     ✓ 127 | ✗ 0                           │
│    Stakeholder Updates        62     ✓ 61 | ✗ 1                            │
│                                                                             │
│  Operations Agent            387   [██████████░░] 67%    3.4s    97.9%     │
│    Task Coordination         198     ✓ 195 | ✗ 3                           │
│    Calendar Management       134     ✓ 132 | ✗ 2                           │
│    Meeting Scheduling         55     ✓ 53 | ✗ 2                            │
│                                                                             │
│  Analytics Agent             312   [███████░░░░░] 56%    4.8s    98.4%     │
│    Report Generation         156     ✓ 154 | ✗ 2                           │
│    Data Analysis              98     ✓ 96 | ✗ 2                            │
│    Metrics Dashboard          58     ✓ 57 | ✗ 1                            │
│                                                                             │
│  Research Agent              289   [█████░░░░░░░] 45%    6.2s    96.5%     │
│    Market Analysis           142     ✓ 138 | ✗ 4                           │
│    Competitive Intel          87     ✓ 84 | ✗ 3                            │
│    Trend Monitoring           60     ✓ 58 | ✗ 2                            │
│                                                                             │
│  Strategy Agent              156   [████░░░░░░░░] 34%    7.5s    99.4%     │
│    Strategic Planning         76     ✓ 76 | ✗ 0                            │
│    Decision Support           53     ✓ 52 | ✗ 1                            │
│    Scenario Analysis          27     ✓ 27 | ✗ 0                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ MODEL DISTRIBUTION & COSTS                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Model          Tasks    Tokens Used    Avg Latency    Cost               │
│  ────────────────────────────────────────────────────────────────────────   │
│  Claude Opus      234      4.2M tokens      1.8s        $356.20           │
│  Claude Sonnet    987     12.8M tokens      1.2s        $487.30           │
│  Claude Haiku     346      2.1M tokens      0.6s        $123.45           │
│                                                                             │
│  Total Cost:                                            $966.95            │
│  Cost per Task:                                           $0.62            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ AGENT PERFORMANCE TRENDS (Last 7 Days)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Success Rate Over Time:                                                    │
│                                                                             │
│  100%│ ──────────────────────────────────────────                          │
│      │                                                                      │
│   95%│           ●──●                    ●──●                               │
│      │        ●──●  ●──●              ●──●  ●                               │
│   90%│     ●──●        ●──●        ●──●       ●                            │
│      │  ●──●              ●──●  ●──●                                        │
│   85%│                       ●──●                                           │
│      │                                                                      │
│      └──────────────────────────────────────────────────────────────────   │
│       Mon   Tue   Wed   Thu   Fri   Sat   Sun                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ AGENT EFFICIENCY METRICS                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Average Tasks per Agent:           131  ▲ +12 vs prev period              │
│  Peak Concurrent Tasks:              18  ● Within normal range             │
│  Queue Wait Time (Avg):            0.3s  ↓ -0.1s improvement               │
│  First Response Time:              1.1s  ● Excellent                       │
│                                                                             │
│  Agent Availability:              99.2%  [███████████░]                    │
│  Agent Reliability:               97.8%  [██████████░░]                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ TOP AGENT COLLABORATIONS                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Agent Pair                              Workflows   Success Rate          │
│  ────────────────────────────────────────────────────────────────────────   │
│  Communications + Operations                    187      98.9%             │
│  Analytics + Strategy                           142      99.3%             │
│  Research + Strategy                             98      97.8%             │
│  Operations + Analytics                          76      98.7%             │
│  Communications + Strategy                       54      100.0%            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ AGENT ERROR ANALYSIS                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Total Errors:                      39                                      │
│  Error Rate:                      2.5%                                      │
│  Auto-Recovered:                    32    (82.1%)                          │
│                                                                             │
│  Error Types:                                                               │
│    API Timeout:                     18    [████████░░] 46.2%              │
│    Rate Limiting:                   12    [█████░░░░░] 30.8%              │
│    Validation Error:                 6    [███░░░░░░░] 15.4%              │
│    Network Issue:                    3    [█░░░░░░░░░]  7.7%              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                      Use /exec:agent:status for real-time agent info
```

### 5. Performance Dashboard

When `view` is "performance":

```
╔════════════════════════════════════════════════════════════════════════════╗
║                     PERFORMANCE & OPTIMIZATION DASHBOARD                    ║
╚════════════════════════════════════════════════════════════════════════════╝

Period: {PERIOD_LABEL}

┌─────────────────────────────────────────────────────────────────────────────┐
│ SYSTEM PERFORMANCE METRICS                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Overall System Health:           98.7%    ● Excellent                      │
│  Average Response Time:            1.2s    ↓ -0.3s vs target               │
│  Peak Response Time:               8.4s    ● Within SLA                    │
│  P95 Response Time:                3.2s    ● Optimal                       │
│  P99 Response Time:                6.1s    ● Good                          │
│                                                                             │
│  Uptime:                         99.8%    [███████████░]                   │
│  Error Rate:                      0.3%    [░░░░░░░░░░░░]                   │
│  Success Rate:                   97.4%    [██████████░░]                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ RESPONSE TIME DISTRIBUTION                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   < 1s:  [████████████████] 67.3%  (1,053 requests)                        │
│  1-2s:   [████████░░░░░░░░] 18.4%    (287 requests)                        │
│  2-5s:   [████░░░░░░░░░░░░]  9.8%    (153 requests)                        │
│  5-10s:  [██░░░░░░░░░░░░░░]  3.5%     (55 requests)                        │
│  > 10s:  [░░░░░░░░░░░░░░░░]  1.0%     (16 requests)                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ THROUGHPUT ANALYSIS                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Requests per Hour (Avg):          223    ▲ +18 vs prev period             │
│  Requests per Day:               5,352    ● Normal load                    │
│  Peak Hour Throughput:             456    12:00-13:00 UTC                  │
│  Off-Peak Throughput:               87    02:00-03:00 UTC                  │
│                                                                             │
│  Hourly Request Pattern:                                                    │
│                                                                             │
│  500│                          ██                                           │
│     │                    ██    ██    ██                                     │
│  400│              ██    ██    ██    ██                                     │
│     │        ██    ██    ██    ██    ██    ██                              │
│  300│        ██    ██    ██    ██    ██    ██                              │
│     │  ██    ██    ██    ██    ██    ██    ██    ██                        │
│  200│  ██    ██    ██    ██    ██    ██    ██    ██                        │
│     │  ██    ██    ██    ██    ██    ██    ██    ██    ██    ██    ██  ██ │
│  100│  ██    ██    ██    ██    ██    ██    ██    ██    ██    ██    ██  ██ │
│     │  ██    ██    ██    ██    ██    ██    ██    ██    ██    ██    ██  ██ │
│    0└──────────────────────────────────────────────────────────────────    │
│      00 02 04 06 08 10 12 14 16 18 20 22  (Hour of Day)                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ COST PERFORMANCE ANALYSIS                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Total API Costs:              $1,234   Budget: $2,500 (49.4%)            │
│  Cost per Request:              $0.78   Target: $1.00 (22% under)          │
│  Daily Average:                 $176    ▼ -$12 vs prev period              │
│  Projected Monthly:            $5,320   ● On track                         │
│                                                                             │
│  Cost Efficiency Trend:                                                     │
│                                                                             │
│  $1.20│                                                                     │
│       │  ●──●                                                               │
│  $1.00│     ●──●──●                                                         │
│       │           ●──●──●──●                                                │
│  $0.80│                    ●──●──●                                          │
│       │                          ●──●                                       │
│  $0.60│                                                                     │
│       └──────────────────────────────────────────────────────────────────  │
│        Week 1  Week 2  Week 3  Week 4                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ OPTIMIZATION OPPORTUNITIES                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  High Impact:                                                               │
│    ● Switch 23% of Opus calls to Sonnet (Est. savings: $89/month)         │
│    ● Implement caching for report generation (Est. savings: $45/month)     │
│    ● Batch email processing during off-peak (Est. savings: $32/month)      │
│                                                                             │
│  Medium Impact:                                                             │
│    ◐ Optimize meeting prep workflow (Est. savings: $18/month)              │
│    ◐ Reduce redundant data fetching (Est. savings: $12/month)              │
│                                                                             │
│  Potential Total Savings:      $196/month  (15.8% cost reduction)          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ RESOURCE UTILIZATION                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  API Rate Limit Usage:                                                      │
│    Anthropic Claude:           [████████░░] 67%  (201K / 300K tokens/min)  │
│    OpenAI (Backup):            [██░░░░░░░░] 12%  ( 12K / 100K tokens/min)  │
│                                                                             │
│  Queue Utilization:            [████░░░░░░] 28%  (8 / 30 max queue depth)  │
│  Agent Pool:                   [████████░░] 75%  (9 / 12 agents active)    │
│  Storage:                      [███░░░░░░░] 23%  (2.3GB / 10GB allocated)  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ RELIABILITY METRICS                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Mean Time Between Failures (MTBF):      156 hours                         │
│  Mean Time To Recovery (MTTR):            2.3 minutes                       │
│  Service Level Agreement (SLA):         99.5% target | 99.8% actual        │
│                                                                             │
│  Incident Summary:                                                          │
│    Total Incidents:                  3                                      │
│    Critical (P0):                    0    No service outages                │
│    High (P1):                        1    Resolved in 4 minutes             │
│    Medium (P2):                      2    Avg resolution: 8 minutes         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ PERFORMANCE BENCHMARKS                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Metric                          Current    Target    Industry Avg         │
│  ────────────────────────────────────────────────────────────────────────   │
│  Response Time (P95):              3.2s      4.0s         5.2s    ✓        │
│  Success Rate:                   97.4%     95.0%        92.1%    ✓        │
│  Cost per Automation:            $0.78     $1.00        $1.45    ✓        │
│  Uptime:                         99.8%     99.5%        98.7%    ✓        │
│  Error Rate:                      0.3%      1.0%         2.3%    ✓        │
│                                                                             │
│  Overall Performance Score:       94.2 / 100    ● Excellent                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                   Use /exec:optimize for automated performance tuning
```

## Data Sources

Dashboard metrics are collected from:

1. **Workflow Execution Logs** (`${AUTOMATION_DIR}/logs/workflows/*.log`)
   - Execution timestamps
   - Success/failure status
   - Duration and performance data
   - Error messages and stack traces

2. **Agent Activity Logs** (`${AUTOMATION_DIR}/logs/agents/*.log`)
   - Task assignments and completions
   - Model usage and token counts
   - Response times
   - Error rates

3. **API Usage Metrics** (`${AUTOMATION_DIR}/.metrics/api-usage.json`)
   - Token consumption by model
   - Cost tracking
   - Rate limit usage
   - Request/response times

4. **System Health Checks** (`${AUTOMATION_DIR}/.metrics/health.json`)
   - Service availability
   - Queue depths
   - Resource utilization
   - Alert history

## Metric Calculations

### Time Saved Estimation

```
Time Saved = (Manual Time per Task × Automation Count) - Actual Automated Time

Where:
- Manual Time per Task: Baseline from user-defined task profiles
- Automation Count: Number of automated executions
- Actual Automated Time: Sum of workflow execution times
```

### Cost Reduction

```
Cost Reduction = (Manual Labor Cost) - (Automation Cost)

Where:
- Manual Labor Cost: Time Saved × Hourly Rate
- Automation Cost: API costs + Infrastructure costs
```

### ROI (Return on Investment)

```
ROI = ((Cost Reduction - Automation Cost) / Automation Cost) × 100%
```

### Success Rate

```
Success Rate = (Successful Executions / Total Executions) × 100%
```

## Display Modes

- **ASCII Dashboard**: Default terminal-friendly visualization
- **JSON Export**: Add `--json` flag for machine-readable output
- **CSV Export**: Add `--csv` flag for spreadsheet import
- **HTML Report**: Add `--html` flag for browser-based viewing

## Refresh Rate

- **Real-time**: Live updates every 5 seconds (use `--watch` flag)
- **Cached**: Default 5-minute cache for performance
- **Force Refresh**: Use `--refresh` flag to bypass cache

## Integration Points

- Exports metrics to Obsidian vault: `${OBSIDIAN_VAULT_PATH}/Automation/Metrics/`
- Sends alerts to Slack (if configured)
- Updates executive summary in daily reports
- Feeds into budget tracking dashboards

## Brand Voice: Brookside BI

- Executive-focused: Clear, actionable insights
- Data-driven: Quantified outcomes and trends
- Professional: Business terminology and metrics
- Confident: Highlight wins, address issues proactively

## Next Steps

After viewing dashboard:
- `/exec:optimize` - Apply recommended optimizations
- `/exec:workflow:tune <name>` - Improve specific workflow
- `/exec:agent:scale` - Adjust agent allocation
- `/exec:report:generate` - Create executive summary

---

**Automation Command Center** | Brookside BI Executive Platform
