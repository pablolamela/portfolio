import { useEffect } from "react";

/**
 * BootClient mounts on the client and dynamically imports client-only scripts
 * so they bundle correctly for production without SSR side-effects.
 * - lenis.ts (smooth scroll)
 * - init-cursor.ts (global custom cursor)
 */
export default function BootClient() {
  useEffect(() => {
    // Dynamically import to ensure client-only execution
    void import("@/scripts/lenis");
    void import("@/scripts/init-cursor");
    void import("@/scripts/mailto-copy");
    void import("@/scripts/navbar-scramble");
    void import("@/scripts/page-fade");
  }, []);
  return null;
}
