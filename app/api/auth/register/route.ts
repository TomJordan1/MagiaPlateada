/**
 * POST /api/auth/register
 * Registra un nuevo usuario (cliente o experto).
 * - Valida email y password
 * - Hashea la contrasena con bcrypt
 * - Crea el usuario en la DB con creditos de bienvenida (3 para clientes)
 * - Registra la transaccion de creditos de bienvenida
 * - Retorna un JWT
 */
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { hashPassword, createToken } from "@/lib/auth"

const WELCOME_CREDITS = 3

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, displayName, role } = body

    // Validaciones basicas
    if (!email || !password || !displayName || !role) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios." },
        { status: 400 }
      )
    }

    if (!["client", "expert"].includes(role)) {
      return NextResponse.json(
        { error: "Rol invalido." },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "El correo electronico no es valido." },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contrasena debe tener al menos 6 caracteres." },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese correo electronico." },
        { status: 409 }
      )
    }

    // Crear usuario
    const passwordHash = await hashPassword(password)
    const credits = role === "client" ? WELCOME_CREDITS : 0

    const result = await sql`
      INSERT INTO users (email, password_hash, display_name, role, credits)
      VALUES (${email.toLowerCase()}, ${passwordHash}, ${displayName}, ${role}, ${credits})
      RETURNING id, email, display_name, role, credits
    `

    const user = result[0]

    // Registrar creditos de bienvenida para clientes
    if (role === "client" && credits > 0) {
      await sql`
        INSERT INTO credit_transactions (user_id, amount, type)
        VALUES (${user.id}, ${credits}, 'welcome')
      `
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
    console.error("Error en registro:", error)
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
