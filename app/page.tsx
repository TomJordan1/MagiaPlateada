/**
 * page.tsx
 * ---------
 * Pagina principal de Magia Plateada.
 *
 * Estructura general:
 * 1. AppProvider envuelve toda la app para proveer el estado global.
 * 2. AppContent selecciona la pantalla activa segun el estado.
 * 3. Los modales (ContactModal, NotificationOverlay) se renderizan siempre
 *    pero solo son visibles cuando su estado "open" esta activo.
 *
 * En desktop, la app se muestra centrada con aspecto de telefono movil
 * (max-w-lg, bordes redondeados, sombra) para mantener la experiencia mobile-first.
 */
"use client"

import { AppProvider, useApp } from "@/lib/app-context"
import { LandingScreen } from "@/components/landing-screen"
import { ChatScreen } from "@/components/chat-screen"
import { ResultsScreen } from "@/components/results-screen"
import { ProfileScreen } from "@/components/profile-screen"
import { ContactModal } from "@/components/contact-modal"
import { NotificationOverlay } from "@/components/notification-overlay"

/**
 * AppContent: componente interno que lee la pantalla activa del contexto
 * y renderiza el componente correspondiente.
 *
 * Se separa de Page porque necesita estar DENTRO del AppProvider
 * para poder usar el hook useApp().
 */
function AppContent() {
  const { screen } = useApp()

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-lg lg:my-8 lg:min-h-0 lg:rounded-3xl lg:border lg:border-border lg:shadow-2xl lg:overflow-hidden">
      {/* Renderizado condicional de pantallas */}
      {screen === "landing" && <LandingScreen />}
      {screen === "chat" && <ChatScreen />}
      {screen === "results" && <ResultsScreen />}
      {screen === "profile" && <ProfileScreen />}

      {/* Modales globales (siempre montados, visibles segun su estado) */}
      <ContactModal />
      <NotificationOverlay />
    </div>
  )
}

/**
 * Page: componente raiz de la pagina.
 * Envuelve todo en el AppProvider y aplica el fondo gris de desktop.
 */
export default function Page() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-secondary lg:flex lg:items-start lg:justify-center lg:py-4">
        <AppContent />
      </div>
    </AppProvider>
  )
}
