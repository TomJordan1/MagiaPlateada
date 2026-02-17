/**
 * chat-screen.tsx
 * ----------------
 * Pantalla de chat principal de Magia Plateada.
 *
 * Flujos implementados:
 * - CLIENTE: autenticacion -> busqueda -> resultados
 * - EXPERTO: autenticacion -> registro de perfil
 * - SESION: solicitud de sesion con fecha/hora/duracion
 * - POST-SESION: verificacion y calificacion multidimensional
 *
 * Todo el flujo de autenticacion ocurre dentro del chat, sin pantallas nuevas.
 */
"use client"

import { useApp, type ChatOption } from "@/lib/app-context"
import { EDAD_MINIMA_EXPERTO } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Send, Star, CreditCard, LogOut } from "lucide-react"
import { useEffect, useRef, useState } from "react"

// ───────────────────────────────────────────
//  Componente principal: ChatScreen
// ───────────────────────────────────────────

export function ChatScreen() {
  const {
    messages,
    addMessage,
    role,
    resetChat,
    chatStep,
    setChatStep,
    setScreen,
    searchData,
    setSearchData,
    authUser,
    setAuthUser,
    setAuthToken,
    isLoggedIn,
    logout,
    loadExperts,
    fetchWithAuth,
    selectedExpert,
    setActiveSession,
  } = useApp()

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState("")
  const [estaCargando, setEstaCargando] = useState(false)
  const [inputType, setInputType] = useState<"text" | "email" | "password">("text")

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, estaCargando])

  // ─── Funciones auxiliares ───

  function enviarMensajeBot(texto: string, opciones?: ChatOption[], retrasoMs = 800) {
    setEstaCargando(true)
    setTimeout(() => {
      setEstaCargando(false)
      addMessage({ sender: "bot", text: texto, options: opciones })
    }, retrasoMs)
  }

  function enviarMensajeBotSecuencia(mensajes: { texto: string; opciones?: ChatOption[] }[], retrasoBase = 800) {
    mensajes.forEach((msg, i) => {
      setTimeout(() => {
        if (i === mensajes.length - 1) {
          setEstaCargando(false)
        }
        addMessage({ sender: "bot", text: msg.texto, options: msg.opciones })
      }, retrasoBase * (i + 1))
    })
    if (mensajes.length > 0) setEstaCargando(true)
  }

  function guardarDato(campo: string, valor: string) {
    setSearchData({ ...searchData, [campo]: valor })
  }

  // ───────────────────────────────────────
  //  FLUJO DE AUTENTICACION (pasos 0-99)
  //  Pasos: 0=pregunta login/registro, 1=email, 2=password,
  //         3=confirmar password (solo registro), 4=nombre (solo registro)
  // ───────────────────────────────────────

  async function procesarPasoAuth(valor: string, paso: number) {
    switch (paso) {
      case 0: {
        // Eligio "Iniciar sesion" o "Crear cuenta"
        if (valor === "login") {
          guardarDato("authMode", "login")
          setInputType("email")
          enviarMensajeBot("Por favor, ingresa tu correo electronico:")
          setChatStep(1)
        } else if (valor === "register") {
          guardarDato("authMode", "register")
          setInputType("email")
          enviarMensajeBot("Vamos a crear tu cuenta. Primero, ingresa tu correo electronico:")
          setChatStep(1)
        }
        break
      }
      case 1: {
        // Email ingresado
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(valor)) {
          enviarMensajeBot("Ese correo no parece valido. Por favor ingresa un correo electronico correcto:")
          return
        }
        guardarDato("email", valor)
        setInputType("password")
        enviarMensajeBot("Ahora ingresa tu contrasena (minimo 6 caracteres):")
        setChatStep(2)
        break
      }
      case 2: {
        // Password ingresado
        if (valor.length < 6) {
          enviarMensajeBot("La contrasena debe tener al menos 6 caracteres. Intenta de nuevo:")
          return
        }
        guardarDato("password", valor)

        if (searchData.authMode === "login") {
          // Intentar login
          setInputType("text")
          await intentarLogin(searchData.email || "", valor)
        } else {
          // Registro: pedir confirmacion de password
          enviarMensajeBot("Confirma tu contrasena:")
          setChatStep(3)
        }
        break
      }
      case 3: {
        // Confirmar password (solo registro)
        if (valor !== searchData.password) {
          enviarMensajeBot("Las contrasenas no coinciden. Confirma tu contrasena nuevamente:")
          return
        }
        setInputType("text")
        enviarMensajeBot("¿Como te gustaria que te llamemos?")
        setChatStep(4)
        break
      }
      case 4: {
        // Nombre (solo registro)
        guardarDato("displayName", valor)
        await intentarRegistro(
          searchData.email || "",
          searchData.password || "",
          valor,
          role || "client"
        )
        break
      }
    }
  }

  async function intentarLogin(email: string, password: string) {
    setEstaCargando(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      setEstaCargando(false)

      if (!res.ok) {
        addMessage({ sender: "bot", text: data.error || "Error al iniciar sesion." })
        addMessage({
          sender: "bot",
          text: "¿Deseas intentar de nuevo?",
          options: [
            { label: "Intentar de nuevo", value: "retry_login" },
            { label: "Crear cuenta nueva", value: "switch_register" },
            { label: "Volver al inicio", value: "home" },
          ],
        })
        setChatStep(99) // paso especial para reintentos
        return
      }

      // Login exitoso
      setAuthToken(data.token)
      setAuthUser(data.user)
      iniciarFlujoPostAuth(data.user)
    } catch {
      setEstaCargando(false)
      addMessage({ sender: "bot", text: "Hubo un error de conexion. Intenta de nuevo mas tarde." })
    }
  }

  async function intentarRegistro(email: string, password: string, displayName: string, userRole: string) {
    setEstaCargando(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName, role: userRole }),
      })
      const data = await res.json()
      setEstaCargando(false)

      if (!res.ok) {
        addMessage({ sender: "bot", text: data.error || "Error al crear la cuenta." })
        addMessage({
          sender: "bot",
          text: "¿Que deseas hacer?",
          options: [
            { label: "Intentar de nuevo", value: "retry_register" },
            { label: "Iniciar sesion", value: "switch_login" },
            { label: "Volver al inicio", value: "home" },
          ],
        })
        setChatStep(99)
        return
      }

      // Registro exitoso
      setAuthToken(data.token)
      setAuthUser(data.user)

      if (userRole === "client") {
        enviarMensajeBotSecuencia([
          { texto: `¡Bienvenido/a, ${displayName}! Tu cuenta ha sido creada exitosamente.` },
          { texto: `Has recibido ${data.user.credits} creditos de bienvenida para solicitar sesiones con nuestros expertos.` },
        ])
        // Continuar flujo de busqueda despues del registro
        setTimeout(() => {
          iniciarFlujoBusqueda()
        }, 2500)
      } else {
        enviarMensajeBot(`¡Bienvenido/a, ${displayName}! Tu cuenta de experto ha sido creada. Ahora vamos a completar tu perfil profesional.`)
        setTimeout(() => {
          iniciarFlujoRegistroExperto()
        }, 1500)
      }
    } catch {
      setEstaCargando(false)
      addMessage({ sender: "bot", text: "Hubo un error de conexion. Intenta de nuevo mas tarde." })
    }
  }

  /** Despues de login exitoso, redirige al flujo correcto segun el rol */
  function iniciarFlujoPostAuth(user: { role: string; displayName: string; credits: number }) {
    if (user.role === "client" || role === "client") {
      enviarMensajeBot(`¡Hola de nuevo, ${user.displayName}! Tienes ${user.credits} creditos disponibles. Vamos a encontrarte un experto.`)
      setTimeout(() => {
        iniciarFlujoBusqueda()
      }, 1500)
    } else {
      enviarMensajeBot(`¡Hola de nuevo, ${user.displayName}! ¿Que deseas hacer?`, [
        { label: "Ver mi perfil", value: "expert_view_profile" },
        { label: "Cambiar disponibilidad", value: "expert_change_status" },
        { label: "Volver al inicio", value: "home" },
      ])
      setChatStep(200) // pasos de gestion de experto
    }
  }

  // ───────────────────────────────────────
  //  FLUJO CLIENTE: busqueda (pasos 100-110)
  // ───────────────────────────────────────

  function iniciarFlujoBusqueda() {
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
    setChatStep(100)
  }

  function procesarPasoCliente(valor: string, paso: number) {
    switch (paso) {
      case 100:
        guardarDato("service", valor)
        enviarMensajeBot("¿Puedes darme mas detalles sobre lo que necesitas?")
        setChatStep(101)
        break

      case 101:
        guardarDato("details", valor)
        enviarMensajeBot("¿Prefieres que el servicio sea presencial o remoto?", [
          { label: "Presencial", value: "presencial" },
          { label: "Remoto", value: "remoto" },
          { label: "Me da igual", value: "ambos" },
        ])
        setChatStep(102)
        break

      case 102:
        guardarDato("modality", valor)
        enviarMensajeBot("¿En que zona te encuentras?", [
          { label: "Centro", value: "Centro" },
          { label: "Norte", value: "Norte" },
          { label: "Sur", value: "Sur" },
          { label: "Este", value: "Este" },
          { label: "Cualquier zona", value: "cualquiera" },
        ])
        setChatStep(103)
        break

      case 103:
        guardarDato("zone", valor)
        enviarMensajeBot("¿Que tan urgente es para ti?", [
          { label: "Lo antes posible", value: "urgente" },
          { label: "Esta semana", value: "semana" },
          { label: "Sin prisa", value: "sin_prisa" },
        ])
        setChatStep(104)
        break

      case 104:
        guardarDato("urgency", valor)
        enviarMensajeBot(
          "¡Perfecto! He encontrado expertos que pueden ayudarte. Voy a mostrarte los resultados.",
          undefined,
          1000,
        )
        // Cargar expertos filtrados desde la DB
        loadExperts({
          zone: searchData.zone || "",
          modality: searchData.modality || "",
          service_category: searchData.service || "",
        })
        setTimeout(() => {
          setScreen("results")
        }, 2500)
        setChatStep(105)
        break

      default:
        break
    }
  }

  // ───────────────────────────────────────
  //  FLUJO EXPERTO: registro de perfil (pasos 200-210)
  // ───────────────────────────────────────

  function iniciarFlujoRegistroExperto() {
    addMessage({
      sender: "bot",
      text: "Para comenzar tu perfil profesional, ¿cual es tu nombre completo?",
    })
    setChatStep(201)
  }

  async function procesarPasoExperto(valor: string, paso: number) {
    switch (paso) {
      case 200: {
        // Menu de gestion de experto post-login
        if (valor === "expert_view_profile") {
          await mostrarPerfilExperto()
        } else if (valor === "expert_edit_info") {
          enviarMensajeBot("¿Que campo deseas editar?", [
            { label: "Servicio ofrecido", value: "edit_service" },
            { label: "Experiencia", value: "edit_experience" },
            { label: "Horario", value: "edit_schedule" },
            { label: "Contacto", value: "edit_contact" },
            { label: "Zona", value: "edit_zone" },
            { label: "Modalidad", value: "edit_modality" },
          ])
          setChatStep(220)
        } else if (valor === "expert_change_status") {
          enviarMensajeBot("¿Cual es tu nueva disponibilidad?", [
            { label: "Disponible", value: "available" },
            { label: "Con agenda llena", value: "busy" },
            { label: "No disponible temporalmente", value: "unavailable" },
          ])
          setChatStep(230)
        } else if (valor === "expert_membership") {
          await mostrarInfoMembresia()
        } else if (valor === "expert_view_sessions") {
          await mostrarSesionesPendientes()
        } else if (valor === "expert_menu") {
          // Volver al menu de gestion
          enviarMensajeBot("¿Que mas deseas hacer?", [
            { label: "Ver mi perfil", value: "expert_view_profile" },
            { label: "Editar mi informacion", value: "expert_edit_info" },
            { label: "Cambiar disponibilidad", value: "expert_change_status" },
            { label: "Membresia destacada", value: "expert_membership" },
            { label: "Volver al inicio", value: "home" },
          ])
          setChatStep(200)
        }
        break
      }
      case 201:
        guardarDato("name", valor)
        enviarMensajeBot("¿Que edad tienes? Recuerda que este espacio es para personas mayores de 50 anos.")
        setChatStep(202)
        break

      case 202: {
        const edad = parseInt(valor)
        if (isNaN(edad) || edad < EDAD_MINIMA_EXPERTO) {
          enviarMensajeBot(
            "Lo sentimos, esta plataforma esta disenada para personas de 50 anos en adelante. Si crees que hubo un error, intenta de nuevo.",
          )
          return
        }
        guardarDato("age", valor)
        enviarMensajeBot("¿Que tipo de servicio ofreces?", [
          { label: "Clases o ensenanza", value: "clases" },
          { label: "Reparaciones", value: "reparaciones" },
          { label: "Asesoria profesional", value: "asesoria" },
          { label: "Oficios manuales", value: "oficios" },
          { label: "Otro", value: "otro" },
        ])
        setChatStep(203)
        break
      }

      case 203:
        guardarDato("serviceCategory", valor)
        enviarMensajeBot("Describe brevemente el servicio que ofreces:")
        setChatStep(204)
        break

      case 204:
        guardarDato("service", valor)
        enviarMensajeBot("Cuentame sobre tu experiencia en este campo.")
        setChatStep(205)
        break

      case 205:
        guardarDato("experience", valor)
        enviarMensajeBot("¿Cual es tu modalidad preferida?", [
          { label: "Presencial", value: "presencial" },
          { label: "Remoto", value: "remoto" },
          { label: "Ambos", value: "ambos" },
        ])
        setChatStep(206)
        break

      case 206:
        guardarDato("modality", valor)
        enviarMensajeBot("¿En que zona te encuentras?", [
          { label: "Centro", value: "Centro" },
          { label: "Norte", value: "Norte" },
          { label: "Sur", value: "Sur" },
          { label: "Este", value: "Este" },
        ])
        setChatStep(207)
        break

      case 207:
        guardarDato("zone", valor)
        enviarMensajeBot("¿Cuales son tus horarios disponibles? Por ejemplo: Lunes a Viernes, 10:00 - 14:00")
        setChatStep(208)
        break

      case 208:
        guardarDato("schedule", valor)
        enviarMensajeBot("Por ultimo, ¿cual es tu medio de contacto preferido? (WhatsApp, telefono, correo)")
        setChatStep(209)
        break

      case 209: {
        guardarDato("contact", valor)
        // Guardar el experto en la DB
        setEstaCargando(true)
        try {
          const res = await fetchWithAuth("/api/experts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: searchData.name || authUser?.displayName || "",
              age: parseInt(searchData.age || "50"),
              service: searchData.service || "",
              serviceCategory: searchData.serviceCategory || "otro",
              experience: searchData.experience || "",
              modality: searchData.modality || "ambos",
              zone: searchData.zone || "Centro",
              schedule: searchData.schedule || "",
              contact: valor,
            }),
          })
          setEstaCargando(false)

          if (res.ok) {
            enviarMensajeBotSecuencia([
              { texto: "¡Excelente! Tu perfil ha sido creado con exito y guardado en nuestra base de datos." },
              {
                texto: "Ahora los usuarios podran encontrarte cuando busquen servicios como los tuyos. ¡Bienvenido/a a Magia Plateada!",
                opciones: [{ label: "Volver al inicio", value: "home" }],
              },
            ])
          } else {
            const data = await res.json()
            addMessage({ sender: "bot", text: data.error || "Hubo un error al crear tu perfil." })
            addMessage({
              sender: "bot",
              text: "Puedes intentar de nuevo o volver al inicio.",
              options: [{ label: "Volver al inicio", value: "home" }],
            })
          }
        } catch {
          setEstaCargando(false)
          addMessage({ sender: "bot", text: "Error de conexion. Intenta de nuevo mas tarde." })
        }
        setChatStep(210)
        break
      }

      case 210:
        resetChat()
        break

      // ─── Editar informacion (pasos 220-221) ───
      case 220: {
        const fieldMap: Record<string, string> = {
          edit_service: "service",
          edit_experience: "experience",
          edit_schedule: "schedule",
          edit_contact: "contact",
          edit_zone: "zone",
          edit_modality: "modality",
        }
        const campo = fieldMap[valor]
        if (campo) {
          guardarDato("editField", campo)
          if (campo === "zone") {
            enviarMensajeBot("Selecciona tu nueva zona:", [
              { label: "Centro", value: "Centro" },
              { label: "Norte", value: "Norte" },
              { label: "Sur", value: "Sur" },
              { label: "Este", value: "Este" },
            ])
          } else if (campo === "modality") {
            enviarMensajeBot("Selecciona tu nueva modalidad:", [
              { label: "Presencial", value: "presencial" },
              { label: "Remoto", value: "remoto" },
              { label: "Ambos", value: "ambos" },
            ])
          } else {
            const labels: Record<string, string> = {
              service: "Escribe tu nuevo servicio ofrecido:",
              experience: "Describe tu nueva experiencia:",
              schedule: "Escribe tu nuevo horario (ej: Lunes a Viernes, 10:00 - 14:00):",
              contact: "Escribe tu nuevo medio de contacto:",
            }
            enviarMensajeBot(labels[campo] || "Escribe el nuevo valor:")
          }
          setChatStep(221)
        }
        break
      }

      case 221: {
        // Guardar el campo editado en la DB
        const field = searchData.editField
        if (!field) break

        setEstaCargando(true)
        try {
          const res = await fetchWithAuth("/api/experts/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ field, value: valor }),
          })
          setEstaCargando(false)

          if (res.ok) {
            const labelCampo: Record<string, string> = {
              service: "servicio",
              experience: "experiencia",
              schedule: "horario",
              contact: "contacto",
              zone: "zona",
              modality: "modalidad",
            }
            enviarMensajeBot(`Tu ${labelCampo[field] || field} ha sido actualizado exitosamente.`, [
              { label: "Editar otro campo", value: "expert_edit_info" },
              { label: "Menu principal", value: "expert_menu" },
              { label: "Volver al inicio", value: "home" },
            ])
          } else {
            const data = await res.json()
            enviarMensajeBot(data.error || "Error al actualizar.", [
              { label: "Intentar de nuevo", value: "expert_edit_info" },
              { label: "Menu principal", value: "expert_menu" },
            ])
          }
        } catch {
          setEstaCargando(false)
          enviarMensajeBot("Error de conexion.", [
            { label: "Menu principal", value: "expert_menu" },
          ])
        }
        setChatStep(200)
        break
      }

      // ─── Cambiar disponibilidad (paso 230) ───
      case 230: {
        if (["available", "busy", "unavailable"].includes(valor)) {
          setEstaCargando(true)
          try {
            const res = await fetchWithAuth("/api/experts/status", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: valor }),
            })
            setEstaCargando(false)

            if (res.ok) {
              const labels: Record<string, string> = {
                available: "Disponible",
                busy: "Con agenda llena",
                unavailable: "No disponible temporalmente",
              }
              enviarMensajeBot(`Tu estado ha sido actualizado a "${labels[valor]}".`, [
                { label: "Menu principal", value: "expert_menu" },
                { label: "Volver al inicio", value: "home" },
              ])
            } else {
              const data = await res.json()
              enviarMensajeBot(data.error || "Error al cambiar estado.", [
                { label: "Intentar de nuevo", value: "expert_change_status" },
                { label: "Menu principal", value: "expert_menu" },
              ])
            }
          } catch {
            setEstaCargando(false)
            enviarMensajeBot("Error de conexion.", [
              { label: "Menu principal", value: "expert_menu" },
            ])
          }
          setChatStep(200)
        }
        break
      }

      // ─── Membresia destacada (paso 240) ───
      case 240: {
        if (valor === "activate_premium" || valor === "deactivate_premium") {
          const newType = valor === "activate_premium" ? "premium" : "free"
          setEstaCargando(true)
          try {
            const res = await fetchWithAuth("/api/experts/membership", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ membershipType: newType }),
            })
            setEstaCargando(false)

            if (res.ok) {
              if (newType === "premium") {
                enviarMensajeBotSecuencia([
                  { texto: "¡Membresia premium activada! (simulado para la demo)" },
                  {
                    texto: "Tu perfil ahora aparecera destacado y con prioridad en los resultados de busqueda.",
                    opciones: [
                      { label: "Menu principal", value: "expert_menu" },
                      { label: "Volver al inicio", value: "home" },
                    ],
                  },
                ])
              } else {
                enviarMensajeBot("Tu membresia ha vuelto al plan gratuito.", [
                  { label: "Menu principal", value: "expert_menu" },
                  { label: "Volver al inicio", value: "home" },
                ])
              }
            } else {
              const data = await res.json()
              enviarMensajeBot(data.error || "Error al cambiar membresia.", [
                { label: "Menu principal", value: "expert_menu" },
              ])
            }
          } catch {
            setEstaCargando(false)
            enviarMensajeBot("Error de conexion.", [
              { label: "Menu principal", value: "expert_menu" },
            ])
          }
          setChatStep(200)
        }
        break
      }

      default:
        break
    }
  }

  // ─── Funciones auxiliares de experto ───

  async function mostrarPerfilExperto() {
    setEstaCargando(true)
    try {
      const res = await fetchWithAuth("/api/experts/me")
      const data = await res.json()
      setEstaCargando(false)

      if (!data.expert) {
        enviarMensajeBot("Aun no tienes un perfil de experto creado. ¿Deseas crearlo?", [
          { label: "Si, crear perfil", value: "create_profile" },
          { label: "Volver al inicio", value: "home" },
        ])
        return
      }

      const e = data.expert
      const statusLabels: Record<string, string> = {
        available: "Disponible",
        busy: "Con agenda llena",
        unavailable: "No disponible",
      }
      const membershipLabel = e.membershipType === "premium" ? "Premium (Destacado)" : "Gratuita"

      enviarMensajeBotSecuencia([
        {
          texto: `Tu perfil:\n\nNombre: ${e.name}\nServicio: ${e.service}\nExperiencia: ${e.experience}\nModalidad: ${e.modality === "ambos" ? "Presencial y Remoto" : e.modality === "presencial" ? "Presencial" : "Remoto"}\nZona: ${e.zone}\nHorario: ${e.schedule}\nContacto: ${e.contact}\nEstado: ${statusLabels[e.status] || e.status}\nMembresia: ${membershipLabel}\nCalificacion: ${e.rating}/5 (${e.totalRatings} resenas)`,
        },
        {
          texto: "¿Que deseas hacer?",
          opciones: [
            { label: "Editar mi informacion", value: "expert_edit_info" },
            { label: "Cambiar disponibilidad", value: "expert_change_status" },
            { label: "Membresia destacada", value: "expert_membership" },
            { label: "Volver al inicio", value: "home" },
          ],
        },
      ])
      setChatStep(200)
    } catch {
      setEstaCargando(false)
      enviarMensajeBot("Error al obtener tu perfil.", [
        { label: "Intentar de nuevo", value: "expert_view_profile" },
        { label: "Volver al inicio", value: "home" },
      ])
    }
  }

  async function mostrarInfoMembresia() {
    setEstaCargando(true)
    try {
      const res = await fetchWithAuth("/api/experts/me")
      const data = await res.json()
      setEstaCargando(false)

      const currentType = data.expert?.membershipType || "free"

      if (currentType === "premium") {
        enviarMensajeBotSecuencia([
          { texto: "Actualmente tienes la membresia Premium activa. Tu perfil aparece destacado y con prioridad en los resultados." },
          {
            texto: "¿Deseas desactivar la membresia premium?",
            opciones: [
              { label: "Desactivar premium", value: "deactivate_premium" },
              { label: "Menu principal", value: "expert_menu" },
            ],
          },
        ])
      } else {
        enviarMensajeBotSecuencia([
          { texto: "La membresia Premium te da visibilidad destacada: tu perfil aparece primero en los resultados con un badge especial." },
          {
            texto: "¿Deseas activar la membresia Premium? (simulado para la demo, sin costo real)",
            opciones: [
              { label: "Activar Premium", value: "activate_premium" },
              { label: "Menu principal", value: "expert_menu" },
            ],
          },
        ])
      }
      setChatStep(240)
    } catch {
      setEstaCargando(false)
      enviarMensajeBot("Error al obtener informacion de membresia.", [
        { label: "Menu principal", value: "expert_menu" },
      ])
    }
  }

  async function mostrarSesionesPendientes() {
    setEstaCargando(true)
    try {
      const res = await fetchWithAuth("/api/sessions")
      const data = await res.json()
      setEstaCargando(false)

      const expertSessions = data.expertSessions || []
      const pending = expertSessions.filter((s: { status: string }) => s.status === "pending")

      if (pending.length === 0) {
        enviarMensajeBot("No tienes sesiones pendientes en este momento.", [
          { label: "Menu principal", value: "expert_menu" },
          { label: "Volver al inicio", value: "home" },
        ])
      } else {
        const listText = pending
          .map((s: { client_name?: string; requested_date?: string; requested_time?: string }, i: number) =>
            `${i + 1}. ${s.client_name || "Cliente"} - ${s.requested_date || "Sin fecha"} ${s.requested_time || ""}`
          )
          .join("\n")

        enviarMensajeBotSecuencia([
          { texto: `Tienes ${pending.length} sesion(es) pendiente(s):\n\n${listText}` },
          {
            texto: "En la version completa, podrias aceptar o rechazar cada solicitud. Para esta demo, quedan como pendientes.",
            opciones: [
              { label: "Menu principal", value: "expert_menu" },
              { label: "Volver al inicio", value: "home" },
            ],
          },
        ])
      }
      setChatStep(200)
    } catch {
      setEstaCargando(false)
      enviarMensajeBot("Error al cargar sesiones.", [
        { label: "Menu principal", value: "expert_menu" },
      ])
    }
  }

  // ───────────────────────────────────────
  //  FLUJO SESION: solicitud (pasos 300-310)
  // ───────────────────────────────────────

  function procesarPasoSesion(valor: string, paso: number) {
    switch (paso) {
      case 300:
        guardarDato("sessionDate", valor)
        enviarMensajeBot("¿A que hora te gustaria la sesion?", [
          { label: "Manana (9-12)", value: "09:00" },
          { label: "Tarde (12-17)", value: "14:00" },
          { label: "Noche (17-20)", value: "18:00" },
        ])
        setChatStep(301)
        break

      case 301:
        guardarDato("sessionTime", valor)
        enviarMensajeBot("¿Que duracion aproximada necesitas?", [
          { label: "30 minutos", value: "30 minutos" },
          { label: "1 hora", value: "1 hora" },
          { label: "2 horas", value: "2 horas" },
        ])
        setChatStep(302)
        break

      case 302: {
        guardarDato("sessionDuration", valor)
        const expertName = selectedExpert?.name?.split(" ")[0] || "el experto"
        enviarMensajeBot(
          `Listo, voy a enviar tu solicitud de sesion a ${expertName} para el ${searchData.sessionDate || "dia solicitado"} a las ${searchData.sessionTime || valor}. Esto costara 1 credito. ¿Confirmas?`,
          [
            { label: "Si, confirmar", value: "confirm_session" },
            { label: "Cancelar", value: "cancel_session" },
          ],
        )
        setChatStep(303)
        break
      }

      case 303: {
        if (valor === "confirm_session") {
          crearSesion()
        } else {
          enviarMensajeBot("Solicitud cancelada. Puedes volver a los resultados o al inicio.", [
            { label: "Ver resultados", value: "go_results" },
            { label: "Volver al inicio", value: "home" },
          ])
          setChatStep(399)
        }
        break
      }

      case 399: {
        if (valor === "go_results") {
          setScreen("results")
        } else {
          resetChat()
        }
        break
      }

      default:
        break
    }
  }

  async function crearSesion() {
    if (!selectedExpert) return
    setEstaCargando(true)
    try {
      const res = await fetchWithAuth("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expertId: selectedExpert.id,
          requestedDate: searchData.sessionDate || "A convenir",
          requestedTime: searchData.sessionTime || "",
          requestedDuration: searchData.sessionDuration || "1 hora",
        }),
      })
      const data = await res.json()
      setEstaCargando(false)

      if (!res.ok) {
        if (res.status === 402) {
          addMessage({
            sender: "bot",
            text: `No tienes suficientes creditos. Tu saldo actual es ${data.credits || 0}. ¿Deseas adquirir mas creditos?`,
            options: [
              { label: "Comprar creditos", value: "buy_credits" },
              { label: "Volver al inicio", value: "home" },
            ],
          })
          setChatStep(400)
        } else {
          addMessage({ sender: "bot", text: data.error || "Error al crear la sesion." })
        }
        return
      }

      setActiveSession(data.session)
      setAuthUser(authUser ? { ...authUser, credits: data.credits } : null)
      const expertName = selectedExpert.name.split(" ")[0]

      enviarMensajeBotSecuencia([
        { texto: `¡Tu solicitud de sesion con ${expertName} ha sido enviada exitosamente!` },
        { texto: `Se descontó 1 credito. Tu saldo actual es de ${data.credits} creditos.` },
        {
          texto: `En la version completa, ${expertName} recibiria tu solicitud y podria aceptar, rechazar o proponer otra fecha. Para esta demo, la sesion queda como "pendiente".`,
          opciones: [
            { label: "Volver al inicio", value: "home" },
            { label: "Buscar otro experto", value: "go_results" },
          ],
        },
      ])
      setChatStep(399)
    } catch {
      setEstaCargando(false)
      addMessage({ sender: "bot", text: "Error de conexion. Intenta de nuevo." })
    }
  }

  // ───────────────────────────────────────
  //  FLUJO CREDITOS (paso 400)
  // ───────────────────────────────────────

  async function procesarPasoCreditos(valor: string) {
    if (valor === "buy_credits") {
      enviarMensajeBot("¿Cuantos creditos deseas adquirir? (simulado para la demo)", [
        { label: "3 creditos", value: "buy_3" },
        { label: "5 creditos", value: "buy_5" },
        { label: "10 creditos", value: "buy_10" },
      ])
      setChatStep(401)
    } else if (valor.startsWith("buy_")) {
      const amount = parseInt(valor.replace("buy_", ""))
      setEstaCargando(true)
      try {
        const res = await fetchWithAuth("/api/credits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount }),
        })
        const data = await res.json()
        setEstaCargando(false)

        if (res.ok) {
          setAuthUser(authUser ? { ...authUser, credits: data.credits } : null)
          enviarMensajeBot(
            `¡Listo! Se han agregado ${amount} creditos a tu cuenta. Tu saldo actual es de ${data.credits} creditos.`,
            [
              { label: "Volver al inicio", value: "home" },
              { label: "Ver expertos", value: "go_results" },
            ],
          )
          setChatStep(399)
        } else {
          addMessage({ sender: "bot", text: data.error || "Error al comprar creditos." })
        }
      } catch {
        setEstaCargando(false)
        addMessage({ sender: "bot", text: "Error de conexion." })
      }
    }
  }

  // ───────────────────────────────────────
  //  Paso 99: reintentos de auth
  // ───────────────────────────────────────

  function procesarPasoReintento(valor: string) {
    if (valor === "retry_login") {
      setInputType("email")
      enviarMensajeBot("Ingresa tu correo electronico:")
      setChatStep(1)
      guardarDato("authMode", "login")
    } else if (valor === "retry_register" || valor === "switch_register") {
      setInputType("email")
      enviarMensajeBot("Vamos a crear tu cuenta. Ingresa tu correo electronico:")
      setChatStep(1)
      guardarDato("authMode", "register")
    } else if (valor === "switch_login") {
      setInputType("email")
      enviarMensajeBot("Ingresa tu correo electronico:")
      setChatStep(1)
      guardarDato("authMode", "login")
    } else if (valor === "home") {
      resetChat()
    }
  }

  // ─── Manejo de envio de mensajes ───

  function enviarMensajeUsuario(valorDirecto?: string) {
    const texto = valorDirecto || inputValue.trim()
    if (!texto) return

    // Para passwords, mostrar asteriscos en el chat
    const textoMostrado = inputType === "password" ? "*".repeat(texto.length) : texto
    addMessage({ sender: "user", text: textoMostrado })
    setInputValue("")

    // Router de flujos basado en chatStep
    if (chatStep >= 400) {
      procesarPasoCreditos(texto)
    } else if (chatStep >= 300 && chatStep < 400) {
      procesarPasoSesion(texto, chatStep)
    } else if (chatStep >= 200 && chatStep < 300) {
      procesarPasoExperto(texto, chatStep)
    } else if (chatStep >= 100 && chatStep < 200) {
      procesarPasoCliente(texto, chatStep)
    } else if (chatStep === 99) {
      procesarPasoReintento(texto)
    } else {
      procesarPasoAuth(texto, chatStep)
    }
  }

  function manejarClicOpcion(opcion: ChatOption) {
    addMessage({ sender: "user", text: opcion.label })

    if (opcion.value === "home") {
      resetChat()
      return
    }
    if (opcion.value === "go_results") {
      setScreen("results")
      return
    }

    // Router de flujos
    if (chatStep >= 400) {
      procesarPasoCreditos(opcion.value)
    } else if (chatStep >= 300 && chatStep < 400) {
      procesarPasoSesion(opcion.value, chatStep)
    } else if (chatStep >= 200 && chatStep < 300) {
      procesarPasoExperto(opcion.value, chatStep)
    } else if (chatStep >= 100 && chatStep < 200) {
      procesarPasoCliente(opcion.value, chatStep)
    } else if (chatStep === 99) {
      procesarPasoReintento(opcion.value)
    } else {
      procesarPasoAuth(opcion.value, chatStep)
    }
  }

  // ─── Renderizado ───

  return (
    <div className="flex h-screen flex-col bg-background">
      <EncabezadoChat
        rol={role}
        onVolver={resetChat}
        isLoggedIn={isLoggedIn}
        credits={authUser?.credits}
        onLogout={logout}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-lg flex-col gap-4">
          {messages.map((msg, index) => (
            <BurbujaMensaje
              key={msg.id}
              mensaje={msg}
              indice={index}
              onClickOpcion={manejarClicOpcion}
            />
          ))}
          {estaCargando && <IndicadorEscribiendo />}
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            enviarMensajeUsuario()
          }}
          className="mx-auto flex max-w-lg items-center gap-3"
        >
          <input
            ref={inputRef}
            type={inputType}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              inputType === "email"
                ? "tu@correo.com"
                : inputType === "password"
                  ? "Tu contrasena..."
                  : "Escribe tu mensaje..."
            }
            className="flex-1 rounded-full border-2 border-input bg-background px-5 py-3.5 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-full"
            disabled={!inputValue.trim()}
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Enviar mensaje</span>
          </Button>
        </form>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────
