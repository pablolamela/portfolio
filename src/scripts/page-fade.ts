import gsap from "gsap";

/**
 * Fundido a negro entre páginas (ClientRouter), desacoplado de la View Transitions
 * API: un overlay [data-page-fade] por DEBAJO de la navbar se funde a negro antes
 * del swap y vuelve después. Así la navbar y el cursor quedan siempre visibles y el
 * scramble del botón corre en vivo; solo el contenido se cubre. El swap en sí es un
 * corte instantáneo (las animaciones VT están anuladas en globals.scss).
 *
 * Por qué no la View Transitions API: los elementos persistidos tienen
 * `view-transition-name: none`, así que caen en el snapshot `root` y se fundirían
 * con el contenido; además los snapshots son estáticos y congelarían el scramble.
 */
const FADE = 0.25; // segundos, cada mitad del fundido
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

function fadeTo(opacity: number): Promise<void> {
  const overlay = document.querySelector<HTMLElement>("[data-page-fade]");
  if (!overlay) return Promise.resolve();
  if (prefersReduced.matches) {
    overlay.style.opacity = String(opacity);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    gsap.to(overlay, { opacity, duration: FADE, ease: "power1.inOut", onComplete: finish });
    // Red de seguridad: si el rAF se pausa (pestaña en background) GSAP no completa
    // nunca; sin esto el swap esperaría su `onComplete` para siempre y la navegación
    // se colgaría. El timeout garantiza que la promesa resuelve igualmente.
    setTimeout(finish, FADE * 1000 + 200);
  });
}

// Antes de preparar el swap: oscurecer en paralelo a la carga del nuevo documento.
// Astro espera a que el loader async resuelva, así el swap (y el reset de scroll en
// lenis.ts) ocurren con la pantalla ya en negro.
document.addEventListener("astro:before-preparation", (event) => {
  const e = event as Event & { loader: () => Promise<unknown> };
  const original = e.loader;
  e.loader = async () => {
    await Promise.all([fadeTo(1), original()]);
  };
});

// Tras cargar la nueva página: revelar. (En la carga inicial el overlay ya está a 0,
// así que esto es un no-op.)
document.addEventListener("astro:page-load", () => {
  void fadeTo(0);
});
