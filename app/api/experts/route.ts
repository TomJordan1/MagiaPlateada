/**
 * GET /api/experts
 * Lista expertos con filtros opcionales: zone, modality, service_category, status.
 *
 * POST /api/experts
 * Crea un nuevo perfil de experto (requiere autenticacion).
 */
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const zone = url.searchParams.get("zone")
    const modality = url.searchParams.get("modality")
    const serviceCategory = url.searchParams.get("service_category")

    // Orden: premium primero, luego disponibles, luego por rating
    // CASE en ORDER BY: available=0, busy=1, unavailable=2 (pero filtramos unavailable)
    let experts
    if (zone && modality && modality !== "ambos") {
      experts = await sql`
        SELECT * FROM experts
        WHERE status != 'unavailable'
          AND zone = ${zone}
          AND (modality = ${modality} OR modality = 'ambos')
        ORDER BY is_featured DESC,
          CASE status WHEN 'available' THEN 0 WHEN 'busy' THEN 1 ELSE 2 END,
          rating DESC
      `
    } else if (zone) {
      experts = await sql`
        SELECT * FROM experts
        WHERE status != 'unavailable'
          AND zone = ${zone}
        ORDER BY is_featured DESC,
          CASE status WHEN 'available' THEN 0 WHEN 'busy' THEN 1 ELSE 2 END,
          rating DESC
      `
    } else if (modality && modality !== "ambos") {
      experts = await sql`
        SELECT * FROM experts
        WHERE status != 'unavailable'
          AND (modality = ${modality} OR modality = 'ambos')
        ORDER BY is_featured DESC,
          CASE status WHEN 'available' THEN 0 WHEN 'busy' THEN 1 ELSE 2 END,
          rating DESC
      `
    } else if (serviceCategory) {
      experts = await sql`
        SELECT * FROM experts
        WHERE status != 'unavailable'
          AND service_category = ${serviceCategory}
        ORDER BY is_featured DESC,
          CASE status WHEN 'available' THEN 0 WHEN 'busy' THEN 1 ELSE 2 END,
          rating DESC
      `
    } else {
      experts = await sql`
        SELECT * FROM experts
        WHERE status != 'unavailable'
        ORDER BY is_featured DESC,
          CASE status WHEN 'available' THEN 0 WHEN 'busy' THEN 1 ELSE 2 END,
          rating DESC
      `
    }

    // Mapear a formato camelCase para el frontend
    const mapped = experts.map((e) => ({
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
      membershipType: e.membership_type || "free",
    }))

    return NextResponse.json({ experts: mapped })
  } catch (error) {
    console.error("Error listando expertos:", error)
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
    const { name, age, service, serviceCategory, experience, modality, zone, schedule, contact } = body

    if (!name || !age || !service || !experience || !modality || !zone || !schedule) {
      return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 })
    }

    // Generar avatar (iniciales)
    const avatar = name
      .split(" ")
      .filter(Boolean)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

    const result = await sql`
      INSERT INTO experts (user_id, name, age, service, service_category, experience, modality, zone, schedule, contact, avatar)
      VALUES (${payload.userId}, ${name}, ${age}, ${serviceCategory || "otro"}, ${serviceCategory || "otro"}, ${experience}, ${modality}, ${zone}, ${schedule}, ${contact || ""}, ${avatar})
      RETURNING *
    `

    const e = result[0]

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
      },
    })
  } catch (error) {
    console.error("Error creando experto:", error)
    return NextResponse.json({ error: "Error interno." }, { status: 500 })
  }
}
