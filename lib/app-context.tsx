/**
 * app-context.tsx
 * ----------------
 * Contexto global de la aplicacion Magia Plateada.
 *
 * Centraliza todo el estado compartido entre pantallas:
 * - Pantalla actual (landing, chat, resultados, perfil)
 * - Rol del usuario (cliente o experto)
 * - Autenticacion (usuario logueado, token JWT, creditos)
 * - Mensajes del chat
 * - Lista de expertos (mutable, cargada desde DB)
 * - Sesiones activas
 * - Modales y overlays
 */
"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

// ───────────────────────────────────────────
//  Tipos principales de la aplicacion
// ───────────────────────────────────────────

export type UserRole = "client" | "expert" | null
export type AppScreen = "landing" | "chat" | "results" | "profile"
export type ExpertStatus = "available" | "busy" | "unavailable"

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role: "client" | "expert"
  credits: number
}

export interface Expert {
  id: string
  userId?: string
  name: string
  age: number
  service: string
  serviceCategory?: string
  experience: string
  modality: "presencial" | "remoto" | "ambos"
  zone: string
  schedule: string
  contact: string
  status: ExpertStatus
  rating: number
  totalRatings: number
  avatar: string
  isFeatured?: boolean
}

export interface SessionRequest {
  id: string
  clientId: string
  expertId: string
  status: "pending" | "accepted" | "rejected" | "completed" | "expired" | "disputed"
  requestedDate: string
  requestedTime: string
  requestedDuration: string
  creditsCost: number
  expertName?: string
  expertService?: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  sender: "bot" | "user"
  text: string
  options?: ChatOption[]
  timestamp: Date
}

export interface ChatOption {
  label: string
  value: string
}

// ───────────────────────────────────────────
//  Interfaz del contexto
// ───────────────────────────────────────────

interface AppContextType {
  // Navegacion
  screen: AppScreen
  setScreen: (screen: AppScreen) => void

  // Rol del usuario
  role: UserRole
  setRole: (role: UserRole) => void

  // Autenticacion
  authUser: AuthUser | null
  setAuthUser: (user: AuthUser | null) => void
  authToken: string | null
  setAuthToken: (token: string | null) => void
  isLoggedIn: boolean
  logout: () => void

  // Chat
  messages: ChatMessage[]
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void
  chatStep: number
  setChatStep: (step: number) => void
  searchData: Record<string, string>
  setSearchData: (data: Record<string, string>) => void

  // Expertos (mutable)
  experts: Expert[]
  setExperts: (experts: Expert[]) => void
  selectedExpert: Expert | null
  setSelectedExpert: (expert: Expert | null) => void
  loadExperts: (filters?: Record<string, string>) => Promise<void>

  // Sesiones
  activeSession: SessionRequest | null
  setActiveSession: (session: SessionRequest | null) => void

  // Modales y overlays
  contactModalOpen: boolean
  setContactModalOpen: (open: boolean) => void
  notificationOverlayOpen: boolean
  setNotificationOverlayOpen: (open: boolean) => void

  // Utilidades
  resetChat: () => void
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>
}

// ───────────────────────────────────────────
//  Creacion del contexto y Provider
// ───────────────────────────────────────────

const AppContext = createContext<AppContextType | undefined>(undefined)

const TOKEN_KEY = "magia_plateada_token"

export function AppProvider({ children }: { children: ReactNode }) {
  // --- Estado de navegacion ---
  const [screen, setScreen] = useState<AppScreen>("landing")
  const [role, setRole] = useState<UserRole>(null)

  // --- Estado de autenticacion ---
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authToken, setAuthTokenState] = useState<string | null>(null)

  // --- Estado del chat ---
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatStep, setChatStep] = useState(0)
  const [searchData, setSearchData] = useState<Record<string, string>>({})

  // --- Estado de expertos (mutable, cargado desde DB) ---
  const [experts, setExperts] = useState<Expert[]>([])
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null)

  // --- Estado de sesiones ---
  const [activeSession, setActiveSession] = useState<SessionRequest | null>(null)

  // --- Estado de modales ---
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [notificationOverlayOpen, setNotificationOverlayOpen] = useState(false)

  /** Persiste el token en localStorage y en el state */
  const setAuthToken = useCallback((token: string | null) => {
    setAuthTokenState(token)
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }, [])

  /** Helper para hacer fetch con el token JWT */
  const fetchWithAuth = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers)
      if (authToken) {
        headers.set("Authorization", `Bearer ${authToken}`)
      }
      return fetch(url, { ...options, headers })
    },
    [authToken]
  )

  /** Carga expertos desde la DB con filtros opcionales */
  const loadExperts = useCallback(async (filters?: Record<string, string>) => {
    try {
      const params = new URLSearchParams()
      if (filters?.zone && filters.zone !== "cualquiera") params.set("zone", filters.zone)
      if (filters?.modality && filters.modality !== "ambos") params.set("modality", filters.modality)
      if (filters?.service_category) params.set("service_category", filters.service_category)

      const queryString = params.toString()
      const url = `/api/experts${queryString ? `?${queryString}` : ""}`
      const res = await fetch(url)
      const data = await res.json()

      if (data.experts) {
        setExperts(data.experts)
      }
    } catch (error) {
      console.error("Error cargando expertos:", error)
    }
  }, [])

  /** Cerrar sesion */
  const logout = useCallback(() => {
    setAuthUser(null)
    setAuthToken(null)
    setMessages([])
    setChatStep(0)
    setSearchData({})
    setRole(null)
    setScreen("landing")
    setSelectedExpert(null)
    setActiveSession(null)
  }, [setAuthToken])

  /** Agrega un nuevo mensaje al historial del chat */
  const addMessage = useCallback((message: Omit<ChatMessage, "id" | "timestamp">) => {
    const nuevoMensaje: ChatMessage = {
      ...message,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, nuevoMensaje])
  }, [])

  /** Reinicia el chat y vuelve al inicio */
  const resetChat = useCallback(() => {
    setMessages([])
    setChatStep(0)
    setSearchData({})
    setRole(null)
    setScreen("landing")
    setSelectedExpert(null)
    setActiveSession(null)
  }, [])

  const isLoggedIn = authUser !== null

  // --- Restaurar sesion desde localStorage al montar ---
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    if (savedToken) {
      setAuthTokenState(savedToken)
      // Verificar el token con el backend
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          if (res.ok) return res.json()
          throw new Error("Token invalido")
        })
        .then((data) => {
          setAuthUser(data.user)
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY)
          setAuthTokenState(null)
        })
    }
  }, [])

  return (
    <AppContext.Provider
      value={{
        screen,
        setScreen,
        role,
        setRole,
        authUser,
        setAuthUser,
        authToken,
        setAuthToken,
        isLoggedIn,
        logout,
        messages,
        addMessage,
        experts,
        setExperts,
        selectedExpert,
        setSelectedExpert,
        loadExperts,
        activeSession,
        setActiveSession,
        chatStep,
        setChatStep,
        searchData,
        setSearchData,
        contactModalOpen,
        setContactModalOpen,
        notificationOverlayOpen,
        setNotificationOverlayOpen,
        resetChat,
        fetchWithAuth,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

// ───────────────────────────────────────────
//  Hook personalizado para acceder al contexto
// ───────────────────────────────────────────

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp debe usarse dentro de un <AppProvider>")
  }
  return context
}
