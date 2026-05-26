# Stop PostgreSQL local database server using portable relative paths
$dbDir = $PSScriptRoot
$dataDir = Join-Path $dbDir "data"

pg_ctl -D "$dataDir" stop
