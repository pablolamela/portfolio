import { useEffect } from "react";

/**
 * BootPortrait monta en cliente y carga el efecto "encender la luz" del retrato.
 * Import dinámico para evitar side-effects en SSR; aprovecha la función de
 * cleanup que devuelve el módulo para limpiar el observer al desmontar.
 */
export default function BootPortrait() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    void import("@/scripts/portrait-light").then((m) => {
      cleanup = m.default();
    });
    return () => cleanup?.();
  }, []);
  return null;
}
