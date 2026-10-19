import DialogShell from "./DialogShell";

// Centred dialog that fades and scales in. `footer` holds the actions.
const SIZES = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

function Modal({ open, onClose, title, description, size = "md", tone, footer, children }) {
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      tone={tone}
      panelClass={(visible) =>
        `absolute left-1/2 top-1/2 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-card border border-line shadow-surface transition-[opacity,transform] duration-base ${SIZES[size]} ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`
      }
    >
      <div className="overflow-y-auto overscroll-contain px-6 py-6">{children}</div>
      {footer && (
        <div className="flex flex-col-reverse gap-3 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>
      )}
    </DialogShell>
  );
}

export default Modal;
