import gsap from "gsap";

/**
 * Intercepta cada <a href="mailto:…">: copia la dirección al portapapeles en vez de abrir el
 * cliente de correo (preventDefault). El feedback se enruta con las mismas condiciones que
 * cursor.ts al inicializarse (pointer:fine + !prefers-reduced-motion):
 *  - desktop/cursor activo → evento "cursor:message" (el cursor morphea a la píldora oscura).
 *  - touch / reduced-motion → toast inferior.
 * El toast es además el anunciador aria-live en AMBOS caminos (el cursor es aria-hidden).
 * Mejora progresiva: sin JS los enlaces son mailto: reales y funcionan de forma nativa.
 *
 * Guard de inicialización única (window.__mailtoInit): Astro ClientRouter puede re-ejecutar
 * scripts en navegación SPA y Vite HMR puede re-correr el módulo sin limpiar listeners viejos.
 * El flag en window garantiza que solo se registra un listener de click y un handler de swap.
 */

const FEEDBACK_TEXT = "Email copied";
const FEEDBACK_MS = 1600;

const extractEmail = (href: string): string => {
  const raw = href.replace(/^mailto:/i, "").split("?")[0];
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const legacyCopy = (text: string): boolean => {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
};

const copy = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* cae al fallback */
  }
  return legacyCopy(text);
};

// --- Toast (primario en touch / fallback en desktop) -----------------------------------
// Elementos resueltos de forma perezosa: BootClient corre tras montar el layout.
let toastRoot: HTMLElement | null = null;
let toastPill: HTMLElement | null = null;
let toastTl: gsap.core.Timeline | null = null;

const SLIDE_IN = 20; // px, la píldora entra desde abajo
const IN_DUR = 0.32;
const OUT_DUR = 0.28;
// hold para total ≈ FEEDBACK_MS: 0.32 in + ~1.0 hold + 0.28 out
const HOLD_S = (FEEDBACK_MS - (IN_DUR + OUT_DUR) * 1000) / 1000;

const resolveToastEls = (): boolean => {
  if (!toastRoot) toastRoot = document.querySelector<HTMLElement>("[data-toast-root]");
  if (!toastPill) toastPill = toastRoot?.querySelector<HTMLElement>("[data-toast-pill]") ?? null;
  return !!(toastRoot && toastPill);
};

// Actualiza el texto del aria-live (re-set dispara el anuncio) sin animar el toast.
const announce = (text: string) => {
  if (resolveToastEls() && toastPill) toastPill.textContent = text;
};

const showToast = (text: string) => {
  if (!resolveToastEls() || !toastRoot || !toastPill) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  toastPill.textContent = text; // re-set → re-dispara aria-live en copias repetidas
  toastRoot.style.visibility = "visible";

  toastTl?.kill();
  toastTl = gsap.timeline();

  if (reduced) {
    toastTl
      .set(toastPill, { y: 0, opacity: 1 })
      .set(toastPill, { opacity: 0 }, `+=${HOLD_S}`)
      .set(toastRoot, { visibility: "hidden" });
    return;
  }

  toastTl
    .fromTo(
      toastPill,
      { opacity: 0, y: SLIDE_IN },
      { opacity: 1, y: 0, duration: IN_DUR, ease: "power3.out" },
    )
    .to(toastPill, { opacity: 0, y: SLIDE_IN, duration: OUT_DUR, ease: "power2.in" }, `+=${HOLD_S}`)
    .set(toastRoot, { visibility: "hidden" });
};

// --- Delegación del click --------------------------------------------------------------
const onClick = (e: MouseEvent) => {
  const target = e.target as Element | null;
  const link = target?.closest?.('a[href^="mailto:"]') as HTMLAnchorElement | null;
  if (!link) return;

  const email = extractEmail(link.getAttribute("href") ?? "");
  if (!email) return; // malformado: deja abrir el cliente de correo nativo

  e.preventDefault();

  void copy(email).then((ok) => {
    if (!ok) return; // copia fallida → sin feedback falso
    // Mismo gate que cursor.ts: fine pointer + sin reduced-motion = cursor custom activo.
    // No se usa data-cursor-ready porque ese atributo se pone en el primer mousemove, lo que
    // provoca que un click sin movimiento previo caiga erróneamente al toast de mobile.
    const hasCursor =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (hasCursor) {
      window.dispatchEvent(
        new CustomEvent("cursor:message", { detail: { text: FEEDBACK_TEXT, ms: FEEDBACK_MS } }),
      );
      announce(FEEDBACK_TEXT); // paridad con lectores de pantalla
    } else {
      showToast(FEEDBACK_TEXT);
    }
  });
};

// Guard: solo inicializar una vez aunque el módulo se re-ejecute (HMR / nav SPA).
// Usamos window como storage persistente entre re-ejecuciones del módulo.
const _KEY = "__mailtoInit";
if (!(window as any)[_KEY]) {
  (window as any)[_KEY] = true;

  document.addEventListener("click", onClick);

  // Limpiar el toast al salir de la página: el elemento persiste via transition:persist,
  // así que una animación en curso seguiría corriendo (y mostrando el toast) en la nueva página.
  document.addEventListener("astro:before-swap", () => {
    toastTl?.kill();
    toastTl = null;
    if (toastRoot) gsap.set(toastRoot, { visibility: "hidden" });
    if (toastPill) gsap.set(toastPill, { opacity: 0, y: 0 });
  });
}
