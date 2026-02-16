"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, ISourceOptions } from "@tsparticles/engine";

export default function ParticlesBackground() {
  const [init, setInit] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Detectar si debemos renderizar el componente (no en móvil / low-power / reduce-motion)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isTouch =
      "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.userAgent.includes("Mobi");
    const smallScreen = !!(window.matchMedia && window.matchMedia("(max-width: 768px)").matches);
    const prefersReducedMotion =
      !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const lowPowerDevice = !!(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);

    const decide = () => {
      const nowIsTouch =
        "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.userAgent.includes("Mobi");
      const nowSmall =
        window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
      const nowReduced =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const nowLowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;

      // No renderizar si es móvil/screen pequeño, prefieres reduced motion, o dispositivo muy limitado
      return !(nowIsTouch || nowSmall || nowReduced || nowLowPower);
    };

    setShouldRender(decide());

    // Listeners para cambios dinámicos (viewport o prefers-reduced-motion)
    const mqScreen = window.matchMedia("(max-width: 768px)");
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handler = () => setShouldRender(decide());

    // Valores históricos: addEventListener para MediaQueryList si existe, si no, addListener
    if (mqScreen.addEventListener) mqScreen.addEventListener("change", handler);
    else mqScreen.addListener(handler as any);

    if (mqReduce.addEventListener) mqReduce.addEventListener("change", handler);
    else mqReduce.addListener(handler as any);

    return () => {
      if (mqScreen.removeEventListener) mqScreen.removeEventListener("change", handler);
      else mqScreen.removeListener(handler as any);

      if (mqReduce.removeEventListener) mqReduce.removeEventListener("change", handler);
      else mqReduce.removeListener(handler as any);
    };
  }, []);

  // Inicializar engine SOLO si shouldRender === true
  useEffect(() => {
    if (!shouldRender) return;

    let mounted = true;
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      if (mounted) setInit(true);
    });

    return () => {
      mounted = false;
    };
  }, [shouldRender]);

  // Si decidimos no renderizar (móvil, low power, reduced motion) -> nada
  if (!shouldRender) return null;

  // Si aún no terminó la inicialización -> nada (o placeholder si quieres)
  if (!init) return null;

  const particlesLoaded = async (container?: Container): Promise<void> => {
    // console.log(container);
  };

  const options: ISourceOptions = {
    background: { color: { value: "transparent" } },
    fpsLimit: 60,
    interactivity: {
      events: {
        onClick: { enable: true, mode: "push" },
        onHover: { enable: true, mode: "repulse" },
      },
      modes: {
        push: { quantity: 4 },
        repulse: { distance: 200, duration: 0.4 },
      },
    },
    particles: {
      color: { value: "#ffffff" },
      links: {
        color: "#ffffff",
        distance: 150,
        enable: true,
        opacity: 0.5,
        width: 1,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "bounce" },
        random: false,
        speed: 2,
        straight: false,
      },
      number: { density: { enable: true }, value: 80 },
      opacity: { value: 0.5 },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 5 } },
    },
    detectRetina: true,
  };

  return (
    <Particles
      id="tsparticles"
      particlesLoaded={particlesLoaded}
      options={options}
      className="absolute inset-0 z-0 pointer-events-none"
    />
  );
}
