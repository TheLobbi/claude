---
name: exec:deploy
intent: Deploy generated LangGraph workflows to execution environment with validation, monitoring, and rollback capabilities
tags:
  - exec-automator
  - command
  - deploy
inputs: []
risk: medium
cost: medium
description: Deploy generated LangGraph workflows to execution environment with validation, monitoring, and rollback capabilities
model: sonnet
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - TodoWrite
  - mcp__exec-automator__deploy_agent
  - mcp__exec-automator__monitor_execution
  - mcp__exec-automator__simulate_workflow
  - mcp__obsidian__obsidian_append_content
  - mcp__obsidian__obsidian_get_file_contents
---

# Executive Workflow Deployment Command

Deploy LangGraph workflows to production, staging, or development environments with comprehensive validation, monitoring configuration, health checks, and rollback procedures.

## COMMAND OVERVIEW

The `/exec:deploy` command handles the complete deployment lifecycle for AI-powered executive director automation workflows:

1. **Pre-Deployment Validation** - Verify workflow integrity, dependencies, configurations
2. **Environment Setup** - Configure environment variables, API keys, checkpoints
3. **Dependency Installation** - Install LangGraph, LangChain, and workflow dependencies
4. **Workflow Deployment** - Deploy workflows to execution environment
5. **Monitoring Configuration** - Set up dashboards, alerts, logging
6. **Health Checks** - Verify workflows are operational
7. **Documentation Generation** - Create deployment reports, runbooks, rollback procedures

---

## INPUT PARAMETERS

Parse the user's command to extract:

### Required Arguments

- **workflow**: Workflow directory name or "all" for batch deployment
  - Example: `workflow-resp_002-member-communication`
  - Example: `all` (deploys all validated workflows)

### Optional Arguments

- **--environment**: Target deployment environment (default: `dev`)
  - `dev` - Development environment for testing
  - `staging` - Pre-production environment for validation
  - `production` - Live production environment

- **--dry-run**: Simulate deployment without executing (default: `false`)
  - Preview deployment steps
  - Validate configurations
  - Identify potential issues
  - No actual changes made

- **--validate-only**: Run validation checks only, skip deployment (default: `false`)
  - Check workflow syntax
  - Validate dependencies
  - Test configurations
  - Exit before deployment

- **--skip-tests**: Skip pre-deployment test execution (default: `false`)
  - WARNING: Not recommended for production
  - Use only when tests already passed recently

### Examples

```bash
# Deploy single workflow to development
/exec:deploy workflow-resp_002-member-communication

# Dry-run deployment to production
/exec:deploy all --environment=production --dry-run

# Validate all workflows without deploying
/exec:deploy all --validate-only

# Deploy to staging with tests
/exec:deploy workflow-resp_005-board-coordination --environment=staging
```

---

## EXECUTION PROTOCOL

You are the **Deployment Manager** for executive automation workflows. Your mission is to:

1. **Execute deployment systematically with specialized sub-agents**
2. **Validate every component before deployment**
3. **Configure robust monitoring and alerting**
4. **Provide detailed deployment status reports**
5. **Create rollback procedures for production safety**
6. **Document all deployment actions in Obsidian vault**

---

## DEPLOYMENT PHASES

### PHASE 1: PRE-DEPLOYMENT VALIDATION

#### Objective
Verify workflow integrity, validate configurations, check dependencies, run tests.

#### Sub-Agents Required (3-4 agents in parallel)
- **Workflow Validator Agent** (sonnet) - Validate workflow syntax and structure
- **Dependency Checker Agent** (haiku) - Verify all dependencies available
- **Configuration Validator Agent** (sonnet) - Check environment configs
- **Test Runner Agent** (sonnet) - Execute pre-deployment tests (unless --skip-tests)

#### Execution Steps

1. **Identify Workflows to Deploy**

   ```bash
   # If workflow="all", find all workflow directories
   Glob pattern="workflow-*.py" path="{generation_output_dir}"

   # If specific workflow, locate it
   Read file_path="{generation_output_dir}/{workflow}.py"
   ```

2. **Validate Workflow Files** (Parallel execution via Agent tool)

   For each workflow:
   - Verify Python syntax is valid
   - Check LangGraph StateGraph structure
   - Validate state schema definitions
   - Confirm all nodes and edges defined
   - Check for required imports
   - Verify error handling present

   ```python
   # Validation checks
   - StateGraph class instantiated correctly
   - All nodes registered with workflow.add_node()
   - All edges defined with workflow.add_edge()
   - Entry point set with workflow.set_entry_point()
   - Workflow compiled with workflow.compile()
   - Error handling in all nodes
   ```

3. **Validate Agent Configurations**

   For each agent config file:
   - Verify JSON syntax valid
   - Check required fields present:
     - agent_id
     - agent_name
     - model
     - system_prompt
     - tools (array)
     - monitoring (object)
   - Validate model names are supported
   - Check tool definitions exist
   - Verify human-in-the-loop checkpoints configured

4. **Check Dependencies**

   ```bash
   # Verify Python environment
   Bash command="python --version"

   # Check required packages installed
   Bash command="pip list | grep -E '(langgraph|langchain|anthropic|openai)'"

   # Validate package versions
   Bash command="pip show langgraph langchain langchain-anthropic langchain-openai"
   ```

   Required dependencies:
   - Python >= 3.10
   - langgraph >= 0.2.0
   - langchain >= 0.3.0
   - langchain-anthropic >= 0.2.0
   - langchain-openai >= 0.2.0
   - mcp >= 1.0.0

5. **Validate Environment Configuration**

   Check required environment variables:
   - `ANTHROPIC_API_KEY` - For Claude models
   - `OPENAI_API_KEY` - For GPT models (if used)
   - `WORKFLOW_ENV` - Target environment (dev/staging/production)
   - `CHECKPOINT_STORAGE_PATH` - Where to store workflow checkpoints
   - `LOG_LEVEL` - Logging verbosity (INFO, DEBUG, ERROR)
   - `MONITORING_ENDPOINT` - Where to send metrics

   ```bash
   # Check environment variables
   Bash command='echo "Checking environment...
   ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:+SET}
   OPENAI_API_KEY: ${OPENAI_API_KEY:+SET}
   WORKFLOW_ENV: ${WORKFLOW_ENV:-NOT_SET}
   CHECKPOINT_STORAGE_PATH: ${CHECKPOINT_STORAGE_PATH:-NOT_SET}
   MONITORING_ENDPOINT: ${MONITORING_ENDPOINT:-NOT_SET}"'
   ```

