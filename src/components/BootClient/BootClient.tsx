import { useEffect } from "react";

/**
 * BootClient mounts on the client and dynamically imports client-only scripts
 * so they bundle correctly for production without SSR side-effects.
 * - lenis.ts (smooth scroll)
 * - init-gravity.ts (gyroscope effect initializer)
 */
export default function BootClient() {
  useEffect(() => {
    // Dynamically import to ensure client-only execution
    void import("@/scripts/lenis");
    void import("@/scripts/init-gravity");
  }, []);
  return null;
}
