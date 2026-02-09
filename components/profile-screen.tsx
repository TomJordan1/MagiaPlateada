/**
 * profile-screen.tsx
 * -------------------
 * Pantalla de perfil detallado de un experto.
 *
 * Muestra toda la informacion del experto seleccionado:
 * - Avatar grande con iniciales
 * - Nombre, servicio y estado de disponibilidad
 * - Calificacion con estrellas
 * - Detalles: experiencia, zona, modalidad, horario y contacto
 * - Boton prominente para contactar (abre el modal de confirmacion)
 */
"use client"

import React from "react"
import { useApp } from "@/lib/app-context"
import { COLOR_POR_ESTADO, ETIQUETA_ESTADO, textoModalidad } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Phone,
  Briefcase,
  Calendar,
} from "lucide-react"

// ───────────────────────────────────────────
//  Componente principal: ProfileScreen
// ───────────────────────────────────────────

export function ProfileScreen() {
  const { selectedExpert, setScreen, setContactModalOpen } = useApp()

  // Si no hay experto seleccionado, no renderizar nada
  if (!selectedExpert) return null

  /** Extrae solo el primer nombre para el boton de contacto */
  const primerNombre = selectedExpert.name.split(" ")[0]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Encabezado con boton volver */}
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-4 shadow-sm">
        <button
          onClick={() => setScreen("results")}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition-colors"
          aria-label="Volver a resultados"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-card-foreground">Perfil del experto</h1>
      </header>

      {/* Contenido del perfil */}
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-lg">
          {/* Cabecera del perfil: avatar, nombre, estado y calificacion */}
          <div className="flex flex-col items-center text-center animate-fade-in-up">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {selectedExpert.avatar}
              </AvatarFallback>
            </Avatar>

            <h2 className="mt-4 font-serif text-2xl text-foreground">{selectedExpert.name}</h2>
            <p className="mt-1 text-base text-muted-foreground">{selectedExpert.service}</p>

            {/* Badge de disponibilidad */}
            <div className="mt-3 flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`${COLOR_POR_ESTADO[selectedExpert.status]} border-0 text-sm font-medium px-3 py-1`}
              >
                {ETIQUETA_ESTADO[selectedExpert.status]}
              </Badge>
            </div>

            {/* Estrellas de calificacion */}
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(selectedExpert.rating)
                        ? "text-accent fill-accent"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-base font-semibold text-foreground">
                {selectedExpert.rating}
              </span>
              <span className="text-sm text-muted-foreground">
                ({selectedExpert.totalRatings} resenas)
              </span>
            </div>
          </div>

          {/* Filas de detalle: experiencia, zona, modalidad, horario, contacto */}
          <div className="mt-8 flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <FilaDetalle
              icon={<Briefcase className="h-5 w-5" />}
              etiqueta="Experiencia"
              valor={selectedExpert.experience}
            />
            <FilaDetalle
              icon={<MapPin className="h-5 w-5" />}
              etiqueta="Zona"
              valor={selectedExpert.zone}
            />
            <FilaDetalle
              icon={<Clock className="h-5 w-5" />}
              etiqueta="Modalidad"
              valor={textoModalidad(selectedExpert.modality)}
            />
            <FilaDetalle
              icon={<Calendar className="h-5 w-5" />}
              etiqueta="Horario"
              valor={selectedExpert.schedule}
            />
            <FilaDetalle
              icon={<Phone className="h-5 w-5" />}
              etiqueta="Contacto"
              valor={selectedExpert.contact}
            />
          </div>

          {/* Boton de contacto principal */}
          <div className="mt-10 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <Button
              className="h-16 w-full rounded-2xl text-lg font-medium"
              onClick={() => setContactModalOpen(true)}
            >
              <Phone className="mr-2 h-5 w-5" />
              Contactar a {primerNombre}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

// ───────────────────────────────────────────
//  Subcomponente: fila de detalle del perfil
// ───────────────────────────────────────────

/**
 * FilaDetalle: muestra un icono, etiqueta y valor dentro de una
 * tarjeta horizontal. Se usa para cada dato del experto.
 */
function FilaDetalle({
  icon,
  etiqueta,
  valor,
}: {
  icon: React.ReactNode
  etiqueta: string
  valor: string
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl bg-card border border-border p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{etiqueta}</p>
        <p className="mt-0.5 text-base text-card-foreground">{valor}</p>
      </div>
    </div>
  )
}
