#!/usr/bin/env bash

set -euo pipefail

readonly MAX_ATTEMPTS=40
readonly SLEEP_INTERVAL=2
readonly DDL_DIR="/usr/local/db/ddl"
readonly SQLCMD="/opt/mssql-tools18/bin/sqlcmd"
readonly FLAG_FILE="/var/opt/mssql/.db_initialized"

log() { echo "[init-db] $*"; }

# ── 1. Wait for SQL Server engine ─────────────────────────────────────────────
wait_for_sqlserver() {
  local attempt=0
  log "Waiting for SQL Server to be ready…"
  until "${SQLCMD}" -S localhost -U sa -P "${MSSQL_SA_PASSWORD}" \
        -Q "SELECT 1" -No &>/dev/null; do
    attempt=$(( attempt + 1 ))
    if (( attempt >= MAX_ATTEMPTS )); then
      log "ERROR: SQL Server did not become ready after ${MAX_ATTEMPTS} attempts."
      exit 1
    fi
    log "Attempt ${attempt}/${MAX_ATTEMPTS} — retrying in ${SLEEP_INTERVAL}s…"
    sleep "${SLEEP_INTERVAL}"
  done
  log "SQL Server is ready."
}

# ── 2. Create the application database ────────────────────────────────────────
create_database() {
  local db="${MSSQL_DB:-ft_transcendence}"
  log "Ensuring database '${db}' exists…"
  "${SQLCMD}" -S localhost -U sa -P "${MSSQL_SA_PASSWORD}" -No -Q \
    "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${db}')
     BEGIN
       CREATE DATABASE [${db}];
       PRINT 'Database ${db} created.';
     END
     ELSE
       PRINT 'Database ${db} already exists — skipping.';"
}

# ── 3. Wait until the database actually accepts connections ───────────────────
# sys.databases.state_desc transitions to ONLINE slightly before the database
# is ready to accept connections with -d. The only reliable gate is to attempt
# a real connection directly against the target database and retry until it works.
wait_for_database_connectable() {
  local db="${MSSQL_DB:-ft_transcendence}"
  local attempt=0
  log "Waiting for database '${db}' to accept connections…"
  until "${SQLCMD}" -S localhost -U sa -P "${MSSQL_SA_PASSWORD}" \
        -d "${db}" -Q "SELECT 1" -No &>/dev/null; do
    attempt=$(( attempt + 1 ))
    if (( attempt >= MAX_ATTEMPTS )); then
      log "ERROR: Database '${db}' did not accept connections after ${MAX_ATTEMPTS} attempts."
      exit 1
    fi
    log "Not connectable yet — retrying in ${SLEEP_INTERVAL}s… (${attempt}/${MAX_ATTEMPTS})"
    sleep "${SLEEP_INTERVAL}"
  done
  log "Database '${db}' is ready."
}

# ── 4. Create SQL schemas ──────────────────────────────────────────────────────
create_schemas() {
  local db="${MSSQL_DB:-ft_transcendence}"
  log "Ensuring SQL schemas exist: auth, core…"
  "${SQLCMD}" -S localhost -U sa -P "${MSSQL_SA_PASSWORD}" -d "${db}" -No -Q \
    "IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'auth')
       EXEC('CREATE SCHEMA [auth]');
     IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'core')
       EXEC('CREATE SCHEMA [core]');"
  log "Schemas ready."
}

# ── 5. Apply DDL scripts ───────────────────────────────────────────────────────
run_ddl_scripts() {
  if [[ -f "${FLAG_FILE}" ]]; then
    log "DDL already applied on a previous run — skipping."
    return 0
  fi

  local db="${MSSQL_DB:-ft_transcendence}"
  local scripts
  mapfile -t scripts < <(find "${DDL_DIR}" -maxdepth 1 -name "*.sql" | sort)

  if (( ${#scripts[@]} == 0 )); then
    log "No DDL scripts found in ${DDL_DIR} — skipping."
    touch "${FLAG_FILE}"
    return 0
  fi

  log "Applying ${#scripts[@]} DDL script(s) against '${db}'…"
  for script in "${scripts[@]}"; do
    log "  → $(basename "${script}")"
    "${SQLCMD}" -S localhost -U sa -P "${MSSQL_SA_PASSWORD}" \
      -d "${db}" -No -i "${script}"
  done

  touch "${FLAG_FILE}"
  log "DDL scripts applied successfully."
}

wait_for_sqlserver
create_database
wait_for_database_connectable
create_schemas
run_ddl_scripts
log "Initialisation complete."
