---
name: exec:simulate
intent: Simulate workflow execution with test data to validate before deployment
tags:
  - simulation
  - testing
  - validation
  - quality-assurance
  - workflow-testing
inputs: []
risk: medium
cost: medium
description: Simulate workflow execution with test data to validate before deployment
model: sonnet
---

# Workflow Simulation Command

**Purpose:** Run comprehensive simulations of generated workflows before deployment to validate logic, test edge cases, and identify potential issues.

**Brand Context:** Brookside BI is a forward-thinking analytics consultancy that champions data-driven decision making. Simulation testing ensures our workflows are robust, reliable, and ready for production use.

---

## Simulation Framework

### Phase 1: Initialization and Setup

**Objective:** Prepare the simulation environment and load workflow definitions.

**Actions:**

1. **Load Workflow Configuration**
   - Parse workflow definition from `.claude/exec-automator/workflows/{workflow}.json`
   - Validate workflow structure and dependencies
   - Identify all decision points, integrations, and approval gates
   - Map data flow and transformation logic

2. **Generate Mock Data**
   - Create realistic test data based on workflow inputs
   - Generate edge case variants (nulls, extremes, invalid formats)
   - Prepare stress test datasets (high volume, concurrent requests)
   - Set up error injection scenarios

3. **Initialize Mock Services**
   - Create mock implementations for external integrations
   - Set up stub responses for API calls
   - Configure simulated delays and timeouts
   - Prepare error responses for failure scenarios

4. **Configure Monitoring**
   - Set up performance metrics collection
   - Initialize logging and tracing
   - Prepare assertion checkpoints
   - Configure result aggregation

---

### Phase 2: Scenario Execution

**Objective:** Run the workflow through various test scenarios to validate behavior.

#### 2.1 Happy Path Testing

**Purpose:** Verify the workflow executes correctly under ideal conditions.

**Test Cases:**

1. **Standard Input Processing**
   - Valid input data within expected ranges
   - All required fields populated
   - Proper data formats and types
   - Expected business logic outcomes

2. **Successful Integration Calls**
   - All external services respond successfully
   - Data transformations execute correctly
   - State transitions occur as expected
   - Output matches expected format

3. **Decision Point Navigation**
   - Conditional logic evaluates correctly
   - Branches execute appropriate paths
   - Loop conditions function properly
   - Workflow completion reaches expected state

4. **Approval Workflows**
   - Approval requests trigger correctly
   - Mock approvals process successfully
   - Post-approval actions execute
   - Notification delivery simulated

**Expected Results:**
- 100% success rate
- Execution time within expected bounds
- All checkpoints pass validation
- Output matches expected schema

---

#### 2.2 Edge Case Testing

**Purpose:** Validate workflow behavior with boundary conditions and unusual inputs.

**Test Cases:**

1. **Data Boundary Conditions**
   - Empty strings and null values
   - Maximum and minimum numeric values
   - Very long text fields (10,000+ characters)
   - Special characters and Unicode
   - Missing optional fields
   - Extra unexpected fields

2. **Timing Edge Cases**
   - Extremely fast processing (< 1ms)
   - Timeout scenarios (30s+ delays)
   - Concurrent execution conflicts
   - Race conditions between parallel tasks
   - Retry logic exhaustion

3. **Integration Failures**
   - Service unavailable (503 errors)
   - Authentication failures (401/403)
   - Rate limiting (429 errors)
   - Network timeouts
   - Partial response data
   - Malformed response structures

4. **Business Logic Edge Cases**
   - Calculations resulting in infinity/NaN
   - Division by zero scenarios
   - Empty result sets
   - Duplicate data handling
   - Conflicting business rules
   - State machine invalid transitions

5. **Approval Workflow Edge Cases**
   - Approval request to non-existent user
   - Multiple approvers with conflicts
   - Expired approval windows
   - Approval revocation
   - Escalation scenarios

**Expected Results:**
- Graceful error handling
- No unhandled exceptions
- Proper fallback mechanisms
- Clear error messages
- Workflow reaches terminal state (success or failure)

---

#### 2.3 Stress Testing

**Purpose:** Evaluate workflow performance under high load and resource constraints.

**Test Cases:**

1. **High Volume Processing**
   - Execute workflow with 1,000+ concurrent instances
   - Process large batch operations (10,000+ items)
   - Sustained load over extended period (10+ minutes)
   - Measure throughput and latency

2. **Resource Constraint Scenarios**
   - Limited memory conditions
   - CPU throttling simulation
   - Network bandwidth restrictions
   - Connection pool exhaustion

