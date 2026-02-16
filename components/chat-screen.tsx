/**
 * chat-screen.tsx
 * ----------------
 * Pantalla de chat principal de Magia Plateada.
 *
 * Muestra una interfaz tipo mensajeria (similar a WhatsApp) donde el bot
 * guia al usuario paso a paso. Hay dos flujos distintos segun el rol:
 *
 * - CLIENTE: el bot pregunta que servicio necesita, detalles, modalidad,
 *   zona y urgencia; luego muestra los resultados.
 *
 * - EXPERTO: el bot recoge nombre, edad, servicio, experiencia, modalidad,
 *   zona, horario y contacto para crear su perfil.
 *
 * Cada "paso" del flujo se controla con un numero (chatStep) que avanza
 * conforme el usuario responde.
 */
"use client"

import { useApp, type ChatOption } from "@/lib/app-context"
import { EDAD_MINIMA_EXPERTO } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Send, Star } from "lucide-react"
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
  } = useApp()

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState("")
  const [estaCargando, setEstaCargando] = useState(false) // indicador de "escribiendo..."

  // Auto-scroll al fondo cuando llegan nuevos mensajes o el bot "escribe"
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, estaCargando])

  // ─── Funciones auxiliares del chat ───

  /**
   * Envia un mensaje del bot con un retraso simulado.
   * Mientras espera, muestra el indicador de "escribiendo...".
   */
  function enviarMensajeBot(texto: string, opciones?: ChatOption[], retrasoMs = 800) {
    setEstaCargando(true)
    setTimeout(() => {
      setEstaCargando(false)
      addMessage({ sender: "bot", text: texto, options: opciones })
    }, retrasoMs)
  }

  /**
   * Actualiza los datos de busqueda/registro acumulados.
   * Cada paso del flujo guarda su respuesta aqui.
   */
  function guardarDato(campo: string, valor: string) {
    setSearchData({ ...searchData, [campo]: valor })
  }

  // ─── Flujo del CLIENTE (buscar ayuda) ───

  /**
   * Procesa cada paso del flujo de busqueda del cliente.
   * Los pasos son:
   *   0 -> Tipo de servicio seleccionado
   *   1 -> Detalles proporcionados (texto libre)
   *   2 -> Modalidad seleccionada (presencial/remoto/ambos)
   *   3 -> Zona seleccionada
   *   4 -> Urgencia seleccionada -> navega a resultados
   */
  function procesarPasoCliente(valor: string, paso: number) {
    switch (paso) {
      case 0:
        guardarDato("service", valor)
        enviarMensajeBot("¿Puedes darme más detalles sobre lo que necesitas?")
        setChatStep(1)
        break

      case 1:
        guardarDato("details", valor)
        enviarMensajeBot("¿Prefieres que el servicio sea presencial o remoto?", [
          { label: "Presencial", value: "presencial" },
          { label: "Remoto", value: "remoto" },
          { label: "Me da igual", value: "ambos" },
        ])
        setChatStep(2)
        break

      case 2:
        guardarDato("modality", valor)
        enviarMensajeBot("¿En qué zona te encuentras?", [
          { label: "Centro", value: "Centro" },
          { label: "Norte", value: "Norte" },
          { label: "Sur", value: "Sur" },
          { label: "Este", value: "Este" },
        ])
        setChatStep(3)
        break

      case 3:
        guardarDato("zone", valor)
        enviarMensajeBot("¿Qué tan urgente es para ti?", [
          { label: "Lo antes posible", value: "urgente" },
          { label: "Esta semana", value: "semana" },
          { label: "Sin prisa", value: "sin_prisa" },
        ])
        setChatStep(4)
        break

      case 4:
        // Ultimo paso: guardar urgencia y navegar a resultados
        guardarDato("urgency", valor)
        enviarMensajeBot(
          "¡Perfecto! He encontrado algunos expertos que pueden ayudarte. Voy a mostrarte los resultados.",
          undefined,
          1000,
        )
        setTimeout(() => {
          setScreen("results")
        }, 2500)
        setChatStep(5)
        break

      default:
        break
    }
  }

  // ─── Flujo del EXPERTO (registro) ───

  /**
   * Procesa cada paso del flujo de registro del experto.
   * Los pasos son:
   *   0 -> Nombre completo
   *   1 -> Edad (valida >= 50)
   *   2 -> Tipo de servicio
   *   3 -> Experiencia (texto libre)
   *   4 -> Modalidad preferida
   *   5 -> Zona
   *   6 -> Horarios disponibles
   *   7 -> Contacto -> muestra confirmacion
   *   8 -> Volver al inicio
   */
  function procesarPasoExperto(valor: string, paso: number) {
    switch (paso) {
      case 0:
        guardarDato("name", valor)
        enviarMensajeBot("¿Qué edad tienes? Recuerda que este espacio es para personas mayores de 50 años.")
        setChatStep(1)
        break

      case 1: {
        // Validar edad minima
        const edad = parseInt(valor)
        if (isNaN(edad) || edad < EDAD_MINIMA_EXPERTO) {
          enviarMensajeBot(
            "Lo sentimos, esta plataforma esta disenada para personas de 50 anos en adelante. Si crees que hubo un error, intenta de nuevo.",
          )
          return // No avanza de paso, permite reintentar
        }
        guardarDato("age", valor)
        enviarMensajeBot("Que tipo de servicio ofreces?", [
          { label: "Clases o enseñanza", value: "clases" },
          { label: "Reparaciones", value: "reparaciones" },
          { label: "Asesoría profesional", value: "asesoria" },
          { label: "Oficios manuales", value: "oficios" },
          { label: "Otro", value: "otro" },
        ])
        setChatStep(2)
        break
      }

      case 2:
        guardarDato("service", valor)
        enviarMensajeBot("Cuéntame sobre tu experiencia en este campo.")
        setChatStep(3)
        break

      case 3:
        guardarDato("experience", valor)
        enviarMensajeBot("¿Cuál es tu modalidad preferida?", [
          { label: "Presencial", value: "presencial" },
          { label: "Remoto", value: "remoto" },
          { label: "Ambos", value: "ambos" },
        ])
        setChatStep(4)
        break

      case 4:
        guardarDato("modality", valor)
        enviarMensajeBot("¿En qué zona te encuentras?", [
          { label: "Centro", value: "Centro" },
          { label: "Norte", value: "Norte" },
          { label: "Sur", value: "Sur" },
          { label: "Este", value: "Este" },
        ])
        setChatStep(5)
        break

      case 5:
        guardarDato("zone", valor)
        enviarMensajeBot("¿Cuáles son tus horarios disponibles? Por ejemplo: Lunes a Viernes, 10:00 - 14:00")
        setChatStep(6)
        break

      case 6:
        guardarDato("schedule", valor)
        enviarMensajeBot("Por último, ¿cuál es tu medio de contacto preferido? (WhatsApp, telefono, correo)")
        setChatStep(7)
        break

      case 7:
        guardarDato("contact", valor)
        enviarMensajeBot(
          "¡Excelente! Tu perfil ha sido creado con éxito. Ahora los usuarios podran encontrarte cuando busquen servicios como los tuyos. Puedes volver al inicio para ver como se ve tu perfil.",
          [{ label: "Volver al inicio", value: "home" }],
          1200,
        )
        setChatStep(8)
        break

      case 8:
        resetChat()
        break

      default:
        break
    }
  }

  // ─── Manejo de envio de mensajes ───

  /**
   * Envia un mensaje del usuario (desde el input o al hacer clic en una opcion).
   * Despues de agregar el mensaje, delega al flujo correspondiente segun el rol.
   */
  function enviarMensajeUsuario(valorDirecto?: string) {
    const texto = valorDirecto || inputValue.trim()
    if (!texto) return

    addMessage({ sender: "user", text: texto })
    setInputValue("")

    // Dirigir al flujo correcto segun el rol del usuario
    if (role === "client") {
      procesarPasoCliente(texto, chatStep)
    } else {
      procesarPasoExperto(texto, chatStep)
    }
  }

  /**
   * Maneja el clic en un boton de respuesta rapida.
   * Muestra el texto seleccionado como mensaje del usuario y avanza el flujo.
   */
  function manejarClicOpcion(opcion: ChatOption) {
    addMessage({ sender: "user", text: opcion.label })

    // Caso especial: "Volver al inicio" reinicia toda la app
    if (opcion.value === "home") {
      resetChat()
      return
    }

    // Dirigir al flujo correcto segun el rol
    if (role === "client") {
      procesarPasoCliente(opcion.value, chatStep)
    } else {
      procesarPasoExperto(opcion.value, chatStep)
    }
  }

  // ─── Renderizado ───

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Encabezado del chat */}
      <EncabezadoChat rol={role} onVolver={resetChat} />

      {/* Area de mensajes (scrollable) */}
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

          {/* Indicador de "escribiendo..." */}
          {estaCargando && <IndicadorEscribiendo />}
        </div>
      </div>

      {/* Barra de entrada de texto */}
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
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu mensaje..."
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
//  Subcomponentes del chat
// ───────────────────────────────────────────

