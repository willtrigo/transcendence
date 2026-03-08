import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import { PrismaMssql } from "@prisma/adapter-mssql"

const prisma = new PrismaClient({
  adapter: new PrismaMssql({
    server: process.env.HOST!,
    port: Number(process.env.DB_PORT ?? 1433),
    database: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  }),
})

async function main() {
  const TENANT_SLUG = "default"
  const TENANT_NAME = "Default Workspace"

  const ADMIN_EMAIL = "admin@email.com"
  const ADMIN_NAME = "Admin"
  const ADMIN_PASSWORD = "123456"

  const tenant = await prisma.tenants.upsert({
    where: { slug: TENANT_SLUG },
    update: { nome: TENANT_NAME, status: "active" },
    create: { nome: TENANT_NAME, slug: TENANT_SLUG, status: "active" },
    select: { tenant_id: true, slug: true },
  })

  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10)

  const admin = await prisma.users.upsert({
    where: { email: ADMIN_EMAIL },
    update: { name: ADMIN_NAME, status: "active" },
    create: { email: ADMIN_EMAIL, name: ADMIN_NAME, status: "active", password_hash },
    select: { user_id: true, email: true },
  })

  await prisma.tenantUsers.upsert({
    where: {
      tenant_id_user_id: { tenant_id: tenant.tenant_id, user_id: admin.user_id },
    },
    update: { status: "active" },
    create: { tenant_id: tenant.tenant_id, user_id: admin.user_id, status: "active" },
  })

  const roleAdmin = await prisma.roles.upsert({
    where: { tenant_id_name: { tenant_id: tenant.tenant_id, name: "admin" } },
    update: { description: "Administrador do tenant", is_system: true },
    create: {
      tenant_id: tenant.tenant_id,
      name: "admin",
      description: "Administrador do tenant",
      is_system: true,
    },
    select: { role_id: true },
  })

  const permissionCodes = [
    "tenant.read",
    "tenant.update",
    "user.read",
    "user.invite",
    "user.disable",
    "role.read",
    "role.write",
    "permission.read",
    "permission.write",
  ] as const

  const permissions = await Promise.all(
    permissionCodes.map((code) =>
      prisma.permissions.upsert({
        where: { code },
        update: { description: code },
        create: { code, description: code },
        select: { permission_id: true },
      })
    )
  )

  for (const p of permissions) {
    await prisma.rolePermissions.upsert({
      where: {
        role_id_permission_id: { role_id: roleAdmin.role_id, permission_id: p.permission_id },
      },
      update: {},
      create: { role_id: roleAdmin.role_id, permission_id: p.permission_id },
    })
  }

  await prisma.userRoles.upsert({
    where: {
      tenant_id_user_id_role_id: {
        tenant_id: tenant.tenant_id,
        user_id: admin.user_id,
        role_id: roleAdmin.role_id,
      },
    },
    update: {},
    create: {
      tenant_id: tenant.tenant_id,
      user_id: admin.user_id,
      role_id: roleAdmin.role_id,
    },
  })

  console.log("✅ Seed concluído!")
  console.log(`Tenant: ${TENANT_SLUG}`)
  console.log(`Admin:  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })