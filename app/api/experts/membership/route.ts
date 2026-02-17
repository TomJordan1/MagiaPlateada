/**
 * PUT /api/experts/membership
 * Cambia el tipo de membresia del experto (free/premium).
 * Si premium, se marca is_featured = true.
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
    const { membershipType } = body

    if (!membershipType || !["free", "premium"].includes(membershipType)) {
      return NextResponse.json({ error: "Tipo de membresia invalido." }, { status: 400 })
    }

    const isFeatured = membershipType === "premium"

    const result = await sql`
      UPDATE experts
      SET membership_type = ${membershipType}, is_featured = ${isFeatured}
      WHERE user_id = ${payload.userId}
      RETURNING id, membership_type, is_featured
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Perfil de experto no encontrado." }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      membershipType: result[0].membership_type,
      isFeatured: result[0].is_featured,
    })
  } catch (error) {
    console.error("Error actualizando membresia:", error)
    return NextResponse.json({ error: "Error interno." }, { status: 500 })
  }
}
