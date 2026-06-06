import setupCursor from "./cursor";

const initCursor = () => {
  try {
    setupCursor();
  } catch {
    // no-op
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCursor, { once: true });
} else {
  initCursor();
}
