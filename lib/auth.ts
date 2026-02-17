/**
 * auth.ts
 * --------
 * Utilidades de autenticacion: hashing de passwords y JWT con jose.
 * Usa bcryptjs para hashear y verificar contrasenas.
 * Usa jose para firmar y verificar tokens JWT (edge-compatible).
 */
import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "magia-plateada-secret-key-2024"
)

const SALT_ROUNDS = 10

/** Hashea una contrasena con bcrypt */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/** Verifica una contrasena contra un hash */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/** Genera un JWT con los datos del usuario (expira en 7 dias) */
export async function createToken(payload: {
  userId: string
  email: string
  role: string
  displayName: string
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(JWT_SECRET)
}

/** Verifica y decodifica un JWT. Retorna null si es invalido. */
export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as {
      userId: string
      email: string
      role: string
      displayName: string
    }
  } catch {
    return null
  }
}
