import { useInView } from "../../hooks/useInView";
import { MOTION } from "../../lib/motion";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
// Every character sits in a cell of the same height, tall enough for the
// display font's old-style figures (they dip below the baseline).
const CELL = "block h-[1.2em] leading-[1.2]";

// Counter roll (roadmap §7 #13): each digit is a 0–9 strip that rolls up to its
// value (transform only) the first time the number scrolls into view, digits
// staggered left to right. Other characters (".", ",") stay put. Screen readers
// get the plain value. Under reduced motion useInView starts true: no roll.
function RollingNumber({ value, className = "" }) {
  const [ref, inView] = useInView({ threshold: 0.6 });
  const text = String(value);
  let digitIndex = 0;

  return (
    <span ref={ref} className={`inline-flex tabular-nums ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex items-start">
        {[...text].map((char, i) => {
          if (!/\d/.test(char)) return <span key={i} className={CELL}>{char}</span>;
          const delay = digitIndex++ * MOTION.counterStagger;
          return (
            <span key={i} className={`${CELL} overflow-hidden`}>
              <span
                style={{
                  transform: `translateY(${inView ? -Number(char) * 10 : 0}%)`,
                  transitionDelay: `${delay}ms`,
                }}
                className="flex flex-col transition-transform duration-reveal ease-out-expo"
              >
                {DIGITS.map((d) => (
                  <span key={d} className={CELL}>
                    {d}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </span>
  );
}

export default RollingNumber;
