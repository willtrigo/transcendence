# ─── SQL Server 2022 ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/mssql/server:2022-latest

USER root

# dos2unix ensures scripts are safe regardless of the host OS line endings
RUN apt-get update \
 && apt-get install -y --no-install-recommends dos2unix \
 && rm -rf /var/lib/apt/lists/*

# --chmod=755 sets permissions atomically at copy time, bypassing any host
# filesystem permission issues (Docker Desktop on Mac/Windows).
COPY --chmod=755 docker/db/scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY --chmod=755 docker/db/scripts/init-db.sh    /usr/local/bin/init-db.sh
RUN dos2unix /usr/local/bin/entrypoint.sh \
 && dos2unix /usr/local/bin/init-db.sh

# DDL files applied in filename order on first boot
COPY database/ddl /usr/local/db/ddl

USER mssql

EXPOSE 1433

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
