// Diagonal light sweep across a watch crystal (roadmap §7 #3): a 10% ivory band.
// `loop` passes every 6s (hero); `hover` passes once when the parent `.group` is
// hovered with a mouse (product cards). Fill the positioned parent; decorative only.
const MODES = {
  loop: "motion-safe:animate-light-sweep",
  hover:
    "transition-none [@media(hover:hover)]:group-hover:translate-x-[300%] [@media(hover:hover)]:group-hover:transition-transform [@media(hover:hover)]:group-hover:duration-reveal",
};

function LightSweep({ mode = "loop", className = "" }) {
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <span className={`absolute inset-y-0 left-0 w-1/3 -translate-x-full ${MODES[mode]}`}>
        <span className="absolute inset-y-[-20%] inset-x-0 skew-x-[-20deg] bg-gradient-to-r from-transparent via-ivory/10 to-transparent" />
      </span>
    </span>
  );
}

export default LightSweep;