6. **Run Pre-Deployment Tests** (unless --skip-tests)

   For each workflow:
   - Load simulation results from Phase 5
   - Re-run critical test cases
   - Verify outputs match expected results
   - Check error handling works
   - Validate human-in-the-loop triggers

   ```
   mcp__exec-automator__simulate_workflow(
     workflow_file: "{workflow_path}",
     test_input: "{test_case_json}",
     dry_run: true,
     capture_logs: true,
     timeout_seconds: 60
   )
   ```

7. **Validation Summary**

   Generate validation report:

   ```json
   {
     "validation_timestamp": "2025-12-17T10:30:00Z",
     "environment": "{target_env}",
     "workflows_validated": [
       {
         "workflow_id": "workflow_resp_002",
         "workflow_file": "workflow-resp_002-member-communication.py",
         "validation_status": "passed",
         "checks_completed": 12,
         "checks_passed": 12,
         "checks_failed": 0,
         "warnings": [],
         "errors": []
       }
     ],
     "dependencies_validated": true,
     "environment_validated": true,
     "tests_executed": 15,
     "tests_passed": 15,
     "tests_failed": 0,
     "deployment_approved": true
   }
   ```

#### Success Criteria
- [ ] All workflow syntax validated
- [ ] All agent configurations validated
- [ ] All dependencies installed and correct versions
- [ ] All environment variables set
- [ ] All pre-deployment tests passed (or --skip-tests used)
- [ ] Validation report generated

#### Validation Failure Handling

If validation fails:
1. Document all errors and warnings
2. Generate detailed error report
3. Provide fix recommendations
4. STOP deployment process
5. Exit with validation report

**DO NOT PROCEED TO PHASE 2 IF VALIDATION FAILS**

---

### PHASE 2: ENVIRONMENT SETUP

#### Objective
Configure deployment environment, set up checkpoint storage, prepare infrastructure.

#### Sub-Agents Required (2-3 agents in parallel)
- **Environment Configurator Agent** (sonnet) - Set up environment
- **Storage Setup Agent** (haiku) - Configure checkpoint storage
- **API Key Manager Agent** (haiku) - Securely configure credentials

#### Execution Steps

1. **Create Deployment Directory Structure**

   ```bash
   # Create deployment directories
   Bash command="mkdir -p /opt/exec-automator/{environment}/workflows"
   Bash command="mkdir -p /opt/exec-automator/{environment}/configs"
   Bash command="mkdir -p /opt/exec-automator/{environment}/checkpoints"
   Bash command="mkdir -p /opt/exec-automator/{environment}/logs"
   Bash command="mkdir -p /opt/exec-automator/{environment}/monitoring"
   ```

   Directory structure:
   ```
   /opt/exec-automator/{environment}/
   ├── workflows/           # Deployed workflow files
   ├── configs/             # Agent configurations
   ├── checkpoints/         # LangGraph checkpoint storage
   ├── logs/                # Application logs
   └── monitoring/          # Monitoring configs and dashboards
   ```

2. **Configure Environment File**

   Create `.env` file for the environment:

   ```bash
   Write file_path="/opt/exec-automator/{environment}/.env" content="
   # Exec-Automator Environment Configuration
   # Environment: {environment}
   # Deployed: {timestamp}

   # Core Configuration
   WORKFLOW_ENV={environment}
   DEPLOYMENT_ID={deployment_id}
   ORGANIZATION_NAME={org_name}

   # API Keys (stored securely, not in plain text)
   ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
   OPENAI_API_KEY=${OPENAI_API_KEY}

   # Storage Paths
   CHECKPOINT_STORAGE_PATH=/opt/exec-automator/{environment}/checkpoints
   LOG_PATH=/opt/exec-automator/{environment}/logs
   CONFIG_PATH=/opt/exec-automator/{environment}/configs

   # Monitoring
   MONITORING_ENDPOINT={monitoring_endpoint}
   LOG_LEVEL={log_level}
   ENABLE_METRICS=true
   ENABLE_TRACING=true

   # Execution Settings
   MAX_CONCURRENT_WORKFLOWS=5
   WORKFLOW_TIMEOUT_SECONDS=300
   ENABLE_CHECKPOINTS=true
   CHECKPOINT_INTERVAL_SECONDS=30

   # Human-in-the-Loop Settings
   HITL_APPROVAL_TIMEOUT_SECONDS=3600
   HITL_NOTIFICATION_EMAIL={admin_email}
   HITL_NOTIFICATION_SLACK={slack_webhook}

   # Error Handling
   MAX_RETRIES=3
   RETRY_DELAY_SECONDS=5
   ENABLE_AUTO_RECOVERY=true
   ALERT_ON_FAILURE=true
   "
   ```

3. **Set Up Checkpoint Storage**

   Configure LangGraph checkpoint persistence:

   ```python
   # Create checkpoint configuration
   checkpoint_config = {
     "storage_type": "filesystem",  # or "postgres", "redis"
     "storage_path": "/opt/exec-automator/{environment}/checkpoints",
     "retention_days": 30,
     "compression_enabled": true,
     "encryption_enabled": environment == "production"
   }

   Write file_path="/opt/exec-automator/{environment}/configs/checkpoint-config.json"
   ```

4. **Configure API Key Management**

   Securely store API keys:

   ```bash
   # For production, use secrets management (AWS Secrets Manager, Vault, etc.)
   if [ "$environment" = "production" ]; then
     # Store in secrets manager
     echo "Using AWS Secrets Manager for production credentials"
     # aws secretsmanager create-secret --name exec-automator-api-keys --secret-string "{...}"
   else
     # For dev/staging, use environment variables
     echo "Using environment variables for dev/staging credentials"
   fi
   ```