3. **Cascading Failures**
   - Multiple simultaneous service failures
   - Degraded performance scenarios
   - Circuit breaker activation
   - Retry storm mitigation

4. **Data Volume Stress**
   - Very large payload processing (100MB+)
   - High cardinality data transformations
   - Complex nested data structures
   - Large result set handling

**Expected Results:**
- Performance degradation is graceful
- No cascading failures
- Proper backpressure handling
- Resource cleanup occurs correctly
- Circuit breakers activate appropriately

---

#### 2.4 Error Injection Testing

**Purpose:** Validate error handling and recovery mechanisms.

**Injection Points:**

1. **Input Validation Errors**
   - Schema validation failures
   - Type mismatch errors
   - Required field violations
   - Format validation errors

2. **Processing Errors**
   - Unhandled exceptions in business logic
   - Calculation errors (overflow, underflow)
   - Data transformation failures
   - State corruption scenarios

3. **Integration Errors**
   - Random service failures (10% error rate)
   - Intermittent connectivity issues
   - Inconsistent response formats
   - Authentication token expiration

4. **System Errors**
   - Out of memory conditions
   - Disk space exhaustion
   - Process crashes
   - Database connection failures

**Expected Results:**
- All errors are caught and logged
- Error messages are descriptive
- Recovery mechanisms activate
- Compensating transactions execute
- System returns to stable state

---

### Phase 3: Performance Analysis

**Objective:** Measure and analyze workflow performance characteristics.

**Metrics Collected:**

1. **Execution Metrics**
   - Total execution time (p50, p95, p99)
   - Time per workflow stage
   - Queue wait times
   - Lock acquisition times

2. **Resource Utilization**
   - CPU usage per iteration
   - Memory allocation patterns
   - Network I/O volume
   - Database query counts

3. **Integration Performance**
   - API call latency
   - Success/failure ratios
   - Retry counts
   - Timeout occurrences

4. **Throughput Metrics**
   - Workflows per second
   - Items processed per minute
   - Concurrent execution capacity
   - Queue depth over time

**Analysis:**

```python
# Performance Analysis Example
performance_report = {
    "execution_time": {
        "p50": "245ms",
        "p95": "890ms",
        "p99": "1.2s",
        "max": "3.4s"
    },
    "throughput": {
        "workflows_per_second": 45,
        "max_concurrent": 120,
        "queue_depth_avg": 12
    },
    "resource_usage": {
        "cpu_avg": "35%",
        "memory_avg": "450MB",
        "network_io": "12MB/s"
    },
    "bottlenecks": [
        "Database query in stage 3 (400ms avg)",
        "External API call timeout handling",
        "Large payload serialization"
    ],
    "recommendations": [
        "Add caching layer for repeated database queries",
        "Increase timeout from 5s to 10s for external API",
        "Implement streaming for payloads > 10MB"
    ]
}
```

---

### Phase 4: Validation and Reporting

**Objective:** Validate simulation results and generate comprehensive reports.

**Validation Checks:**

1. **Functional Correctness**
   - All happy path tests pass
   - Expected outputs match actual outputs
   - State transitions are correct
   - Business rules enforce properly

2. **Error Handling**
   - No unhandled exceptions
   - Error messages are clear and actionable
   - Recovery mechanisms work
   - Logging is comprehensive

3. **Performance Standards**
   - Execution time within SLA
   - Resource usage acceptable
   - Throughput meets requirements
   - No memory leaks detected

4. **Integration Health**
   - All mocked services called correctly
   - Request formats are valid
   - Response parsing works
   - Authentication handled properly

**Report Generation:**

