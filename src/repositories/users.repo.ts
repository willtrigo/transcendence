import { prisma } from "@/lib/prisma"

export async function findUserByEmail(email: string) {
  return prisma.users.findUnique({
    where: { email },
  })
}

export async function findUserById(userId: bigint) {
  return prisma.users.findUnique({
    where: { user_id: userId },
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

export async function updateUserEmail(params: {
  userId: bigint
  email: string
}) {
  return prisma.users.update({
    where: { user_id: params.userId },
    data: { email: params.email },
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

export async function createCredentialsUser(params: {
  name: string
  email: string
  passwordHash: string
}) {
  return prisma.users.create({
    data: {
      name: params.name,
      email: params.email,
      password_hash: params.passwordHash,
      status: "active",
    },
    select: {
      user_id: true,
      name: true,
      email: true,
      status: true,
    },
  })
}

export async function updateUserPasswordHash(params: {
  userId: bigint
  passwordHash: string
}) {
  return prisma.users.update({
    where: { user_id: params.userId },
    data: {
      password_hash: params.passwordHash,
    },
    select: {
      user_id: true,
      email: true,
      name: true,
      status: true,
    },
  })
}

export async function getProfileByUserId(userId: bigint) {
  return prisma.users.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      name: true,
      email: true,
      status: true,
      password_hash: true,
    },
  })
}

export async function deleteUserById(userId: bigint) {
  return prisma.users.delete({
    where: { user_id: userId },
  })
}