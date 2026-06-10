import gsap from "gsap";
import { scramble } from "@/scripts/scramble";

/**
 * Anima el botón derecho de la navbar (Contact ↔ Close) en cada navegación SPA.
 *
 * La navbar persiste entre páginas vía `transition:persist` (Base.astro), así que
 * el nodo NO se re-renderiza con el nuevo `currentPath` — su texto/href quedan los
 * del estado previo. Aquí, tras cada swap de ClientRouter, recalculamos el destino
 * según la URL y, si la palabra cambió, lanzamos un scramble tipo código.
 *
 * El estado inicial lo fija el SSR (carga directa de /info ya muestra "Close" sin
 * animación, que es lo correcto: no hubo transición).
 */
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

type Target = { word: string; href: string };

function resolveTarget(wrapper: HTMLElement): Target {
  // El href de "Contact" viaja en el data-attr para no hardcodear el mailto aquí.
  return window.location.pathname === "/"
    ? { word: "Contact", href: wrapper.dataset.contactHref || "#" }
    : { word: "Close", href: "/" };
}

function updateContactButton() {
  const wrapper = document.querySelector<HTMLElement>("[data-nav-action]");
  const link = wrapper?.querySelector<HTMLAnchorElement>("a");
  if (!wrapper || !link) return;

  const { word, href } = resolveTarget(wrapper);

  // Misma palabra (p. ej. proyecto → proyecto, ambos "Close") → nada que animar.
  if (link.textContent?.trim() === word) {
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
    return;
  }

  link.setAttribute("href", href);

  if (prefersReduced.matches) {
    link.textContent = word;
    return;
  }

  gsap.to(link, {
    duration: 0.6,
    ease: "none",
    scrambleText: scramble(word),
  });
}

document.addEventListener("astro:after-swap", updateContactButton);
