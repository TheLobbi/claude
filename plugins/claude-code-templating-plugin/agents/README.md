---
name: claude-code-templating-plugin:README
intent: Harness Expert Agent
tags:
  - claude-code-templating-plugin
  - agent
  - README
inputs: []
risk: medium
cost: medium
description: Expert system for Harness CI/CD pipeline generation, template management, and intelligent pipeline suggestions.
---

# Harness Expert Agent

Expert system for Harness CI/CD pipeline generation, template management, and intelligent pipeline suggestions.

## Overview

The Harness Expert Agent provides comprehensive capabilities for generating production-ready Harness pipelines, templates, services, and environments. It combines deep knowledge of Harness patterns with intelligent project analysis to suggest optimal CI/CD configurations.

## Features

### 1. Pipeline Generation
- **Multi-stage orchestration** with parallel and sequential execution
- **Variable management** (pipeline, stage, runtime inputs)
- **Failure strategies** (retry, rollback, manual intervention)
- **Notification rules** (Slack, Email, PagerDuty, MSTeams)
- **Approval gates** (Harness, Jira, ServiceNow, Custom)
- **CI/CD integration** (build, test, deploy, verify)

### 2. Template Management
- **Step Templates**: Reusable steps for common operations
- **Stage Templates**: Complete stage configurations
- **Pipeline Templates**: Full pipeline workflows
- **StepGroup Templates**: Grouped step collections
- **Versioning**: Template version management
- **Scope Management**: Project, Org, Account levels

### 3. Service Configuration
- **Kubernetes Services**: Manifest-based deployments
- **Helm Services**: Chart-based deployments
- **Serverless Services**: AWS Lambda, Azure Functions
- **Custom Services**: Flexible deployment types

### 4. Environment Configuration
- **Development Environments**: Debug settings, single replica
- **Staging Environments**: Production-like with reduced scale
- **Production Environments**: High availability, monitoring
- **Variable Overrides**: Environment-specific configurations

### 5. Intelligent Suggestions
- **Language Detection**: Node.js, Python, Java, Go, Rust, etc.
- **Framework Recognition**: React, Spring Boot, FastAPI, Django
- **Infrastructure Detection**: Docker, Kubernetes, Terraform
- **Testing Setup**: Jest, Pytest, JUnit, Go test
- **Deployment Strategy**: Rolling, Canary, Blue-Green, GitOps

## Usage

### Create a Pipeline

```typescript
import { HarnessExpertAgent } from './agents/harness-expert';

const agent = new HarnessExpertAgent();

const result = await agent.createPipeline({
  name: "My Application Pipeline",
  orgIdentifier: "default",
  projectIdentifier: "my_project",
  stages: [
    {
      name: "Build",
      type: "CI",
      spec: {
        cloneCodebase: true,
        infrastructure: {
          type: "KubernetesDirect",
          spec: {
            connectorRef: "<+input>",
            namespace: "<+input>"
          }
        },
        execution: {
          steps: [
            {
              name: "Run Tests",
              type: "RunTests",
              spec: {
                language: "node",
                buildTool: "npm",
                args: "test"
              }
            }
          ]
        }
      }
    }
  ]
});

console.log(result.data.yaml);
console.log(`Pipeline saved to: ${result.data.filePath}`);
```

### Create a Template

```typescript
const result = await agent.createTemplate({
  name: "Docker Build Template",
  type: "Step",
  scope: "org",
  orgIdentifier: "default",
  versionLabel: "1.0.0",
  spec: {
    name: "Build Docker Image",
    type: "BuildAndPushDockerRegistry",
    spec: {
      connectorRef: "<+input>",
      repo: "<+input>",
      tags: ["<+pipeline.sequenceId>", "latest"]
    }
  }
});
```

### Auto-Generate Pipeline from Project

```typescript
const result = await agent.createPipelineForProject({
  projectPath: "./my-app",
  projectType: "nodejs",
  environments: ["dev", "staging", "prod"],
  includeCI: true,
  includeCD: true,
  deploymentStrategy: "Rolling"
});
```

### Suggest Pipeline

```typescript
const analysis = {
  projectName: "my-app",
  projectType: "web-application",
  language: "typescript",
  frameworks: ["react"],
  hasTests: true,
  hasDockerfile: true,
  hasKubernetesConfig: true,
  hasTerraform: false,
  dependencies: {},
  devDependencies: {}
};

const result = await agent.suggestPipeline(analysis);

console.log(result.data.reasoning);
console.log(`Confidence: ${result.data.confidence}`);
console.log(`Detected patterns: ${result.data.detectedPatterns.join(', ')}`);
```

### Validate Pipeline

```typescript
const yaml = `
pipeline:
  name: Test Pipeline
  identifier: test_pipeline
  stages:
    - stage:
        name: Build
        type: CI