//  Subcomponentes
// ───────────────────────────────────────────

function EncabezadoChat({
  rol,
  onVolver,
  isLoggedIn,
  credits,
  onLogout,
}: {
  rol: "client" | "expert" | null
  onVolver: () => void
  isLoggedIn: boolean
  credits?: number
  onLogout: () => void
}) {
  const subtitulo = rol === "client" ? "Buscando ayuda" : "Ofreciendo experiencia"

  return (
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-4 shadow-sm">
      <button
        onClick={onVolver}
        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition-colors"
        aria-label="Volver al inicio"
      >
        <ArrowLeft className="h-5 w-5 text-foreground" />
      </button>
      <div className="flex flex-1 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Star className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-base font-semibold text-card-foreground">Magia Plateada</p>
          <p className="text-xs text-muted-foreground">{subtitulo}</p>
        </div>
      </div>
      {isLoggedIn && (
        <div className="flex items-center gap-2">
          {credits !== undefined && (
            <span className="flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent">
              <CreditCard className="h-3.5 w-3.5" />
              {credits}
            </span>
          )}
          <button
            onClick={onLogout}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary transition-colors"
            aria-label="Cerrar sesion"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </header>
  )
}

function BurbujaMensaje({
  mensaje,
  indice,
  onClickOpcion,
}: {
  mensaje: { id: string; sender: "bot" | "user"; text: string; options?: ChatOption[] }
  indice: number
  onClickOpcion: (opcion: ChatOption) => void
}) {
  const esUsuario = mensaje.sender === "user"

  return (
    <div
      className={`flex flex-col ${esUsuario ? "items-end" : "items-start"} animate-fade-in-up`}
      style={{ animationDelay: `${indice * 50}ms` }}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
          esUsuario
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card text-card-foreground border border-border shadow-sm rounded-bl-md"
        }`}
      >
        {mensaje.text}
      </div>

      {mensaje.options && !esUsuario && (
        <div className="mt-3 flex flex-wrap gap-2">
          {mensaje.options.map((opcion) => (
            <button
              key={opcion.value}
              onClick={() => onClickOpcion(opcion)}
              className="rounded-full border-2 border-primary bg-card px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
            >
              {opcion.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function IndicadorEscribiendo() {
  return (
    <div className="flex items-start animate-fade-in-up">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-card border border-border px-5 py-4 shadow-sm">
        <span className="typing-dot h-2.5 w-2.5 rounded-full bg-muted-foreground" />
        <span className="typing-dot h-2.5 w-2.5 rounded-full bg-muted-foreground" />
        <span className="typing-dot h-2.5 w-2.5 rounded-full bg-muted-foreground" />
      </div>
    </div>
  )
}
