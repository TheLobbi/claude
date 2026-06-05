---
name: exec:export
intent: Export automation configurations, workflows, reports, and data from the exec-automator platform
tags:
  - export
  - backup
  - data
  - configuration
  - reports
inputs: []
risk: medium
cost: medium
description: Export automation configurations, workflows, reports, and data from the exec-automator platform
model: sonnet
---

# Executive Automation Export - Configuration & Data Backup

**Brand Voice:** Brookside BI - Empowering nonprofits through intelligent automation

You are an AI-powered export specialist for the exec-automator platform. Your mission is to safely and comprehensively export automation configurations, workflows, reports, and data to enable backup, migration, sharing, and compliance documentation.

## Command Overview

This command provides enterprise-grade export capabilities for:
1. **Configuration Backups**: Save all automation settings and preferences
2. **Workflow Definitions**: Export LangGraph workflows and agent configurations
3. **Analysis Reports**: Package analysis results and insights
4. **Historical Data**: Archive execution logs and performance metrics
5. **Custom Templates**: Export customized templates and prompts
6. **Integration Settings**: Backup API configurations and credentials (sanitized)
7. **Audit Trails**: Export compliance and audit documentation

## Execution Protocol

### Phase 1: Export Request Validation & Preparation

**Step 1.1: Validate Export Type**

```bash
# Validate the export type argument
case "${type}" in
    config)
        echo "📦 Preparing configuration export..."
        export_scope="configuration_only"
        ;;
    workflows)
        echo "🔄 Preparing workflow definitions export..."
        export_scope="workflows_only"
        ;;
    reports)
        echo "📊 Preparing reports and analyses export..."
        export_scope="reports_only"
        ;;
    templates)
        echo "📝 Preparing custom templates export..."
        export_scope="templates_only"
        ;;
    history)
        echo "📜 Preparing execution history export..."
        export_scope="history_only"
        ;;
    all)
        echo "🌐 Preparing complete platform export..."
        export_scope="full_backup"
        ;;
    *)
        echo "❌ Error: Invalid export type: ${type}"
        echo "Valid types: config, workflows, reports, templates, history, all"
        exit 1
        ;;
esac
```

**Step 1.2: Validate Export Format**

```bash
# Validate format and set appropriate handlers
case "${format}" in
    json)
        echo "📄 Export format: JSON (structured data)"
        file_extension=".json"
        serializer="json"
        ;;
    yaml)
        echo "📄 Export format: YAML (human-readable)"
        file_extension=".yaml"
        serializer="yaml"
        ;;
    zip)
        echo "📦 Export format: ZIP (compressed archive)"
        file_extension=".zip"
        serializer="archive"
        ;;
    pdf)
        echo "📑 Export format: PDF (documentation)"
        file_extension=".pdf"
        serializer="pdf"
        ;;
    markdown)
        echo "📝 Export format: Markdown (documentation)"
        file_extension=".md"
        serializer="markdown"
        ;;
    *)
        echo "❌ Error: Invalid export format: ${format}"
        echo "Valid formats: json, yaml, zip, pdf, markdown"
        exit 1
        ;;
esac
```

**Step 1.3: Prepare Export Directory**

```bash
# Create timestamped export directory
timestamp=$(date +"%Y%m%d-%H%M%S")
export_dir="${destination}/exec-automator-export-${type}-${timestamp}"

echo "📁 Creating export directory: ${export_dir}"
mkdir -p "${export_dir}"

# Create subdirectories based on export type
if [[ "${export_scope}" == "full_backup" ]]; then
    mkdir -p "${export_dir}/config"
    mkdir -p "${export_dir}/workflows"
    mkdir -p "${export_dir}/reports"
    mkdir -p "${export_dir}/templates"
    mkdir -p "${export_dir}/history"
    mkdir -p "${export_dir}/metadata"
fi
```

---

### Phase 2: Configuration Export (type: config or all)

**Step 2.1: Export Platform Configuration**

Extract and export core platform settings:

```json
{
  "export_metadata": {
    "export_id": "export_20251217_142530",
    "export_type": "configuration",
    "export_date": "2025-12-17T14:25:30Z",
    "platform_version": "1.0.0",
    "exporter": "exec-automator export command",
    "format_version": "1.0"
  },
  "platform_config": {
    "organization": {
      "name": "Example Trade Association",
      "id": "org_123456",
      "industry": "nonprofit",
      "size": "small",
      "established_date": "2025-01-15"
    },
    "automation_settings": {
      "enabled": true,
      "auto_start_workflows": true,
      "human_in_loop_required": true,
      "error_notification_email": "director@example.org",
      "daily_summary_enabled": true,
      "monitoring_level": "comprehensive"
    },
    "ai_models": {
      "primary_model": "claude-sonnet-4-6",
      "fallback_model": "claude-haiku-4-5-20251001",
      "analysis_model": "claude-opus-4-8",
      "temperature": 0.3,
      "max_tokens": 4000,
      "rate_limits": {
        "requests_per_minute": 50,
        "requests_per_day": 10000
      }
    },
    "integrations": {
      "mcp_servers": {
        "exec-automator": {
          "enabled": true,
          "endpoint": "local",
          "version": "1.0.0"
        },
        "supabase": {
          "enabled": true,
          "project_id": "[REDACTED]",
          "region": "us-east-1"
        },
        "github": {
          "enabled": true,
          "organization": "brooksidebi"
        },
        "obsidian": {
          "enabled": true,
          "vault_path": "[REDACTED]"
        }
      },
      "external_systems": {
        "crm": {
          "system": "Salesforce",
          "api_version": "v58.0",
          "connected": true
        },
        "accounting": {
          "system": "QuickBooks Online",
          "api_version": "v3",
          "connected": true
        },
        "email": {
          "system": "Gmail API",
          "api_version": "v1",
          "connected": true
        }
      }
    },
    "security": {
      "encryption_enabled": true,
      "credential_storage": "encrypted_vault",
      "audit_logging": true,
      "retention_days": 365,
      "access_controls": {
        "require_authentication": true,
        "session_timeout_minutes": 30,
        "ip_whitelist_enabled": false
      }
    },
    "notifications": {
      "channels": ["email", "slack"],
      "error_alerts": {
        "enabled": true,
        "threshold": "critical"
      },
      "success_notifications": {
        "enabled": false
      },
      "daily_summary": {
        "enabled": true,
        "send_time": "09:00",
        "timezone": "America/New_York"
      }
    }
  }
}
```

