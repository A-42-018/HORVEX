import { useCallback, useState } from "react";

const KEY = "wristory-admin-theme";

function read() {
  try {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

// Admin is dark by default; "light" flips the surface tokens with `.section-ivory`.
export function useAdminTheme() {
  const [theme, setTheme] = useState(read);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // Private mode: the choice just lasts for this visit.
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
