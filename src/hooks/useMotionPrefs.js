import { MEDIA } from "../lib/motion";
import { useMediaQuery } from "./useMediaQuery";

// Live motion preferences. Every C1/C2 effect checks these so reduced motion
// and touch devices get the static version.
export const useReducedMotion = () => useMediaQuery(MEDIA.reducedMotion);

/** Fine pointer (mouse / trackpad) and motion allowed: Lenis smooth scroll. */
export function useSmoothScrollAllowed() {
  const fine = useMediaQuery(MEDIA.finePointer);
  const reduced = useReducedMotion();
  return fine && !reduced;
}

/** Desktop (lg+, fine pointer) and motion allowed: parallax, bezel ring, magnetic CTAs. */
export function useDesktopMotion() {
  const desktop = useMediaQuery(MEDIA.desktopPointer);
  const reduced = useReducedMotion();
  return desktop && !reduced;
}
