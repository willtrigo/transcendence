#!/usr/bin/env bash

set -euo pipefail

/usr/local/bin/init-db.sh &

exec /opt/mssql/bin/sqlservr "$@"
