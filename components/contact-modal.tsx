/**
 * contact-modal.tsx
 * ------------------
 * Modal de confirmacion de sesion.
 *
 * Ahora muestra un resumen de la solicitud de sesion
 * antes de que el usuario confirme en el chat.
 * Ya no redirige a WhatsApp.
 */
"use client"

import { useApp } from "@/lib/app-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CalendarPlus, Search } from "lucide-react"

export function ContactModal() {
  const {
    contactModalOpen,
    setContactModalOpen,
    selectedExpert,
    setScreen,
    addMessage,
    setChatStep,
    role,
    setRole,
  } = useApp()

  if (!selectedExpert) return null

  function confirmarSolicitud() {
    setContactModalOpen(false)
    if (!role) setRole("client")
    setScreen("chat")

    setTimeout(() => {
      addMessage({
        sender: "bot",
        text: `Vas a solicitar una sesion con ${selectedExpert?.name}. ¿Para que fecha te gustaria?`,
        options: [
          { label: "Hoy", value: "Hoy" },
          { label: "Manana", value: "Manana" },
          { label: "Esta semana", value: "Esta semana" },
          { label: "La proxima semana", value: "La proxima semana" },
        ],
      })
      setChatStep(300)
    }, 300)
  }

  function buscarOtroExperto() {
    setContactModalOpen(false)
    setScreen("results")
  }

  return (
    <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
      <DialogContent className="mx-4 max-w-sm rounded-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="font-serif text-xl text-foreground">
            Solicitar sesion
          </DialogTitle>
          <DialogDescription className="mt-2 text-base text-muted-foreground leading-relaxed">
            ¿Deseas solicitar una sesion con{" "}
            <span className="font-semibold text-foreground">
              {selectedExpert.name}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-xl bg-secondary p-4">
          <p className="text-sm text-secondary-foreground">
            Se te guiara por el chat para elegir fecha, hora y duracion. El costo es de 1 credito por sesion.
          </p>
        </div>

        <DialogFooter className="mt-4 flex flex-col gap-3 sm:flex-col">
          <Button
            className="h-14 w-full rounded-xl text-base font-medium"
            onClick={confirmarSolicitud}
          >
            <CalendarPlus className="mr-2 h-5 w-5" />
            Si, solicitar sesion
          </Button>
          <Button
            variant="outline"
            className="h-14 w-full rounded-xl text-base font-medium border-2 bg-transparent"
            onClick={buscarOtroExperto}
          >
            <Search className="mr-2 h-5 w-5" />
            Buscar otro experto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
