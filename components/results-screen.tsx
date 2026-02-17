/**
 * results-screen.tsx
 * -------------------
 * Pantalla de resultados que muestra expertos filtrados desde la DB.
 *
 * Cambios respecto a la version anterior:
 * - Carga expertos desde /api/experts con filtros de searchData
 * - Muestra "Destacado" badge si el experto tiene membresia
 * - Boton "Solicitar sesion" en vez de "Contactar"
 * - Indicador de creditos del usuario en el header
 */
"use client"

import { useApp, type Expert } from "@/lib/app-context"
import { COLOR_POR_ESTADO, ETIQUETA_ESTADO, textoModalidad } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Star, MapPin, Clock, CalendarPlus, Award, CreditCard, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

export function ResultsScreen() {
  const { experts, setSelectedExpert, setScreen, resetChat, loadExperts, searchData, isLoggedIn, authUser } = useApp()
  const [isLoading, setIsLoading] = useState(false)

  // Cargar expertos al montar si no hay datos
  useEffect(() => {
    if (experts.length === 0) {
      setIsLoading(true)
      loadExperts({
        zone: searchData.zone || "",
        modality: searchData.modality || "",
        service_category: searchData.service || "",
      }).finally(() => setIsLoading(false))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function verPerfilExperto(experto: Expert) {
    setSelectedExpert(experto)
    setScreen("profile")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-4 shadow-sm">
        <button
          onClick={resetChat}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition-colors"
          aria-label="Volver al inicio"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-card-foreground">Expertos disponibles</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Buscando..." : `${experts.length} resultados encontrados`}
          </p>
        </div>
        {isLoggedIn && authUser && (
          <span className="flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent">
            <CreditCard className="h-3.5 w-3.5" />
            {authUser.credits}
          </span>
        )}
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto flex max-w-lg flex-col gap-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Buscando expertos...</p>
            </div>
          ) : experts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <p className="text-lg font-medium text-card-foreground">No se encontraron expertos</p>
              <p className="text-sm text-muted-foreground text-center">
                Intenta cambiar tus filtros de busqueda o tu zona.
              </p>
              <Button variant="outline" onClick={resetChat}>
                Volver al inicio
              </Button>
            </div>
          ) : (
            experts.map((experto, index) => (
              <TarjetaExperto
                key={experto.id}
                experto={experto}
                indice={index}
                onSeleccionar={() => verPerfilExperto(experto)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  )
}

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
        <Avatar className="h-14 w-14 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
            {experto.avatar}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-card-foreground">{experto.name}</h3>
              <p className="text-sm text-muted-foreground">{experto.service}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant="secondary"
                className={`${COLOR_POR_ESTADO[experto.status]} border-0 text-xs font-medium`}
              >
                {ETIQUETA_ESTADO[experto.status]}
              </Badge>
              {experto.isFeatured && (
                <Badge
                  variant="secondary"
                  className="bg-accent/15 text-accent border-0 text-xs font-medium"
                >
                  <Award className="mr-0.5 h-3 w-3" />
                  Destacado
                </Badge>
              )}
            </div>
          </div>

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

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{textoModalidad(experto.modality)}</span>
          </div>

          <Button
            className="mt-2 h-11 rounded-xl text-sm font-medium"
            onClick={(e) => {
              e.stopPropagation()
              onSeleccionar()
            }}
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            Solicitar sesion
          </Button>
        </div>
      </div>
    </div>
  )
}