5. **Set Up Logging Infrastructure**

   Configure structured logging:

   ```python
   logging_config = {
     "version": 1,
     "formatters": {
       "json": {
         "class": "pythonjsonlogger.jsonlogger.JsonFormatter",
         "format": "%(timestamp)s %(level)s %(name)s %(message)s"
       }
     },
     "handlers": {
       "file": {
         "class": "logging.handlers.RotatingFileHandler",
         "filename": "/opt/exec-automator/{environment}/logs/workflows.log",
         "maxBytes": 10485760,  # 10MB
         "backupCount": 5,
         "formatter": "json"
       },
       "console": {
         "class": "logging.StreamHandler",
         "formatter": "json"
       }
     },
     "root": {
       "level": "{log_level}",
       "handlers": ["file", "console"]
     }
   }

   Write file_path="/opt/exec-automator/{environment}/configs/logging-config.json"
   ```

#### Success Criteria
- [ ] Deployment directories created
- [ ] Environment configuration file created
- [ ] Checkpoint storage configured
- [ ] API keys securely stored
- [ ] Logging infrastructure configured

---

### PHASE 3: DEPENDENCY INSTALLATION

#### Objective
Install all required Python packages and dependencies for workflows.

#### Sub-Agents Required (1-2 agents)
- **Dependency Installer Agent** (haiku) - Install Python packages
- **Version Validator Agent** (haiku) - Verify correct versions installed

#### Execution Steps

1. **Create Virtual Environment** (if not exists)

   ```bash
   # Create isolated Python environment
   Bash command="python -m venv /opt/exec-automator/{environment}/venv"

   # Activate virtual environment
   Bash command="source /opt/exec-automator/{environment}/venv/bin/activate"
   ```

2. **Generate Requirements File**

   Extract dependencies from all workflows:

   ```python
   requirements = """
   # LangGraph Core
   langgraph>=0.2.0
   langchain>=0.3.0
   langchain-anthropic>=0.2.0
   langchain-openai>=0.2.0
   langchain-core>=0.3.0

   # MCP Server
   mcp>=1.0.0

   # Utilities
   python-dotenv>=1.0.0
   pydantic>=2.0.0
   typing-extensions>=4.0.0

   # Monitoring & Logging
   python-json-logger>=2.0.0
   prometheus-client>=0.19.0

   # Testing
   pytest>=7.0.0
   pytest-asyncio>=0.21.0

   # Workflow-Specific Dependencies
   {additional_dependencies}
   """

   Write file_path="/opt/exec-automator/{environment}/requirements.txt"
   ```

3. **Install Dependencies**

   ```bash
   # Upgrade pip
   Bash command="pip install --upgrade pip setuptools wheel"

   # Install requirements
   Bash command="pip install -r /opt/exec-automator/{environment}/requirements.txt"

   # Verify installation
   Bash command="pip list --format=json > /opt/exec-automator/{environment}/installed-packages.json"
   ```

4. **Validate Installed Versions**

   ```bash
   # Check critical packages
   Bash command="pip show langgraph langchain langchain-anthropic langchain-openai mcp"
   ```

5. **Install Workflow-Specific Tools**

   If workflows require external tools (e.g., Playwright, Selenium):

   ```bash
   # Example: Install Playwright browsers
   Bash command="playwright install chromium"
   ```

#### Success Criteria
- [ ] Virtual environment created
- [ ] All dependencies installed
- [ ] Versions validated
- [ ] Workflow-specific tools installed

---

### PHASE 4: WORKFLOW DEPLOYMENT

#### Objective
Deploy workflow files, agent configurations, and supporting resources to execution environment.

#### Sub-Agents Required (3-4 agents in parallel)
- **Workflow Deployer Agent** (sonnet) - Copy and configure workflows
- **Configuration Manager Agent** (haiku) - Deploy agent configs
- **Service Registrar Agent** (sonnet) - Register workflows as services
- **Deployment Validator Agent** (haiku) - Verify deployment success

#### Execution Steps

1. **Copy Workflow Files**

   ```bash
   # Copy all workflow Python files
   for workflow in {workflows_to_deploy}; do
     Bash command="cp {source_dir}/$workflow /opt/exec-automator/{environment}/workflows/"
   done
   ```

2. **Deploy Agent Configurations**

   ```bash
   # Copy agent config files
   for config in {agent_configs}; do
     Bash command="cp {source_dir}/$config /opt/exec-automator/{environment}/configs/"
   done
   ```

3. **Create Workflow Registry**

   Track all deployed workflows:

   ```json
   {
     "registry_version": "1.0.0",
     "deployment_id": "{deployment_id}",
     "deployment_timestamp": "2025-12-17T10:30:00Z",
     "environment": "{environment}",
     "organization": "{org_name}",
     "workflows": [
       {
         "workflow_id": "workflow_resp_002",
         "workflow_file": "workflow-resp_002-member-communication.py",
         "agent_config": "agent-resp_002-config.json",
         "deployment_status": "active",
         "auto_start": true,
         "schedule": "on_demand",
         "priority": "high",
         "endpoints": {
           "invoke": "/api/workflows/resp_002/invoke",
           "status": "/api/workflows/resp_002/status",
           "cancel": "/api/workflows/resp_002/cancel"
         },
         "monitoring": {
           "dashboard_url": "{monitoring_url}/workflow-resp_002",
           "metrics_enabled": true,
           "alerts_enabled": true
         }
       }
     ]
   }

   Write file_path="/opt/exec-automator/{environment}/configs/workflow-registry.json"
   ```

4. **Create Deployment Manifest**

   Document deployment details:

   ```json
   {
     "deployment_id": "{deployment_id}",
     "deployment_timestamp": "2025-12-17T10:30:00Z",
     "deployed_by": "Claude Orchestration System",
     "environment": "{environment}",
     "workflows_deployed": 5,
     "deployment_duration_seconds": 120,
     "validation_passed": true,
     "tests_passed": 15,
     "deployment_method": "automated",
     "rollback_available": true,
     "rollback_manifest": "/opt/exec-automator/{environment}/configs/rollback-{deployment_id}.json"
   }

   Write file_path="/opt/exec-automator/{environment}/configs/deployment-manifest-{timestamp}.json"
   ```

