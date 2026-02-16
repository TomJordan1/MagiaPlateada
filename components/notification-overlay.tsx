/**
 * notification-overlay.tsx
 * -------------------------
 * Overlay de seguimiento post-contacto.
 *
 * Se muestra despues de que el usuario confirma el contacto con un experto.
 * Informa que se le consultara sobre el servicio tras un periodo de tiempo
 * (por defecto 7 dias) y permite cambiar la fecha de seguimiento.
 *
 * Tiene dos vistas internas:
 *   1. Vista principal: muestra la fecha programada con boton "Ok" o "Cambiar fecha"
 *   2. Selector de fecha: permite elegir entre 3 dias, 1 semana, 2 semanas o 1 mes
 */
"use client"

import { useApp } from "@/lib/app-context"
import { DIAS_SEGUIMIENTO_DEFECTO, OPCIONES_SEGUIMIENTO } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Calendar, Check, Clock } from "lucide-react"
import { useState } from "react"

export function NotificationOverlay() {
  const { notificationOverlayOpen, setNotificationOverlayOpen, selectedExpert, resetChat } = useApp()

  /** Indica si se esta mostrando el selector de fecha */
  const [mostrarSelectorFecha, setMostrarSelectorFecha] = useState(false)

  /** Dias seleccionados para el seguimiento */
  const [diasSeleccionados, setDiasSeleccionados] = useState(DIAS_SEGUIMIENTO_DEFECTO)

  // No renderizar si el overlay no esta abierto
  if (!notificationOverlayOpen) return null

  /** Confirma y cierra el overlay, regresando al inicio */
  function confirmarYCerrar() {
    setNotificationOverlayOpen(false)
    setMostrarSelectorFecha(false)
    resetChat()
  }

  /** Cambia a la vista de selector de fecha */
  function abrirSelectorFecha() {
    setMostrarSelectorFecha(true)
  }

  /** Selecciona un periodo y vuelve a la vista principal */
  function seleccionarPeriodo(dias: number) {
    setDiasSeleccionados(dias)
    setMostrarSelectorFecha(false)
  }

  /**
   * Convierte los dias seleccionados a un texto legible.
   * Ejemplo: 7 -> "una semana", 14 -> "14 dias"
   */
  function textoTiempoSeguimiento(): string {
    return diasSeleccionados === 7 ? "una semana" : `${diasSeleccionados} dias`
  }

  /** Nombre corto del experto para el mensaje */
  const nombreExperto = selectedExpert ? selectedExpert.name.split(" ")[0] : ""

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-6">
      <div className="animate-fade-in-up w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl border border-border">
        {!mostrarSelectorFecha ? (
          /* ─── Vista principal: confirmacion de seguimiento ─── */
          <VistaPrincipal
            nombreExperto={nombreExperto}
            textoTiempo={textoTiempoSeguimiento()}
            onConfirmar={confirmarYCerrar}
            onCambiarFecha={abrirSelectorFecha}
          />
        ) : (
          /* ─── Vista selector: elegir periodo de seguimiento ─── */
          <VistaSelectorFecha
            diasActuales={diasSeleccionados}
            onSeleccionar={seleccionarPeriodo}
            onConfirmar={confirmarYCerrar}
          />
        )}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────
//  Subcomponentes internos del overlay
// ───────────────────────────────────────────

/**
 * VistaPrincipal: muestra el mensaje de seguimiento con los botones
 * "Ok, entendido" y "Cambiar fecha de seguimiento".
 */
function VistaPrincipal({
  nombreExperto,
  textoTiempo,
  onConfirmar,
  onCambiarFecha,
}: {
  nombreExperto: string
  textoTiempo: string
  onConfirmar: () => void
  onCambiarFecha: () => void
}) {
  return (
    <>
      {/* Icono decorativo */}
      <div className="flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <Clock className="h-8 w-8 text-primary" />
        </div>
      </div>

      <h3 className="mt-5 text-center font-serif text-xl text-card-foreground">
        Solicitud registrada
      </h3>

      <p className="mt-3 text-center text-base leading-relaxed text-muted-foreground">
        Te consultaremos que tal fue el servicio
        {nombreExperto ? ` con ${nombreExperto}` : ""} en{" "}
        <span className="font-semibold text-card-foreground">{textoTiempo}</span>.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <Button className="h-14 w-full rounded-xl text-base font-medium" onClick={onConfirmar}>
          <Check className="mr-2 h-5 w-5" />
          Ok, entendido
        </Button>
        <Button
          variant="outline"
          className="h-14 w-full rounded-xl text-base font-medium border-2 bg-transparent"
          onClick={onCambiarFecha}
        >
          <Calendar className="mr-2 h-5 w-5" />
          Cambiar fecha de seguimiento
        </Button>
      </div>
    </>
  )
}

/**
 * VistaSelectorFecha: permite al usuario elegir en cuantos dias
 * quiere recibir el seguimiento sobre el servicio.
 */
function VistaSelectorFecha({
  diasActuales,
  onSeleccionar,
  onConfirmar,
}: {
  diasActuales: number
  onSeleccionar: (dias: number) => void
  onConfirmar: () => void
}) {
  return (
    <>
      {/* Icono decorativo */}
      <div className="flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
      </div>

      <h3 className="mt-5 text-center font-serif text-xl text-card-foreground">
        Cambiar fecha de seguimiento
      </h3>

      <p className="mt-3 text-center text-sm text-muted-foreground">
        ¿Cuándo te gustaría que te consultemos sobre el servicio?
      </p>

      {/* Opciones de periodo (se leen desde constants.ts) */}
      <div className="mt-6 flex flex-col gap-3">
        {OPCIONES_SEGUIMIENTO.map((opcion) => {
          const estaSeleccionado = diasActuales === opcion.days
          return (
            <button
              key={opcion.days}
              onClick={() => onSeleccionar(opcion.days)}
              className={`flex h-12 w-full items-center justify-center rounded-xl border-2 text-base font-medium transition-colors duration-200 ${
                estaSeleccionado
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-card-foreground hover:border-primary hover:bg-secondary"
              }`}
            >
              {opcion.label}
            </button>
          )
        })}
      </div>

      <Button className="mt-4 h-14 w-full rounded-xl text-base font-medium" onClick={onConfirmar}>
        <Check className="mr-2 h-5 w-5" />
        Confirmar
      </Button>
    </>
  )
}
