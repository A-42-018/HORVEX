import { useLocation } from "react-router";

// Page change (roadmap §7 #14): the new page fades in with an 8px rise (250ms).
// Enter-only, so the old page never holds the new one back and ScrollRestoration
// works as usual. Not on the first load ("default" key) to keep LCP fast.
// `backwards` fill leaves no transform behind, so fixed children (sticky buy bar)
// stay pinned to the viewport once it ends.
function RouteTransition({ children }) {
  const { pathname, key } = useLocation();
  return (
    <div key={pathname} className={key === "default" ? undefined : "motion-safe:animate-route-enter"}>
      {children}
    </div>
  );
}

export default RouteTransition;