5. **MCP Deployment** (if not --dry-run)

   Deploy workflows via MCP server:

   ```
   for workflow in {workflows_to_deploy}:
     mcp__exec-automator__deploy_agent(
       workflow_file: "/opt/exec-automator/{environment}/workflows/{workflow}.py",
       agent_config: "/opt/exec-automator/{environment}/configs/agent-{workflow}-config.json",
       deployment_mode: "{environment}",
       auto_start: true,
       monitoring_enabled: true
     )
   ```

6. **Verify Deployment**

   Check that workflows are accessible:

   ```bash
   # List deployed workflows
   Bash command="ls -la /opt/exec-automator/{environment}/workflows/"

   # List deployed configs
   Bash command="ls -la /opt/exec-automator/{environment}/configs/"

   # Verify file permissions
   Bash command="chmod +x /opt/exec-automator/{environment}/workflows/*.py"
   ```

#### Success Criteria
- [ ] All workflow files deployed
- [ ] All configurations deployed
- [ ] Workflow registry created
- [ ] Deployment manifest generated
- [ ] Workflows verified accessible

---

### PHASE 5: MONITORING CONFIGURATION

#### Objective
Set up monitoring dashboards, configure alerts, enable logging, create health checks.

#### Sub-Agents Required (3-4 agents in parallel)
- **Monitoring Setup Agent** (sonnet) - Configure dashboards and metrics
- **Alert Configuration Agent** (sonnet) - Set up alert rules
- **Health Check Agent** (haiku) - Create health check endpoints
- **Dashboard Designer Agent** (haiku) - Design monitoring visualizations

#### Execution Steps

1. **Configure Workflow Metrics**

   Track key metrics for each workflow:

   ```python
   metrics_config = {
     "workflow_id": "workflow_resp_002",
     "metrics": [
       {
         "name": "execution_count",
         "type": "counter",
         "description": "Total number of workflow executions",
         "labels": ["environment", "status"]
       },
       {
         "name": "execution_duration_seconds",
         "type": "histogram",
         "description": "Workflow execution time in seconds",
         "buckets": [1, 5, 10, 30, 60, 120, 300]
       },
       {
         "name": "success_rate",
         "type": "gauge",
         "description": "Percentage of successful executions",
         "unit": "percent"
       },
       {
         "name": "error_count",
         "type": "counter",
         "description": "Total number of errors",
         "labels": ["error_type", "node"]
       },
       {
         "name": "tokens_used",
         "type": "counter",
         "description": "Total LLM tokens consumed",
         "labels": ["model", "node"]
       },
       {
         "name": "cost_per_execution",
         "type": "gauge",
         "description": "Estimated cost per execution in USD",
         "unit": "dollars"
       }
     ]
   }

   Write file_path="/opt/exec-automator/{environment}/monitoring/metrics-config.json"
   ```

2. **Set Up Alert Rules**

   Configure alerts for critical conditions:

   ```yaml
   alert_rules:
     - alert_name: "High Error Rate"
       condition: "error_rate > 0.05"  # 5% error rate
       severity: "critical"
       notification_channels:
         - email: "{admin_email}"
         - slack: "{slack_webhook}"
       message: "Workflow {workflow_id} error rate exceeded 5% threshold"

     - alert_name: "Slow Execution"
       condition: "avg_duration_seconds > 60"
       severity: "warning"
       notification_channels:
         - email: "{admin_email}"
       message: "Workflow {workflow_id} average execution time exceeded 60 seconds"

     - alert_name: "Workflow Failure"
       condition: "execution_failed"
       severity: "critical"
       notification_channels:
         - email: "{admin_email}"
         - slack: "{slack_webhook}"
         - pagerduty: "{pagerduty_key}"
       message: "Workflow {workflow_id} execution failed: {error_message}"

     - alert_name: "High API Cost"
       condition: "daily_cost > 100"
       severity: "warning"
       notification_channels:
         - email: "{finance_email}"
       message: "Daily API costs exceeded $100 for workflow {workflow_id}"

   Write file_path="/opt/exec-automator/{environment}/monitoring/alert-rules.yaml"
   ```

3. **Create Monitoring Dashboard**

   Design dashboard for workflow monitoring:

   ```json
   {
     "dashboard_name": "Exec-Automator Workflows - {Environment}",
     "refresh_interval_seconds": 30,
     "panels": [
       {
         "panel_id": "overview",
         "title": "Workflow Overview",
         "type": "stat_grid",
         "metrics": [
           "total_workflows_deployed",
           "total_executions_today",
           "overall_success_rate",
           "total_cost_today"
         ]
       },
       {
         "panel_id": "execution_timeline",
         "title": "Execution Timeline (24h)",
         "type": "time_series",
         "metrics": ["execution_count"],
         "group_by": "workflow_id"
       },
       {
         "panel_id": "error_rate",
         "title": "Error Rate by Workflow",
         "type": "bar_chart",
         "metric": "error_rate",
         "group_by": "workflow_id"
       },
       {
         "panel_id": "performance",
         "title": "Execution Duration (p50, p95, p99)",
         "type": "time_series",
         "metrics": ["execution_duration_p50", "execution_duration_p95", "execution_duration_p99"]
       },
       {
         "panel_id": "cost_tracking",
         "title": "API Cost Tracking",
         "type": "area_chart",
         "metrics": ["cumulative_cost"],
         "group_by": "workflow_id"
       }
     ]
   }

   Write file_path="/opt/exec-automator/{environment}/monitoring/dashboard-config.json"
   ```

4. **Configure MCP Monitoring** (if not --dry-run)

   ```
   for workflow in {workflows_deployed}:
     mcp__exec-automator__monitor_execution(
       agent_id: "{workflow.agent_id}",
       metrics: [
         "execution_count",
         "success_rate",
         "avg_duration",
         "error_rate",
         "tokens_used",
         "cost_per_execution"
       ],
       alert_thresholds: {
         "error_rate": 0.05,
         "avg_duration_seconds": 60,
         "daily_cost": 100
       },
       notification_channels: {
         "email": "{admin_email}",
         "slack": "{slack_webhook}"
       }
     )
   ```

