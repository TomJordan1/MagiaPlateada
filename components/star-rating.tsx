/**
 * star-rating.tsx
 * ----------------
 * Componente de calificacion con estrellas (1-5).
 *
 * Permite al usuario calificar un servicio haciendo clic en las estrellas.
 * Muestra una etiqueta descriptiva segun la puntuacion seleccionada
 * (Muy malo, Malo, Regular, Bueno, Excelente).
 *
 * Props:
 * - onRate: callback que se ejecuta al seleccionar una calificacion
 */
"use client"

import { Star } from "lucide-react"
import { useState } from "react"
import { ETIQUETA_CALIFICACION } from "@/lib/constants"

export function StarRating({ onRate }: { onRate: (rating: number) => void }) {
  /** Estrella sobre la que esta el cursor (hover), 0 si no hay hover */
  const [estrellaHover, setEstrellaHover] = useState(0)

  /** Estrella seleccionada por el usuario (clic) */
  const [estrellaSeleccionada, setEstrellaSeleccionada] = useState(0)

  /** La estrella "activa" es la de hover si existe, o la seleccionada */
  const estrellaActiva = estrellaHover || estrellaSeleccionada

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl bg-card border border-border p-6 shadow-sm animate-fade-in-up">
      <p className="text-base font-medium text-card-foreground">
        ¿Cómo calificarías el servicio?
      </p>

      {/* Fila de 5 estrellas interactivas */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => {
          const valorEstrella = i + 1
          return (
            <button
              key={i}
              className="transition-transform duration-150 hover:scale-110"
              onClick={() => {
                setEstrellaSeleccionada(valorEstrella)
                onRate(valorEstrella)
              }}
              onMouseEnter={() => setEstrellaHover(valorEstrella)}
              onMouseLeave={() => setEstrellaHover(0)}
              aria-label={`Calificar ${valorEstrella} estrellas`}
            >
              <Star
                className={`h-10 w-10 ${
                  valorEstrella <= estrellaActiva
                    ? "text-accent fill-accent"
                    : "text-muted"
                }`}
              />
            </button>
          )
        })}
      </div>

      {/* Etiqueta descriptiva de la calificacion seleccionada */}
      {estrellaSeleccionada > 0 && (
        <p className="text-sm text-muted-foreground">
          {ETIQUETA_CALIFICACION[estrellaSeleccionada]}
        </p>
      )}
    </div>
  )
}