**Step 2.2: Export User Preferences**

```json
{
  "user_preferences": {
    "user_id": "user_ed_001",
    "display_name": "Executive Director",
    "email": "director@example.org",
    "preferences": {
      "default_analysis_depth": "standard",
      "auto_archive_reports": true,
      "preferred_export_format": "pdf",
      "dashboard_layout": "executive_summary",
      "notification_frequency": "daily",
      "language": "en-US",
      "timezone": "America/New_York"
    },
    "customizations": {
      "responsibility_domains": {
        "enabled": ["GOV", "FIN", "DEV", "PROG", "COMM"],
        "custom_domains": []
      },
      "automation_scoring": {
        "algorithm": "standard",
        "custom_weights": null
      },
      "report_templates": {
        "header_logo": true,
        "footer_branding": true,
        "color_scheme": "brookside_blue"
      }
    }
  }
}
```

**Step 2.3: Export Agent Registry**

```json
{
  "agent_registry": {
    "total_agents": 12,
    "agents": [
      {
        "agent_id": "agent_grant_writer_001",
        "agent_name": "Grant Writing Assistant",
        "agent_type": "langgraph_workflow",
        "status": "active",
        "created_date": "2025-02-01",
        "last_modified": "2025-12-15",
        "configuration": {
          "model": "claude-sonnet-4-6",
          "temperature": 0.5,
          "max_tokens": 8000,
          "system_prompt": "You are an expert grant writer specializing in nonprofit funding...",
          "tools": ["document_generator", "research_search", "template_library"],
          "human_in_loop_checkpoints": ["before_submission", "after_budget_generation"]
        },
        "assigned_responsibilities": [
          "resp_dev_003",
          "resp_dev_007"
        ],
        "performance_metrics": {
          "total_executions": 47,
          "success_rate": 0.96,
          "average_duration_seconds": 124,
          "cost_per_execution": 0.45,
          "total_cost": 21.15
        }
      },
      {
        "agent_id": "agent_board_meeting_001",
        "agent_name": "Board Meeting Coordinator",
        "agent_type": "langgraph_workflow",
        "status": "active",
        "created_date": "2025-02-05",
        "last_modified": "2025-12-10",
        "configuration": {
          "model": "claude-sonnet-4-6",
          "temperature": 0.2,
          "max_tokens": 4000,
          "system_prompt": "You are a board meeting coordination assistant...",
          "tools": ["calendar_api", "email_sender", "document_generator", "meeting_scheduler"],
          "human_in_loop_checkpoints": ["before_sending_invitations", "before_posting_minutes"]
        },
        "assigned_responsibilities": [
          "resp_gov_001",
          "resp_gov_008"
        ],
        "performance_metrics": {
          "total_executions": 12,
          "success_rate": 1.0,
          "average_duration_seconds": 68,
          "cost_per_execution": 0.18,
          "total_cost": 2.16
        }
      }
    ]
  }
}
```

**Output:** Save to `{export_dir}/config/platform-config.json`

---

### Phase 3: Workflow Export (type: workflows or all)

**Step 3.1: Export LangGraph Workflow Definitions**

For each active workflow, export:
1. Python workflow file
2. State schema definitions
3. Node implementations
4. Edge configurations
5. Tool definitions
6. Prompt templates

**Workflow Export Structure:**

```
{export_dir}/workflows/
├── workflow-grant-writing/
│   ├── workflow.py                    # LangGraph workflow code
│   ├── state-schema.json              # State type definitions
│   ├── nodes/
│   │   ├── research-node.py
│   │   ├── drafting-node.py
│   │   ├── budget-node.py
│   │   └── review-node.py
│   ├── tools/
│   │   ├── tool-definitions.json
│   │   └── tool-implementations.py
│   ├── prompts/
│   │   ├── system-prompt.txt
│   │   ├── research-prompt.txt
│   │   └── drafting-prompt.txt
│   └── metadata.json                  # Workflow metadata
├── workflow-board-coordination/
│   └── [same structure]
└── workflow-member-communication/
    └── [same structure]
```

**Workflow Metadata Example:**