```markdown
# Workflow Simulation Report: {workflow_name}

## Executive Summary

- **Simulation Date:** {timestamp}
- **Iterations:** {count}
- **Success Rate:** {percentage}%
- **Confidence Score:** {score}/100
- **Deployment Recommendation:** {APPROVED/NEEDS_WORK/BLOCKED}

## Scenario Results

### Happy Path Testing
- **Status:** ✅ PASSED
- **Iterations:** {count}
- **Success Rate:** 100%
- **Avg Execution Time:** {time}ms
- **Details:** All test cases passed without issues.

### Edge Case Testing
- **Status:** ⚠️ WARNINGS
- **Iterations:** {count}
- **Success Rate:** 95%
- **Failed Cases:** 3
- **Details:**
  - Missing null check in stage 2 (low severity)
  - Timeout handling could be improved (medium)
  - Unicode handling issue in email template (low)

### Stress Testing
- **Status:** ✅ PASSED
- **Iterations:** {count}
- **Success Rate:** 98%
- **Peak Throughput:** {count} workflows/sec
- **Details:** Performance degrades gracefully under load.

### Error Injection Testing
- **Status:** ✅ PASSED
- **Iterations:** {count}
- **Recovery Rate:** 100%
- **Details:** All injected errors handled correctly.

## Performance Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Avg Execution Time | 245ms | < 500ms | ✅ PASS |
| P95 Execution Time | 890ms | < 2s | ✅ PASS |
| Max Concurrent | 120 | > 50 | ✅ PASS |
| Memory Usage | 450MB | < 1GB | ✅ PASS |
| Error Rate | 2% | < 5% | ✅ PASS |

## Issues Identified

### Critical Issues (0)
None identified.

### High Priority Issues (1)
1. **Timeout Handling in External API Call**
   - **Location:** Stage 3, Integration Service
   - **Impact:** Can cause workflow to hang under load
   - **Recommendation:** Increase timeout from 5s to 10s and add circuit breaker

### Medium Priority Issues (2)
1. **Missing Null Check**
   - **Location:** Stage 2, Data Transformation
   - **Impact:** Potential NPE if field is missing
   - **Recommendation:** Add null coalescing with default value

2. **Unicode Handling**
   - **Location:** Stage 5, Email Template
   - **Impact:** Special characters may not render correctly
   - **Recommendation:** Ensure UTF-8 encoding throughout

### Low Priority Issues (1)
1. **Logging Verbosity**
   - **Location:** All stages
   - **Impact:** Logs may be too verbose for production
   - **Recommendation:** Reduce log level from DEBUG to INFO

## Integration Health

| Integration | Calls | Success Rate | Avg Latency | Status |
|-------------|-------|--------------|-------------|--------|
| CRM API | 150 | 99% | 120ms | ✅ Healthy |
| Email Service | 85 | 100% | 45ms | ✅ Healthy |
| Database | 220 | 100% | 15ms | ✅ Healthy |
| Analytics | 120 | 97% | 340ms | ⚠️ Slow |

## Recommendations

### Immediate Actions
1. Fix timeout handling in external API call
2. Add null checks in data transformation stage
3. Test with production-like data volumes

### Performance Optimizations
1. Add caching layer for repeated database queries
2. Implement connection pooling for external APIs
3. Consider async processing for non-critical tasks

### Deployment Readiness
- **Pre-Deployment Testing:** ✅ Complete
- **Documentation:** ✅ Complete
- **Runbook:** ⚠️ Needs update with new timeout values
- **Monitoring:** ✅ Dashboards configured
- **Rollback Plan:** ✅ Documented

## Confidence Score: 87/100

**Breakdown:**
- Functional Correctness: 95/100 (minor issues)
- Error Handling: 90/100 (timeout handling)
- Performance: 85/100 (some optimization opportunities)
- Integration Health: 95/100 (all healthy)
- Test Coverage: 90/100 (good coverage)

**Deployment Recommendation:** ✅ APPROVED WITH MINOR FIXES

The workflow is ready for deployment after addressing the timeout handling issue. All other issues are low priority and can be addressed post-deployment.

---

**Next Steps:**
1. Fix high priority issues identified above
2. Run one final simulation with fixes applied
3. Deploy to staging environment
4. Monitor closely for 24-48 hours
5. Promote to production with gradual rollout

---

**Simulated By:** Claude Code Exec-Automator Plugin
**Report Generated:** {timestamp}
**Simulation Duration:** {duration}
```

---

## Mock Data Generation

**Purpose:** Create realistic test data that covers a wide range of scenarios.

**Generation Strategies:**

### 1. Happy Path Data
```json
{
  "customer_id": "CUST-12345",
  "order_total": 1250.00,
  "order_date": "2025-12-17T10:30:00Z",
  "items": [
    {"sku": "PROD-001", "quantity": 2, "price": 500.00},
    {"sku": "PROD-002", "quantity": 1, "price": 250.00}
  ],
  "shipping_address": {
    "street": "123 Main St",
    "city": "Seattle",
    "state": "WA",
    "zip": "98101"
  },
  "payment_method": "credit_card"
}
```

### 2. Edge Case Data
```json
{
  "customer_id": "",  // Empty string
  "order_total": 0.01,  // Minimum value
  "order_date": null,  // Missing value
  "items": [],  // Empty array
  "shipping_address": {
    "street": "Улица Пушкина дом 1",  // Unicode
    "city": "A" * 1000,  // Very long string
    "state": "XX",  // Invalid state
    "zip": "00000-0000"  // Edge case zip
  },
  "payment_method": "cryptocurrency"  // Unexpected value
}
```

