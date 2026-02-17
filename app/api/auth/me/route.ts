/**
 * GET /api/auth/me
 * Retorna los datos del usuario autenticado a partir del JWT.
 * Se usa para restaurar sesion al recargar la pagina.
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

    // Obtener datos actualizados del usuario
    const result = await sql`
      SELECT id, email, display_name, role, credits
      FROM users WHERE id = ${payload.userId}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 })
    }

    const user = result[0]

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        credits: user.credits,
      },
    })
  } catch (error) {
    console.error("Error en /me:", error)
    return NextResponse.json({ error: "Error interno." }, { status: 500 })
  }
}