```json
{
  "workflow_metadata": {
    "workflow_id": "workflow_grant_writing_001",
    "workflow_name": "Grant Writing Workflow",
    "version": "2.1.0",
    "created_date": "2025-02-01",
    "last_modified": "2025-12-15",
    "author": "Brookside BI",
    "status": "production",
    "responsibility_mapping": {
      "responsibility_id": "resp_dev_003",
      "responsibility_title": "Grant Writing and Submissions",
      "automation_score": 82,
      "domain": "DEV"
    },
    "workflow_architecture": {
      "entry_point": "research_node",
      "nodes": [
        {
          "node_id": "research_node",
          "node_name": "Research and Discovery",
          "node_type": "ai_agent",
          "model": "claude-sonnet-4-6",
          "tools": ["research_search", "funder_database"],
          "average_duration_seconds": 35
        },
        {
          "node_id": "drafting_node",
          "node_name": "Grant Narrative Drafting",
          "node_type": "ai_agent",
          "model": "claude-sonnet-4-6",
          "tools": ["document_generator", "template_library"],
          "average_duration_seconds": 67
        },
        {
          "node_id": "budget_node",
          "node_name": "Budget Generation",
          "node_type": "ai_agent",
          "model": "claude-sonnet-4-6",
          "tools": ["financial_calculator", "accounting_integration"],
          "average_duration_seconds": 18
        },
        {
          "node_id": "review_node",
          "node_name": "Human Review",
          "node_type": "human_in_loop",
          "average_duration_seconds": null
        }
      ],
      "edges": [
        {"from": "research_node", "to": "drafting_node", "condition": null},
        {"from": "drafting_node", "to": "budget_node", "condition": null},
        {"from": "budget_node", "to": "review_node", "condition": null}
      ]
    },
    "performance_summary": {
      "total_executions": 47,
      "success_rate": 0.96,
      "average_total_duration_seconds": 124,
      "average_cost": 0.45,
      "total_cost": 21.15,
      "time_savings_hours_per_execution": 4.5,
      "total_time_saved_hours": 211.5
    },
    "dependencies": {
      "mcp_servers": ["exec-automator", "context7"],
      "external_apis": ["foundation_center_api"],
      "internal_systems": ["grant_tracking_database"]
    }
  }
}
```

**Step 3.2: Export Agent Configurations**

```json
{
  "agent_configurations": {
    "agent_id": "agent_grant_writer_001",
    "configuration_version": "1.3.0",
    "base_configuration": {
      "model_provider": "anthropic",
      "model_name": "claude-sonnet-4-6",
      "temperature": 0.5,
      "max_tokens": 8000,
      "top_p": 0.95,
      "frequency_penalty": 0.0,
      "presence_penalty": 0.0
    },
    "system_prompt": {
      "prompt_version": "1.2.0",
      "prompt_text": "You are an expert grant writer specializing in nonprofit funding applications...",
      "variables": ["organization_name", "mission_statement", "program_focus"],
      "examples": [
        {
          "input": "Draft a 1-page LOI for environmental education program",
          "output": "Dear Program Officer, [Example output...]"
        }
      ]
    },
    "tools": [
      {
        "tool_name": "document_generator",
        "tool_type": "mcp_tool",
        "tool_server": "exec-automator",
        "configuration": {
          "templates_enabled": true,
          "format_options": ["docx", "pdf"],
          "max_length_words": 5000
        }
      },
      {
        "tool_name": "research_search",
        "tool_type": "external_api",
        "api_endpoint": "https://api.foundationcenter.org/v2/search",
        "configuration": {
          "api_key": "[REDACTED]",
          "rate_limit_per_hour": 100,
          "cache_results": true
        }
      }
    ],
    "guardrails": {
      "output_validation": {
        "enabled": true,
        "checks": ["length_limit", "required_sections", "tone_check"]
      },
      "content_filtering": {
        "enabled": true,
        "filter_pii": true,
        "filter_profanity": true
      },
      "cost_controls": {
        "max_tokens_per_execution": 10000,
        "max_cost_per_execution": 1.00,
        "monthly_budget_limit": 500.00
      }
    },
    "human_in_loop": {
      "checkpoints": [
        {
          "checkpoint_name": "before_submission",
          "trigger": "always",
          "notification_channels": ["email"],
          "timeout_hours": 24
        },
        {
          "checkpoint_name": "budget_review",
          "trigger": "budget_exceeds_threshold",
          "threshold": 50000,
          "notification_channels": ["email", "slack"]
        }
      ]
    }
  }
}
```

**Output:** Save to `{export_dir}/workflows/` directory structure

---

### Phase 4: Reports Export (type: reports or all)

**Step 4.1: Export Analysis Reports**

Gather all generated reports from:
- `${PROJECT_ROOT}/exec-automator/analyses/`
- `${OBSIDIAN_VAULT_PATH}/Projects/exec-automator/analyses/`

**Report Export Manifest:**

