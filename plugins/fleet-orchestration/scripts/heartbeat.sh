#!/usr/bin/env bash
# Append one heartbeat line to a lane's heartbeat file.
#
# POSIX hosts: O_APPEND on a local filesystem is atomic for writes under
# PIPE_BUF, which is what a heartbeat line is. This is safe here.
#
# Windows hosts: use heartbeat.ps1 instead. A POSIX `>>` or `tail` against a
# file another session holds open can block until the calling tool's timeout.
# That is a platform property, not a rule of this protocol.
#
# Usage:
#   heartbeat.sh <log-root> <lane> <state> <task> [note]
#   state: start|working|waiting|blocked|delivered|standby

set -euo pipefail

if [ "$#" -lt 4 ]; then
  echo "usage: $0 <log-root> <lane> <state> <task> [note]" >&2
  exit 2
fi

log_root=$1
lane=$2
state=$3
task=$4
note=${5:-}

case "$state" in
  start|working|waiting|blocked|delivered|standby) ;;
  *) echo "invalid state: $state" >&2; exit 2 ;;
esac

dir="$log_root/heartbeats"
mkdir -p "$dir"

utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)
line="$utc | $state | $task | $note"

printf '%s\n' "$line" >> "$dir/$lane.md"
printf '%s\n' "$line"
