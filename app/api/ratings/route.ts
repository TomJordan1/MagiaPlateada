/**
 * POST /api/ratings
 * Crea una calificacion multidimensional para una sesion completada.
 * Actualiza el rating promedio del experto automaticamente.
 */
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

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
    const { sessionId, ratedId, quality, clarity, punctuality, overall, comment } = body

    if (!sessionId || !ratedId || !quality || !clarity || !punctuality || !overall) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 })
    }

    // Verificar que la sesion exista y este completada
    const session = await sql`SELECT * FROM sessions WHERE id = ${sessionId} AND status = 'completed'`
    if (session.length === 0) {
      return NextResponse.json({ error: "La sesion no existe o no esta completada." }, { status: 400 })
    }

    // Crear la calificacion
    const result = await sql`
      INSERT INTO ratings (session_id, rater_id, rated_id, quality, clarity, punctuality, overall, comment)
      VALUES (${sessionId}, ${payload.userId}, ${ratedId}, ${quality}, ${clarity}, ${punctuality}, ${overall}, ${comment || ""})
      RETURNING *
    `

    // Actualizar rating promedio del experto
    const expertRatings = await sql`
      SELECT AVG(overall) as avg_rating, COUNT(*) as total
      FROM ratings r
      JOIN experts e ON r.rated_id = e.user_id
      WHERE r.rated_id = ${ratedId}
    `

    if (expertRatings.length > 0 && expertRatings[0].avg_rating) {
      await sql`
        UPDATE experts
        SET rating = ROUND(${expertRatings[0].avg_rating}::numeric, 1),
            total_ratings = ${expertRatings[0].total}
        WHERE user_id = ${ratedId}
      `
    }

    return NextResponse.json({ rating: result[0] })
  } catch (error) {
    console.error("Error creando calificacion:", error)
    return NextResponse.json({ error: "Error interno." }, { status: 500 })
  }
}
