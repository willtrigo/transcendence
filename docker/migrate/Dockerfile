# ─── Prisma Migration + Seed Runner ───────────────────────────────────────────
# One-shot service. Startup logic:
#   1. If _prisma_migrations table is empty → baseline all existing migrations
#      (DDL scripts already built the schema; we just record them as applied).
#   2. If _prisma_migrations table exists and has rows → run migrate deploy
#      normally (picks up any new migrations since last run).
#   3. Always run prisma db seed (uses upsert — idempotent).
FROM node:20-alpine AS migrate
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma         ./prisma
COPY prisma.config.ts ./

ENV DATABASE_URL="sqlserver://build-placeholder:1433;database=placeholder;user=sa;password=Placeholder1!;encrypt=true;trustServerCertificate=true"
RUN pnpm prisma generate
ENV DATABASE_URL=""

COPY docker/migrate/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

CMD ["/usr/local/bin/entrypoint.sh"]
