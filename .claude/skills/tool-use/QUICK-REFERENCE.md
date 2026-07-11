# Tool Use Quick Reference

## Tool Choice Modes at a Glance

```python
# Default: Let Claude decide
# tool_choice="auto" or omit parameter

# Force any tool to be used
tool_choice={"type": "any"}

# Force specific tool (JSON output)
tool_choice={"type": "tool", "name": "my_tool"}

# No tool use
tool_choice={"type": "none"}
```

## Tool Definition Template

```python
{
    "name": "tool_name",
    "description": "What does this tool do? When should it be used? What does it return? Any limitations?",
    "input_schema": {
        "type": "object",
        "properties": {
            "param1": {
                "type": "string",
                "description": "Parameter description"
            },
            "param2": {
                "type": "integer",
                "description": "Parameter description"
            }
        },
        "required": ["param1"],
        "additionalProperties": false
    },
    "input_examples": [  # Optional, beta feature
        {"param1": "example1", "param2": 10}
    ]
}
```

## Response Handling

### Tool Use Response
```python
if response.stop_reason == "tool_use":
    for block in response.content:
        if block.type == "tool_use":
            tool_name = block.name
            tool_id = block.id
            inputs = block.input
```

### Return Tool Result
```python
{
    "type": "tool_result",
    "tool_use_id": "toolu_xxx",  # From tool_use block
    "content": "Result string",
    "is_error": False  # Set true if error occurred
}
```

## Parallel Tools Pattern

```python
# Execute all tools in parallel and return results in ONE message
tool_results = []
for tool_use in tool_uses:
    result = execute_tool(tool_use.name, tool_use.input)
    tool_results.append({
        "type": "tool_result",
        "tool_use_id": tool_use.id,
        "content": result
    })

# CRITICAL: All results in ONE user message
response = client.messages.create(
    model="claude-sonnet-5",
    max_tokens=1024,
    tools=tools,
    messages=[
        {"role": "user", "content": "..."},
        {"role": "assistant", "content": response.content},
        {"role": "user", "content": tool_results}  # All together!
    ]
)
```

## Strict Schema Mode (Beta)

```python
# Enable guaranteed schema conformance
tools=[{
    "name": "my_tool",
    "strict": True,  # Add this
    "input_schema": {...}
}]

# Requires beta header
betas=["structured-outputs-2025-11-13"]
```

## Extended Thinking + Tools

```python
# ✅ Works with extended thinking
thinking={"type": "adaptive"},
tool_choice={"type": "auto"}  # Only auto or none

# ❌ Doesn't work with extended thinking
tool_choice={"type": "any"}  # Error!
tool_choice={"type": "tool", "name": "..."}  # Error!

# Use "think" tool instead for complex reasoning
```

## Error Handling

```python
# Tool execution error
{
    "type": "tool_result",
    "tool_use_id": "toolu_xxx",
    "content": "Error message",
    "is_error": True
}

# Invalid parameters
{
    "type": "tool_result",
    "tool_use_id": "toolu_xxx",
    "content": "Error: Missing required parameter 'location'",
    "is_error": True
}

# Handle max_tokens truncation
if response.stop_reason == "max_tokens":
    if response.content[-1].type == "tool_use":
        # Retry with higher limit
        response = client.messages.create(
            max_tokens=4096,  # Increased
            messages=messages,
            tools=tools
        )
```

## Common JSON Schema Patterns

### Enum (Constrained Values)
```python
"status": {
    "type": "string",
    "enum": ["pending", "approved", "rejected"]
}
```

### Nested Object
```python
"address": {
    "type": "object",
    "properties": {
        "street": {"type": "string"},
        "city": {"type": "string"}
    },
    "required": ["street", "city"],
    "additionalProperties": false
}
```

### Array
```python
"tags": {
    "type": "array",
    "items": {"type": "string"},
    "minItems": 1
}
```

### Optional Field
```python
"description": {
    "type": "string",
    "description": "Optional description"
}
# (Don't include in "required" array)
```

## Best Practices Checklist

- [ ] Tool description is 3-4+ sentences
- [ ] Description explains when to use tool
- [ ] Description explains what tool returns
- [ ] Description mentions any limitations
- [ ] Use `input_examples` for complex schemas
- [ ] Set `additionalProperties: false`
- [ ] Use enums for constrained parameters
- [ ] Required fields explicitly listed
- [ ] All tool results in ONE user message (parallel)
- [ ] Tool result blocks BEFORE text content
- [ ] Use `strict: true` for production agents
- [ ] Test parallel tool calls working
- [ ] Error messages include context

## Performance Tips

| Issue | Solution |
|-------|----------|
| Slow first tool use | Normal: grammar compilation. Cached for 24h after. |
| Tool calls consuming tokens | Compress results, use summaries, chunk operations |
| Parallel tools not working | Check message formatting, verify all results in one message |
| Extended thinking + tools failing | Use `tool_choice: "auto"` and "think" tool only |
| Invalid parameters | Use `strict: true` to prevent entirely |

## Model Selection for Tools

| Model | Best For | Note |
|-------|----------|------|
| Claude Opus 4.8 | Complex tools, ambiguous queries | Best parallel tool use |
| Claude Sonnet 5 | General tool use, balance | Good default choice |
| Claude Haiku 4.5 | Straightforward tools | May infer missing params |

## Stop Reasons

| Stop Reason | Action |
|-------------|--------|
| `tool_use` | Extract tools, execute, return results |
| `end_turn` | Response complete, no more tool calls |
| `max_tokens` | If tool_use incomplete, retry with higher limit |
| `pause_turn` | Continue conversation with server tools |

## SDK Tool Runner

```python
# Python SDK - automatic tool execution
from anthropic import beta_tool

@beta_tool
def my_tool(param: str) -> str:
    """Tool description."""
    return "result"

runner = client.beta.messages.tool_runner(
    model="claude-sonnet-5",
    max_tokens=1024,
    tools=[my_tool],
    messages=[{"role": "user", "content": "..."}]
)

# Iterate or get final
for message in runner:
    print(message)

final = runner.until_done()
```

## Formatting Rules

### Correct Tool Result Format
```python
# ✅ CORRECT
{"role": "user", "content": [
    {"type": "tool_result", "tool_use_id": "id1", "content": "result1"},
    {"type": "tool_result", "tool_use_id": "id2", "content": "result2"}
]}

# ❌ WRONG
{"role": "user", "content": [
    {"type": "text", "text": "Results:"},  # Text before results!
    {"type": "tool_result", "tool_use_id": "id1", "content": "result1"}
]}
```

## Structured Output (JSON Mode)

```python
# Use tool as JSON schema without execution
tool_choice={"type": "tool", "name": "output_schema"},
tools=[{
    "name": "output_schema",
    "description": "Format output as JSON",
    "input_schema": {
        "type": "object",
        "properties": {
            "field1": {"type": "string"},
            "field2": {"type": "integer"}
        },
        "required": ["field1", "field2"],
        "additionalProperties": false
    }
}]

# Extract structured data from tool_use.input
structured = tool_use.input
```