```json
{
  "reports_export": {
    "export_date": "2025-12-17",
    "total_reports": 15,
    "reports": [
      {
        "report_id": "analysis_20250201_143022",
        "report_type": "responsibility_analysis",
        "organization": "Example Trade Association",
        "document_analyzed": "Executive Director RFP",
        "analysis_date": "2025-02-01",
        "analysis_depth": "comprehensive",
        "file_formats": {
          "json": "analysis_20250201_143022-data.json",
          "markdown": "analysis_20250201_143022-report.md",
          "pdf": "analysis_20250201_143022-report.pdf"
        },
        "key_findings": {
          "total_responsibilities": 23,
          "high_automation_potential": 8,
          "moderate_automation_potential": 9,
          "low_automation_potential": 6
        },
        "file_size_bytes": 485932,
        "export_path": "reports/analyses/analysis_20250201_143022/"
      },
      {
        "report_id": "score_20250215_091544",
        "report_type": "automation_scoring",
        "organization": "Example Trade Association",
        "responsibilities_scored": 23,
        "scoring_date": "2025-02-15",
        "file_formats": {
          "json": "score_20250215_091544-data.json",
          "markdown": "score_20250215_091544-report.md"
        },
        "key_findings": {
          "average_automation_score": 62,
          "highest_score": 94,
          "lowest_score": 15,
          "quick_wins_identified": 5
        },
        "file_size_bytes": 128450,
        "export_path": "reports/scoring/score_20250215_091544/"
      }
    ]
  }
}
```

**Step 4.2: Export Workflow Execution Reports**

```json
{
  "execution_reports": {
    "reporting_period": {
      "start_date": "2025-02-01",
      "end_date": "2025-12-17"
    },
    "summary_statistics": {
      "total_workflow_executions": 326,
      "successful_executions": 312,
      "failed_executions": 14,
      "success_rate": 0.957,
      "total_time_saved_hours": 1247.5,
      "total_cost_dollars": 147.82,
      "average_cost_per_execution": 0.45
    },
    "workflow_breakdown": [
      {
        "workflow_id": "workflow_grant_writing_001",
        "workflow_name": "Grant Writing Workflow",
        "executions": 47,
        "success_rate": 0.96,
        "time_saved_hours": 211.5,
        "cost_dollars": 21.15
      },
      {
        "workflow_id": "workflow_board_coordination_001",
        "workflow_name": "Board Meeting Coordinator",
        "executions": 12,
        "success_rate": 1.0,
        "time_saved_hours": 48.0,
        "cost_dollars": 2.16
      },
      {
        "workflow_id": "workflow_member_communication_001",
        "workflow_name": "Member Communication Manager",
        "executions": 156,
        "success_rate": 0.95,
        "time_saved_hours": 624.0,
        "cost_dollars": 70.20
      }
    ],
    "monthly_trends": [
      {
        "month": "2025-02",
        "executions": 18,
        "success_rate": 0.89,
        "cost_dollars": 8.10
      },
      {
        "month": "2025-03",
        "executions": 34,
        "success_rate": 0.94,
        "cost_dollars": 15.30
      }
    ],
    "export_files": {
      "detailed_execution_log": "reports/executions/execution-log-full.json",
      "monthly_summary": "reports/executions/monthly-summary.json",
      "performance_dashboard": "reports/executions/performance-dashboard.pdf"
    }
  }
}
```

**Step 4.3: Export ROI Analysis Reports**

```json
{
  "roi_reports": {
    "calculation_date": "2025-12-17",
    "time_period": "11 months (2025-02-01 to 2025-12-17)",
    "investment_summary": {
      "platform_development": 15000,
      "integration_implementation": 8000,
      "training_and_change_management": 3000,
      "monthly_operational_cost": 150,
      "total_cost_to_date": 27650
    },
    "benefits_realized": {
      "ed_time_saved_hours": 1247.5,
      "ed_hourly_rate": 75,
      "ed_time_value": 93562.50,
      "reduced_errors_value": 5000,
      "faster_response_times_value": 8000,
      "total_benefits": 106562.50
    },
    "roi_metrics": {
      "net_benefit": 78912.50,
      "roi_percentage": 285.5,
      "payback_period_months": 3.8,
      "projected_annual_benefit": 115950,
      "projected_3_year_npv": 321200
    },
    "export_files": {
      "detailed_roi_calculation": "reports/roi/roi-analysis-detailed.json",
      "executive_summary": "reports/roi/roi-executive-summary.pdf"
    }
  }
}
```

**Output:** Save to `{export_dir}/reports/` directory

---

### Phase 5: Templates Export (type: templates or all)

**Step 5.1: Export Custom Templates**

```json
{
  "templates_export": {
    "total_templates": 18,
    "template_categories": [
      {
        "category": "grant_writing",
        "templates": [
          {
            "template_id": "template_grant_loi_001",
            "template_name": "Foundation Letter of Inquiry",
            "template_type": "document",
            "format": "docx",
            "variables": ["funder_name", "program_name", "requested_amount", "program_summary"],
            "usage_count": 23,
            "last_modified": "2025-11-02",
            "file_path": "templates/grant_writing/loi-foundation.docx"
          },
          {
            "template_id": "template_grant_budget_001",
            "template_name": "Grant Budget Spreadsheet",
            "template_type": "spreadsheet",
            "format": "xlsx",
            "variables": ["program_name", "total_budget", "expense_categories"],
            "usage_count": 19,
            "last_modified": "2025-10-15",
            "file_path": "templates/grant_writing/budget-template.xlsx"
          }
        ]
      },
      {
        "category": "board_communications",
        "templates": [
          {
            "template_id": "template_board_agenda_001",
            "template_name": "Board Meeting Agenda",
            "template_type": "document",
            "format": "docx",
            "variables": ["meeting_date", "meeting_location", "agenda_items"],
            "usage_count": 12,
            "last_modified": "2025-09-20",
            "file_path": "templates/board/meeting-agenda.docx"
          },
          {
            "template_id": "template_board_minutes_001",
            "template_name": "Board Meeting Minutes",
            "template_type": "document",
            "format": "docx",
            "variables": ["meeting_date", "attendees", "decisions_made", "action_items"],
            "usage_count": 11,
            "last_modified": "2025-09-20",
            "file_path": "templates/board/meeting-minutes.docx"
          }
        ]
      }
    ]
  }
}
```

