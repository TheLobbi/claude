# Hook System Foundation v1.0

**Branch:** `feature/AI-1099-foundation-fixes`
**Status:** Implementation Complete
**Version:** 1.0.0

## Overview

The Hook System Foundation provides robust infrastructure for loading, validating, executing, tracing, and analyzing Claude Code plugin hooks. This foundation implements fail-fast validation, comprehensive tracing, and production-ready metrics collection.

## Components

### 1. Hook Loader (`lib/hook-loader.ts`)

**Purpose:** Load and validate hook configurations with fail-fast behavior

**Features:**
- JSON schema validation using Zod
- Regex pattern validation for matchers
- Script existence and permission verification (Windows-aware)
- Environment variable expansion in script paths
- Detailed error messages with line numbers
- Type-safe hook definitions

**Key Functions:**
```typescript
loadHooks(hooksPath: string, basePath?: string): HooksConfig
validateHookConfig(config: unknown): HooksConfig
validateMatcherPatterns(config: HooksConfig): void
validateScripts(config: HooksConfig, basePath: string): void
getHooksForEvent(config: HooksConfig, eventType: HookEventType): HookDefinition[]
shouldTriggerHook(hook: HookDefinition, matchString: string): boolean
```

**Error Types:**
- `HookValidationError` - Schema or pattern validation failures
- `HookScriptError` - Script access or permission issues

**Usage:**
```typescript
import { loadHooks } from './lib/hook-loader';

try {
  const hooks = loadHooks('/path/to/hooks.json');
  console.log('Hooks loaded successfully');
} catch (error) {
  // Plugin load blocked - fail fast
  console.error('Failed to load hooks:', error.message);
  process.exit(1);
}
```

---

### 2. Hook Tracer (`lib/hook-tracer.ts`)

**Purpose:** OpenTelemetry-style execution tracing for hooks

**Features:**
- Unique trace and span IDs (UUID v4)
- Nested trace support (parent-child relationships)
- Timing tracking (start, end, duration)
- Status tracking (running, success, error, timeout)
- Metadata attachment
- JSON and NDJSON export formats
- Auto-export on process exit

**Key Functions:**
```typescript
startTrace(hookName, eventType, hookType, parentSpanId?, metadata?): HookTrace
endTrace(trace, status, error?): void
getTrace(spanId): HookTrace | undefined
getActiveTraces(): HookTrace[]
getCompletedTraces(): HookTrace[]
getTracesByHook(hookName): HookTrace[]
getTracesByEvent(eventType): HookTrace[]
exportTraces(outputPath?, options?): string
getStatistics(): TraceStatistics
```

**Trace Structure:**
```typescript
interface HookTrace {
  traceId: string;           // Unique trace identifier
  spanId: string;            // Unique span identifier
  parentSpanId?: string;     // Parent span for nested traces
  hookName: string;          // Hook being traced
  eventType: string;         // Event that triggered hook
  hookType: 'prompt' | 'command';
  startTime: number;         // Unix timestamp (ms)
  endTime?: number;          // Unix timestamp (ms)
  duration?: number;         // Duration in milliseconds
  status: TraceStatus;       // running | success | error | timeout
  error?: string;            // Error message if failed
  metadata?: Record<string, unknown>;
}
```

**Usage:**
```typescript
import { getGlobalTracer } from './lib/hook-tracer';

const tracer = getGlobalTracer();

// Start trace
const trace = tracer.startTrace('detect-jira-issue', 'UserPromptSubmit', 'prompt');

try {
  // Execute hook...
  tracer.endTrace(trace, 'success');
} catch (error) {
  tracer.endTrace(trace, 'error', error.message);
}

// Export traces
const exportPath = tracer.exportTraces();
console.log(`Traces exported to: ${exportPath}`);
```

**Storage:**
- Traces: `sessions/traces/hooks/traces-{timestamp}.json`

---

### 3. Hook Metrics Collector (`lib/hook-metrics.ts`)

**Purpose:** Production metrics collection and analysis

**Features:**
- Execution counts per hook
- Success/failure/timeout tracking
- Timing statistics (min, max, avg)
- Aggregate metrics by event type and hook name
- Execution history (configurable limit)
- Persistent storage
- Report generation

