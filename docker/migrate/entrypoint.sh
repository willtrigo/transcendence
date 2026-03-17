#!/usr/bin/env sh
# entrypoint.sh — Prisma migration + seed runner
#
# Strategy: attempt migrate deploy first. If it fails with P3005
# (database schema not empty, no migration history), baseline all
# existing migrations then proceed to seed. This avoids fragile
# output-parsing to detect first boot vs subsequent boots.
set -e

log() { echo "[migrate] $*"; }

run_deploy() {
  log "Running prisma migrate deploy…"
  pnpm prisma migrate deploy
}

run_baseline() {
  log "Baselining existing schema (first boot after DDL scripts)…"
  for dir in prisma/migrations/*/; do
    name=$(basename "$dir")
    log "  Resolving: $name"
    # --applied is idempotent in Prisma 7: already-applied migrations are skipped
    pnpm prisma migrate resolve --applied "$name" 2>&1 | grep -v "^$" || true
  done
  log "Baseline complete."
}

# Try deploy; if P3005 (non-empty DB with no migration history) → baseline first
if ! OUTPUT=$(pnpm prisma migrate deploy 2>&1); then
  echo "$OUTPUT"
  if echo "$OUTPUT" | grep -q "P3005"; then
    run_baseline
    log "Running prisma migrate deploy after baseline…"
    pnpm prisma migrate deploy
  else
    log "ERROR: Migration failed with unexpected error."
    echo "$OUTPUT"
    exit 1
  fi
else
  echo "$OUTPUT"
  log "Migrations applied successfully."
fi

# ── Seed (idempotent — all operations use upsert) ─────────────────────────────
log "Running prisma db seed…"
pnpm prisma db seed

log "Done."
