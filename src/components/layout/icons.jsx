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

export const SearchIcon = icon(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>
);

export const UserIcon = icon(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-3.5 4.5-5.5 8-5.5s6.5 2 8 5.5" />
  </>
);

export const HeartIcon = icon(
  <path d="M12 20.5s-7-4.35-9.5-8.9C.7 8.1 2.3 4.5 5.8 4.5c2 0 3.4 1 4.7 2.6 1.3-1.6 2.7-2.6 4.7-2.6 3.5 0 5.1 3.6 3.3 7.1-2.5 4.55-9.5 8.9-9.5 8.9Z" />
);

export const BagIcon = icon(
  <>
    <path d="M6 8h12l-1 12H7L6 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </>
);

export const MenuIcon = icon(
  <>
    <path d="M3 6h18" />
    <path d="M3 12h18" />
    <path d="M3 18h18" />
  </>
);

export const CloseIcon = icon(
  <>
    <path d="M18 6 6 18" />
    <path d="M6 6l12 12" />
  </>
);

export const ChevronRightIcon = icon(<path d="m9 18 6-6-6-6" />);

export function StarIcon({ className = "w-4 h-4", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17.8 5.9 21l1.5-6.8-5.2-4.7 6.9-.7L12 2.5z" />
    </svg>
  );
}

export const TruckIcon = icon(
  <>
    <path d="M2 7h11v9H2z" />
    <path d="M13 10h4l3 3v3h-7z" />
    <circle cx="6.5" cy="18" r="1.75" />
    <circle cx="16.5" cy="18" r="1.75" />
  </>
);

export const ShieldCheckIcon = icon(
  <>
    <path d="M12 3l7 3v5c0 4.5-2.9 7.9-7 9-4.1-1.1-7-4.5-7-9V6l7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </>
);

export const LockIcon = icon(
  <>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </>
);

export const RefreshIcon = icon(
  <>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </>
);

export const ShirtIcon = icon(
  <path d="M8 4 4 7l2 3 2-1v11h8V9l2 1 2-3-4-3-2 2h-2L8 4Z" />
);

export const DressIcon = icon(
  <path d="M10 3h4l1 3-1 2 3 12H7l3-12-1-2 1-3Z" />
);

export const WatchIcon = icon(
  <>
    <circle cx="12" cy="12" r="5.5" />
    <path d="M12 9.5V12l1.8 1.2" />
    <path d="M9.5 3h5l-.6 3.2h-3.8L9.5 3Z" />
    <path d="M9.5 21h5l-.6-3.2h-3.8L9.5 21Z" />
  </>
);

export const ShoeIcon = icon(
  <path d="M3 17c0-2 1.2-3 2.5-3.8C7 12.3 8 11 8 9.5V6l3 2h1.5c1 0 1.5.6 2 1.5l2.5 4.3c.6 1 1.6 1.7 3 1.7v1.5c0 .8-.7 1.5-1.5 1.5H4A1 1 0 0 1 3 17Z" />
);

export const SparkleIcon = icon(
  <>
    <path d="M12 3v4" />
    <path d="M12 17v4" />
    <path d="M3 12h4" />
    <path d="M17 12h4" />
    <path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z" />
  </>
);

export const LeafIcon = icon(
  <>
    <path d="M20 4c-9 0-16 7-16 16 9 0 16-7 16-16Z" />
    <path d="M6 18C10 12 14 9 20 4" />
  </>
);

export const HammerIcon = icon(
  <>
    <path d="m15 12-8.5 8.5a1.5 1.5 0 0 1-2-2L13 10" />
    <path d="M13 4 20 11l-2.5 2.5L10 6l1-1 2 2Z" />
  </>
);

export const CompassIcon = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="m15 9-2 6-6 2 2-6 6-2Z" />
  </>
);

export const MailIcon = icon(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </>
);

export const CheckIcon = icon(<path d="M20 6 9 17l-5-5" />);

export const AlertIcon = icon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5" />
    <path d="M12 16h.01" />
  </>
);

export const ChevronDownIcon = icon(<path d="m6 9 6 6 6-6" />);

export const InstagramIcon = icon(
  <>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
  </>
);