/**
 * EncabezadoChat: barra superior del chat con boton "volver",
 * logo de la app y subtitulo segun el rol del usuario.
 */
function EncabezadoChat({
  rol,
  onVolver,
}: {
  rol: "client" | "expert" | null
  onVolver: () => void
}) {
  const subtitulo = rol === "client" ? "Buscando ayuda" : "Registro de experto"

  return (
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-4 shadow-sm">
      <button
        onClick={onVolver}
        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition-colors"
        aria-label="Volver al inicio"
      >
        <ArrowLeft className="h-5 w-5 text-foreground" />
      </button>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Star className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-base font-semibold text-card-foreground">Magia Plateada</p>
          <p className="text-xs text-muted-foreground">{subtitulo}</p>
        </div>
      </div>
    </header>
  )
}

/**
 * BurbujaMensaje: renderiza un mensaje individual (del bot o del usuario).
 * Los mensajes del bot aparecen a la izquierda, los del usuario a la derecha.
 * Si el mensaje del bot tiene opciones, muestra botones de respuesta rapida.
 */
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
      {/* Burbuja de texto */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-base leading-relaxed ${
          esUsuario
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card text-card-foreground border border-border shadow-sm rounded-bl-md"
        }`}
      >
        {mensaje.text}
      </div>

      {/* Botones de respuesta rapida (solo para mensajes del bot) */}
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

/**
 * IndicadorEscribiendo: tres puntos animados que aparecen
 * mientras el bot "escribe" su respuesta.
 */
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
