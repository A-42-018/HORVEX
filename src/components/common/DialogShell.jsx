import { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { DURATION } from "../../lib/motion";
import { strings } from "../../lib/strings";
import IconButton from "./IconButton";

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Base for Drawer and Modal, built on a native <dialog>: showModal() puts it in
// the top layer and makes the page inert; ESC, the backdrop and the close button
// call onClose; Tab wraps inside the panel; page scroll is locked; focus moves to
// [data-autofocus] (or the panel) and returns to the trigger on close. The dialog
// stays mounted through the exit transition. `panelClass(visible)` styles the panel.
function DialogShell({ open, onClose, title, description, tone = "dark", panelClass, overlayClass = "", children }) {
  const id = useId();
  const dialogRef = useRef(null);
  const panelRef = useRef(null);
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const visible = open && entered;

  // Mount as soon as `open` turns true (adjusting state during render).
  if (open && !mounted) setMounted(true);

  // Scroll lock + focus return, for as long as the dialog is mounted.
  useEffect(() => {
    if (!mounted) return;
    const trigger = document.activeElement;
    const root = document.documentElement;
    const previous = { overflow: root.style.overflow, paddingRight: root.style.paddingRight };
    const scrollbar = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`;
    return () => {
      root.style.overflow = previous.overflow;
      root.style.paddingRight = previous.paddingRight;
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, [mounted]);

  // Open: showModal, focus, then flip to the visible state on the next frame so
  // the enter transition runs. Close: transition out, then close and unmount.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      (dialog.querySelector("[data-autofocus]") ?? panelRef.current)?.focus();
      const frame = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(frame);
    }

    const timer = setTimeout(
      () => {
        dialog.close();
        setEntered(false);
        setMounted(false);
      },
      prefersReducedMotion() ? 0 : DURATION.slow,
    );
    return () => clearTimeout(timer);
  }, [open, mounted]);

  if (!mounted) return null;

  const handleKeyDown = (event) => {
    if (event.key !== "Tab" || !panelRef.current) return;
    const items = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 backdrop:bg-transparent"
      onCancel={(event) => {
        event.preventDefault(); // we close after the exit transition
        onClose();
      }}
      // The browser can force-close (e.g. a second ESC); keep React state in sync.
      onClose={() => open && onClose()}
      onKeyDown={handleKeyDown}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`absolute inset-0 bg-obsidian/60 backdrop-blur transition-opacity duration-slow ${
          visible ? "opacity-100" : "opacity-0"
        } ${overlayClass}`}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`${tone === "ivory" ? "section-ivory" : "section-dark"} flex flex-col bg-raised text-fg focus:outline-none ${panelClass(visible)}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line py-3 pl-6 pr-3">
          <div className="flex min-w-0 flex-col gap-1 py-2">
            <h2 id={`${id}-title`} className="text-h3">
              {title}
            </h2>
            {description && (
              <p id={`${id}-description`} className="text-small text-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton label={strings.common.close} variant="ghost" onClick={onClose}>
            <X aria-hidden="true" size={20} strokeWidth={1.5} />
          </IconButton>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export default DialogShell;
