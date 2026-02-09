/**
 * landing-screen.tsx
 * -------------------
 * Pantalla de inicio (landing) de Magia Plateada.
 *
 * Muestra:
 * 1. Logo y nombre de la app
 * 2. Titulo hero y descripcion
 * 3. Dos botones principales: "Buscar ayuda" y "Ofrecer mis servicios"
 * 4. Seccion "Como funciona" con 3 pasos explicativos
 * 5. Footer con mensaje de marca
 *
 * Al presionar un boton, se inicia el flujo correspondiente en el chat.
 */
"use client"

import React from "react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Search, Briefcase, Star, Users, MessageCircle, Shield } from "lucide-react"

// ───────────────────────────────────────────
//  Componente principal: LandingScreen
// ───────────────────────────────────────────

export function LandingScreen() {
  const { setScreen, setRole, addMessage } = useApp()

  /**
   * Inicia el flujo de CLIENTE (buscar ayuda).
   * Cambia el rol a "client", navega al chat y envia los primeros
   * mensajes del bot con un pequeno retraso para simular conversacion natural.
   */
  function iniciarFlujoBusqueda() {
    setRole("client")
    setScreen("chat")

    // Primer mensaje de bienvenida (aparece tras 500ms)
    setTimeout(() => {
      addMessage({
        sender: "bot",
        text: "Hola, bienvenido a Magia Plateada. Estoy aquí para ayudarte a encontrar al experto ideal para lo que necesitas.",
      })

      // Segundo mensaje con opciones de servicio (aparece tras 1200ms mas)
      setTimeout(() => {
        addMessage({
          sender: "bot",
          text: "Cuentame, ¿qué tipo de servicio estas buscando?",
          options: [
            { label: "Clases o enseñanza", value: "clases" },
            { label: "Reparaciones", value: "reparaciones" },
            { label: "Asesoría profesional", value: "asesoría" },
            { label: "Otro servicio", value: "otro" },
          ],
        })
      }, 1200)
    }, 500)
  }

  /**
   * Inicia el flujo de EXPERTO (ofrecer servicios).
   * Cambia el rol a "expert", navega al chat y envia los primeros
   * mensajes del bot pidiendo el nombre del experto.
   */
  function iniciarFlujoRegistro() {
    setRole("expert")
    setScreen("chat")

    // Primer mensaje de bienvenida (aparece tras 500ms)
    setTimeout(() => {
      addMessage({
        sender: "bot",
        text: "¡Bienvenido! Nos da mucho gusto que quieras compartir tu experiencia. Vamos a crear tu perfil paso a paso.",
      })

      // Segundo mensaje pidiendo el nombre (aparece tras 1200ms mas)
      setTimeout(() => {
        addMessage({
          sender: "bot",
          text: "Para comenzar, ¿cuál es tu nombre completo?",
        })
      }, 1200)
    }, 500)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Encabezado con logo */}
      <header className="flex items-center justify-center px-6 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary">
            <Star className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-2xl text-foreground">Magia Plateada</h1>
        </div>
      </header>

      {/* Seccion hero: titulo principal y descripcion */}
      <main className="flex flex-1 flex-col items-center px-6 pt-6">
        <div className="mx-auto w-full max-w-md text-center">
          <h2 className="font-serif text-3xl leading-tight text-foreground text-balance md:text-4xl">
            Conecta con la experiencia que necesitas
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Una plataforma donde adultos mayores comparten su experiencia y sabiduría con quienes la necesitan.
          </p>
        </div>

        {/* Botones de accion principal (CTAs) */}
        <div className="mt-10 flex w-full max-w-md flex-col gap-4">
          <Button
            size="lg"
            className="h-16 rounded-2xl text-lg font-medium"
            onClick={iniciarFlujoBusqueda}
          >
            <Search className="mr-2 h-5 w-5" />
            Buscar ayuda
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-16 rounded-2xl text-lg font-medium border-2 bg-transparent"
            onClick={iniciarFlujoRegistro}
          >
            <Briefcase className="mr-2 h-5 w-5" />
            Ofrecer mis servicios
          </Button>
        </div>

        {/* Seccion explicativa: "Como funciona" */}
        <section className="mt-14 w-full max-w-md">
          <h3 className="text-center font-serif text-xl text-foreground mb-8">
            Como funciona
          </h3>
          <div className="flex flex-col gap-6">
            <TarjetaPaso
              icon={<MessageCircle className="h-6 w-6" />}
              title="Conversamos contigo"
              description="Un chat sencillo te guía para encontrar o publicar el servicio ideal."
            />
            <TarjetaPaso
              icon={<Users className="h-6 w-6" />}
              title="Conectamos personas"
              description="Encontramos al experto más adecuado según tus necesidades."
            />
            <TarjetaPaso
              icon={<Shield className="h-6 w-6" />}
              title="Sin prisa, con confianza"
              description="Los servicios se coordinan a tu ritmo. Te avisamos cuando sea momento de evaluar."
            />
          </div>
        </section>

        {/* Pie de pagina */}
        <footer className="mt-14 mb-8 text-center">
          <p className="text-sm text-muted-foreground">
            Hecho con cariño para quienes más saben
          </p>
        </footer>
      </main>
    </div>
  )
}

// ───────────────────────────────────────────
//  Subcomponente: tarjeta de paso explicativo
// ───────────────────────────────────────────

/**
 * TarjetaPaso: muestra un icono, titulo y descripcion
 * dentro de una tarjeta con borde suave. Se usa en la seccion
 * "Como funciona" de la landing.
 */
function TarjetaPaso({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-card p-5 shadow-sm border border-border">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
        {icon}
      </div>
      <div className="flex flex-col">
        <h4 className="text-base font-semibold text-card-foreground">{title}</h4>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