5. **Create Health Check Endpoint**

   ```python
   # Health check script
   health_check_script = """
   #!/usr/bin/env python3

   import json
   import sys
   from datetime import datetime

   def check_workflow_health(workflow_id):
       '''Check if workflow is healthy and operational'''
       try:
           # Check workflow file exists
           # Check configuration valid
           # Check dependencies available
           # Check API keys valid
           # Check recent execution status

           return {
               "workflow_id": workflow_id,
               "status": "healthy",
               "last_check": datetime.utcnow().isoformat(),
               "checks_passed": 5,
               "checks_failed": 0
           }
       except Exception as e:
           return {
               "workflow_id": workflow_id,
               "status": "unhealthy",
               "error": str(e),
               "last_check": datetime.utcnow().isoformat()
           }

   if __name__ == "__main__":
       workflows = {workflows_deployed}
       health_status = [check_workflow_health(w) for w in workflows]
       print(json.dumps(health_status, indent=2))
   """

   Write file_path="/opt/exec-automator/{environment}/monitoring/health-check.py"
   Bash command="chmod +x /opt/exec-automator/{environment}/monitoring/health-check.py"
   ```

#### Success Criteria
- [ ] Metrics configured for all workflows
- [ ] Alert rules created
- [ ] Monitoring dashboard designed
- [ ] MCP monitoring configured
- [ ] Health check endpoint created

---

### PHASE 6: HEALTH CHECKS & VERIFICATION

#### Objective
Run post-deployment health checks to verify workflows are operational.

#### Sub-Agents Required (2-3 agents in parallel)
- **Health Checker Agent** (haiku) - Execute health checks
- **Smoke Test Agent** (sonnet) - Run smoke tests on deployed workflows
- **Status Verifier Agent** (haiku) - Verify workflow status

#### Execution Steps

1. **Run Health Checks**

   ```bash
   # Execute health check script
   Bash command="/opt/exec-automator/{environment}/monitoring/health-check.py"
   ```

2. **Run Smoke Tests**

   Execute minimal test case for each workflow:

   ```
   for workflow in {workflows_deployed}:
     mcp__exec-automator__simulate_workflow(
       workflow_file: "/opt/exec-automator/{environment}/workflows/{workflow}.py",
       test_input: "{minimal_test_case}",
       dry_run: false,
       timeout_seconds: 30
     )
   ```

3. **Verify Workflow Status**

   Check that all workflows are in "active" state:

   ```bash
   # Check workflow registry
   Read file_path="/opt/exec-automator/{environment}/configs/workflow-registry.json"

   # Verify each workflow status is "active"
   ```

4. **Test Monitoring Integration**

   Verify metrics are being collected:

   ```bash
   # Check that metrics are being written
   Bash command="ls -la /opt/exec-automator/{environment}/monitoring/metrics/"
   ```

5. **Test Alert System**

   Send test alert to verify notification channels:

   ```bash
   # Send test alert
   Bash command="curl -X POST {monitoring_endpoint}/test-alert -d '{...}'"
   ```

6. **Generate Health Report**

   ```json
   {
     "health_check_timestamp": "2025-12-17T10:35:00Z",
     "environment": "{environment}",
     "overall_status": "healthy",
     "workflows_checked": 5,
     "workflows_healthy": 5,
     "workflows_unhealthy": 0,
     "smoke_tests_passed": 5,
     "smoke_tests_failed": 0,
     "monitoring_operational": true,
     "alerts_functional": true
   }

   Write file_path="/opt/exec-automator/{environment}/monitoring/health-report-{timestamp}.json"
   ```

#### Success Criteria
- [ ] All health checks passed
- [ ] All smoke tests passed
- [ ] All workflows showing "active" status
- [ ] Monitoring integration verified
- [ ] Alert system tested
- [ ] Health report generated

---

### PHASE 7: DOCUMENTATION & ROLLBACK PREPARATION

#### Objective
Generate deployment documentation, create runbooks, prepare rollback procedures.

#### Sub-Agents Required (2-3 agents in parallel)
- **Documentation Generator Agent** (haiku) - Create deployment docs
- **Runbook Writer Agent** (sonnet) - Write operator runbooks
- **Rollback Planner Agent** (sonnet) - Create rollback procedures

#### Execution Steps

1. **Generate Deployment Report**

   ```markdown
   # Workflow Deployment Report

   **Deployment ID:** {deployment_id}
   **Environment:** {environment}
   **Deployment Date:** {timestamp}
   **Deployed By:** Claude Orchestration System
   **Organization:** {org_name}

   ---

   ## Deployment Summary

   - **Workflows Deployed:** {count}
   - **Deployment Duration:** {duration} seconds
   - **Validation Status:** ✓ Passed
   - **Tests Passed:** {test_count}
   - **Health Checks:** ✓ All Passed
   - **Monitoring:** ✓ Configured
   - **Alerts:** ✓ Active

   ---

   ## Deployed Workflows

   1. **workflow-resp_002-member-communication**
      - Agent: Member Communication Assistant
      - Status: Active
      - Endpoint: /api/workflows/resp_002/invoke
      - Dashboard: {url}

   2. **workflow-resp_005-board-coordination**
      - Agent: Board Coordination Assistant
      - Status: Active
      - Endpoint: /api/workflows/resp_005/invoke
      - Dashboard: {url}

   ---

   ## Environment Configuration

   - **API Keys:** Configured
   - **Checkpoint Storage:** /opt/exec-automator/{environment}/checkpoints
   - **Logging:** Enabled (Level: INFO)
   - **Monitoring Endpoint:** {url}
   - **Alert Channels:** Email, Slack

   ---

   ## Monitoring & Alerts

   **Dashboard URL:** {monitoring_url}

   **Active Alerts:**
   - High Error Rate (>5%)
   - Slow Execution (>60s avg)
   - Workflow Failure
   - High API Cost (>$100/day)

   **Metrics Tracked:**
   - Execution count
   - Success rate
   - Execution duration (p50, p95, p99)
   - Error count by type
   - Token usage
   - Cost per execution

   ---

   ## Health Check Results

   **Overall Status:** ✓ Healthy

   | Workflow | Status | Last Check |
   |----------|--------|------------|
   | workflow_resp_002 | Healthy | {timestamp} |
   | workflow_resp_005 | Healthy | {timestamp} |

   ---

   ## Access & Endpoints

   **Workflow Invocation:**
   ```bash
   curl -X POST {base_url}/api/workflows/{workflow_id}/invoke \
     -H "Authorization: Bearer {token}" \
     -d '{"input": "..."}'
   ```

   **Status Check:**
   ```bash
   curl {base_url}/api/workflows/{workflow_id}/status
   ```

   **Cancel Execution:**
   ```bash
   curl -X POST {base_url}/api/workflows/{workflow_id}/cancel/{execution_id}
   ```

   ---

   ## Rollback Information

   **Rollback Available:** Yes
   **Rollback Manifest:** /opt/exec-automator/{environment}/configs/rollback-{deployment_id}.json
   **Rollback Command:** `/exec:rollback {deployment_id}`

   ---

   ## Next Steps

   1. Review monitoring dashboard for initial metrics
   2. Test workflows with real-world inputs
   3. Verify human-in-the-loop checkpoints functioning
   4. Monitor error rates and performance
   5. Adjust alert thresholds if needed

   ---

   **Generated by:** Claude Orchestration System
   **Report Version:** 1.0.0
   ```

   Write file_path="/opt/exec-automator/{environment}/DEPLOYMENT-REPORT-{timestamp}.md"

