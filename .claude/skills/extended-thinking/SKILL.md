---
name: extended-thinking
description: Extended thinking (ultrathink) configuration for Claude API. Activate for complex reasoning tasks, deep analysis, multi-step problem solving, and tasks requiring careful deliberation. Enables Claude's internal reasoning with configurable thinking budgets.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
  - WebFetch
  - WebSearch
triggers:
  - think
  - think harder
  - ultrathink
  - extended thinking
  - deep thinking
  - reasoning
  - deliberate
  - analyze deeply
  - step by step
  - careful analysis
---

# Extended Thinking (Ultrathink) Skill

Enable Claude's extended thinking capabilities for complex reasoning tasks that benefit from internal deliberation before responding.

## When to Use

- **Complex problem solving** requiring multi-step reasoning
- **Code architecture decisions** with multiple trade-offs
- **Debugging complex issues** needing systematic analysis
- **Strategic planning** with many variables
- **Mathematical or logical proofs**
- **Security analysis** requiring threat modeling
- **Performance optimization** with multiple factors

## Supported Models

| Model | Thinking configuration |
|-------|------------------------|
| Claude Fable 5 (`claude-fable-5`) | Always on — omit the `thinking` param (or `{"type": "adaptive"}`); `{"type": "disabled"}` returns 400 |
| Claude Opus 4.8 / 4.7 (`claude-opus-4-8`) | `{"type": "adaptive"}` (off when omitted); `budget_tokens` removed — returns 400 |
| Claude Sonnet 5 (`claude-sonnet-5`) | Adaptive by default when `thinking` omitted; `budget_tokens` removed — returns 400 |
| Claude Opus 4.6 / Sonnet 4.6 | `{"type": "adaptive"}` recommended; `budget_tokens` deprecated (transitional only) |
| Older models (Sonnet 4.5, Haiku 4.5, ...) | `{"type": "enabled", "budget_tokens": N}` — the manual budget mechanism below |

## API Configuration

### Adaptive Thinking — current models (Python)

On current models (Opus 4.6+, Sonnet 5, Fable 5), adaptive thinking replaces manual budgets: Claude decides when and how much to think, and `output_config.effort` controls depth.

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    output_config={"effort": "high"},  # low | medium | high | xhigh | max
    messages=[{
        "role": "user",
        "content": "Analyze this complex architecture decision..."
    }]
)

# Access thinking and response
for block in response.content:
    if block.type == "thinking":
        print(f"Thinking: {block.thinking}")
    elif block.type == "text":
        print(f"Response: {block.text}")
```

### TypeScript Configuration

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const response = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 16000,
  thinking: { type: "adaptive" },
  output_config: { effort: "high" },
  messages: [
    {
      role: "user",
      content: "Analyze this complex architecture decision...",
    },
  ],
});
```

### Manual Budgets — older models only (`budget_tokens`)

On older models (Sonnet 4.5 / Haiku 4.5 era), extended thinking is enabled with a fixed token budget. `budget_tokens` must be >= 1,024 and < `max_tokens`. **Do not use this shape on current models** — `budget_tokens` is removed on Opus 4.7+, Sonnet 5, and Fable 5 and returns a 400 error (deprecated but still functional on Opus 4.6 / Sonnet 4.6).

```python
response = client.messages.create(
    model="claude-sonnet-4-5",  # older model — manual budget still applies
    max_tokens=16000,
    thinking={
        "type": "enabled",
        "budget_tokens": 10000  # Minimum 1,024
    },
    messages=[{"role": "user", "content": "..."}]
)
```

### Streaming (Required for large max_tokens)

```python
with client.messages.stream(
    model="claude-sonnet-5",
    max_tokens=32000,
    thinking={"type": "adaptive"},
    output_config={"effort": "high"},
    messages=[{"role": "user", "content": prompt}]
) as stream:
    for event in stream:
        if event.type == "content_block_delta":
            if hasattr(event.delta, "thinking"):
                print(event.delta.thinking, end="", flush=True)
            elif hasattr(event.delta, "text"):
                print(event.delta.text, end="", flush=True)
```

