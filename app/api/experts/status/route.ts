/**
 * PUT /api/experts/status
 * Cambia el estado de disponibilidad del experto.
 * Acepta { status: "available" | "busy" | "unavailable" }
 */
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function PUT(req: Request) {
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
    const { status } = body

    if (!status || !["available", "busy", "unavailable"].includes(status)) {
      return NextResponse.json({ error: "Estado invalido. Opciones: available, busy, unavailable." }, { status: 400 })
    }

    const result = await sql`
      UPDATE experts
      SET status = ${status}
      WHERE user_id = ${payload.userId}
      RETURNING id, status
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Perfil de experto no encontrado." }, { status: 404 })
    }

    return NextResponse.json({ success: true, status: result[0].status })
  } catch (error) {
    console.error("Error actualizando estado:", error)
    return NextResponse.json({ error: "Error interno." }, { status: 500 })
  }
}