**Key Functions:**
```typescript
recordExecution(hookName, eventType, durationMs, success, timedOut): void
getMetrics(hookName?, eventType?): HookMetrics[]
getAggregateByEventType(): Record<string, AggregateMetrics>
getAggregateByHookName(): Record<string, AggregateMetrics>
getGlobalAggregate(): AggregateMetrics
getExecutionHistory(hookName, eventType, limit?): ExecutionRecord[]
persist(): void
clear(): void
generateReport(): string
```

**Metrics Structure:**
```typescript
interface HookMetrics {
  hookName: string;
  eventType: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  lastExecuted: number;       // Unix timestamp
  firstExecuted: number;      // Unix timestamp
}
```

**Usage:**
```typescript
import { getGlobalCollector } from './lib/hook-metrics';

const collector = getGlobalCollector();

// Record execution
collector.recordExecution('detect-jira-issue', 'UserPromptSubmit', 125, true);

// Get metrics
const metrics = collector.getMetrics('detect-jira-issue');
console.log(`Success rate: ${metrics[0].successCount / metrics[0].executionCount * 100}%`);

// Generate report
const report = collector.generateReport();
console.log(report);

// Persist metrics
collector.persist();
```

**Storage:**
- Metrics: `sessions/metrics/hooks/hook-metrics.json`
- History: `sessions/metrics/hooks/execution-history.json`

---

### 4. JSON Schema (`hooks/schema/hook-config.schema.json`)

**Purpose:** JSON Schema for hooks.json validation

**Features:**
- Draft-07 JSON Schema
- Type-specific validation (prompt vs command)
- Regex pattern enforcement for hook names (kebab-case)
- Timeout range validation (100ms - 300s)
- Conditional field requirements

**Hook Definition Rules:**
- `name`: kebab-case, 1-100 chars
- `description`: 10-500 chars
- `type`: "prompt" or "command"
- `matcher`: valid regex (optional)
- `timeout`: 100-300000 ms
- `prompt`: required if type=prompt
- `command`: required if type=command

---

### 5. Bash Utilities (`hooks/scripts/lib/platform-utils.sh`)

**Purpose:** Cross-platform hook tracing in Bash scripts

**New Functions:**
```bash
hook_trace_start "hook-name" "event-type" "hook-type"
  # Returns: trace_id

hook_trace_end "$trace_id" "success|error|timeout" "optional error message"
  # Updates trace file with completion status

hook_trace_log "$trace_id" "key" "value"
  # Append metadata to trace
```

**Usage in Hook Scripts:**
```bash
#!/usr/bin/env bash
source "$(dirname "$0")/lib/platform-utils.sh"

# Start trace
TRACE_ID=$(hook_trace_start "my-hook" "UserPromptSubmit" "command")

# Execute hook logic
if ./my-hook-logic.sh; then
  hook_trace_end "$TRACE_ID" "success"
else
  hook_trace_end "$TRACE_ID" "error" "Hook logic failed"
fi
```

---

## Configuration

### hooks.json with Schema Reference

```json
{
  "$schema": "./schema/hook-config.schema.json",
  "UserPromptSubmit": [
    {
      "name": "detect-jira-issue",
      "description": "Detects Jira issue keys in user messages",
      "type": "prompt",
      "matcher": "\\b[A-Z]{2,10}-\\d+\\b",
      "timeout": 5000,
      "prompt": "# Jira Issue Detection Hook\n\n..."
    }
  ],
  "PreToolUse": [
    {
      "name": "pr-size-guard",
      "description": "Checks PR size before creation",
      "type": "command",
      "matcher": "harness_deploy|mcp__harness__execute_pipeline",
      "timeout": 10000,
      "command": "${CLAUDE_PLUGIN_ROOT}/hooks/scripts/pr-size-guard.sh main"
    }
  ]
}
```

---

## Technical Decisions (LOCKED)

| Decision | Rationale |
|----------|-----------|
| **Fail Fast on Invalid Hooks** | Block plugin load to prevent runtime failures |
| **Full Script Validation** | Check existence, permissions, syntax before runtime |
| **Zod for Validation** | Type-safe validation with excellent error messages |
| **OpenTelemetry-style Tracing** | Industry-standard distributed tracing patterns |
| **Persistent Metrics** | Survive process restarts for long-term analysis |
| **Windows-Aware Permissions** | Skip Unix execute checks on Windows |
| **Environment Variable Expansion** | Support `${CLAUDE_PLUGIN_ROOT}` in paths |

---

## Directory Structure

