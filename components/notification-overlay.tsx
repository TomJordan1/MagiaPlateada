/**
 * notification-overlay.tsx
 * -------------------------
 * Overlay post-sesion que implementa el flujo descrito en el documento:
 *
 * 1. Pregunta "¿Se realizo la sesion?"
 * 2. Si responde "Si": marca como completada y muestra calificacion multidimensional
 * 3. Si responde "Hubo un problema": marca como disputada
 * 4. Calificacion multidimensional: calidad, claridad, puntualidad, experiencia general
 */
"use client"

import { useApp } from "@/lib/app-context"
import { ETIQUETA_CALIFICACION } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Check, AlertTriangle, Star, ThumbsUp, X } from "lucide-react"
import { useState } from "react"

type OverlayView = "question" | "rating" | "problem" | "done"

export function NotificationOverlay() {
  const {
    notificationOverlayOpen,
    setNotificationOverlayOpen,
    selectedExpert,
    activeSession,
    resetChat,
    fetchWithAuth,
    setActiveSession,
  } = useApp()

  const [view, setView] = useState<OverlayView>("question")
  const [ratings, setRatings] = useState({
    quality: 0,
    clarity: 0,
    punctuality: 0,
    overall: 0,
  })
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!notificationOverlayOpen) return null

  const expertName = selectedExpert?.name?.split(" ")[0] || "el experto"

  async function confirmarSesionRealizada() {
    // Marcar sesion como completada
    if (activeSession) {
      try {
        await fetchWithAuth("/api/sessions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: activeSession.id, status: "completed" }),
        })
      } catch {
        // Si falla, continuamos con la UI
      }
    }
    setView("rating")
  }

  function reportarProblema() {
    setView("problem")
  }

  async function enviarCalificacion() {
    if (ratings.overall === 0) return

    setIsSubmitting(true)
    try {
      if (activeSession && selectedExpert) {
        await fetchWithAuth("/api/ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: activeSession.id,
            ratedId: selectedExpert.userId || selectedExpert.id,
            quality: ratings.quality || ratings.overall,
            clarity: ratings.clarity || ratings.overall,
            punctuality: ratings.punctuality || ratings.overall,
            overall: ratings.overall,
            comment,
          }),
        })
      }
    } catch {
      // Si falla, continuamos
    }
    setIsSubmitting(false)
    setView("done")
  }

  async function reportarSesion() {
    if (activeSession) {
      try {
        await fetchWithAuth("/api/sessions", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: activeSession.id, status: "disputed" }),
        })
      } catch {
        // Continuamos
      }
    }
    setView("done")
  }

  function cerrarOverlay() {
    setNotificationOverlayOpen(false)
    setView("question")
    setRatings({ quality: 0, clarity: 0, punctuality: 0, overall: 0 })
    setComment("")
    setActiveSession(null)
    resetChat()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-6">
      <div className="animate-fade-in-up w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl border border-border">
        {view === "question" && (
          <VistaPreguntar
            expertName={expertName}
            onSi={confirmarSesionRealizada}
            onProblema={reportarProblema}
            onCerrar={cerrarOverlay}
          />
        )}
        {view === "rating" && (
          <VistaCalificar
            expertName={expertName}
            ratings={ratings}
            setRatings={setRatings}
            comment={comment}
            setComment={setComment}
            onEnviar={enviarCalificacion}
            isSubmitting={isSubmitting}
          />
        )}
        {view === "problem" && (
          <VistaProblema
            expertName={expertName}
            onReportar={reportarSesion}
            onVolver={() => setView("question")}
          />
        )}
        {view === "done" && (
          <VistaCompletado onCerrar={cerrarOverlay} />
        )}
      </div>
    </div>
  )
}

// ─── Vista: pregunta inicial post-sesion ───

