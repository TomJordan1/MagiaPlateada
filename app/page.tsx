/**
 * app/page.tsx
 * Página principal — AppProvider + AppContent con ParticlesBackground
 */
"use client";

import ParticlesBackground from "@/components/ParticlesBackground";
import { AppProvider, useApp } from "@/lib/app-context";
import { LandingScreen } from "@/components/landing-screen";
import { ChatScreen } from "@/components/chat-screen";
import { ResultsScreen } from "@/components/results-screen";
import { ProfileScreen } from "@/components/profile-screen";
import { ContactModal } from "@/components/contact-modal";
import { NotificationOverlay } from "@/components/notification-overlay";

/* AppContent: usa el contexto y renderiza la pantalla activa */
function AppContent() {
  const { screen } = useApp();

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-lg lg:my-8 lg:min-h-0 lg:rounded-3xl lg:border lg:border-border lg:shadow-2xl lg:overflow-hidden">
      {/* Fondo de partículas — absoluto respecto a este contenedor */}
      <ParticlesBackground />

      {/* Contenido principal por encima de las partículas */}
      <div className="relative z-10">
        {screen === "landing" && <LandingScreen />}
        {screen === "chat" && <ChatScreen />}
        {screen === "results" && <ResultsScreen />}
        {screen === "profile" && <ProfileScreen />}

        {/* Modales globales (siempre montados) */}
        <ContactModal />
        <NotificationOverlay />
      </div>
    </div>
  );
}

/* Page: envuelve todo en AppProvider (único export default en app/) */
export default function Page() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-secondary lg:flex lg:items-start lg:justify-center lg:py-4">
        <AppContent />
      </div>
    </AppProvider>
  );
}
