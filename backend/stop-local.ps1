$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$runtime = Join-Path $projectRoot 'tmp/runtime'
$frontendPid = Join-Path $runtime 'frontend.pid'
if (Test-Path -LiteralPath $frontendPid) {
    $webProcessId = [int]([IO.File]::ReadAllText($frontendPid).Trim())
    $web = Get-CimInstance Win32_Process -Filter "ProcessId=$webProcessId"
    if ($web) {
        $webScript = Join-Path $projectRoot 'scripts/serve-local.mjs'
        if ($web.Name -ne 'node.exe' -or -not $web.CommandLine.Contains($webScript)) { throw 'PID no longer belongs to this frontend.' }
        Stop-Process -Id $webProcessId
    }
    Remove-Item -LiteralPath $frontendPid
}
$pidFile = Join-Path $runtime 'api.pid'
if (Test-Path -LiteralPath $pidFile) {
    $apiProcessId = [int]([IO.File]::ReadAllText($pidFile).Trim())
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$apiProcessId"
    $jar = Join-Path $PSScriptRoot 'target/honkai-backend-0.1.0.jar'
    if ($process) {
        if ($process.Name -ne 'java.exe' -or -not $process.CommandLine.Contains($jar)) { throw 'PID no longer belongs to this API; refusing to stop it.' }
        Stop-Process -Id $apiProcessId
    }
    Remove-Item -LiteralPath $pidFile
}
$mysqlPidFile = Join-Path $runtime 'mysql.pid'
if (Test-Path -LiteralPath $mysqlPidFile) {
    $mysqlProcessId = [int]([IO.File]::ReadAllText($mysqlPidFile).Trim())
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$mysqlProcessId"
    if ($process) {
        $expectedExe = [IO.File]::ReadAllText((Join-Path $runtime 'mysql-executable.txt')).Trim()
        if ($process.ExecutablePath -ne [IO.Path]::GetFullPath($expectedExe)) { throw 'MySQL PID does not belong to this project.' }
        $mysqlAdmin = Join-Path (Split-Path $expectedExe) 'mysqladmin.exe'
        $config = Join-Path (Split-Path (Split-Path (Split-Path $expectedExe))) 'mysql-client.ini'
        & $mysqlAdmin "--defaults-file=$config" shutdown
        if ($LASTEXITCODE -ne 0) { throw 'MySQL shutdown failed.' }
    }
}
Write-Host 'Local API and MySQL stopped. Database files retained.'
