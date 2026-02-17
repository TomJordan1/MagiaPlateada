/**
 * POST /api/auth/login
 * Autentica un usuario existente.
 * - Verifica email y password contra la DB
 * - Retorna un JWT si las credenciales son correctas
 */
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyPassword, createToken } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contrasena son obligatorios." },
        { status: 400 }
      )
    }

    // Buscar usuario
    const result = await sql`
      SELECT id, email, password_hash, display_name, role, credits
      FROM users WHERE email = ${email.toLowerCase()}
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "No existe una cuenta con ese correo electronico." },
        { status: 401 }
      )
    }

    const user = result[0]

    // Verificar contrasena
    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json(
        { error: "La contrasena es incorrecta." },
        { status: 401 }
      )
    }

    // Generar JWT
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name,
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        credits: user.credits,
      },
    })
  } catch (error) {
    console.error("Error en login:", error)
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
