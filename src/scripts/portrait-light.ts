/**
 * Retrato que "cobra vida": la silueta vive siempre debajo y la capa iluminada
 * (.portrait_on) se enciende con un fundido lento cuando el retrato entra en
 * viewport, y se apaga al salir. La primera aparición espera una breve pausa
 * para que parezca que la luz se enciende sola tras cargar.
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

  const FIRST_DELAY = 600; // pausa inicial: "se enciende sola" tras cargar
  let first = true;
  let timer: number | undefined;

  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        const delay = first ? FIRST_DELAY : 0;
        first = false;
        timer = window.setTimeout(() => {
          root.dataset.lit = "on";
        }, delay);
      } else {
        if (timer) {
          window.clearTimeout(timer);
          timer = undefined;
        }
        root.dataset.lit = "off";
      }
    },
    { threshold: 0.65 }
  );

  io.observe(root);

  return () => {
    io.disconnect();
    if (timer) window.clearTimeout(timer);
  };
}