## Thinking Depth Recommendations

### Current models — effort levels (`output_config: {"effort": ...}`)

| Effort | Use Case |
|--------|----------|
| `low` | Simple clarifications, latency-sensitive tasks, subagents |
| `medium` | Code review, debugging, design decisions (good cost balance) |
| `high` (default) | Architecture planning, security audits, intelligence-sensitive work |
| `xhigh` | The hardest coding and agentic tasks (Opus 4.7+, Sonnet 5, Fable 5) |
| `max` | Correctness matters more than cost; can be prone to overthinking |

### Older models — budget_tokens

| Task Complexity | Budget Tokens | Use Case |
|-----------------|---------------|----------|
| **Light** | 1,024 - 4,000 | Simple clarifications, basic analysis |
| **Medium** | 4,000 - 10,000 | Code review, debugging, design decisions |
| **Heavy** | 10,000 - 20,000 | Architecture planning, security audits |
| **Complex** | 20,000 - 32,000 | Multi-system analysis, comprehensive reviews |
| **Maximum** | 32,000+ | Use batch API for budgets exceeding 32k |

## Tool Use with Extended Thinking

**CRITICAL**: When using tools with extended thinking, you MUST preserve thinking blocks in the conversation history.

```python
# Initial request with thinking
response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    tools=[{
        "name": "analyze_code",
        "description": "Analyze code for issues",
        "input_schema": {
            "type": "object",
            "properties": {"code": {"type": "string"}},
            "required": ["code"]
        }
    }],
    messages=[{"role": "user", "content": "Analyze this code..."}]
)

# MUST include ALL content blocks including thinking
tool_use_block = next(b for b in response.content if b.type == "tool_use")
tool_result = execute_tool(tool_use_block)

# Continue with thinking blocks preserved
follow_up = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    tools=[...],
    messages=[
        {"role": "user", "content": "Analyze this code..."},
        {"role": "assistant", "content": response.content},  # Includes thinking!
        {"role": "user", "content": [{
            "type": "tool_result",
            "tool_use_id": tool_use_block.id,
            "content": tool_result
        }]}
    ]
)
```

## Interleaved Thinking

On current models (Opus 4.6+, Sonnet 5, Fable 5), adaptive thinking automatically interleaves thinking between tool calls — no beta header needed:

```python
response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=16000,
    thinking={"type": "adaptive"},
    messages=[...]
)
```

On older Claude 4 models using manual `budget_tokens`, interleaved thinking requires the `interleaved-thinking-2025-05-14` beta header.

## Constraints

- **Current models (Opus 4.7+, Sonnet 5, Fable 5)**: `budget_tokens`, `temperature`, `top_p`, and `top_k` are all removed — sending any of them returns 400
- **Older models**: minimum `budget_tokens` is 1,024 and must be < `max_tokens`; temperature must be 1 (default); `top_k` cannot be used with extended thinking
- **Maximum output**: 128k tokens (thinking + response); Haiku 4.5 caps at 64k
- **Streaming required**: For large max_tokens (above ~16k, to avoid SDK HTTP timeouts)
- **System prompts**: Fully compatible

## Best Practices

1. **Start conservative**: Begin with lower budgets, increase as needed
2. **Monitor actual usage**: Track `thinking_tokens` in response usage
3. **Use streaming**: For better UX and larger outputs
4. **Preserve thinking blocks**: Critical for multi-turn tool use
5. **Batch for heavy workloads**: Use batch API for budgets > 32k tokens
6. **Match budget to task**: Don't over-allocate for simple tasks

## Integration with Claude Code

When using Claude Code CLI with extended thinking models:

```bash
# The CLI automatically handles extended thinking for supported models
# Use opus or sonnet models for complex tasks

claude --model claude-opus-4-8 "Analyze this codebase architecture"
```

## See Also

- [[complex-reasoning]] - Multi-step reasoning patterns
- [[deep-analysis]] - Analytical thinking templates
- [[llm-integration]] - General LLM API patterns
