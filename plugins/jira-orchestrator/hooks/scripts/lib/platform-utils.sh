#!/usr/bin/env bash
# Platform Utilities for Cross-Platform Compatibility
# Provides helper functions for Windows Git Bash, macOS, and Linux
#
# Usage: source this file in other scripts
#   source "$(dirname "$0")/lib/platform-utils.sh"

# Detect platform
is_windows() {
    [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]
}

is_macos() {
    [[ "$OSTYPE" == "darwin"* ]]
}

is_linux() {
    [[ "$OSTYPE" == "linux-gnu"* ]]
}

# Get file modification time (Unix timestamp)
# Usage: get_mtime "/path/to/file"
get_mtime() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        echo "0"
        return 1
    fi

    if is_windows; then
        # Windows Git Bash - use Python as fallback
        python -c "import os; print(int(os.path.getmtime('$file')))" 2>/dev/null || echo "0"
    elif is_macos; then
        # macOS uses BSD stat
        stat -f %m "$file" 2>/dev/null || echo "0"
    else
        # Linux uses GNU stat
        stat -c %Y "$file" 2>/dev/null || echo "0"
    fi
}

# Convert ISO date string to Unix timestamp
# Usage: date_to_epoch "2025-12-29T10:00:00.000Z"
date_to_epoch() {
    local datestr="$1"

    if is_windows; then
        # Windows Git Bash - use Python
        python -c "
from datetime import datetime
import sys
try:
    dt = datetime.fromisoformat(sys.argv[1].replace('Z', '+00:00'))
    print(int(dt.timestamp()))
except:
    print(0)
" "$datestr" 2>/dev/null || echo "0"
    elif is_macos; then
        # macOS BSD date
        date -j -f "%Y-%m-%dT%H:%M:%S" "${datestr%%.*}" +%s 2>/dev/null || echo "0"
    else
        # Linux GNU date
        date -d "$datestr" +%s 2>/dev/null || echo "0"
    fi
}

# Get current Unix timestamp
get_current_epoch() {
    date +%s
}

# Calculate age in seconds
# Usage: get_age_seconds "/path/to/file"
get_age_seconds() {
    local file="$1"
    local mtime
    mtime=$(get_mtime "$file")
    local now
    now=$(get_current_epoch)
    echo $((now - mtime))
}

# Check if jq is available
has_jq() {
    command -v jq &> /dev/null
}

# Check if Python is available
has_python() {
    command -v python &> /dev/null || command -v python3 &> /dev/null
}

# Get Python command
get_python() {
    if command -v python3 &> /dev/null; then
        echo "python3"
    elif command -v python &> /dev/null; then
        echo "python"
    else
        echo ""
    fi
}

# Check required dependencies
check_dependencies() {
    local missing=()

    for cmd in "$@"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing+=("$cmd")
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        echo "ERROR: Missing required dependencies: ${missing[*]}" >&2
        return 1
    fi
    return 0
}

# Platform info for logging
get_platform_info() {
    echo "OS: $OSTYPE | Shell: $SHELL | Bash: $BASH_VERSION"
}

# ============================================================================
# Hook Tracing Utilities
# ============================================================================

# Hook trace directory
HOOK_TRACE_DIR="${CLAUDE_PLUGIN_ROOT}/sessions/traces/hooks"

# Ensure trace directory exists
ensure_trace_dir() {
    mkdir -p "$HOOK_TRACE_DIR" 2>/dev/null
}

# Get current timestamp in milliseconds (cross-platform)
# Usage: timestamp_ms=$(get_timestamp_ms)
get_timestamp_ms() {
    if is_windows; then
        # Windows Git Bash - use Python
        python -c "import time; print(int(time.time() * 1000))" 2>/dev/null || echo "0"
    elif is_macos; then
        # macOS BSD date - use Python or calculate from seconds
        if has_python; then
            python3 -c "import time; print(int(time.time() * 1000))" 2>/dev/null || echo "0"
        else
            # Fallback: seconds only (multiply by 1000)
            echo $(($(date +%s) * 1000))
        fi
    else
        # Linux GNU date - can use %N for nanoseconds
        local seconds=$(date +%s)
        local nanoseconds=$(date +%N 2>/dev/null || echo "0")
        # Convert to milliseconds: seconds * 1000 + nanoseconds / 1000000
        echo $((seconds * 1000 + nanoseconds / 1000000))
    fi
}

