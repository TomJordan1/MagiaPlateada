/**
 * PUT /api/experts/profile
 * Actualiza campos del perfil de experto.
 * Acepta { field, value } donde field es uno de los campos editables.
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
    const { field, value } = body

    if (!field || value === undefined) {
      return NextResponse.json({ error: "Faltan campo y valor." }, { status: 400 })
    }

    // Ejecutar la query correcta segun el campo
    let result
    switch (field) {
      case "service":
        result = await sql`UPDATE experts SET service = ${value} WHERE user_id = ${payload.userId} RETURNING id`
        break
      case "experience":
        result = await sql`UPDATE experts SET experience = ${value} WHERE user_id = ${payload.userId} RETURNING id`
        break
      case "schedule":
        result = await sql`UPDATE experts SET schedule = ${value} WHERE user_id = ${payload.userId} RETURNING id`
        break
      case "contact":
        result = await sql`UPDATE experts SET contact = ${value} WHERE user_id = ${payload.userId} RETURNING id`
        break
      case "zone":
        result = await sql`UPDATE experts SET zone = ${value} WHERE user_id = ${payload.userId} RETURNING id`
        break
      case "modality":
        result = await sql`UPDATE experts SET modality = ${value} WHERE user_id = ${payload.userId} RETURNING id`
        break
      default:
        return NextResponse.json({ error: "Campo no editable." }, { status: 400 })
    }

    if (result.length === 0) {
      return NextResponse.json({ error: "Perfil de experto no encontrado." }, { status: 404 })
    }

    return NextResponse.json({ success: true, updatedField: field })
  } catch (error) {
    console.error("Error actualizando perfil:", error)
    return NextResponse.json({ error: "Error interno." }, { status: 500 })
  }
}
