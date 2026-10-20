import { useLayoutEffect, useRef } from "react";
import { MOTION } from "../../lib/motion";

// Headline mask reveal (roadmap §7 #2): each line slides up out of a clip, 80ms
// apart. Words are measured after layout and grouped by line, so it follows the
// real wrapping at every width. `segments` = [{ text, em, className }]; `em`
// parts render as <em> (e.g. the italic gold word). With `play` false (or reduced motion) the text is static.
// While the preloader shows (`html.is-preloading`), the reveal waits for it.
function MaskReveal({ as: Tag = "h2", segments, play = true, className = "" }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    if (!play || !ref.current) return;
    let line = -1;
    let top = null;
    for (const word of ref.current.querySelectorAll("[data-mask-word]")) {
      if (word.offsetTop !== top) {
        top = word.offsetTop;
        line += 1;
      }
      word.firstElementChild.style.animationDelay = `${line * MOTION.stagger}ms`;
    }
  }, [play]);

  const words = (text) =>
    text
      .split(/(\s+)/)
      .filter(Boolean)
      .map((word, i) =>
        /^\s+$/.test(word) ? (
          " "
        ) : (
          <span key={i} data-mask-word className="mask-word">
            <span className={play ? "mask-word__inner motion-safe:animate-mask-rise" : "mask-word__inner"}>{word}</span>
          </span>
        ),
      );

  return (
    <Tag ref={ref} className={className}>
      {segments.map((segment, i) =>
        segment.em ? (
          <em key={i} className={segment.className}>
            {words(segment.text)}
          </em>
        ) : (
          <span key={i} className={segment.className}>
            {words(segment.text)}
          </span>
        ),
      )}
    </Tag>
  );
}

export default MaskReveal;
