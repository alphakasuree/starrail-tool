param([switch]$Build)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$runtime = Join-Path $projectRoot 'tmp/runtime'
# MySQL's Windows command-line parser requires an ASCII path. The junction
# points to the project runtime, so database files still live inside tmp/runtime.
$hash = [Security.Cryptography.SHA256]::Create()
try { $runtimeKey = ([BitConverter]::ToString($hash.ComputeHash([Text.Encoding]::UTF8.GetBytes($projectRoot)))).Replace('-', '').Substring(0,12) } finally { $hash.Dispose() }
$mysqlRuntime = Join-Path ([IO.Path]::GetTempPath()) "honkai-mysql-$runtimeKey"
if ($mysqlRuntime -match '[^\x00-\x7F]') { throw 'MySQL requires an ASCII Windows TEMP path.' }
if (-not (Test-Path -LiteralPath $mysqlRuntime)) {
    New-Item -ItemType Junction -Path $mysqlRuntime -Value $runtime | Out-Null
} else {
    $link = Get-Item -LiteralPath $mysqlRuntime
    if ($link.LinkType -ne 'Junction' -or [IO.Path]::GetFullPath($link.Target[0]) -ne [IO.Path]::GetFullPath($runtime)) { throw 'Runtime junction points to another directory.' }
}
$mysqlHome = Join-Path $mysqlRuntime 'mysql-8.4.9-winx64'
$mysqlServer = Join-Path $mysqlHome 'bin/mysqld.exe'
$maven = Join-Path $runtime 'apache-maven-3.9.11/bin/mvn.cmd'
$jar = Join-Path $PSScriptRoot 'target/honkai-backend-0.1.0.jar'
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Write-Utf8($path, $value) { [IO.File]::WriteAllText($path, $value, $utf8) }
function New-Password {
    $bytes = New-Object byte[] 32
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
}
function Test-MySQL {
    $ErrorActionPreference = 'SilentlyContinue'
    & (Join-Path $mysqlHome 'bin/mysql.exe') "--defaults-file=$client" --batch --skip-column-names --execute='SELECT 1' 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
}
function Read-Environment {
    $settings = @{}
    foreach ($line in [IO.File]::ReadAllLines((Join-Path $PSScriptRoot '.env'))) {
        if ($line -match '^([A-Z_]+)=(.*)$') { $settings[$matches[1]] = $matches[2] }
    }
    foreach ($key in @('MYSQL_DATABASE','MYSQL_USER','MYSQL_PASSWORD','MYSQL_ROOT_PASSWORD','FRONTEND_ORIGINS')) {
        if (-not $settings[$key]) { throw "Missing $key in backend/.env" }
    }
    return $settings
}
if (-not (Test-Path -LiteralPath $mysqlServer)) { throw 'Download MySQL ZIP into tmp/runtime first; see backend/README.md.' }
if ($Build -or -not (Test-Path -LiteralPath $jar)) {
    if (-not (Test-Path -LiteralPath $maven)) { throw 'Download Maven ZIP into tmp/runtime first; see backend/README.md.' }
    Push-Location $PSScriptRoot
    try {
        & $maven "-Dmaven.repo.local=$runtime/m2" -B -ntp package
        if ($LASTEXITCODE -ne 0) { throw 'API build or tests failed.' }
    } finally { Pop-Location }
}
$envFile = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path -LiteralPath $envFile)) {
    Write-Utf8 $envFile "MYSQL_DATABASE=honkai`nMYSQL_USER=honkai`nMYSQL_PASSWORD=$(New-Password)`nMYSQL_ROOT_PASSWORD=$(New-Password)`nFRONTEND_ORIGINS=https://alphakasuree.github.io,http://localhost:5500,http://127.0.0.1:5500`n"
}
$settings = Read-Environment
# Restrict identifiers and passwords before using them in bootstrap SQL / client config.
if ($settings.MYSQL_DATABASE -notmatch '^[a-zA-Z0-9_]+$' -or $settings.MYSQL_USER -notmatch '^[a-zA-Z0-9_]+$') { throw 'Use alphanumeric database/user names.' }
if ($settings.MYSQL_PASSWORD -notmatch '^[a-zA-Z0-9_-]{24,}$' -or $settings.MYSQL_ROOT_PASSWORD -notmatch '^[a-zA-Z0-9_-]{24,}$') { throw 'Local runner requires passwords of at least 24 letters, digits, underscores or hyphens.' }
$dataDir = Join-Path $mysqlRuntime 'mysql-data'
$config = Join-Path $mysqlRuntime 'my.ini'
$client = Join-Path $mysqlRuntime 'mysql-client.ini'
$mysqlPid = Join-Path $runtime 'mysql.pid'
$forwardRuntime = $mysqlRuntime.Replace('\','/')
# MySQL on Windows interprets configuration paths in the system code page.
# UTF-8 path values fail when the project directory contains Korean characters.
[IO.File]::WriteAllText($config, "[mysqld]`nbasedir=$($mysqlHome.Replace('\','/'))`ndatadir=$($dataDir.Replace('\','/'))`nbind-address=127.0.0.1`nport=3306`nmysqlx=0`ncharacter-set-server=utf8mb4`ncollation-server=utf8mb4_0900_ai_ci`nlog-error=$forwardRuntime/mysql-error.log`npid-file=$forwardRuntime/mysql.pid`n", [Text.Encoding]::Default)
Write-Utf8 $client "[client]`nuser=root`npassword=$($settings.MYSQL_ROOT_PASSWORD)`nhost=127.0.0.1`nport=3306`nprotocol=tcp`n"
$bootstrap = Join-Path $mysqlRuntime 'mysql-bootstrap.sql'
$newDatabase = -not (Test-Path -LiteralPath (Join-Path $dataDir 'mysql'))
if ($newDatabase) {
    & $mysqlServer "--defaults-file=$config" --initialize-insecure
    if ($LASTEXITCODE -ne 0) { throw 'MySQL initialization failed. See tmp/runtime/mysql-error.log.' }
    Write-Utf8 $bootstrap "ALTER USER 'root'@'localhost' IDENTIFIED BY '$($settings.MYSQL_ROOT_PASSWORD)';`nCREATE DATABASE IF NOT EXISTS $($settings.MYSQL_DATABASE) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;`nCREATE USER IF NOT EXISTS '$($settings.MYSQL_USER)'@'localhost' IDENTIFIED BY '$($settings.MYSQL_PASSWORD)';`nGRANT ALL PRIVILEGES ON $($settings.MYSQL_DATABASE).* TO '$($settings.MYSQL_USER)'@'localhost';`n"
}
$mysqlAdmin = Join-Path $mysqlHome 'bin/mysqladmin.exe'
if (-not (Test-MySQL)) {
    if (Get-NetTCPConnection -LocalPort 3306 -State Listen -ErrorAction SilentlyContinue) { throw 'Port 3306 belongs to another server; refusing to replace it.' }
    $arguments = @("--defaults-file=`"$config`"")
    if (Test-Path -LiteralPath $bootstrap) { $arguments += "--init-file=`"$bootstrap`"" }
    Start-Process -FilePath $mysqlServer -ArgumentList $arguments -WindowStyle Hidden | Out-Null
    Write-Utf8 (Join-Path $runtime 'mysql-executable.txt') ([IO.Path]::GetFullPath($mysqlServer))
    $ready = $false
    for ($i=0; $i -lt 60; $i++) {
        Start-Sleep -Seconds 1
        if (Test-MySQL) { $ready = $true; break }
    }
    if (-not $ready) { throw 'MySQL did not become ready. See tmp/runtime/mysql-error.log.' }
}
if (Test-Path -LiteralPath $bootstrap) { Remove-Item -LiteralPath $bootstrap }
if (Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue) {
    throw 'Port 8080 is in use. Stop the existing API before starting another instance.'
}
$variables = @{
    DB_URL="jdbc:mysql://127.0.0.1:3306/$($settings.MYSQL_DATABASE)?connectionTimeZone=UTC"
    DB_USERNAME=$settings.MYSQL_USER; DB_PASSWORD=$settings.MYSQL_PASSWORD
    FRONTEND_ORIGINS=$settings.FRONTEND_ORIGINS
    SERVER_ADDRESS='127.0.0.1'; PORT='8080'
    SESSION_COOKIE_SECURE='false'; SESSION_COOKIE_SAME_SITE='Lax'
}
$previous = @{}
try {
    foreach ($key in $variables.Keys) { $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process'); [Environment]::SetEnvironmentVariable($key, $variables[$key], 'Process') }
    $java = (Get-Command java.exe -ErrorAction Stop).Source
    $process = Start-Process -FilePath $java -ArgumentList @('-Dfile.encoding=UTF-8', '-jar', "`"$jar`"") -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'api.log') -RedirectStandardError (Join-Path $runtime 'api-error.log')
    Write-Utf8 (Join-Path $runtime 'api.pid') "$($process.Id)"
} finally {
    foreach ($key in $variables.Keys) { [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process') }
}
for ($i=0; $i -lt 90; $i++) {
    if ($process.HasExited) { throw 'API exited. See tmp/runtime/api.log and api-error.log.' }
    try {
        $health = Invoke-RestMethod -Uri 'http://127.0.0.1:8080/api/health' -TimeoutSec 2
        if ($health.status -eq 'ok') {
            $node = Join-Path $runtime 'node.exe'
            if ((Test-Path -LiteralPath $node) -and -not (Get-NetTCPConnection -LocalPort 5500 -State Listen -ErrorAction SilentlyContinue)) {
                $webScript = Join-Path $projectRoot 'scripts/serve-local.mjs'
                $web = Start-Process -FilePath $node -ArgumentList "`"$webScript`"" -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'frontend.log') -RedirectStandardError (Join-Path $runtime 'frontend-error.log')
                Write-Utf8 (Join-Path $runtime 'frontend.pid') "$($web.Id)"
            }
            Write-Host 'MySQL: 127.0.0.1:3306 | API: http://localhost:8080/api/health'
            if (Test-Path -LiteralPath $node) { Write-Host 'Frontend: http://localhost:5500' }
            return
        }
    } catch { Start-Sleep -Seconds 1 }
}
throw 'API did not become ready. See tmp/runtime/api.log.'
