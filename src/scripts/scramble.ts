import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

/**
 * Fuente única del efecto scramble (texto tipo código que se resuelve carácter a carácter).
 * Lo usan la navbar (Contact ↔ Close), el cursor custom (label) y el toast de email.
 *
 * `registerPlugin` es idempotente: importar este módulo deja el plugin listo, así que cada
 * consumidor queda autocontenido sin depender del orden de carga.
 */
gsap.registerPlugin(ScrambleTextPlugin);

// Solo símbolos → `text-transform: uppercase` no los altera (el label es mayúsculas).
export const SCRAMBLE_CHARS = "!<>-_\\/[]{}=+*^?#";

// Config para spread dentro de un .to()/.fromTo() de timeline: `scrambleText: scramble(text)`.
// speed: navbar usa el default 0.5 (0.6s de duración); cursor/toast pasan 1.5 (ventanas ~0.4s).
export const scramble = (text: string, speed = 0.5) => ({
  text,
  chars: SCRAMBLE_CHARS,
  speed,
  revealDelay: 0,
});
