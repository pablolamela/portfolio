import gsap from "gsap";

/**
 * Global custom cursor — a decorative follower that trails the native cursor (which
 * stays visible) with a gsap.quickTo lag.
 * - Single anchor (root) animated with gsap.quickTo for a smooth trailing follow.
 * - State (default | grow | project) resolved from the element under the pointer.
 * - The MORPH is GSAP-driven on the dot (real width/height/border-radius + material via
 *   --cursor-blur / --cursor-bg-alpha, NO scale); in the project state the "View Project"
 *   text fades + slides up AFTER the shape finishes morphing into the pill.
 * - Bails on touch (pointer:coarse) and on prefers-reduced-motion (no follower mounted).
 */

type CursorState = "default" | "grow" | "project";

// Geometría/material por estado (px y valores crudos para tween directo).
const DOT = { size: 20, radius: 10, blur: 8, bgAlpha: 0.4 }; // default: círculo pequeño oscuro
const GROW = { size: 40, radius: 20, blur: 0, bgAlpha: 0 }; // grow: círculo hueco (transparente, sin blur)

const MORPH_DUR = 0.35;
const LABEL_IN_DUR = 0.25;
const LABEL_OUT_DUR = 0.12;
const MORPH_EASE = "power3.out";
const SLIDE_UP = 8; // px

export default function setupCursor(): () => void {
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!finePointer || prefersReduced) return () => {};

  const root = document.querySelector<HTMLElement>("[data-cursor-root]");
  if (!root) return () => {};

  const dot = root.querySelector<HTMLElement>("[data-cursor-dot]");
  const label = root.querySelector<HTMLElement>("[data-cursor-label]");
  const labelText = root.querySelector<HTMLElement>("[data-cursor-label-text]");
  if (!dot || !label || !labelText) return () => {};

  const ctx = gsap.context(() => {
    const xTo = gsap.quickTo(root, "x", { duration: 0.45, ease: "power3.out" });
    const yTo = gsap.quickTo(root, "y", { duration: 0.45, ease: "power3.out" });

    let ready = false;
    let lastState: CursorState = "default";
    let morph: gsap.core.Timeline | null = null;

    // Medida del pill: perezosa (Inter carga vía rsms.me, puede no estar lista al setup).
    // Se mide en el primer hover de project, con el label maquetado (opacity:0 ≠ display:none).
    let projectBox: { width: number; height: number } | null = null;
    const measureProjectBox = () => {
      if (!projectBox) {
        projectBox = { width: label.offsetWidth + 32, height: label.offsetHeight + 24 };
      }
      return projectBox;
    };

    const resolveState = (target: EventTarget | null): CursorState => {
      const el = target as Element | null;
      if (!el || typeof el.closest !== "function") return "default";
      if (el.closest("[data-card]")) return "project"; // las cards son <a>: comprobar primero
      if (el.closest('a, button, [role="button"], [data-cursor="grow"]')) return "grow";
      return "default";
    };

    const applyState = (next: CursorState) => {
      morph?.kill();
      morph = gsap.timeline({ defaults: { ease: MORPH_EASE, overwrite: "auto" } });

      if (next === "project") {
        const box = measureProjectBox();
        // 1) la forma muta (círculo → píldora oscura); 2) luego entra el texto.
        morph
          .to(dot, {
            width: box.width,
            height: box.height,
            borderRadius: 8, // md
            "--cursor-blur": DOT.blur,
            "--cursor-bg-alpha": DOT.bgAlpha,
            duration: MORPH_DUR,
          })
          .to(labelText, { opacity: 1, y: 0, duration: LABEL_IN_DUR }, "-=0.15");
      } else {
        const target = next === "grow" ? GROW : DOT;
        // Saca el texto rápido (por si veníamos de project a medio revelar) y, en paralelo,
        // lleva el dot al círculo objetivo desde su tamaño ACTUAL (radio y size con misma
        // dur/ease ⇒ siempre circular durante el tween).
        morph
          .to(labelText, { opacity: 0, y: SLIDE_UP, duration: LABEL_OUT_DUR }, 0)
          .to(
            dot,
            {
              width: target.size,
              height: target.size,
              borderRadius: target.radius,
              "--cursor-blur": target.blur,
              "--cursor-bg-alpha": target.bgAlpha,
              duration: MORPH_DUR,
            },
            0
          );
      }
    };

    const onMove = (e: MouseEvent) => {
      if (!ready) {
        ready = true;
        root.style.opacity = "1";
      }
      xTo(e.clientX);
      yTo(e.clientY);

      const next = resolveState(e.target);
      if (next !== lastState) {
        lastState = next;
        root.setAttribute("data-state", next); // hook de depuración; el SCSS ya no lo lee
        applyState(next);
      }
    };

    const onLeave = () => {
      root.style.opacity = "0";
    };
    const onEnter = () => {
      if (ready) root.style.opacity = "1";
    };

    // Estado inicial: el texto parte oculto + desplazado (slide-up listo).
    gsap.set(labelText, { opacity: 0, y: SLIDE_UP });
    root.setAttribute("data-state", "default");

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    // gsap.context revierte tweens/sets; este return limpia los listeners.
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, root);

  return () => ctx.revert();
}
