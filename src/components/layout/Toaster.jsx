import { Toaster as Sonner } from "sonner";

// Storefront toasts (sonner). Top-centre so they clear the mobile tab bar and
// the WhatsApp button. Toasts sit in the normal page layer, so they can't show
// above an open drawer/modal (native <dialog> top layer); only fire them for
// actions that happen while nothing is open.
function Toaster() {
  return (
    <Sonner
      position="top-center"
      theme="dark"
      duration={3500}
      visibleToasts={2}
      toastOptions={{
        classNames: {
          toast: "!rounded-card !border !border-line !bg-raised !text-fg !font-sans !text-small",
          description: "!text-muted",
        },
      }}
    />
  );
}

export default Toaster;