function VistaPreguntar({
  expertName,
  onSi,
  onProblema,
  onCerrar,
}: {
  expertName: string
  onSi: () => void
  onProblema: () => void
  onCerrar: () => void
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <ThumbsUp className="h-7 w-7 text-primary" />
        </div>
        <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground" aria-label="Cerrar">
          <X className="h-5 w-5" />
        </button>
      </div>

      <h3 className="mt-5 font-serif text-xl text-card-foreground">
        ¿Como fue la sesion?
      </h3>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
        ¿Se realizo la sesion con {expertName}?
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <Button className="h-14 w-full rounded-xl text-base font-medium" onClick={onSi}>
          <Check className="mr-2 h-5 w-5" />
          Si, todo bien
        </Button>
        <Button
          variant="outline"
          className="h-14 w-full rounded-xl text-base font-medium border-2 bg-transparent"
          onClick={onProblema}
        >
          <AlertTriangle className="mr-2 h-5 w-5" />
          Hubo un problema
        </Button>
      </div>
    </>
  )
}

// ─── Vista: calificacion multidimensional ───

function VistaCalificar({
  expertName,
  ratings,
  setRatings,
  comment,
  setComment,
  onEnviar,
  isSubmitting,
}: {
  expertName: string
  ratings: { quality: number; clarity: number; punctuality: number; overall: number }
  setRatings: (r: typeof ratings) => void
  comment: string
  setComment: (c: string) => void
  onEnviar: () => void
  isSubmitting: boolean
}) {
  const criterios = [
    { key: "quality" as const, label: "Calidad del servicio" },
    { key: "clarity" as const, label: "Claridad y comunicacion" },
    { key: "punctuality" as const, label: "Puntualidad" },
    { key: "overall" as const, label: "Experiencia general" },
  ]

  return (
    <>
      <h3 className="font-serif text-xl text-card-foreground">
        Califica a {expertName}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Tu opinion ayuda a otros usuarios a elegir mejor.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        {criterios.map((criterio) => (
          <div key={criterio.key}>
            <p className="mb-1.5 text-sm font-medium text-card-foreground">{criterio.label}</p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const valor = i + 1
                return (
                  <button
                    key={i}
                    onClick={() => setRatings({ ...ratings, [criterio.key]: valor })}
                    className="transition-transform hover:scale-110"
                    aria-label={`${criterio.label}: ${valor} estrellas`}
                  >
                    <Star
                      className={`h-7 w-7 ${
                        valor <= ratings[criterio.key]
                          ? "text-accent fill-accent"
                          : "text-muted"
                      }`}
                    />
                  </button>
                )
              })}
              {ratings[criterio.key] > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {ETIQUETA_CALIFICACION[ratings[criterio.key]]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comentario opcional..."
          className="w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
          rows={3}
        />
      </div>

      <Button
        className="mt-4 h-14 w-full rounded-xl text-base font-medium"
        onClick={onEnviar}
        disabled={ratings.overall === 0 || isSubmitting}
      >
        {isSubmitting ? "Enviando..." : "Enviar calificacion"}
      </Button>
    </>
  )
}

// ─── Vista: reporte de problema ───

function VistaProblema({
  expertName,
  onReportar,
  onVolver,
}: {
  expertName: string
  onReportar: () => void
  onVolver: () => void
}) {
  return (
    <>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>

      <h3 className="mt-5 font-serif text-xl text-card-foreground">
        Reportar problema
      </h3>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
        Lamentamos que hayas tenido un problema con la sesion con {expertName}. Al reportar, se marcara la sesion como disputada y se te reembolsara el credito utilizado.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <Button
          variant="destructive"
          className="h-14 w-full rounded-xl text-base font-medium"
          onClick={onReportar}
        >
          Reportar y solicitar reembolso
        </Button>
        <Button
          variant="outline"
          className="h-14 w-full rounded-xl text-base font-medium border-2 bg-transparent"
          onClick={onVolver}
        >
          Volver
        </Button>
      </div>
    </>
  )
}

// ─── Vista: completado ───

function VistaCompletado({ onCerrar }: { onCerrar: () => void }) {
  return (
    <>
      <div className="flex items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
      </div>

      <h3 className="mt-5 text-center font-serif text-xl text-card-foreground">
        ¡Gracias por tu retroalimentacion!
      </h3>
      <p className="mt-3 text-center text-base leading-relaxed text-muted-foreground">
        Tu opinion ayuda a mantener la calidad de nuestra comunidad.
      </p>

      <Button className="mt-6 h-14 w-full rounded-xl text-base font-medium" onClick={onCerrar}>
        Volver al inicio
      </Button>
    </>
  )
}
