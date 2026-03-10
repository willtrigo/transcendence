import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/authz"
import { updateMyPassword } from "@/services/user-profile"

export async function PATCH(req: Request) {
  const auth = await requireAuth(req)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await req.json()

    const currentPassword = body?.currentPassword
    const newPassword = body?.newPassword
    const confirmPassword = body?.confirmPassword

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return NextResponse.json(
        { error: "Dados inválidos." },
        { status: 400 }
      )
    }

    const userId = BigInt(auth.token.userId)

    const result = await updateMyPassword({
      userId,
      currentPassword,
      newPassword,
      confirmPassword,
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: result.message },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error updating password:", error)

    return NextResponse.json(
      { error: "Erro ao atualizar senha." },
      { status: 500 }
    )
  }
}