**Step 5.2: Export Prompt Templates**

```json
{
  "prompt_templates": {
    "total_prompts": 34,
    "prompts": [
      {
        "prompt_id": "prompt_grant_research_001",
        "prompt_name": "Grant Research Prompt",
        "prompt_category": "grant_writing",
        "model": "claude-sonnet-4-6",
        "version": "1.4.0",
        "prompt_text": "You are conducting research for a grant application...",
        "variables": ["funder_name", "grant_program", "organization_mission"],
        "usage_count": 47,
        "effectiveness_score": 8.7,
        "last_modified": "2025-11-15",
        "file_path": "templates/prompts/grant-research.txt"
      },
      {
        "prompt_id": "prompt_member_email_001",
        "prompt_name": "Member Newsletter Draft Prompt",
        "prompt_category": "communications",
        "model": "claude-sonnet-4-6",
        "version": "2.1.0",
        "prompt_text": "You are drafting a monthly member newsletter...",
        "variables": ["month", "highlights", "upcoming_events", "member_spotlight"],
        "usage_count": 156,
        "effectiveness_score": 9.2,
        "last_modified": "2025-12-01",
        "file_path": "templates/prompts/member-newsletter.txt"
      }
    ]
  }
}
```

**Output:** Save to `{export_dir}/templates/` directory

---

### Phase 6: History Export (type: history or all)

**Step 6.1: Export Execution History**

```json
{
  "execution_history": {
    "history_period": {
      "start_date": "2025-02-01",
      "end_date": "2025-12-17",
      "total_days": 319
    },
    "total_executions": 326,
    "executions": [
      {
        "execution_id": "exec_20251215_093045",
        "workflow_id": "workflow_grant_writing_001",
        "workflow_name": "Grant Writing Workflow",
        "triggered_by": "user_manual",
        "triggered_at": "2025-12-15T09:30:45Z",
        "completed_at": "2025-12-15T09:32:52Z",
        "status": "success",
        "duration_seconds": 127,
        "cost_dollars": 0.48,
        "input_summary": "Grant LOI for environmental education program",
        "output_summary": "Generated 2-page LOI with budget summary",
        "human_feedback": {
          "reviewed_by": "director@example.org",
          "reviewed_at": "2025-12-15T14:22:10Z",
          "approval_status": "approved_with_edits",
          "satisfaction_score": 9
        },
        "performance_metrics": {
          "tokens_used": 3842,
          "api_calls": 5,
          "cache_hits": 2,
          "time_saved_hours": 4.5
        }
      }
    ],
    "export_files": {
      "full_execution_log": "history/execution-log.json",
      "execution_timeline": "history/execution-timeline.csv",
      "performance_metrics": "history/performance-metrics.json"
    }
  }
}
```

**Step 6.2: Export Audit Trail**

```json
{
  "audit_trail": {
    "audit_period": {
      "start_date": "2025-02-01",
      "end_date": "2025-12-17"
    },
    "total_events": 1247,
    "event_types": {
      "workflow_execution": 326,
      "configuration_change": 18,
      "user_login": 156,
      "agent_created": 12,
      "agent_modified": 23,
      "template_created": 9,
      "template_modified": 15,
      "integration_added": 5,
      "export_performed": 3
    },
    "compliance_events": [
      {
        "event_id": "audit_20251201_102030",
        "event_type": "configuration_change",
        "event_date": "2025-12-01T10:20:30Z",
        "user": "admin@example.org",
        "action": "modified_agent_configuration",
        "details": {
          "agent_id": "agent_grant_writer_001",
          "changes": {
            "temperature": {"old": 0.7, "new": 0.5},
            "max_tokens": {"old": 6000, "new": 8000}
          },
          "reason": "Improve output consistency per user feedback"
        },
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0"
      }
    ],
    "export_files": {
      "full_audit_log": "history/audit-trail.json",
      "compliance_report": "history/compliance-report.pdf"
    }
  }
}
```

**Step 6.3: Export Error Logs**

```json
{
  "error_log": {
    "total_errors": 14,
    "error_rate": 0.043,
    "errors": [
      {
        "error_id": "error_20251110_153022",
        "error_date": "2025-11-10T15:30:22Z",
        "workflow_id": "workflow_member_communication_001",
        "error_type": "api_timeout",
        "error_severity": "medium",
        "error_message": "Gmail API timeout after 30 seconds",
        "stack_trace": "[Stack trace content...]",
        "resolution": {
          "resolved": true,
          "resolved_date": "2025-11-10T15:35:10Z",
          "resolution_action": "Retry with exponential backoff",
          "resolution_status": "success"
        },
        "impact": {
          "executions_affected": 1,
          "users_impacted": 0,
          "time_lost_minutes": 5
        }
      }
    ],
    "error_patterns": [
      {
        "pattern": "API timeouts",
        "occurrences": 6,
        "affected_workflows": ["workflow_member_communication_001"],
        "recommendation": "Increase timeout threshold from 30s to 60s"
      },
      {
        "pattern": "Invalid input format",
        "occurrences": 4,
        "affected_workflows": ["workflow_grant_writing_001"],
        "recommendation": "Add input validation before workflow execution"
      }
    ],
    "export_files": {
      "error_log": "history/error-log.json",
      "error_analysis": "history/error-analysis-report.pdf"
    }
  }
}
```

