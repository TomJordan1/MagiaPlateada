/**
 * landing-screen.tsx
 * -------------------
 * Pantalla de inicio de Magia Plateada.
 *
 * Textos alineados con el documento funcional:
 * - "Quiero encontrar ayuda" / "Quiero ofrecer mi experiencia"
 * - Si el usuario ya esta logueado, muestra bienvenida personalizada
 */
"use client"

import React from "react"
import { useApp } from "@/lib/app-context"
import { Button } from "@/components/ui/button"
import { Search, Briefcase, Star, Users, MessageCircle, Shield, CreditCard, LogOut } from "lucide-react"

export function LandingScreen() {
  const { setScreen, setRole, addMessage, isLoggedIn, authUser, logout, setChatStep, fetchWithAuth } = useApp()

  /**
   * Inicia el flujo de CLIENTE.
   * Si ya esta logueado, salta directo al flujo de busqueda.
   * Si no, inicia el flujo de autenticacion.
   */
  function iniciarFlujoBusqueda() {
    setRole("client")
    setScreen("chat")

    if (isLoggedIn && authUser) {
      setChatStep(100) // Saltar auth, ir directo a busqueda
      setTimeout(() => {
        addMessage({
          sender: "bot",
          text: `¡Hola de nuevo, ${authUser.displayName}! Tienes ${authUser.credits} creditos disponibles. Vamos a encontrarte un experto.`,
        })
        setTimeout(() => {
          addMessage({
            sender: "bot",
            text: "Cuentame, ¿que tipo de servicio estas buscando?",
            options: [
              { label: "Clases o ensenanza", value: "clases" },
              { label: "Reparaciones", value: "reparaciones" },
              { label: "Asesoria profesional", value: "asesoria" },
              { label: "Oficios manuales", value: "oficios" },
              { label: "Otro servicio", value: "otro" },
            ],
          })
        }, 1200)
      }, 500)
    } else {
      setTimeout(() => {
        addMessage({
          sender: "bot",
          text: "¡Hola! Bienvenido a Magia Plateada. Estoy aqui para ayudarte a encontrar al experto ideal.",
        })
        setTimeout(() => {
          addMessage({
            sender: "bot",
            text: "Para comenzar, necesito que inicies sesion o crees una cuenta. ¿Que prefieres?",
            options: [
              { label: "Iniciar sesion", value: "login" },
              { label: "Crear cuenta nueva", value: "register" },
            ],
          })
        }, 1200)
      }, 500)
    }
  }

  /**
   * Inicia el flujo de EXPERTO.
   * Si ya esta logueado como experto, muestra opciones de gestion.
   * Si no, inicia el flujo de autenticacion.
   */
  async function iniciarFlujoExperto() {
    setRole("expert")
    setScreen("chat")

    if (isLoggedIn && authUser) {
      setChatStep(200) // Saltar auth, ir directo a gestion de experto

      // Obtener perfil y sesiones pendientes del experto
      try {
        const res = await fetchWithAuth("/api/experts/me")
        const data = await res.json()
        const pendingCount = data.pendingSessions || 0
        const expertProfile = data.expert

        if (!expertProfile) {
          // Tiene cuenta pero no perfil de experto aun
          setTimeout(() => {
            addMessage({
              sender: "bot",
              text: `¡Hola, ${authUser.displayName}! Veo que aun no has completado tu perfil de experto. Vamos a crearlo.`,
            })
            setTimeout(() => {
              addMessage({
                sender: "bot",
                text: "Para comenzar tu perfil profesional, ¿cual es tu nombre completo?",
              })
              setChatStep(201)
            }, 1200)
          }, 500)
          return
        }

        const pendingText = pendingCount > 0
          ? ` Tienes ${pendingCount} solicitud(es) de sesion pendiente(s).`
          : ""

        setTimeout(() => {
          addMessage({
            sender: "bot",
            text: `¡Hola, ${authUser.displayName}!${pendingText} ¿Que deseas hacer?`,
            options: [
              { label: "Ver mi perfil", value: "expert_view_profile" },
              { label: "Editar mi informacion", value: "expert_edit_info" },
              { label: "Cambiar disponibilidad", value: "expert_change_status" },
              { label: "Membresia destacada", value: "expert_membership" },
              ...(pendingCount > 0
                ? [{ label: `Ver sesiones (${pendingCount})`, value: "expert_view_sessions" }]
                : []),
              { label: "Volver al inicio", value: "home" },
            ],
          })
        }, 500)
      } catch {
        setTimeout(() => {
          addMessage({
            sender: "bot",
            text: `¡Hola, ${authUser.displayName}! ¿Que deseas hacer?`,
            options: [
              { label: "Ver mi perfil", value: "expert_view_profile" },
              { label: "Cambiar disponibilidad", value: "expert_change_status" },
              { label: "Volver al inicio", value: "home" },
            ],
          })
        }, 500)
      }
    } else {
      setTimeout(() => {
        addMessage({
          sender: "bot",
          text: "¡Bienvenido! Nos da mucho gusto que quieras compartir tu experiencia. Para comenzar, necesitamos crear tu cuenta.",
        })
        setTimeout(() => {
          addMessage({
            sender: "bot",
            text: "¿Ya tienes una cuenta o deseas registrarte?",
            options: [
              { label: "Iniciar sesion", value: "login" },
              { label: "Crear cuenta nueva", value: "register" },
            ],
          })
        }, 1200)
      }, 500)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Encabezado con logo y sesion */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary">
            <Star className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-2xl text-foreground">Magia Plateada</h1>
        </div>
        {isLoggedIn && authUser && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent">
              <CreditCard className="h-3.5 w-3.5" />
              {authUser.credits}
            </span>
            <button
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary transition-colors"
              aria-label="Cerrar sesion"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </header>

      <main className="flex flex-1 flex-col items-center px-6 pt-6">
        <div className="mx-auto w-full max-w-md text-center">
          {isLoggedIn && authUser ? (
            <>
              <p className="text-base text-muted-foreground">
                Hola, {authUser.displayName}
              </p>
              <h2 className="mt-2 font-serif text-3xl leading-tight text-foreground text-balance md:text-4xl">
                ¿Que necesitas hoy?
              </h2>
            </>
          ) : (
            <>
              <h2 className="font-serif text-3xl leading-tight text-foreground text-balance md:text-4xl">
                Conectando como si fuera magia
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Una plataforma donde adultos mayores comparten su experiencia y sabiduria con quienes la necesitan.
              </p>
            </>
          )}
        </div>

        {/* CTAs alineados con el documento funcional */}
        <div className="mt-10 flex w-full max-w-md flex-col gap-4">
          <Button
            size="lg"
            className="h-16 rounded-2xl text-lg font-medium"
            onClick={iniciarFlujoBusqueda}
          >
            <Search className="mr-2 h-5 w-5" />
            Quiero encontrar ayuda
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-16 rounded-2xl text-lg font-medium border-2 bg-transparent"
            onClick={iniciarFlujoExperto}
          >
            <Briefcase className="mr-2 h-5 w-5" />
            Quiero ofrecer mi experiencia
          </Button>
        </div>

        {/* Seccion "Como funciona" */}
        <section className="mt-14 w-full max-w-md">
          <h3 className="text-center font-serif text-xl text-foreground mb-8">
            Como funciona
          </h3>
          <div className="flex flex-col gap-6">
            <TarjetaPaso
              icon={<MessageCircle className="h-6 w-6" />}
              title="Conversamos contigo"
              description="Un chat sencillo te guia para encontrar o publicar el servicio ideal."
            />
            <TarjetaPaso
              icon={<Users className="h-6 w-6" />}
              title="Conectamos personas"
              description="Encontramos al experto mas adecuado segun tus necesidades."
            />
            <TarjetaPaso
              icon={<Shield className="h-6 w-6" />}
              title="Con confianza y creditos"
              description="Solicita sesiones con creditos. Ambos se califican al terminar."
            />
          </div>
        </section>

        <footer className="mt-14 mb-8 text-center">
          <p className="text-sm text-muted-foreground">
            Hecho con carino para quienes mas saben
          </p>
        </footer>
      </main>
    </div>
  )
}

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
