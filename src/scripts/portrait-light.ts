/**
 * Retrato que "cobra vida": la silueta vive siempre debajo y la capa iluminada
 * (.portrait_on) se enciende con un fundido lento cuando el retrato entra en
 * viewport, y se apaga al salir. Cada aparición en viewport espera INVIEW_DELAY
 * antes de encenderse. Al hacer hover se apaga tras HOVER_DELAY; al salir del
 * hover vuelve a encenderse si sigue en viewport.
 * - El toggle es solo data-lit en [data-portrait]; el fundido lo hace CSS.
 * - prefers-reduced-motion (o sin IntersectionObserver): se queda encendido,
 *   sin animación ni observer.
 */
export default function setupPortraitLight(): () => void {
  const root = document.querySelector<HTMLElement>("[data-portrait]");
  if (!root) return () => {};

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced || !("IntersectionObserver" in window)) {
    root.dataset.lit = "on";
    return () => {};
  }

  const INVIEW_DELAY = 600;
  const HOVER_DELAY = 400;

  let isInView = false;
  let inviewTimer: number | undefined;
  let hoverTimer: number | undefined;

  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        isInView = true;
        window.clearTimeout(inviewTimer);
        inviewTimer = window.setTimeout(() => {
          root.dataset.lit = "on";
        }, INVIEW_DELAY);
      } else {
        isInView = false;
        window.clearTimeout(inviewTimer);
        window.clearTimeout(hoverTimer);
        root.dataset.lit = "off";
      }
    },
    { threshold: 0.65 }
  );

  // Arrow functions (no declarations) para conservar el narrowing de `const root`
  // tras el early-return de la línea 13; las declarations se hoistean y TS pierde
  // el narrowing, marcando root como posiblemente null.
  const onMouseEnter = () => {
    window.clearTimeout(inviewTimer);
    window.clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => {
      root.dataset.lit = "off";
    }, HOVER_DELAY);
  };

  const onMouseLeave = () => {
    window.clearTimeout(hoverTimer);
    if (isInView) root.dataset.lit = "on";
  };

  // Hover sobre las imágenes, no el contenedor del grid (que es más grande)
  const imgs = Array.from(root.querySelectorAll<HTMLElement>("img"));
  imgs.forEach((img) => {
    img.addEventListener("mouseenter", onMouseEnter);
    img.addEventListener("mouseleave", onMouseLeave);
  });
  io.observe(root);

  return () => {
    io.disconnect();
    window.clearTimeout(inviewTimer);
    window.clearTimeout(hoverTimer);
    imgs.forEach((img) => {
      img.removeEventListener("mouseenter", onMouseEnter);
      img.removeEventListener("mouseleave", onMouseLeave);
    });
  };
}
