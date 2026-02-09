/**
 * app-context.tsx
 * ----------------
 * Contexto global de la aplicacion Magia Plateada.
 *
 * Centraliza todo el estado compartido entre pantallas:
 * - Pantalla actual (landing, chat, resultados, perfil)
 * - Rol del usuario (cliente o experto)
 * - Mensajes del chat
 * - Lista de expertos disponibles
 * - Estado del modal de contacto y overlay de notificacion
 *
 * Usa el patron Context + Provider de React para que cualquier
 * componente hijo pueda leer y modificar el estado sin pasar props manualmente.
 */
"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { EXPERTOS_DEMO } from "./demo-experts"

// ───────────────────────────────────────────
//  Tipos principales de la aplicacion
// ───────────────────────────────────────────

/** Rol del usuario: puede ser "client" (busca ayuda) o "expert" (ofrece servicios) */
export type UserRole = "client" | "expert" | null

/** Pantallas disponibles en la app (se navega cambiando este valor) */
export type AppScreen = "landing" | "chat" | "results" | "profile"

/** Estado de disponibilidad de un experto */
export type ExpertStatus = "available" | "busy" | "unavailable"

/** Datos completos de un experto registrado en la plataforma */
export interface Expert {
  id: string
  name: string
  age: number
  service: string
  experience: string
  modality: "presencial" | "remoto" | "ambos"
  zone: string
  schedule: string
  contact: string
  status: ExpertStatus
  rating: number
  totalRatings: number
  /** Iniciales que se muestran como avatar (ej: "ME" para Maria Elena) */
  avatar: string
}

/** Un mensaje individual dentro del chat */
export interface ChatMessage {
  id: string
  sender: "bot" | "user"
  text: string
  /** Opciones de respuesta rapida (botones bajo el mensaje del bot) */
  options?: ChatOption[]
  timestamp: Date
}

/** Opcion de respuesta rapida que aparece como boton en el chat */
export interface ChatOption {
  label: string
  value: string
}

/** Registro de una solicitud de servicio (para seguimiento futuro) */
export interface ServiceRequest {
  id: string
  clientId: string
  expertId: string
  status: "pending" | "tracking" | "closed"
  contactDate: Date
  notificationDate: Date
}

// ───────────────────────────────────────────
//  Interfaz del contexto (que valores expone)
// ───────────────────────────────────────────

interface AppContextType {
  // Navegacion
  screen: AppScreen
  setScreen: (screen: AppScreen) => void

  // Rol del usuario
  role: UserRole
  setRole: (role: UserRole) => void

  // Chat
  messages: ChatMessage[]
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void
  chatStep: number
  setChatStep: (step: number) => void
  searchData: Record<string, string>
  setSearchData: (data: Record<string, string>) => void

  // Expertos
  experts: Expert[]
  selectedExpert: Expert | null
  setSelectedExpert: (expert: Expert | null) => void

  // Modales y overlays
  contactModalOpen: boolean
  setContactModalOpen: (open: boolean) => void
  notificationOverlayOpen: boolean
  setNotificationOverlayOpen: (open: boolean) => void

  // Utilidades
  resetChat: () => void
}

// ───────────────────────────────────────────
//  Creacion del contexto y Provider
// ───────────────────────────────────────────

const AppContext = createContext<AppContextType | undefined>(undefined)

/**
 * AppProvider: envuelve la app y provee el estado global.
 * Debe colocarse en el nivel mas alto de la jerarquia de componentes.
 */
export function AppProvider({ children }: { children: ReactNode }) {
  // --- Estado de navegacion ---
  const [screen, setScreen] = useState<AppScreen>("landing")
  const [role, setRole] = useState<UserRole>(null)

  // --- Estado del chat ---
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatStep, setChatStep] = useState(0)
  const [searchData, setSearchData] = useState<Record<string, string>>({})

  // --- Estado de expertos (por ahora usa datos demo) ---
  const [experts] = useState<Expert[]>(EXPERTOS_DEMO)
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null)

  // --- Estado de modales ---
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [notificationOverlayOpen, setNotificationOverlayOpen] = useState(false)

  /**
   * Agrega un nuevo mensaje al historial del chat.
   * Genera automaticamente un ID unico y la fecha actual.
   */
  const addMessage = useCallback((message: Omit<ChatMessage, "id" | "timestamp">) => {
    const nuevoMensaje: ChatMessage = {
      ...message,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, nuevoMensaje])
  }, [])

  /**
   * Reinicia todo el estado del chat y vuelve a la pantalla de inicio.
   * Se usa cuando el usuario presiona "Volver al inicio" o termina un flujo.
   */
  const resetChat = useCallback(() => {
    setMessages([])
    setChatStep(0)
    setSearchData({})
    setRole(null)
    setScreen("landing")
    setSelectedExpert(null)
  }, [])

  return (
    <AppContext.Provider
      value={{
        screen,
        setScreen,
        role,
        setRole,
        messages,
        addMessage,
        experts,
        selectedExpert,
        setSelectedExpert,
        chatStep,
        setChatStep,
        searchData,
        setSearchData,
        contactModalOpen,
        setContactModalOpen,
        notificationOverlayOpen,
        setNotificationOverlayOpen,
        resetChat,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// ───────────────────────────────────────────
//  Hook personalizado para acceder al contexto
// ───────────────────────────────────────────

/**
 * useApp: hook que da acceso al estado global de la app.
 * Lanza un error si se usa fuera de un AppProvider (ayuda a detectar errores).
 *
 * Ejemplo de uso:
 *   const { screen, setScreen, experts } = useApp()
 */
export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp debe usarse dentro de un <AppProvider>")
  }
  return context
}