# Start a hook trace
# Usage: trace_id=$(hook_trace_start "hook-name" "event-type" "hook-type")
hook_trace_start() {
    local hook_name="$1"
    local event_type="$2"
    local hook_type="$3"

    ensure_trace_dir

    # Generate trace ID using timestamp + random (cross-platform)
    local seconds=$(date +%s)
    local nanoseconds=$(date +%N 2>/dev/null || echo "000000000")
    local trace_id="trace_${seconds}_${nanoseconds}_${RANDOM}"
    local start_time=$(get_timestamp_ms)  # milliseconds

    # Create trace file
    local trace_file="${HOOK_TRACE_DIR}/${trace_id}.json"

    cat > "$trace_file" <<EOF
{
  "traceId": "${trace_id}",
  "hookName": "${hook_name}",
  "eventType": "${event_type}",
  "hookType": "${hook_type}",
  "startTime": ${start_time},
  "status": "running",
  "pid": $$
}
EOF

    echo "$trace_id"
}

# End a hook trace
# Usage: hook_trace_end "$trace_id" "success|error|timeout" "optional error message"
hook_trace_end() {
    local trace_id="$1"
    local status="$2"
    local error_msg="${3:-}"

    local trace_file="${HOOK_TRACE_DIR}/${trace_id}.json"

    if [[ ! -f "$trace_file" ]]; then
        echo "WARN: Trace file not found: $trace_file" >&2
        return 1
    fi

    local end_time=$(get_timestamp_ms)  # milliseconds

    # Read existing trace
    local start_time
    start_time=$(grep -o '"startTime": [0-9]*' "$trace_file" | cut -d' ' -f2)

    # Validate start_time was extracted successfully
    if [[ -z "$start_time" ]] || ! [[ "$start_time" =~ ^[0-9]+$ ]]; then
        echo "WARN: Failed to extract startTime from trace file: $trace_file" >&2
        # Try to use jq as fallback if available
        if has_jq; then
            start_time=$(jq -r '.startTime // empty' "$trace_file" 2>/dev/null)
        fi
        # If still empty, use end_time as fallback (duration will be 0)
        if [[ -z "$start_time" ]] || ! [[ "$start_time" =~ ^[0-9]+$ ]]; then
            start_time="$end_time"
        fi
    fi

    local duration=$((end_time - start_time))

    # Update trace file with completion data
    local temp_file="${trace_file}.tmp"

    if [[ -n "$error_msg" ]]; then
        # Include error message
        jq --arg status "$status" \
           --arg endTime "$end_time" \
           --arg duration "$duration" \
           --arg error "$error_msg" \
           '. + {status: $status, endTime: ($endTime|tonumber), duration: ($duration|tonumber), error: $error}' \
           "$trace_file" > "$temp_file" 2>/dev/null
    else
        # No error message
        jq --arg status "$status" \
           --arg endTime "$end_time" \
           --arg duration "$duration" \
           '. + {status: $status, endTime: ($endTime|tonumber), duration: ($duration|tonumber)}' \
           "$trace_file" > "$temp_file" 2>/dev/null
    fi

    if [[ $? -eq 0 ]]; then
        mv "$temp_file" "$trace_file"
    else
        # Fallback if jq not available - simple append
        rm -f "$temp_file"
        # Just mark completion in a simple way
        echo "  # Completed: $status at $end_time (${duration}ms)" >> "$trace_file"
    fi
}

# Log trace event (append metadata)
# Usage: hook_trace_log "$trace_id" "key" "value"
hook_trace_log() {
    local trace_id="$1"
    local key="$2"
    local value="$3"

    local trace_file="${HOOK_TRACE_DIR}/${trace_id}.json"

    if [[ ! -f "$trace_file" ]]; then
        return 1
    fi

    # Add to metadata section
    if has_jq; then
        local temp_file="${trace_file}.tmp"
        jq --arg key "$key" --arg value "$value" \
           '.metadata = (.metadata // {}) | .metadata[$key] = $value' \
           "$trace_file" > "$temp_file" 2>/dev/null && mv "$temp_file" "$trace_file"
    fi
}

# Export functions
export -f is_windows is_macos is_linux
export -f get_mtime date_to_epoch get_current_epoch get_age_seconds
export -f has_jq has_python get_python check_dependencies get_platform_info
export -f ensure_trace_dir get_timestamp_ms hook_trace_start hook_trace_end hook_trace_log