2. **Create Operator Runbook**

   ```markdown
   # Operator Runbook: {Organization} Workflows

   **Environment:** {environment}
   **Last Updated:** {timestamp}

   ---

   ## Quick Reference

   | Action | Command |
   |--------|---------|
   | Check workflow status | `python /opt/exec-automator/{environment}/monitoring/health-check.py` |
   | View logs | `tail -f /opt/exec-automator/{environment}/logs/workflows.log` |
   | Restart workflow | `/exec:restart {workflow_id}` |
   | View metrics | Open dashboard at {monitoring_url} |

   ---

   ## Common Operations

   ### Starting a Workflow

   ```bash
   curl -X POST {base_url}/api/workflows/{workflow_id}/invoke \
     -H "Authorization: Bearer {token}" \
     -d '{"input": "..."}'
   ```

   ### Checking Workflow Status

   ```bash
   curl {base_url}/api/workflows/{workflow_id}/status
   ```

   ### Canceling a Workflow Execution

   ```bash
   curl -X POST {base_url}/api/workflows/{workflow_id}/cancel/{execution_id}
   ```

   ### Viewing Logs

   ```bash
   # Real-time logs
   tail -f /opt/exec-automator/{environment}/logs/workflows.log

   # Search for errors
   grep "ERROR" /opt/exec-automator/{environment}/logs/workflows.log

   # Filter by workflow
   grep "workflow_resp_002" /opt/exec-automator/{environment}/logs/workflows.log
   ```

   ---

   ## Troubleshooting

   ### Workflow Fails to Start

   **Symptoms:** Workflow invocation returns error

   **Diagnostic Steps:**
   1. Check workflow file exists: `ls /opt/exec-automator/{environment}/workflows/{workflow}.py`
   2. Verify configuration valid: `cat /opt/exec-automator/{environment}/configs/{config}.json`
   3. Check API keys set: `echo $ANTHROPIC_API_KEY`
   4. Review logs: `grep "ERROR" /opt/exec-automator/{environment}/logs/workflows.log`

   **Resolution:**
   - If workflow file missing: Redeploy workflow
   - If config invalid: Update configuration and reload
   - If API key missing: Set environment variable
   - If dependencies missing: Reinstall requirements

   ### High Error Rate Alert

   **Symptoms:** Alert triggered for error rate >5%

   **Diagnostic Steps:**
   1. Check error logs: `grep "ERROR" /opt/exec-automator/{environment}/logs/workflows.log`
   2. Identify common error type
   3. Check recent changes to workflow
   4. Verify external dependencies (APIs, databases) operational

   **Resolution:**
   - If LLM errors: Check API key validity, rate limits
   - If data errors: Validate input format
   - If integration errors: Check external service status
   - If persistent: Rollback to previous deployment

   ### Slow Performance

   **Symptoms:** Average execution time >60 seconds

   **Diagnostic Steps:**
   1. Check monitoring dashboard for slow nodes
   2. Review LLM token usage
   3. Check for rate limiting
   4. Verify checkpoint storage performance

   **Resolution:**
   - Optimize prompts to reduce token usage
   - Increase concurrent execution limit
   - Add caching for repeated operations
   - Consider faster model for non-critical nodes

   ---

   ## Escalation Procedures

   ### Critical Issues (Workflow Down)

   1. **Immediate Actions:**
      - Check health status
      - Review error logs
      - Attempt restart

   2. **If Unresolved (15 min):**
      - Notify: {admin_email}
      - Execute rollback: `/exec:rollback {deployment_id}`

   3. **If Still Unresolved (30 min):**
      - Escalate to: {escalation_contact}
      - Disable workflow
      - Switch to manual process

   ### Non-Critical Issues (Degraded Performance)

   1. **Monitor for 1 hour**
   2. **If persists, investigate root cause**
   3. **Schedule maintenance window for fixes**
   4. **Notify stakeholders of degraded performance**

   ---

   ## Maintenance

   ### Weekly Tasks
   - Review monitoring dashboard
   - Check error logs
   - Verify alert system functional
   - Review cost metrics

   ### Monthly Tasks
   - Update dependencies
   - Review and optimize workflows
   - Analyze performance trends
   - Update documentation

   ---

   **Contact Information:**
   - **Primary:** {admin_email}
   - **Escalation:** {escalation_contact}
   - **Slack:** {slack_channel}
   ```

   Write file_path="/opt/exec-automator/{environment}/RUNBOOK.md"

