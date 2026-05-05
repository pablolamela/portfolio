import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useScramble } from "@/hooks/useScramble";
import styles from "./ThemeSwitch.module.scss";

type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "theme";
const THEME_ORDER: readonly ThemeMode[] = ["system", "light", "dark"] as const;
const TRANSITION_CLASS = "theme-transition";
const TRANSITION_DURATION_FALLBACK_MS = 320;
const WIDTH_TWEEN_DURATION = 0.32;

function readMsVar(name: string, fallback: number): number {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (raw.endsWith("ms")) return parseFloat(raw);
  if (raw.endsWith("s")) return parseFloat(raw) * 1000;
  return fallback;
}

function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

function readInitialMode(): ThemeMode {
  if (typeof document !== "undefined") {
    const fromAttr = document.documentElement.getAttribute("data-theme-mode");
    if (isThemeMode(fromAttr)) return fromAttr;
  }
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isThemeMode(stored)) return stored;
  }
  return "system";
}

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }
  return mode;
}

function getNavbarElements(): {
  shell: HTMLElement | null;
  track: HTMLElement | null;
} {
  return {
    shell: document.querySelector<HTMLElement>("[data-navbar-shell]"),
    track: document.querySelector<HTMLElement>("[data-navbar-track]"),
  };
}

export default function ThemeSwitch() {
  const [mode, setMode] = useState<ThemeMode>(readInitialMode);
  const [trigger, setTrigger] = useState(0);
  const didMountRef = useRef(false);
  const transitionTimeoutRef = useRef<number | undefined>(undefined);
  // Widths captured synchronously in the click handler, before React re-renders
  const pendingWidthsRef = useRef<{ shell: number; track: number } | null>(null);

  const labelRef = useScramble<HTMLSpanElement>(mode.toUpperCase(), trigger);

  const handleClick = useCallback(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!reduceMotion) {
      const { shell, track } = getNavbarElements();
      if (shell && track) {
        pendingWidthsRef.current = {
          shell: shell.getBoundingClientRect().width,
          track: track.getBoundingClientRect().width,
        };
      }
    }

    setMode((current) => {
      const nextIndex = (THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length;
      const next = THEME_ORDER[nextIndex];
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore storage errors */
      }
      return next;
    });
    setTrigger((t) => t + 1);
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (didMountRef.current && !reduceMotion) {
      document.documentElement.classList.add(TRANSITION_CLASS);
      window.clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = window.setTimeout(() => {
        document.documentElement.classList.remove(TRANSITION_CLASS);
      }, readMsVar("--theme-transition-class-duration", TRANSITION_DURATION_FALLBACK_MS));
    }

    document.documentElement.setAttribute("data-theme-mode", mode);
    document.documentElement.setAttribute("data-theme", resolveTheme(mode));

    const widthsBefore = pendingWidthsRef.current;
    pendingWidthsRef.current = null;

    if (didMountRef.current && widthsBefore) {
      const { shell, track } = getNavbarElements();
      if (shell && track) {
        void shell.offsetWidth;
        const nextShellWidth = shell.getBoundingClientRect().width;
        const nextTrackWidth = track.getBoundingClientRect().width;

        const shellChanged = Math.abs(widthsBefore.shell - nextShellWidth) >= 1;
        const trackChanged = Math.abs(widthsBefore.track - nextTrackWidth) >= 1;

        if (shellChanged || trackChanged) {
          gsap.killTweensOf([shell, track]);
          gsap.fromTo(
            shell,
            { width: widthsBefore.shell },
            {
              width: nextShellWidth,
              duration: WIDTH_TWEEN_DURATION,
              ease: "power2.out",
              clearProps: "width",
            },
          );
          gsap.fromTo(
            track,
            { width: widthsBefore.track },
            {
              width: nextTrackWidth,
              duration: WIDTH_TWEEN_DURATION,
              ease: "power2.out",
              clearProps: "width",
            },
          );
        }
      }
    }

    didMountRef.current = true;
  }, [mode]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      if (mode === "system") {
        document.documentElement.setAttribute(
          "data-theme",
          media.matches ? "light" : "dark",
        );
      }
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [mode]);

  useEffect(() => {
    return () => {
      window.clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  return (
    <button
      type="button"
      className={styles.switcher}
      onClick={handleClick}
      aria-label="Theme switcher"
    >
      <span ref={labelRef} className={styles.label} />
    </button>
  );
}
