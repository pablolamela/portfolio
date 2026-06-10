import Lenis from "lenis";

// Make Lenis accessible if needed elsewhere
declare global {
  interface Window {
    lenis?: Lenis;
  }
}

// Read CSS var --nav-h to compensate sticky navbar on anchor scrolls
const getNavOffset = (): number => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--nav-h") || "72px";
  const n = parseFloat(raw);
  return Number.isFinite(n) ? -n : -72;
};

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

let lenis: Lenis | null = null;

const createLenis = () => {
  if (lenis || prefersReduced.matches) return;
  lenis = new Lenis({ duration: 1.2, smoothWheel: true });
  window.lenis = lenis;
};

const destroyLenis = () => {
  lenis?.destroy();
  lenis = null;
  window.lenis = undefined;
};

// Single rAF loop: always running, delegates to the current instance (if any).
const raf = (time: number) => {
  lenis?.raf(time);
  requestAnimationFrame(raf);
};
requestAnimationFrame(raf);

// Internal anchor links (#id) with navbar offset.
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement | null;
  const a = target?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
  if (a && a.hash?.length > 1) {
    const el = document.querySelector<HTMLElement>(a.hash);
    if (el) {
      e.preventDefault();
      lenis?.scrollTo(el, { offset: getNavOffset() });
    }
  }
});

// ── ClientRouter: no arrastrar el estado de scroll de Lenis entre páginas ──────
// Lenis mantiene su propio targetScroll + un tween de scroll suave (1.2 s) y, vía
// onNativeScroll, se re-sincroniza con scrolls externos. Sincronizarlo a mano tras
// el swap es frágil: la posición/inercia de la página anterior reaparecía como un
// scroll a la posición vieja (~la duración del tween de Lenis después). En vez de
// eso, DESTRUIMOS Lenis antes de navegar, fijamos el scroll nativo a la posición
// que resuelve Astro (history.state.scrollY: 0 en navegación nueva, guardado al
// volver atrás) y RECREAMOS Lenis ya colocado. El overlay negro oculta el reset.
const targetScrollY = (): number =>
  typeof history.state?.scrollY === "number" ? history.state.scrollY : 0;

document.addEventListener("astro:before-preparation", destroyLenis);
document.addEventListener("astro:after-swap", () => {
  window.scrollTo(0, targetScrollY());
});
document.addEventListener("astro:page-load", () => {
  window.scrollTo(0, targetScrollY());
  createLenis(); // instancia fresca; lee la posición ya fijada del window
});

// Init + reaccionar a cambios de reduced-motion.
createLenis();
prefersReduced.addEventListener?.("change", (ev: MediaQueryListEvent) => {
  if (ev.matches) destroyLenis();
  else createLenis();
});
