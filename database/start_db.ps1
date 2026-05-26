# Start PostgreSQL local database server on port 5433 using portable relative paths
$dbDir = $PSScriptRoot
$dataDir = Join-Path $dbDir "data"
$logFile = Join-Path $dbDir "pg.log"

pg_ctl -D "$dataDir" -o "-p 5433" -l "$logFile" start