### 3. Stress Test Data
```python
# Generate 10,000 orders with varying characteristics
stress_test_data = [
    generate_order(
        complexity="random",
        items_count=random.randint(1, 100),
        total_amount=random.uniform(0.01, 100000)
    )
    for _ in range(10000)
]
```

### 4. Error Injection Data
```json
{
  "customer_id": "CUST-99999",  // Non-existent customer
  "order_total": -500.00,  // Invalid negative value
  "order_date": "not-a-date",  // Invalid format
  "items": "should-be-array",  // Type mismatch
  "shipping_address": null,  // Required field missing
  "payment_method": "<script>alert('xss')</script>"  // Security test
}
```

---

## Simulation Execution

**Command Examples:**

```bash
# Simulate a single workflow with happy path scenarios
/exec:simulate workflow="monthly-report-automation" scenarios="happy-path" iterations=10

# Run comprehensive testing on all scenarios
/exec:simulate workflow="client-onboarding" scenarios="all" iterations=50

# Stress test a specific workflow
/exec:simulate workflow="data-pipeline" scenarios="stress" iterations=100

# Test edge cases only
/exec:simulate workflow="approval-workflow" scenarios="edge-cases" iterations=25

# Simulate all workflows (quick validation)
/exec:simulate workflow="all" scenarios="happy-path" iterations=5
```

---

## Integration with Deployment

**Purpose:** Use simulation results to inform deployment decisions.

**Workflow:**

1. **Pre-Deployment Gate**
   - Require simulation with confidence score > 80
   - Block deployment if critical issues found
   - Warn on medium/high priority issues

2. **Automated Deployment**
   - Simulation passes → Deploy to staging
   - Staging validation → Deploy to production
   - Production monitoring → Rollback if needed

3. **Continuous Validation**
   - Run simulations on workflow changes
   - Regression testing on core workflows
   - Performance benchmarking over time

---

## Advanced Simulation Features

### 1. Human-in-the-Loop Simulation
- Simulate approval requests with mock responses
- Test approval timeout scenarios
- Validate escalation workflows
- Test approval delegation

### 2. Time-Based Simulation
- Fast-forward time for scheduled workflows
- Test cron expressions
- Validate time zone handling
- Test date/time calculations

### 3. Multi-Workflow Orchestration
- Simulate workflow dependencies
- Test event-driven triggers
- Validate data passing between workflows
- Test rollback scenarios

### 4. Security Testing
- SQL injection attempts
- XSS attack vectors
- Authentication bypass attempts
- Authorization boundary testing
- Rate limiting validation

---

## Best Practices

1. **Always simulate before deploying** - Catch issues early
2. **Run all scenario types** - Don't skip edge cases
3. **Monitor performance trends** - Track degradation over time
4. **Update test data regularly** - Keep scenarios realistic
5. **Document failure patterns** - Build institutional knowledge
6. **Automate simulation in CI/CD** - Make it part of the process
7. **Review simulation reports** - Don't just check pass/fail

---

## Troubleshooting

### Simulation Hangs
- **Cause:** Infinite loop in workflow logic
- **Solution:** Add timeout to simulation, review loop conditions

### High Memory Usage
- **Cause:** Large data sets or memory leaks
- **Solution:** Reduce iteration count, check for resource cleanup

### Inconsistent Results
- **Cause:** Race conditions or non-deterministic logic
- **Solution:** Add delays, use seeded random values

### Mock Service Failures
- **Cause:** Incorrect mock configuration
- **Solution:** Verify mock setup, check request/response formats

---

## Brookside BI Commitment

At Brookside BI, we believe that **robust testing is the foundation of reliable automation**. Our simulation framework ensures that every workflow we deploy meets the highest standards of quality, performance, and reliability.

**Our Promise:**
- No workflow ships without comprehensive simulation
- All edge cases are identified and handled
- Performance meets or exceeds expectations
- Error handling is bulletproof
- Documentation is complete and accurate

**Your Success, Automated. Your Insights, Amplified.**

---

**Next:** After successful simulation, proceed with deployment using `/exec:deploy`

**Related Commands:**
- `/exec:analyze` - Analyze business processes
- `/exec:generate` - Generate workflow definitions
- `/exec:deploy` - Deploy to production
- `/exec:monitor` - Monitor deployed workflows