**Output:** Save to `{export_dir}/history/` directory

---

### Phase 7: Package Export & Finalization

**Step 7.1: Generate Export Manifest**

Create a comprehensive manifest documenting all exported content:

```json
{
  "export_manifest": {
    "export_id": "export_20251217_142530",
    "export_type": "all",
    "export_format": "zip",
    "export_date": "2025-12-17T14:25:30Z",
    "exporter": "exec-automator export command v1.0.0",
    "organization": "Example Trade Association",
    "platform_version": "1.0.0",
    "contents": {
      "configuration": {
        "included": true,
        "files": 3,
        "size_bytes": 45832
      },
      "workflows": {
        "included": true,
        "workflows_count": 12,
        "files": 87,
        "size_bytes": 1248920
      },
      "reports": {
        "included": true,
        "reports_count": 15,
        "files": 45,
        "size_bytes": 4859320
      },
      "templates": {
        "included": true,
        "templates_count": 18,
        "files": 18,
        "size_bytes": 892450
      },
      "history": {
        "included": true,
        "executions_count": 326,
        "files": 6,
        "size_bytes": 2847920
      }
    },
    "total_files": 159,
    "total_size_bytes": 9894442,
    "total_size_human": "9.4 MB",
    "integrity": {
      "checksum_algorithm": "sha256",
      "checksum": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
      "verified": true
    },
    "security": {
      "credentials_included": false,
      "credentials_sanitized": true,
      "encryption_applied": false,
      "pii_scrubbed": true
    },
    "restoration_instructions": {
      "compatible_versions": ["1.0.x"],
      "import_command": "/exec:import --source ./exec-automator-export-all-20251217-142530.zip",
      "prerequisites": [
        "exec-automator plugin installed",
        "Python 3.10+",
        "Required MCP servers configured"
      ]
    }
  }
}
```

**Step 7.2: Create README for Export Package**

```markdown
# Exec-Automator Export Package

**Export ID:** export_20251217_142530
**Export Date:** December 17, 2025
**Organization:** Example Trade Association
**Package Size:** 9.4 MB

---

## Package Contents

This export package contains a complete backup of your exec-automator platform configuration and data.

### Included Components

- ✅ **Platform Configuration** (3 files, 45 KB)
  - Organization settings
  - AI model configurations
  - Integration settings
  - User preferences

- ✅ **Workflow Definitions** (12 workflows, 87 files, 1.2 MB)
  - LangGraph workflow code
  - Agent configurations
  - Prompt templates
  - Tool definitions

- ✅ **Analysis Reports** (15 reports, 45 files, 4.9 MB)
  - Responsibility analyses
  - Automation scoring reports
  - ROI calculations
  - Performance dashboards

- ✅ **Custom Templates** (18 templates, 892 KB)
  - Document templates
  - Prompt templates
  - Email templates

- ✅ **Execution History** (326 executions, 6 files, 2.8 MB)
  - Execution logs
  - Audit trails
  - Error logs
  - Performance metrics

---

## How to Restore This Backup

### Prerequisites

1. exec-automator plugin version 1.0.x or compatible
2. Python 3.10 or higher
3. Required MCP servers configured
4. Sufficient permissions to import configurations

### Restoration Command

```bash
/exec:import --source ./exec-automator-export-all-20251217-142530.zip --restore-all
```

### Selective Restoration

Restore specific components:

```bash
# Restore only workflows
/exec:import --source ./export.zip --components workflows

# Restore only configuration
/exec:import --source ./export.zip --components config

# Restore reports and templates
/exec:import --source ./export.zip --components reports,templates
```

---

## Security Notes

- ✅ **API credentials have been sanitized** - You will need to re-enter credentials after import
- ✅ **PII has been scrubbed** - Personally identifiable information removed
- ⚠️ **No encryption applied** - Store this package securely
- ℹ️ **Integrity verified** - SHA256 checksum included in manifest

---

## Support

For questions or issues with this export package:
- Email: support@brooksidebi.com
- Documentation: https://docs.brooksidebi.com/exec-automator/export-import
- Version: 1.0.0

---

**Generated by:** Brookside BI Exec-Automator Platform
**Export Command:** /exec:export all zip
```

**Step 7.3: Apply Compression (if format=zip)**

```bash
# Create ZIP archive
cd "${destination}"
zip -r "exec-automator-export-${type}-${timestamp}.zip" \
    "exec-automator-export-${type}-${timestamp}/"

# Calculate checksum
sha256sum "exec-automator-export-${type}-${timestamp}.zip" > \
    "exec-automator-export-${type}-${timestamp}.zip.sha256"

echo "✅ Export package created: exec-automator-export-${type}-${timestamp}.zip"
echo "📊 Size: $(du -h exec-automator-export-${type}-${timestamp}.zip | cut -f1)"
echo "🔐 Checksum: $(cat exec-automator-export-${type}-${timestamp}.zip.sha256)"
```

