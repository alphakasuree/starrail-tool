param([switch]$NoBrowser, [switch]$Restart)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$siteUrl = 'http://localhost:5510'
$healthUrl = 'http://127.0.0.1:5510/api/hsr/health'

function Test-UidServer {
    try {
        $health = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2
        return $health.service -eq 'honkai-uid-relay' -and $health.version -eq 2 -and $health.freeChat -eq 2
    } catch { return $false }
}

try {
    if ($Restart -or -not (Test-UidServer)) {
        $serverScript = Join-Path $PSScriptRoot 'serve-local.mjs'
        # Restart only a confirmed relay running this project's exact server script.
        $existingHealth = $null
        try { $existingHealth = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 2 } catch {}
        if ($existingHealth.service -eq 'honkai-uid-relay') {
            $serverArgument = '"' + $serverScript + '"'
            $oldServers = @(Get-CimInstance Win32_Process -Filter "name = 'node.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($serverArgument) })
            if ($oldServers.Count -ne 1) { throw 'Could not safely identify this project server. Restart the server manually.' }
            Stop-Process -Id $oldServers[0].ProcessId -Force
        }
        $nodeExecutable = Join-Path $projectRoot 'tmp\runtime\node.exe'
        if (-not (Test-Path -LiteralPath $nodeExecutable)) {
            $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
            if (-not $nodeCommand) { throw 'Node.js is required. Install Node.js and try again.' }
            $nodeExecutable = $nodeCommand.Source
        }
        $logDirectory = Join-Path $projectRoot 'tmp\web'
        New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
        $env:PORT = '5510'
        $serverProcess = Start-Process -FilePath $nodeExecutable -ArgumentList ('"' + $serverScript + '"') -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDirectory 'server.log') -RedirectStandardError (Join-Path $logDirectory 'server-error.log')
        $ready = $false
        for ($attempt = 0; $attempt -lt 20; $attempt++) {
            if (Test-UidServer) { $ready = $true; break }
            if ($serverProcess.HasExited) { break }
            Start-Sleep -Milliseconds 250
        }
        if (-not $ready) { throw ('Could not start the UID server. Check port 5510 and ' + (Join-Path $logDirectory 'server-error.log')) }
    }
    Write-Host ('UID server is ready: ' + $siteUrl)
    if (-not $NoBrowser) { Start-Process $siteUrl }
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
