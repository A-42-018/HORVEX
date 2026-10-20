import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import "lenis/dist/lenis.css";
import { useSmoothScrollAllowed } from "../../hooks/useMotionPrefs";

// Lenis smooth wheel scrolling (roadmap §7), mouse / trackpad only: touch keeps
// native scrolling and reduced motion turns it off. Lenis scrolls the window, so
// scroll-linked effects (subscribeScroll) follow its smoothed position.
// Dialogs and nested scrollers (drawers, menus, filter lists) scroll natively.
// Lenis is loaded on demand, so touch devices never download it.
function SmoothScroll() {
  const enabled = useSmoothScrollAllowed();
  const { key } = useLocation();
  const lenisRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    let lenis = null;
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({
        autoRaf: true,
        allowNestedScroll: true,
        prevent: (node) => node.nodeName === "DIALOG",
      });
      lenisRef.current = lenis;
    });
    return () => {
      cancelled = true;
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, [enabled]);

  // ScrollRestoration has already moved the page (layout effect); drop any wheel
  // momentum left from the previous page so Lenis doesn't drag it back.
  useEffect(() => {
    lenisRef.current?.scrollTo(window.scrollY, { immediate: true, force: true });
  }, [key]);

  return null;
}

export default SmoothScroll;
