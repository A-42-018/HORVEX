import { LoaderCircle } from "lucide-react";

// Full-screen message for auth states (loading, refused, error). Dark like the
// login page; `children` holds the actions.
function AdminStatus({ title, body, loading = false, children }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-gutter py-12">
      <div role={loading ? "status" : undefined} className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <title>{`${title} | HORVEX Admin`}</title>
        {loading && <LoaderCircle aria-hidden="true" size={28} strokeWidth={1.5} className="animate-spin text-brand" />}
        <h1 className={loading ? "text-small text-muted" : "text-h3 text-fg"}>{title}</h1>
        {body && <p className="text-small text-muted">{body}</p>}
        {children && <div className="mt-2 flex flex-wrap justify-center gap-3">{children}</div>}
      </div>
    </main>
  );
}

export default AdminStatus;
