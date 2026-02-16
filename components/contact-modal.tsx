/**
 * contact-modal.tsx
 * ------------------
 * Modal de confirmacion de contacto.
 *
 * Se abre cuando el usuario presiona "Contactar" en el perfil de un experto.
 * Ofrece dos opciones:
 *   1. "Si, contactar" -> abre WhatsApp con el numero del experto
 *      y luego muestra el overlay de seguimiento (notificacion).
 *   2. "Buscar otro experto" -> vuelve a la lista de resultados.
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
import { Phone, Search } from "lucide-react"

export function ContactModal() {
  const {
    contactModalOpen,
    setContactModalOpen,
    selectedExpert,
    setNotificationOverlayOpen,
    setScreen,
  } = useApp()

  // No renderizar si no hay experto seleccionado
  if (!selectedExpert) return null

  /**
   * Confirma el contacto: abre WhatsApp y programa el overlay de seguimiento.
   * El numero de telefono se limpia de caracteres no numericos para generar
   * la URL de WhatsApp correctamente.
   */
  function confirmarContacto() {
    setContactModalOpen(false)

    // Construir la URL de WhatsApp quitando espacios, guiones, parentesis, etc.
    const numeroLimpio = selectedExpert?.contact.replace(/\D/g, "")
    const urlWhatsApp = `https://wa.me/${numeroLimpio}`
    window.open(urlWhatsApp, "_blank")

    // Mostrar el overlay de seguimiento tras medio segundo
    setTimeout(() => {
      setNotificationOverlayOpen(true)
    }, 500)
  }

  /** Cancela y vuelve a la lista de resultados para buscar otro experto */
  function buscarOtroExperto() {
    setContactModalOpen(false)
    setScreen("results")
  }

  return (
    <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
      <DialogContent className="mx-4 max-w-sm rounded-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="font-serif text-xl text-foreground">
            Confirmar contacto
          </DialogTitle>
          <DialogDescription className="mt-2 text-base text-muted-foreground leading-relaxed">
            Deseas coordinar el servicio con{" "}
            <span className="font-semibold text-foreground">
              {selectedExpert.name}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        {/* Nota informativa */}
        <div className="mt-2 rounded-xl bg-secondary p-4">
          <p className="text-sm text-secondary-foreground">
            Se abrirá WhatsApp para que puedas comunicarte directamente. El servicio se coordina entre ustedes.
          </p>
        </div>

        {/* Botones de accion */}
        <DialogFooter className="mt-4 flex flex-col gap-3 sm:flex-col">
          <Button
            className="h-14 w-full rounded-xl text-base font-medium"
            onClick={confirmarContacto}
          >
            <Phone className="mr-2 h-5 w-5" />
            Sí, contactar
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