3. **Create Rollback Manifest**

   ```json
   {
     "rollback_manifest_version": "1.0.0",
     "deployment_id": "{deployment_id}",
     "deployment_timestamp": "2025-12-17T10:30:00Z",
     "rollback_instructions": {
       "method": "restore_previous_deployment",
       "previous_deployment_id": "{previous_deployment_id}",
       "previous_deployment_path": "/opt/exec-automator/{environment}/backups/{previous_deployment_id}",
       "estimated_rollback_duration_seconds": 60
     },
     "workflows_to_rollback": [
       {
         "workflow_id": "workflow_resp_002",
         "current_version": "/opt/exec-automator/{environment}/workflows/workflow-resp_002-member-communication.py",
         "previous_version": "/opt/exec-automator/{environment}/backups/{previous_deployment_id}/workflow-resp_002-member-communication.py",
         "rollback_action": "restore_file"
       }
     ],
     "configurations_to_rollback": [
       {
         "config_file": "workflow-registry.json",
         "current_version": "/opt/exec-automator/{environment}/configs/workflow-registry.json",
         "previous_version": "/opt/exec-automator/{environment}/backups/{previous_deployment_id}/workflow-registry.json",
         "rollback_action": "restore_file"
       }
     ],
     "rollback_verification": {
       "health_checks_required": true,
       "smoke_tests_required": true,
       "monitoring_verification_required": true
     }
   }

   Write file_path="/opt/exec-automator/{environment}/configs/rollback-{deployment_id}.json"
   ```

4. **Archive Previous Deployment** (for rollback)

   ```bash
   # Create backup of current deployment before this one
   Bash command="mkdir -p /opt/exec-automator/{environment}/backups/{previous_deployment_id}"
   Bash command="cp -r /opt/exec-automator/{environment}/workflows /opt/exec-automator/{environment}/backups/{previous_deployment_id}/"
   Bash command="cp -r /opt/exec-automator/{environment}/configs /opt/exec-automator/{environment}/backups/{previous_deployment_id}/"
   ```

#### Success Criteria
- [ ] Deployment report generated
- [ ] Operator runbook created
- [ ] Rollback manifest created
- [ ] Previous deployment archived
- [ ] All documentation saved

---

## FINAL OUTPUT GENERATION

After completing all phases, generate the **Deployment Status Report**.

### Deployment Status Report Structure

```markdown
# Workflow Deployment Status Report

**Deployment ID:** {deployment_id}
**Environment:** {environment}
**Organization:** {org_name}
**Deployment Date:** {timestamp}
**Status:** {SUCCESS|FAILED|PARTIAL}

---

## Deployment Summary

{1-2 paragraph summary of deployment}

**Key Metrics:**
- Workflows deployed: {count}
- Deployment duration: {duration} seconds
- Validation status: {passed|failed}
- Tests passed: {count}/{total}
- Health checks: {passed|failed}
- Smoke tests: {passed}/{total}

---

## Deployment Details

### Workflows Deployed

| Workflow ID | Workflow Name | Status | Endpoint |
|-------------|---------------|--------|----------|
| workflow_resp_002 | Member Communication | Active | {url} |
| workflow_resp_005 | Board Coordination | Active | {url} |

### Configuration

- **Environment:** {environment}
- **Deployment Path:** /opt/exec-automator/{environment}
- **Checkpoint Storage:** /opt/exec-automator/{environment}/checkpoints
- **Log Level:** INFO
- **Monitoring:** Enabled

---

## Monitoring & Access

**Dashboard URL:** {monitoring_url}

**Endpoint Documentation:**
- Invoke workflow: `POST {base_url}/api/workflows/{id}/invoke`
- Check status: `GET {base_url}/api/workflows/{id}/status`
- Cancel execution: `POST {base_url}/api/workflows/{id}/cancel/{exec_id}`

**Alert Channels:**
- Email: {admin_email}
- Slack: {slack_webhook}

---

## Health Check Results

**Overall Status:** {healthy|unhealthy}

| Check | Status | Details |
|-------|--------|---------|
| Workflow Files | ✓ Pass | All files deployed |
| Configurations | ✓ Pass | All configs valid |
| Dependencies | ✓ Pass | All packages installed |
| API Keys | ✓ Pass | All keys configured |
| Smoke Tests | ✓ Pass | 5/5 tests passed |
| Monitoring | ✓ Pass | Metrics collecting |
| Alerts | ✓ Pass | Notifications working |

---

## Rollback Information

**Rollback Available:** Yes
**Rollback Command:** `/exec:rollback {deployment_id}`
**Rollback Manifest:** /opt/exec-automator/{environment}/configs/rollback-{deployment_id}.json
**Previous Deployment Backup:** /opt/exec-automator/{environment}/backups/{previous_deployment_id}

---

## Documentation

- **Deployment Report:** /opt/exec-automator/{environment}/DEPLOYMENT-REPORT-{timestamp}.md
- **Operator Runbook:** /opt/exec-automator/{environment}/RUNBOOK.md
- **Health Check Script:** /opt/exec-automator/{environment}/monitoring/health-check.py

---

## Next Steps

1. ✓ Deployment completed successfully
2. Monitor dashboard for initial metrics: {monitoring_url}
3. Test workflows with real-world inputs
4. Verify human-in-the-loop checkpoints
5. Adjust alert thresholds based on baseline metrics
6. Schedule follow-up review in 7 days

---

**Deployment completed successfully at {timestamp}**

Generated by Claude Orchestration System | Brookside BI
```

### Save Deployment Report

```bash
Write file_path="{output_dir}/DEPLOYMENT-STATUS-REPORT.md" content="{report_markdown}"
```

### Archive to Obsidian

```
mcp__obsidian__obsidian_append_content(
  filepath: "Projects/Exec-Automator/Deployments/{org-name}-{environment}-{date}.md",
  content: "{deployment_report_markdown}"
)
```

---

## DRY-RUN MODE

If `--dry-run` flag is set:

