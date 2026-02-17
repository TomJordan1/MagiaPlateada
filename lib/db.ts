/**
 * db.ts
 * ------
 * Utilidad de conexion a Neon Postgres.
 * Exporta una funcion `sql` reutilizable para queries parametrizados.
 */
import { neon } from "@neondatabase/serverless"

export const sql = neon(process.env.DATABASE_URL!)
