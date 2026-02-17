/**
 * POST /api/sessions
 * Crea una solicitud de sesion (cliente -> experto).
 * Descuenta creditos al cliente.
 *
 * GET /api/sessions
 * Lista sesiones del usuario autenticado.
 *
 * PATCH /api/sessions
 * Actualiza el estado de una sesion (aceptar, rechazar, completar).
 */
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

const SESSION_CREDIT_COST = 1

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
    const { expertId, requestedDate, requestedTime, requestedDuration } = body

    if (!expertId || !requestedDate) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 })
    }

    // Verificar creditos del cliente
    const userResult = await sql`SELECT credits FROM users WHERE id = ${payload.userId}`
    if (userResult.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 })
    }

    const userCredits = userResult[0].credits
    if (userCredits < SESSION_CREDIT_COST) {
      return NextResponse.json(
        { error: "No tienes suficientes creditos para solicitar una sesion.", credits: userCredits },
        { status: 402 }
      )
    }

    // Crear la sesion
    const sessionResult = await sql`
      INSERT INTO sessions (client_id, expert_id, requested_date, requested_time, requested_duration, credits_cost)
      VALUES (${payload.userId}, ${expertId}, ${requestedDate}, ${requestedTime || ""}, ${requestedDuration || "1 hora"}, ${SESSION_CREDIT_COST})
      RETURNING *
    `

    // Descontar creditos
    await sql`UPDATE users SET credits = credits - ${SESSION_CREDIT_COST} WHERE id = ${payload.userId}`

    // Registrar transaccion de creditos
    await sql`
      INSERT INTO credit_transactions (user_id, amount, type, session_id)
      VALUES (${payload.userId}, ${-SESSION_CREDIT_COST}, 'session_charge', ${sessionResult[0].id})
    `

    // Obtener creditos actualizados
    const updatedUser = await sql`SELECT credits FROM users WHERE id = ${payload.userId}`

    return NextResponse.json({
      session: sessionResult[0],
      credits: updatedUser[0].credits,
    })
  } catch (error) {
    console.error("Error creando sesion:", error)
    return NextResponse.json({ error: "Error interno." }, { status: 500 })
  }
}

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

    // Obtener sesiones del usuario (como cliente o como experto)
    const sessions = await sql`
      SELECT s.*, e.name as expert_name, e.service as expert_service
      FROM sessions s
      JOIN experts e ON s.expert_id = e.id
      WHERE s.client_id = ${payload.userId}
      ORDER BY s.created_at DESC
    `

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Error listando sesiones:", error)
    return NextResponse.json({ error: "Error interno." }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
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
    const { sessionId, status } = body

    if (!sessionId || !status) {
      return NextResponse.json({ error: "Faltan campos." }, { status: 400 })
    }

    if (!["accepted", "rejected", "completed", "disputed"].includes(status)) {
      return NextResponse.json({ error: "Estado invalido." }, { status: 400 })
    }

    // Si se rechaza, reembolsar creditos al cliente
    if (status === "rejected") {
      const session = await sql`SELECT * FROM sessions WHERE id = ${sessionId}`
      if (session.length > 0) {
        await sql`UPDATE users SET credits = credits + ${session[0].credits_cost} WHERE id = ${session[0].client_id}`
        await sql`
          INSERT INTO credit_transactions (user_id, amount, type, session_id)
          VALUES (${session[0].client_id}, ${session[0].credits_cost}, 'session_refund', ${sessionId})
        `
      }
    }

    const completedAt = status === "completed" ? new Date().toISOString() : null

    const result = await sql`
      UPDATE sessions
      SET status = ${status}, completed_at = ${completedAt}
      WHERE id = ${sessionId}
      RETURNING *
    `

    return NextResponse.json({ session: result[0] })
  } catch (error) {
    console.error("Error actualizando sesion:", error)
    return NextResponse.json({ error: "Error interno." }, { status: 500 })
  }
}
