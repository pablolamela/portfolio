import gsap from "gsap";
import { scramble } from "@/scripts/scramble";

/**
 * Global custom cursor — replaces the native cursor (hidden via cursor:none, gated on
 * html[data-cursor-ready]). Two follow anchors:
 * - Precise dot: near-instant follow, marks the exact pointer (high contrast for aiming).
 * - Ring/root: lagging gsap.quickTo follow; the morphing disc + "View Project" label.
 * State (default | grow | project) resolved from the element under the pointer. The MORPH
 * is GSAP-driven on the dot (real width/height/border-radius + material via --cursor-blur /
 * backgroundColor, NO scale); in project the label fades + slides up after the shape morph.
 * Bails on touch (pointer:coarse) and on prefers-reduced-motion → data-cursor-ready is never
 * set, so the native cursor stays (fallback).
 */

type CursorState = "default" | "grow" | "project";

// Geometría/material por estado. bg = color de fondo (GSAP tweenea backgroundColor como rgba).
const DOT = { size: 20, radius: 10, blur: 8, bg: "rgba(255, 255, 255, 0.1)" }; // base: blanco translúcido + blur (= use-color('white-opacity'))
const GROW = { size: 40, radius: 20, blur: 0, bg: "rgba(255, 255, 255, 0)" }; // grow: hueco transparente, sin blur
const PROJECT_BG = "rgba(8, 8, 8, 0.4)"; // project: pill oscuro (= use-color('background') @ 0.4), sin cambios

const MORPH_DUR = 0.35;
const LABEL_IN_DUR = 0.4;
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
  // Anchor independiente (hermano del root, sin su lag).
  const precise = document.querySelector<HTMLElement>("[data-cursor-precise]");
  if (!dot || !label || !labelText || !precise) return () => {};

  const ctx = gsap.context(() => {
    const xTo = gsap.quickTo(root, "x", { duration: 0.45, ease: "power3.out" }); // aro: lag
    const yTo = gsap.quickTo(root, "y", { duration: 0.45, ease: "power3.out" });
    const pxTo = gsap.quickTo(precise, "x", { duration: 0.06, ease: "power3.out" }); // punto: casi instantáneo
    const pyTo = gsap.quickTo(precise, "y", { duration: 0.06, ease: "power3.out" });

    let ready = false;
    let lastState: CursorState = "default";
    let morph: gsap.core.Timeline | null = null;

    // Mensaje bloqueado (p.ej. "Email copied"): mientras está activo, el cursor sigue la
    // posición pero NO cambia de estado por hover; al expirar vuelve al estado bajo el puntero.
    let locked = false;
    let pendingState: CursorState = "default";
    let messageTimer: ReturnType<typeof setTimeout> | null = null;

    const DEFAULT_LABEL = "View Project";
    // Medida del pill por texto (perezosa; Inter carga async). Mide poniendo el texto en el
    // label (white-space:nowrap; el texto oculto por opacity sigue dando offsetWidth) y restaura.
    const boxCache = new Map<string, { width: number; height: number }>();
    const measureBox = (text: string) => {
      const cached = boxCache.get(text);
      if (cached) return cached;
      const prev = labelText.textContent;
      labelText.textContent = text;
      const box = { width: label.offsetWidth + 32, height: label.offsetHeight + 24 };
      if (prev !== text) labelText.textContent = prev;
      boxCache.set(text, box);
      return box;
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
        const box = measureBox(DEFAULT_LABEL);
        // 1) la forma muta (círculo → píldora oscura); 2) luego el texto entra scrambleando.
        morph
          .to(dot, {
            width: box.width,
            height: box.height,
            borderRadius: 8, // md
            "--cursor-blur": DOT.blur,
            backgroundColor: PROJECT_BG,
            duration: MORPH_DUR,
          })
          .to(labelText, { opacity: 1, y: 0, duration: LABEL_IN_DUR, scrambleText: scramble(DEFAULT_LABEL, 1.5) });
      } else {
        const target = next === "grow" ? GROW : DOT;
        // Saca el texto con fade rápido (sin scramble) y, en paralelo, lleva el dot al círculo
        // objetivo desde su tamaño ACTUAL (radio y size con misma dur/ease ⇒ siempre circular).
        morph
          .to(labelText, { opacity: 0, y: SLIDE_UP, duration: LABEL_OUT_DUR }, 0)
          .to(
            dot,
            {
              width: target.size,
              height: target.size,
              borderRadius: target.radius,
              "--cursor-blur": target.blur,
              backgroundColor: target.bg,
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
        precise.style.opacity = "1";
        document.documentElement.setAttribute("data-cursor-ready", ""); // habilita cursor:none
      }
      xTo(e.clientX);
      yTo(e.clientY);
      pxTo(e.clientX);
      pyTo(e.clientY);

      const next = resolveState(e.target);
      if (locked) {
        pendingState = next; // recuerda a dónde volver; no morphea mientras dura el mensaje
        return;
      }
      if (next !== lastState) {
        lastState = next;
        root.setAttribute("data-state", next); // hook de depuración; el SCSS ya no lo lee
        applyState(next);
      }
    };

    const onLeave = () => {
      root.style.opacity = "0";
      precise.style.opacity = "0";
    };
    const onEnter = () => {
      if (ready) {
        root.style.opacity = "1";
        precise.style.opacity = "1";
      }
    };

    // Morphea el cursor a la píldora oscura con un mensaje y, al expirar, vuelve al estado
    // que haya bajo el puntero. Lo dispara mailto-copy.ts vía el evento "cursor:message".
    const showMessage = (text: string, ms: number) => {
      if (messageTimer) clearTimeout(messageTimer);
      if (!locked) pendingState = lastState; // estado actual bajo el puntero (la 1ª vez)
      locked = true;

      const box = measureBox(text);
      morph?.kill();
      morph = gsap.timeline({ defaults: { ease: MORPH_EASE, overwrite: "auto" } });
      morph
        .to(dot, {
          width: box.width,
          height: box.height,
          borderRadius: 8,
          "--cursor-blur": DOT.blur,
          backgroundColor: PROJECT_BG,
          duration: MORPH_DUR,
        })
        // El texto entra scrambleando hacia el mensaje, una vez el recuadro ha terminado de formarse.
        .to(labelText, { opacity: 1, y: 0, duration: LABEL_IN_DUR, scrambleText: scramble(text, 1.5) });

      messageTimer = setTimeout(() => {
        locked = false;
        messageTimer = null;
        // applyState scramblea solo hacia el objetivo (""=oculto / DEFAULT_LABEL=project),
        // sin swap instantáneo de textContent que delataría el efecto.
        lastState = pendingState;
        root.setAttribute("data-state", pendingState);
        applyState(pendingState);
      }, ms);
    };

    const onMessage = (e: Event) => {
      const detail = (e as CustomEvent<{ text?: string; ms?: number }>).detail;
      showMessage(detail?.text ?? "Copied", detail?.ms ?? 1600);
    };

    // Estado inicial: el texto parte oculto + desplazado (slide-up listo).
    gsap.set(labelText, { opacity: 0, y: SLIDE_UP });
    root.setAttribute("data-state", "default");

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    window.addEventListener("cursor:message", onMessage);

    // gsap.context revierte tweens/sets; este return limpia listeners + el flag de hide.
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("cursor:message", onMessage);
      if (messageTimer) clearTimeout(messageTimer);
      document.documentElement.removeAttribute("data-cursor-ready");
    };
  }, root);

  return () => ctx.revert();
}