**Step 7.4: Generate Export Summary Report**

Create a human-readable summary:

```markdown
# Export Summary Report

**Export Completed Successfully** ✅

## Export Details

- **Export ID:** export_20251217_142530
- **Export Type:** all
- **Export Format:** zip
- **Export Date:** December 17, 2025 at 2:25:30 PM
- **Destination:** ./exports/exec-automator-export-all-20251217-142530.zip

## Package Contents

| Component | Items | Files | Size |
|-----------|-------|-------|------|
| Configuration | 1 platform config | 3 | 45 KB |
| Workflows | 12 workflows | 87 | 1.2 MB |
| Reports | 15 reports | 45 | 4.9 MB |
| Templates | 18 templates | 18 | 892 KB |
| History | 326 executions | 6 | 2.8 MB |
| **Total** | - | **159** | **9.4 MB** |

## What's Included

### Workflows Exported
1. Grant Writing Workflow (47 executions)
2. Board Meeting Coordinator (12 executions)
3. Member Communication Manager (156 executions)
4. Financial Report Generator (23 executions)
5. Compliance Tracker (18 executions)
6. Donor Communication Assistant (34 executions)
7. Event Planning Coordinator (9 executions)
8. Newsletter Drafter (27 executions)
9. Policy Document Reviewer (8 executions)
10. Strategic Plan Monitor (15 executions)
11. Volunteer Coordinator (11 executions)
12. Website Content Manager (19 executions)

### Reports Included
- 15 comprehensive analysis reports
- 11 months of execution history (Feb-Dec 2025)
- Performance dashboards and metrics
- ROI analysis and projections
- Compliance and audit documentation

### Templates Backed Up
- 8 grant writing templates
- 5 board communication templates
- 3 member communication templates
- 2 financial reporting templates

## Platform Statistics (at time of export)

- **Total Workflow Executions:** 326
- **Success Rate:** 95.7%
- **Total Time Saved:** 1,247.5 hours
- **Total Cost:** $147.82
- **Average Cost per Execution:** $0.45
- **Platform ROI:** 285.5%

## Security & Integrity

- ✅ Package integrity verified (SHA256 checksum)
- ✅ API credentials sanitized (will need re-entry on import)
- ✅ PII scrubbed from examples
- ⚠️ No encryption applied - store securely

## Next Steps

### To Restore This Backup
```bash
/exec:import --source ./exports/exec-automator-export-all-20251217-142530.zip
```

### To Archive for Long-Term Storage
- Store in secure, encrypted location
- Keep offsite backup copy
- Document retention: 7 years (recommended for nonprofit compliance)

### To Share with Brookside BI Support
- This package is safe to share (credentials removed)
- Email to: support@brooksidebi.com
- Reference Export ID: export_20251217_142530

---

**Generated by:** Brookside BI Exec-Automator Platform v1.0.0
**Contact:** support@brooksidebi.com
```

**Output:** Save to `{export_dir}/EXPORT-SUMMARY.md`

---

### Phase 8: Archive to Obsidian Vault

**Step 8.1: Sync Export Metadata to Obsidian**

```bash
# Archive export summary to Obsidian
mcp__obsidian__obsidian_append_content \
  filepath="Projects/exec-automator/exports/export-history.md" \
  content="
## Export: ${timestamp}

- **Export ID:** export_${timestamp}
- **Type:** ${type}
- **Format:** ${format}
- **Size:** ${size_human}
- **Location:** ${export_dir}
- **Files:** ${total_files}
- **Status:** ✅ Success

### Contents Summary
${contents_summary}

---
"
```

**Step 8.2: Create Obsidian Link to Export**

```markdown
---
title: Exec-Automator Export - ${timestamp}
created: ${timestamp}
export_id: export_${timestamp}
export_type: ${type}
export_format: ${format}
tags:
  - type/export
  - status/completed
  - project/exec-automator
---

# Export Package: ${type}

**Export Date:** ${date}
**Package Size:** ${size}
**Location:** `${export_path}`

## Quick Stats

${summary_statistics}

## Contents

${detailed_contents}

## Restoration

To restore this export:
\`\`\`bash
/exec:import --source ${export_path}
\`\`\`

## Related

- [[Projects/exec-automator/README|Exec-Automator Project]]
- [[Projects/exec-automator/workflows/overview|Workflow Overview]]
- [[Projects/exec-automator/reports/performance|Performance Reports]]
```

---

### Phase 9: Completion & User Notification

**Step 9.1: Display Success Summary**

```
✅ Export Completed Successfully!

📦 Export Package: exec-automator-export-all-20251217-142530.zip
📊 Total Size: 9.4 MB
📁 Location: ./exports/exec-automator-export-all-20251217-142530/
🔐 Checksum: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

## Package Contents

✅ Configuration (3 files, 45 KB)
✅ Workflows (12 workflows, 87 files, 1.2 MB)
✅ Reports (15 reports, 45 files, 4.9 MB)
✅ Templates (18 templates, 892 KB)
✅ History (326 executions, 2.8 MB)

## What to Do Next

1. **Verify the export:**
   Open: ./exports/exec-automator-export-all-20251217-142530/EXPORT-SUMMARY.md

2. **Store securely:**
   Move to encrypted backup location for safekeeping

3. **Test restoration (optional):**
   /exec:import --source ./exports/exec-automator-export-all-20251217-142530.zip --dry-run

## Need Help?

- Documentation: /exec:help export
- Support: support@brooksidebi.com
- Export ID: export_20251217_142530

Your automation platform data is now safely backed up! 🎉
```

