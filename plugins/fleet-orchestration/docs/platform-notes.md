# Platform notes

**These are documented platform properties, not assumptions of the protocol.**
The protocol needs a concurrent append and a reliable exit code; how you get
them differs by host. Each item below was hit during the run that produced
this plugin, on Windows with Git Bash and PowerShell 7 available.

## Concurrent append to a shared log

Many sessions append to the same run directory.

- **Windows:** use `[IO.File]::Open($path,'Append','Write','ReadWrite')` or
  `Add-Content`. A POSIX `>>` — and `tail` — against a file another session
  holds open **can block until the calling tool's timeout**. It presents as a
  hung session, which is the exact failure the heartbeat monitor exists to
  detect, from a cause that has nothing to do with the session.
- **POSIX:** `>>` on a local filesystem is fine for a single short line.
- `fleet hb` (in `scripts/fleet.mjs`) uses Node's append flag, which opens
  with shared read/write on Windows — the same property — and validates the
  line before writing it. Prefer it; the shell scripts remain for hosts
  without Node.

## Exit codes through pipes

- **POSIX:** a pipe reports the **last** command's status.
  `cmd > log; echo $?; tail log` prints the tail's exit code, not `cmd`'s.
  Capture the status immediately after the command, before any shaping.
- **PowerShell:** `Select-Object -First N` on a native command's output can
  stop the pipeline early and discard the native exit status. Capture
  `$LASTEXITCODE` before filtering.
- **Timeout kill:** 128 + SIGTERM = **143** on POSIX. Learn it by sight; it is
  not an ordinary nonzero, and the command may already have printed a
  plausible partial result.

## Recursive tree walks

- `Get-ChildItem -Recurse` **without `-Force`** silently skips hidden and
  dotted directories — which is where configuration usually lives. Any sweep
  claiming to cover a tree passes `-Force`.
- `rg` skips hidden directories without `--hidden`, and ignores files matched
  by ignore rules unless told otherwise. For an inventory that must be
  complete, enumerate from version control rather than from the filesystem.
- `find -mtime +N` means **N+1** days, not N — it discards the remainder. A
  14-day retention window first reaps at 15.

## Long heredocs and generated scripts

Some tool harnesses truncate very long heredocs and mangle escapes inside
them. Write the script to a file, then run the file. This also makes the
script reviewable, which a heredoc is not.

## Shell variables

- **PowerShell variable names are case-insensitive**: `$S` and `$s` are the
  same variable. It bit twice in one day.
- `pwsh -WorkingDirectory` does **not** resolve a relative `-File`. Pass an
  absolute `-File` path.
- .NET I/O APIs ignore PowerShell's `Set-Location`; they resolve relative
  paths against the process working directory.

## Toolchain pins

A repository pinning a runtime version different from the default on PATH can
make **every** package-manager command fail before running anything — and a
`cmd > log; echo $?; tail log` reports the tail's exit 0. Assert the runtime
version matches the pin **first**, and capture the tool's own exit code
before any tail.

## The general shape

Every item here is one of two things: a **concurrency** property of the host,
or a **truncation** of a result. Both are covered by the `evidence-rules`
skill in the abstract; this file is the host-specific instance list, and it
should grow as a fleet meets new hosts.
