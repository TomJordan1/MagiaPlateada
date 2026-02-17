/**
 * GET /api/credits
 * Retorna el saldo de creditos del usuario autenticado.
 *
 * POST /api/credits
 * Simula una compra de creditos (para demo/hackaton).
 */
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token invalido." }, { status: 401 })
    }

    const result = await sql`SELECT credits FROM users WHERE id = ${payload.userId}`
    if (result.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 })
    }

    return NextResponse.json({ credits: result[0].credits })
  } catch (error) {
    console.error("Error obteniendo creditos:", error)
    return NextResponse.json({ error: "Error interno." }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token invalido." }, { status: 401 })
    }

    const body = await req.json()
    const { amount } = body

    if (!amount || amount < 1 || amount > 50) {
      return NextResponse.json({ error: "Cantidad invalida (1-50)." }, { status: 400 })
    }

    // Agregar creditos
    await sql`UPDATE users SET credits = credits + ${amount} WHERE id = ${payload.userId}`

    // Registrar transaccion
    await sql`
      INSERT INTO credit_transactions (user_id, amount, type)
      VALUES (${payload.userId}, ${amount}, 'purchase')
    `

    const result = await sql`SELECT credits FROM users WHERE id = ${payload.userId}`

    return NextResponse.json({ credits: result[0].credits })
  } catch (error) {
    console.error("Error comprando creditos:", error)
    return NextResponse.json({ error: "Error interno." }, { status: 500 })
  }
}