1. **Execute all validation phases**
2. **Simulate deployment steps** (don't actually deploy)
3. **Generate deployment plan** instead of deployment report
4. **Show what WOULD happen** without making changes

### Dry-Run Output

```markdown
# Deployment Dry-Run Report

**Environment:** {environment}
**Dry-Run Date:** {timestamp}
**Workflows to Deploy:** {count}

---

## Deployment Plan

The following actions WOULD be performed:

### Validation Phase
✓ Validate 5 workflow files
✓ Validate 5 agent configurations
✓ Check dependencies installed
✓ Verify environment variables set
✓ Run 15 pre-deployment tests

### Environment Setup Phase
→ Create deployment directories at /opt/exec-automator/{environment}/
→ Create .env configuration file
→ Configure checkpoint storage
→ Set up logging infrastructure

### Dependency Installation Phase
→ Create virtual environment at /opt/exec-automator/{environment}/venv
→ Install 12 Python packages
→ Verify package versions

### Workflow Deployment Phase
→ Copy 5 workflow files to /opt/exec-automator/{environment}/workflows/
→ Copy 5 config files to /opt/exec-automator/{environment}/configs/
→ Create workflow registry
→ Deploy via MCP server

### Monitoring Configuration Phase
→ Configure metrics for 5 workflows
→ Set up 4 alert rules
→ Create monitoring dashboard
→ Enable MCP monitoring

### Health Check Phase
→ Run health checks on 5 workflows
→ Execute smoke tests
→ Verify monitoring integration

### Documentation Phase
→ Generate deployment report
→ Create operator runbook
→ Prepare rollback manifest

---

## Estimated Impact

- **Deployment Duration:** ~2 minutes
- **Disk Space Required:** ~50 MB
- **API Calls:** 0 (dry-run mode)
- **Risk Level:** Low (all validations passed)

---

**This was a DRY-RUN. No actual changes were made.**

To deploy for real, run: `/exec:deploy {workflow} --environment={environment}`
```

---

## VALIDATE-ONLY MODE

If `--validate-only` flag is set:

1. **Execute validation phase only**
2. **Generate validation report**
3. **Exit before deployment**

### Validate-Only Output

```markdown
# Validation Report

**Validation Date:** {timestamp}
**Workflows Validated:** {count}
**Environment:** {environment}

---

## Validation Results

### Workflow Syntax Validation
✓ All 5 workflow files have valid Python syntax
✓ All LangGraph structures correct
✓ All state schemas defined
✓ All nodes and edges registered

### Configuration Validation
✓ All 5 agent config files have valid JSON
✓ All required fields present
✓ All model names supported
✓ All tool definitions exist

### Dependency Check
✓ Python 3.10 installed
✓ langgraph 0.2.0 installed
✓ langchain 0.3.0 installed
✓ All dependencies satisfied

### Environment Validation
✓ ANTHROPIC_API_KEY set
✓ OPENAI_API_KEY set
✓ All required environment variables present

### Test Execution
✓ 15/15 pre-deployment tests passed
✓ All smoke tests passed
✓ No critical issues found

---

## Validation Summary

**Overall Status:** ✓ PASSED

All validations completed successfully. Workflows are ready for deployment.

**Warnings:** 0
**Errors:** 0
**Recommendations:** Consider enabling checkpoint encryption for production

---

To deploy, run: `/exec:deploy {workflow} --environment={environment}`
```

---

## ERROR HANDLING

### Common Errors and Recovery

1. **Validation Failed**
   - Error: Workflow syntax invalid, config missing fields, dependencies not installed
   - Recovery: Fix errors, re-run validation
   - Do NOT proceed to deployment

2. **Deployment Failed**
   - Error: Cannot copy files, MCP server unavailable, permissions error
   - Recovery: Check permissions, restart MCP server, retry deployment
   - Rollback if partial deployment

3. **Health Check Failed**
   - Error: Workflow not responding, smoke tests failing
   - Recovery: Check logs, restart workflow, investigate errors
   - Rollback if critical

4. **Monitoring Setup Failed**
   - Error: Cannot configure metrics, dashboard unavailable
   - Recovery: Check monitoring endpoint, retry configuration
   - Deployment can continue (monitoring non-critical)

### Error Logging

Log all errors to:
- `{deployment_dir}/deployment-errors-{timestamp}.json`
- Obsidian: `Projects/Exec-Automator/Errors/{org-name}-deployment-errors.md`

---

## PROGRESS TRACKING

Use TodoWrite to track deployment progress:

```
TodoWrite todos=[
  {
    "content": "Complete Phase 1: Pre-Deployment Validation",
    "activeForm": "Completing Phase 1: Validating workflows",
    "status": "in_progress"
  },
  {
    "content": "Complete Phase 2: Environment Setup",
    "activeForm": "Completing Phase 2: Setting up environment",
    "status": "pending"
  },
  {
    "content": "Complete Phase 3: Dependency Installation",
    "activeForm": "Completing Phase 3: Installing dependencies",
    "status": "pending"
  },
  {
    "content": "Complete Phase 4: Workflow Deployment",
    "activeForm": "Completing Phase 4: Deploying workflows",
    "status": "pending"
  },
  {
    "content": "Complete Phase 5: Monitoring Configuration",
    "activeForm": "Completing Phase 5: Configuring monitoring",
    "status": "pending"
  },
  {
    "content": "Complete Phase 6: Health Checks & Verification",
    "activeForm": "Completing Phase 6: Running health checks",
    "status": "pending"
  },
  {
    "content": "Complete Phase 7: Documentation & Rollback Preparation",
    "activeForm": "Completing Phase 7: Generating documentation",
    "status": "pending"
  },
  {
    "content": "Generate Deployment Status Report",
    "activeForm": "Generating deployment status report",
    "status": "pending"
  }
]
```

Update todo status as each phase completes.

---

## SUMMARY OF EXECUTION

When the user runs this command:

1. **Parse arguments** - Extract workflow, environment, flags
2. **Execute deployment phases** in order:
   - Phase 1: Pre-Deployment Validation
   - Phase 2: Environment Setup
   - Phase 3: Dependency Installation
   - Phase 4: Workflow Deployment
   - Phase 5: Monitoring Configuration
   - Phase 6: Health Checks & Verification
   - Phase 7: Documentation & Rollback Preparation
3. **Use Agent tool** to spawn 3-4 sub-agents per phase
4. **Call MCP tools** for deployment operations
5. **Track progress** with TodoWrite
6. **Generate comprehensive deployment report**
7. **Archive everything to Obsidian**
8. **Present deployment status to user**

**Remember:**
- Use 3-4 sub-agents per phase for parallel execution
- STOP deployment if validation fails
- Generate rollback manifest for production safety
- Document everything in Obsidian vault
- Provide clear deployment status and next steps

**Model Assignments:**
- Deployment orchestration: sonnet
- Documentation, validation: haiku
- Complex configuration: sonnet

Begin deployment now.