```
plugins/jira-orchestrator/
├── hooks/
│   ├── schema/
│   │   └── hook-config.schema.json        # JSON Schema for validation
│   ├── scripts/
│   │   └── lib/
│   │       └── platform-utils.sh          # Bash tracing utilities
│   └── hooks.json                         # Hook configuration (with $schema)
├── lib/
│   ├── hook-loader.ts                     # Hook loading & validation
│   ├── hook-tracer.ts                     # Execution tracing
│   ├── hook-metrics.ts                    # Metrics collection
│   └── hook-foundation-README.md          # This file
├── sessions/
│   ├── traces/
│   │   └── hooks/                         # Trace exports
│   └── metrics/
│       └── hooks/                         # Metrics storage
└── tests/
    └── hook-foundation/
        ├── test_hook_loader.ts            # Loader tests
        ├── test_hook_tracer.ts            # Tracer tests
        └── test_hook_metrics.ts           # Metrics tests
```

---

## Dependencies

### NPM Dependencies
- `zod` ^3.24.1 - Schema validation
- `uuid` ^11.0.5 - UUID generation
- `@types/node` ^22.10.6 - TypeScript types

### Runtime Requirements
- Node.js >= 18.x
- Bash >= 4.x (for hook scripts)
- Python 3.x (for cross-platform date utilities)
- `jq` (optional, for enhanced trace logging)

---

## Testing

### Run Tests

```bash
# Install dependencies
npm install

# Run TypeScript tests (when test runner configured)
npm test -- tests/hook-foundation/

# Manual validation
node -e "const {loadHooks} = require('./lib/hook-loader'); loadHooks('./hooks/hooks.json');"
```

### Test Coverage

| Component | Test File | Coverage |
|-----------|-----------|----------|
| Hook Loader | `test_hook_loader.ts` | Schema validation, regex patterns, script checks |
| Hook Tracer | `test_hook_tracer.ts` | Trace lifecycle, nesting, export, statistics |
| Hook Metrics | `test_hook_metrics.ts` | Recording, aggregation, persistence, reports |

---

## Integration Example

```typescript
import { loadHooks, getHooksForEvent, shouldTriggerHook } from './lib/hook-loader';
import { getGlobalTracer } from './lib/hook-tracer';
import { getGlobalCollector } from './lib/hook-metrics';

// Load hooks at plugin initialization (fail fast)
const hooksConfig = loadHooks('./hooks/hooks.json');
const tracer = getGlobalTracer();
const metrics = getGlobalCollector();

// Execute hooks on event
async function onUserPromptSubmit(userMessage: string) {
  const hooks = getHooksForEvent(hooksConfig, 'UserPromptSubmit');

  for (const hook of hooks) {
    if (!shouldTriggerHook(hook, userMessage)) {
      continue;
    }

    const trace = tracer.startTrace(hook.name, 'UserPromptSubmit', hook.type);
    const startTime = Date.now();

    try {
      if (hook.type === 'prompt') {
        // Inject prompt
        await injectPrompt(hook.prompt);
      } else {
        // Execute command
        await executeCommand(hook.command, hook.timeout);
      }

      const duration = Date.now() - startTime;
      tracer.endTrace(trace, 'success');
      metrics.recordExecution(hook.name, 'UserPromptSubmit', duration, true);
    } catch (error) {
      const duration = Date.now() - startTime;
      tracer.endTrace(trace, 'error', error.message);
      metrics.recordExecution(hook.name, 'UserPromptSubmit', duration, false);
    }
  }
}
```

---

## Next Steps

### Phase 2: Hook Executor
- Implement hook execution engine
- Add timeout enforcement
- Implement retry logic
- Add circuit breaker pattern

### Phase 3: Hook Dashboard
- Real-time metrics visualization
- Trace timeline viewer
- Performance analysis tools
- Alert configuration

### Phase 4: Advanced Features
- Hook dependencies
- Conditional execution chains
- Hook versioning
- A/B testing hooks

---

## References

- [Hook System Documentation](../hooks/README.md)
- [Hook Examples](../hooks/EXAMPLES.md)
- [Hook Verification Guide](../hooks/VERIFICATION.md)
- [JSON Schema Specification](https://json-schema.org/draft-07/schema)
- [OpenTelemetry Tracing](https://opentelemetry.io/docs/concepts/signals/traces/)

---

**Version:** 1.0.0
**Last Updated:** 2026-01-19
**Authors:** Claude, architect-supreme
**License:** MIT