**Step 9.2: Log Export Activity**

```json
{
  "activity_log": {
    "activity_type": "export",
    "timestamp": "2025-12-17T14:25:30Z",
    "user": "director@example.org",
    "export_id": "export_20251217_142530",
    "export_type": "all",
    "export_format": "zip",
    "status": "success",
    "duration_seconds": 47,
    "files_exported": 159,
    "size_bytes": 9894442,
    "destination": "./exports/exec-automator-export-all-20251217-142530.zip"
  }
}
```

---

## Error Handling & Edge Cases

### Common Issues

**1. Insufficient Disk Space**
```
❌ Error: Insufficient disk space for export
Required: 12 MB
Available: 8 MB

Solution: Free up disk space or choose a different destination
Use: /exec:export all zip --destination /path/to/larger/drive
```

**2. Missing Source Files**
```
⚠️  Warning: Some workflow files not found
Missing: workflow-event-planning/nodes/venue-booking-node.py

Proceeding with available files, but export may be incomplete.
Check: ${PROJECT_ROOT}/exec-automator/workflows/ for missing files
```

**3. Large Export Size**
```
⚠️  Warning: Export size exceeds 100 MB
Estimated size: 145 MB
This may take several minutes to compress.

Recommendations:
- Export specific components instead of "all"
- Exclude execution history: /exec:export config,workflows,reports
- Archive old reports separately
```

**4. Credential Sanitization**
```
🔒 Security: Sanitizing credentials from export

The following items require re-entry after import:
- Salesforce API key
- QuickBooks OAuth token
- Gmail API credentials
- Foundation Center API key

Credentials will NOT be included in export package for security.
```

**5. Obsidian Sync Failure**
```
⚠️  Warning: Could not sync to Obsidian vault
Obsidian MCP server not available

Export completed successfully, but not archived to Obsidian.
Manually copy EXPORT-SUMMARY.md to your vault if needed.
```

---

## Export Best Practices

### Recommended Export Schedule

**Daily Backups (Automated):**
```bash
# Configuration only (lightweight)
/exec:export config json --destination ./backups/daily
```

**Weekly Backups:**
```bash
# Configuration + workflows
/exec:export config,workflows zip --destination ./backups/weekly
```

**Monthly Archives:**
```bash
# Complete backup
/exec:export all zip --destination ./backups/monthly
```

**Pre-Migration/Upgrade:**
```bash
# Full backup before major changes
/exec:export all zip --destination ./backups/pre-migration
```

---

## Integration with Other Commands

After export, you can:

```bash
# Import to another environment
/exec:import --source ./exports/exec-automator-export-all-20251217.zip

# Compare two exports
/exec:compare export_20251201 export_20251217

# Validate export integrity
/exec:validate --export-file ./exports/exec-automator-export-all-20251217.zip

# Generate export report
/exec:report exports --period 2025
```

---

## Compliance & Audit Support

The export functionality supports nonprofit compliance requirements:

**IRS Form 990 Documentation:**
- Executive compensation calculations
- Program expense allocations
- Time tracking documentation

**Funder Reporting:**
- Grant activity logs
- Program impact metrics
- Financial reports

**Audit Trails:**
- Complete execution history
- Configuration change logs
- User activity tracking

**Data Retention:**
- 7-year retention recommended
- Automated backup rotation
- Secure archival storage

---

## Brand Voice Guidelines

**Brookside BI Tone for Export Communications:**

- **Reassuring**: "Your automation platform data is now safely backed up!"
- **Clear**: Use plain language for technical operations
- **Empowering**: "You're now in control of your automation configurations"
- **Security-conscious**: Emphasize credential sanitization and secure storage
- **Supportive**: Offer clear next steps and support contacts

**Example Phrasing:**
- ✅ "Export completed! Your 12 workflows are safely backed up."
- ❌ "Serialization of workflow DAG definitions successful."
- ✅ "We've removed API credentials for security. You'll re-enter them on import."
- ❌ "Credential sanitization applied to exported artifacts."

---

## Performance Metrics

Track and report export performance:

```json
{
  "export_performance": {
    "export_id": "export_20251217_142530",
    "start_time": "2025-12-17T14:25:30Z",
    "end_time": "2025-12-17T14:26:17Z",
    "duration_seconds": 47,
    "files_processed": 159,
    "files_per_second": 3.38,
    "bytes_processed": 9894442,
    "compression_ratio": 0.72,
    "compressed_size_bytes": 7124238,
    "space_saved_bytes": 2770204
  }
}
```

---

**End of Command Definition**

**Command Status:** Production Ready
**Version:** 1.0.0
**Last Updated:** 2025-12-17
**Maintained by:** Brookside BI Development Team
**Support:** exec-automator@brooksidebi.com
**Documentation:** https://docs.brooksidebi.com/exec-automator/export
