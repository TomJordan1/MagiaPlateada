/**
 * results-screen.tsx
 * -------------------
 * Pantalla de resultados que muestra la lista de expertos encontrados.
 *
 * Cada experto se presenta en una tarjeta (ExpertCard) con:
 * - Avatar con iniciales, nombre y servicio
 * - Badge de estado (Disponible / Ocupado / No disponible)
 * - Calificacion con estrellas, zona y modalidad
 * - Boton "Contactar" que lleva al perfil detallado
 */
"use client"

import { useApp, type Expert } from "@/lib/app-context"
import { COLOR_POR_ESTADO, ETIQUETA_ESTADO, textoModalidad } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Star, MapPin, Clock, Phone } from "lucide-react"

// ───────────────────────────────────────────
//  Componente principal: ResultsScreen
// ───────────────────────────────────────────

export function ResultsScreen() {
  const { experts, setSelectedExpert, setScreen, resetChat } = useApp()

  /** Navega al perfil del experto seleccionado */
  function verPerfilExperto(experto: Expert) {
    setSelectedExpert(experto)
    setScreen("profile")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Encabezado con boton volver y contador de resultados */}
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-4 shadow-sm">
        <button
          onClick={resetChat}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition-colors"
          aria-label="Volver al inicio"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-card-foreground">Expertos disponibles</h1>
          <p className="text-sm text-muted-foreground">{experts.length} resultados encontrados</p>
        </div>
      </header>

      {/* Lista de tarjetas de expertos */}
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto flex max-w-lg flex-col gap-4">
          {experts.map((experto, index) => (
            <TarjetaExperto
              key={experto.id}
              experto={experto}
              indice={index}
              onSeleccionar={() => verPerfilExperto(experto)}
            />
          ))}
        </div>
      </main>
    </div>
  )
}

// ───────────────────────────────────────────
//  Subcomponente: tarjeta individual de experto
// ───────────────────────────────────────────

/**
 * TarjetaExperto: muestra un resumen del experto en formato tarjeta.
 * Es clickable: al presionar, navega al perfil completo.
 * Usa las constantes compartidas para colores y etiquetas de estado.
 */
function TarjetaExperto({
  experto,
  indice,
  onSeleccionar,
}: {
  experto: Expert
  indice: number
  onSeleccionar: () => void
}) {
  return (
    <div
      className="animate-fade-in-up rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md cursor-pointer"
      style={{ animationDelay: `${indice * 100}ms` }}
      onClick={onSeleccionar}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSeleccionar()
      }}
    >
      <div className="flex items-start gap-4">
        {/* Avatar con iniciales */}
        <Avatar className="h-14 w-14 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
            {experto.avatar}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col gap-2">
          {/* Nombre, servicio y badge de estado */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-card-foreground">{experto.name}</h3>
              <p className="text-sm text-muted-foreground">{experto.service}</p>
            </div>
            <Badge
              variant="secondary"
              className={`${COLOR_POR_ESTADO[experto.status]} border-0 text-xs font-medium`}
            >
              {ETIQUETA_ESTADO[experto.status]}
            </Badge>
          </div>

          {/* Calificacion y zona */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-accent fill-accent" />
              <span className="font-medium text-card-foreground">{experto.rating}</span>
              <span>({experto.totalRatings})</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {experto.zone}
            </span>
          </div>

          {/* Modalidad */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{textoModalidad(experto.modality)}</span>
          </div>

          {/* Boton de contacto */}
          <Button
            className="mt-2 h-11 rounded-xl text-sm font-medium"
            onClick={(e) => {
              e.stopPropagation() // Evita que el click se propague a la tarjeta
              onSeleccionar()
            }}
          >
            <Phone className="mr-2 h-4 w-4" />
            Contactar
          </Button>
        </div>
      </div>
    </div>
  )
}
