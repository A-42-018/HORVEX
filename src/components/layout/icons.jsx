function icon(paths) {
  return function Icon({ className = "w-5 h-5", ...props }) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        {...props}
      >
        {paths}
      </svg>
    );
  };
}

export const InstagramIcon = icon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
  </>
);

// Official round "f" mark, filled so it reads as the brand logo next to the outline icons.
// Accepts lucide's `size` so it can stand in for a lucide icon; strokeWidth is ignored.
export function FacebookIcon({ className = "w-5 h-5", size, strokeWidth: _strokeWidth, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} className={className} aria-hidden="true" {...props}>
      <path d="M9.1 23.69v-7.98H6.63v-3.67H9.1v-1.58c0-4.09 1.85-5.98 5.86-5.98.4 0 .96.04 1.47.1.38.04.76.11 1.14.2v3.32a8.6 8.6 0 0 0-.65-.03 27 27 0 0 0-.73-.01c-.71 0-1.26.1-1.68.31-.28.14-.51.36-.68.62-.26.42-.37 1-.37 1.75v1.3h3.92l-.39 2.1-.29 1.57h-3.24v8.24C19.4 23.24 24 18.18 24 12.04 24 5.42 18.63.04 12 .04S0 5.42 0 12.04c0 5.63 3.87 10.35 9.1 11.65Z" />
    </svg>
  );
}
