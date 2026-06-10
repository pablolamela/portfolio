import { useEffect } from "react";

/**
 * BootHover mounts on the client and dynamically imports the hover initializer.
 * This avoids SSR side-effects and ensures proper bundling in production.
 */
export default function BootHover() {
  useEffect(() => {
    void import("@/scripts/init-hover");
  }, []);
  return null;
}
