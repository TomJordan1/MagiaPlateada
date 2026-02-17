/**
 * GET /api/experts/me
 * Retorna el perfil de experto del usuario autenticado.
 * Incluye el conteo de sesiones pendientes.
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

    // Buscar perfil de experto por user_id
    const expertResult = await sql`
      SELECT * FROM experts WHERE user_id = ${payload.userId}
    `

    if (expertResult.length === 0) {
      return NextResponse.json({ expert: null, pendingSessions: 0 })
    }

    const e = expertResult[0]

    // Contar sesiones por estado donde este experto es el destinatario
    const countsResult = await sql`
      SELECT status, COUNT(*) as count FROM sessions
      WHERE expert_id = ${e.id} AND status IN ('pending', 'accepted')
      GROUP BY status
    `
    let pendingCount = 0
    let confirmedCount = 0
    for (const row of countsResult) {
      if (row.status === "pending") pendingCount = parseInt(row.count) || 0
      if (row.status === "accepted") confirmedCount = parseInt(row.count) || 0
    }

    // Sesiones urgentes = pendientes con fecha en las proximas 24h
    const urgentResult = await sql`
      SELECT COUNT(*) as count FROM sessions
      WHERE expert_id = ${e.id}
        AND status = 'pending'
        AND requested_date IS NOT NULL
        AND requested_date::date <= (CURRENT_DATE + INTERVAL '1 day')
    `
    const urgentCount = parseInt(urgentResult[0].count) || 0

    return NextResponse.json({
      expert: {
        id: e.id,
        userId: e.user_id,
        name: e.name,
        age: e.age,
        service: e.service,
        serviceCategory: e.service_category,
        experience: e.experience,
        modality: e.modality,
        zone: e.zone,
        schedule: e.schedule,
        contact: e.contact,
        status: e.status,
        rating: parseFloat(e.rating),
        totalRatings: e.total_ratings,
        avatar: e.avatar,
        isFeatured: e.is_featured,
        membershipType: e.membership_type,
      },
      pendingSessions: pendingCount,
      urgentCount,
      confirmedCount,
    })
  } catch (error) {
    console.error("Error obteniendo perfil de experto:", error)
    return NextResponse.json({ error: "Error interno." }, { status: 500 })
  }
}
