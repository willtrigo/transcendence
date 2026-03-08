#!/bin/bash
set -e

echo "Esperando SQL Server iniciar..."

until /opt/mssql-tools18/bin/sqlcmd -S sqlserver -U sa -P 'Password123' -C -Q "SELECT 1" > /dev/null 2>&1
do
  sleep 2
done

echo "SQL Server pronto."

echo "Criando banco ft_transcendence..."

/opt/mssql-tools18/bin/sqlcmd -S sqlserver -U sa -P 'Password123' -C -Q "
IF DB_ID('ft_transcendence') IS NULL
BEGIN
  CREATE DATABASE ft_transcendence;
END
"

echo "Aplicando DDL..."

for file in /database/ddl/*.sql
do
  echo "Executando $file"
  /opt/mssql-tools18/bin/sqlcmd \
    -S sqlserver \
    -U sa \
    -P 'Password123' \
    -d ft_transcendence \
    -C \
    -i "$file"
done

echo "Aplicando seed..."

if [ -f /database/seed/seed.sql ]; then
  /opt/mssql-tools18/bin/sqlcmd \
    -S sqlserver \
    -U sa \
    -P 'Password123' \
    -d ft_transcendence \
    -C \
    -i /database/seed/seed.sql
fi

echo "Banco inicializado com sucesso."