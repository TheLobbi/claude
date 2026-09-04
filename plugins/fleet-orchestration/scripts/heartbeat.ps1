<#
.SYNOPSIS
Append one heartbeat line to a lane's heartbeat file, tolerating concurrent
readers and writers.

.DESCRIPTION
Opens the file with FileShare.ReadWrite so another session holding the file
open does not block this write, and so this write does not block that
session's read. On Windows, a plain POSIX `>>` or `tail` against a file
another session has open can block until the calling tool's timeout.

The file is the lane's own. Never write another lane's heartbeat file.

.EXAMPLE
pwsh -File heartbeat.ps1 -LogRoot ./.fleet/runs/r1 -Lane lane-api `
     -State working -Task "#412 retry classifier" -Note "worker dispatched"
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$LogRoot,
    [Parameter(Mandatory)][string]$Lane,
    [Parameter(Mandatory)]
    [ValidateSet('start', 'working', 'waiting', 'blocked', 'delivered', 'standby')]
    [string]$State,
    [Parameter(Mandatory)][string]$Task,
    [string]$Note = ''
)

$ErrorActionPreference = 'Stop'

$dir = Join-Path $LogRoot 'heartbeats'
if (-not (Test-Path -LiteralPath $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

$path = Join-Path $dir "$Lane.md"
$utc = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
$line = "$utc | $State | $Task | $Note`r`n"

# FileShare.ReadWrite is the point of this script.
$stream = [IO.File]::Open($path, 'Append', 'Write', 'ReadWrite')
try {
    $writer = New-Object IO.StreamWriter($stream)
    try {
        $writer.Write($line)
        $writer.Flush()
    }
    finally { $writer.Dispose() }
}
finally { $stream.Dispose() }

Write-Output $line.TrimEnd()
