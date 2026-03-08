import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaMssql } from "@prisma/adapter-mssql"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function makeAdapter() {
  return new PrismaMssql({
    server: process.env.HOST!, // obrigatório
    port: Number(process.env.DB_PORT ?? 1433),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    options: {
      encrypt: true,
      trustServerCertificate: true, // local/self-signed
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  })
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: makeAdapter(),
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma