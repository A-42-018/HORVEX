import DialogShell from "./DialogShell";

// Roadmap §3.4: right-side panel (420px) on desktop, bottom sheet on mobile.
// side="left" is a full-height panel from the left at every size (mobile nav).
// `footer` stays pinned below the scrolling body (e.g. cart totals + checkout).
const PANEL = {
  right: (visible) =>
    `fixed inset-x-0 bottom-0 max-h-[85dvh] rounded-t-card border-t border-line md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-drawer md:rounded-none md:border-l md:border-t-0 transition-transform duration-slow ${
      visible ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-x-full md:translate-y-0"
    }`,
  left: (visible) =>
    `fixed inset-y-0 left-0 w-drawer max-w-[88vw] border-r border-line transition-transform duration-slow ${
      visible ? "translate-x-0" : "-translate-x-full"
    }`,
};

function Drawer({ open, onClose, title, description, side = "right", tone, footer, children }) {
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      tone={tone}
      panelClass={PANEL[side]}
    >
      <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-6">{children}</div>
      {footer && <div className="border-t border-line px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">{footer}</div>}
    </DialogShell>
  );
}

export default Drawer;
