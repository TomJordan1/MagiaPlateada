/**
 * profile-screen.tsx
 * -------------------
 * Pantalla de perfil detallado de un experto.
 *
 * Cambio principal: el boton "Contactar" ahora inicia el flujo de
 * "Solicitar sesion" dentro del chat (en vez de abrir WhatsApp).
 * Muestra badge de "Destacado" si el experto tiene membresia.
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
  Briefcase,
  Calendar,
  CalendarPlus,
  Award,
} from "lucide-react"

export function ProfileScreen() {
  const {
    selectedExpert,
    setScreen,
    isLoggedIn,
    addMessage,
    setChatStep,
    setSearchData,
    searchData,
    role,
    setRole,
    authUser,
  } = useApp()

  if (!selectedExpert) return null

  const primerNombre = selectedExpert.name.split(" ")[0]

  /** Inicia el flujo de solicitud de sesion dentro del chat */
  function iniciarSolicitudSesion() {
    if (!isLoggedIn) {
      // Si no esta logueado, redirigir a auth primero
      setRole("client")
      setScreen("chat")
      setTimeout(() => {
        addMessage({
          sender: "bot",
          text: "Para solicitar una sesion necesitas iniciar sesion primero.",
        })
        setTimeout(() => {
          addMessage({
            sender: "bot",
            text: "¿Que prefieres?",
            options: [
              { label: "Iniciar sesion", value: "login" },
              { label: "Crear cuenta nueva", value: "register" },
            ],
          })
        }, 800)
      }, 300)
      return
    }

    // Ya esta logueado, iniciar flujo de solicitud de sesion
    setScreen("chat")
    if (!role) setRole("client")

    setTimeout(() => {
      addMessage({
        sender: "bot",
        text: `Vas a solicitar una sesion con ${selectedExpert.name}. Servicio: ${selectedExpert.service}.`,
      })
      setTimeout(() => {
        addMessage({
          sender: "bot",
          text: "¿Para que fecha te gustaria la sesion?",
          options: [
            { label: "Hoy", value: "Hoy" },
            { label: "Manana", value: "Manana" },
            { label: "Esta semana", value: "Esta semana" },
            { label: "La proxima semana", value: "La proxima semana" },
          ],
        })
        setChatStep(300)
      }, 1000)
    }, 300)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
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

      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-lg">
          {/* Cabecera del perfil */}
          <div className="flex flex-col items-center text-center animate-fade-in-up">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {selectedExpert.avatar}
              </AvatarFallback>
            </Avatar>

            <h2 className="mt-4 font-serif text-2xl text-foreground">{selectedExpert.name}</h2>
            <p className="mt-1 text-base text-muted-foreground">{selectedExpert.service}</p>

            {/* Badges: estado + destacado */}
            <div className="mt-3 flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`${COLOR_POR_ESTADO[selectedExpert.status]} border-0 text-sm font-medium px-3 py-1`}
              >
                {ETIQUETA_ESTADO[selectedExpert.status]}
              </Badge>
              {selectedExpert.isFeatured && (
                <Badge
                  variant="secondary"
                  className="bg-accent/15 text-accent border-0 text-sm font-medium px-3 py-1"
                >
                  <Award className="mr-1 h-3.5 w-3.5" />
                  Destacado
                </Badge>
              )}
            </div>

            {/* Estrellas */}
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

          {/* Detalles */}
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
          </div>

          {/* Creditos disponibles (si esta logueado) */}
          {isLoggedIn && authUser && (
            <div className="mt-6 rounded-xl bg-secondary p-4 text-center animate-fade-in-up" style={{ animationDelay: "250ms" }}>
              <p className="text-sm text-secondary-foreground">
                Tienes <span className="font-bold text-foreground">{authUser.credits} creditos</span> disponibles. Solicitar una sesion cuesta 1 credito.
              </p>
            </div>
          )}

          {/* Boton de solicitar sesion (reemplaza "Contactar via WhatsApp") */}
          <div className="mt-6 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <Button
              className="h-16 w-full rounded-2xl text-lg font-medium"
              onClick={iniciarSolicitudSesion}
            >
              <CalendarPlus className="mr-2 h-5 w-5" />
              Solicitar sesion con {primerNombre}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

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
