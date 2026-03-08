import { prisma } from "@/lib/prisma"

export async function findUserByEmail(email: string) {
  return prisma.users.findUnique({
    where: { email },
  })
}

export async function findCredentialsUserByEmail(email: string) {
  return prisma.users.findUnique({
    where: { email },
    select: {
      user_id: true,
      email: true,
      name: true,
      password_hash: true,
      status: true,
    },
  })
}

export async function createOAuthUser(params: {
  email: string
  name?: string | null
}) {
  return prisma.users.create({
    data: {
      email: params.email,
      name: params.name ?? null,
      status: "active",
    },
  })
}

export async function updateUserName(params: {
  userId: bigint
  name: string
}) {
  return prisma.users.update({
    where: { user_id: params.userId },
    data: { name: params.name },
  })
}