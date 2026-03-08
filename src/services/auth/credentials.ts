import bcrypt from "bcryptjs"

import { findCredentialsUserByEmail } from "@/repositories/users.repo"

export async function authorizeWithCredentials(
  email: string,
  password: string
) {
  const user = await findCredentialsUserByEmail(email)

  if (!user) return null
  if (user.status !== "active") return null
  if (!user.password_hash) return null

  const isValidPassword = await bcrypt.compare(password, user.password_hash)

  if (!isValidPassword) return null

  return {
    id: user.user_id.toString(),
    email: user.email,
    name: user.name ?? undefined,
  }
}