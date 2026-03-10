import { NextResponse } from "next/server"

import { requireAuth } from "@/lib/authz"
import {
  deleteMyProfile,
  getMyProfile,
  updateMyEmail,
  updateMyProfile,
} from "@/services/user-profile"

export async function GET(req: Request) {
  const auth = await requireAuth(req)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const userId = BigInt(auth.token.userId)
    const result = await getMyProfile(userId)

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { user: result.user },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching profile:", error)

    return NextResponse.json(
      { error: "Erro ao carregar perfil." },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuth(req)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const body = await req.json()
    const name = body?.name
    const email = body?.email

    const userId = BigInt(auth.token.userId)

    if (typeof name === "string" && typeof email === "undefined") {
      const result = await updateMyProfile({
        userId,
        name,
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
    }

    if (typeof email === "string" && typeof name === "undefined") {
      const result = await updateMyEmail({
        userId,
        email,
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
    }

    return NextResponse.json(
      { error: "Dados inválidos." },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error updating profile:", error)

    return NextResponse.json(
      { error: "Erro ao atualizar perfil." },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAuth(req)

  if (!auth.ok) {
    return auth.response
  }

  try {
    const userId = BigInt(auth.token.userId)
    const result = await deleteMyProfile(userId)

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
    console.error("Error deleting profile:", error)

    return NextResponse.json(
      { error: "Erro ao deletar perfil." },
      { status: 500 }
    )
  }
}