`;

const result = await agent.validatePipeline(yaml);

if (result.data.valid) {
  console.log("Pipeline is valid");
} else {
  console.log("Validation errors:");
  result.data.errors.forEach(error => {
    console.log(`- ${error.message}`);
  });
}
```

### List Templates

```typescript
const result = await agent.listTemplates("org");

result.data.forEach(template => {
  console.log(`${template.name} (${template.type}) - v${template.versionLabel}`);
});
```

## Pipeline Patterns

### CI/CD Pipeline
Complete build, test, and deployment workflow.

### Canary Deployment
Gradual rollout with automated rollback.

### Blue-Green Deployment
Zero-downtime deployments with instant rollback.

### GitOps Pipeline
Git-based configuration management.

### Terraform Pipeline
Infrastructure as Code provisioning.

## Template Patterns

### Step Templates
- **Shell Script**: Execute custom scripts with output variables
- **HTTP Request**: Make API calls with assertions
- **Docker Build**: Build and push container images
- **Kubernetes Deploy**: Deploy to K8s clusters
- **Terraform**: Provision infrastructure

### Stage Templates
- **CI Build**: Complete build and test workflow
- **CD Deploy**: Deployment with rollback
- **Approval**: Manual or automated approvals
- **Security**: Security scanning and validation

### Pipeline Templates
- **Microservice**: Full microservice deployment
- **Monorepo**: Multi-project pipeline
- **Multi-Cloud**: Deploy to multiple clouds
- **Compliance**: Policy enforcement pipeline

## Best Practices

### 1. Pipeline Organization
- Use descriptive stage and step names
- Group related steps in stages
- Use parallel stages for independent operations
- Add approval gates before production deployments

### 2. Variable Management
- Use pipeline variables for reusable values
- Use runtime inputs for deployment-specific values
- Store sensitive data in secrets
- Use expressions for dynamic values

### 3. Failure Handling
- Implement retry logic for transient failures
- Add rollback steps for deployment stages
- Use manual intervention for critical errors
- Set appropriate timeouts for all steps

### 4. Template Usage
- Create templates for repeated patterns
- Version templates for stability
- Use account-level templates for organization-wide patterns
- Document template inputs and outputs

### 5. Security
- Use secrets for all sensitive data
- Enable approval gates for production
- Implement least-privilege access
- Use connectors with scoped permissions

### 6. Monitoring
- Add notification rules for failures
- Use output variables for debugging
- Enable execution history
- Track deployment metrics

## Configuration

The agent uses the following configuration structure:

```typescript
interface HarnessPipelineConfig {
  name: string;
  identifier?: string;
  orgIdentifier: string;
  projectIdentifier: string;
  description?: string;
  tags?: Record<string, string>;
  stages: HarnessStageConfig[];
  variables?: PipelineVariable[];
  notificationRules?: NotificationRule[];
  properties?: PipelineProperties;
}
```

## API Reference

### Methods

#### `createPipeline(config: HarnessPipelineConfig)`
Generate a complete Harness pipeline from configuration.

**Returns**: `Promise<AgentExecutionResult<PipelineCreationResult>>`

#### `createTemplate(config: HarnessTemplateConfig)`
Create a reusable Harness template.

**Returns**: `Promise<AgentExecutionResult<TemplateCreationResult>>`

#### `createPipelineForProject(params: ProjectPipelineParams)`
Auto-generate a pipeline for a scaffolded project.

**Returns**: `Promise<AgentExecutionResult<PipelineCreationResult>>`

#### `suggestPipeline(analysis: ProjectAnalysis)`
Suggest an optimal pipeline based on project patterns.

**Returns**: `Promise<AgentExecutionResult<PipelineSuggestion>>`

#### `validatePipeline(yaml: string)`
Validate pipeline YAML for correctness.

**Returns**: `Promise<AgentExecutionResult<ValidationResult>>`

#### `listTemplates(scope: 'project' | 'org' | 'account')`
List available templates at a specific scope.

**Returns**: `Promise<AgentExecutionResult<HarnessTemplateInfo[]>>`

## Testing

Run tests with:

```bash
npm test
```

Run specific tests:

```bash
npm test -- harness-expert.test.ts
```

## Integration

The Harness Expert Agent integrates with:

- **Scaffold Agent**: Auto-generate pipelines for new projects
- **Harness API Expert**: Deploy pipelines via API
- **Testing Agent**: Generate test pipelines
- **Database Agent**: Generate database migration pipelines

## Examples

See the [examples directory](../examples/) for complete working examples:

- `basic-ci-cd-pipeline.ts` - Simple CI/CD pipeline
- `canary-deployment.ts` - Canary deployment strategy
- `terraform-pipeline.ts` - Infrastructure provisioning
- `multi-stage-pipeline.ts` - Complex multi-stage workflow
- `template-creation.ts` - Creating reusable templates

## Contributing

Contributions are welcome! Please see the [contributing guide](../CONTRIBUTING.md).

## License

MIT License - see [LICENSE](../LICENSE) for details.
