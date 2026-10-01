$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$runtime = Join-Path $projectRoot 'tmp/runtime'
$settings = @{}
[IO.File]::ReadAllLines((Join-Path $PSScriptRoot '.env')) | ForEach-Object {
    if ($_ -match '^([A-Z_]+)=(.*)$') { $settings[$matches[1]]=$matches[2] }
}
if ($settings.MYSQL_USER -notmatch '^[a-zA-Z0-9_]+$') { throw 'Invalid MySQL user.' }
$server = [IO.File]::ReadAllText((Join-Path $runtime 'mysql-executable.txt')).Trim()
$mysqlBin = Split-Path $server
$alias = Split-Path (Split-Path $mysqlBin)
& (Join-Path $mysqlBin 'mysql.exe') "--defaults-file=$alias/mysql-client.ini" --execute="CREATE DATABASE IF NOT EXISTS honkai_account_test CHARACTER SET utf8mb4; GRANT ALL PRIVILEGES ON honkai_account_test.* TO '$($settings.MYSQL_USER)'@'localhost';"
if ($LASTEXITCODE -ne 0) { throw 'Cannot prepare the dedicated test database. Start local MySQL first.' }
$variables = @{
    TEST_DB_URL='jdbc:mysql://127.0.0.1:3306/honkai_account_test?connectionTimeZone=UTC'
    TEST_DB_USERNAME=$settings.MYSQL_USER
    TEST_DB_PASSWORD=$settings.MYSQL_PASSWORD
}
$previous = @{}
Push-Location $PSScriptRoot
try {
    foreach ($key in $variables.Keys) { $previous[$key]=[Environment]::GetEnvironmentVariable($key,'Process'); [Environment]::SetEnvironmentVariable($key,$variables[$key],'Process') }
    & (Join-Path $runtime 'apache-maven-3.9.11/bin/mvn.cmd') "-Dmaven.repo.local=$runtime/m2" -B -ntp test
    if ($LASTEXITCODE -ne 0) { throw 'MySQL integration tests failed.' }
} finally {
    foreach ($key in $variables.Keys) { [Environment]::SetEnvironmentVariable($key,$previous[$key],'Process') }
    Pop-Location
}
