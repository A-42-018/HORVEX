import { useState } from "react";
import { Navigate, useLocation } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CircleAlert } from "lucide-react";
import { Button, Input } from "../../components/common";
import { strings } from "../../lib/strings";
import { signIn, signOut } from "../../services/auth";
import { adminProfileQuery, useAuth } from "../auth/authContext";
import AdminStatus from "../components/AdminStatus";

const t = strings.admin.login;

function Login() {
  const { status } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [errorCode, setErrorCode] = useState(null);

  const from = location.state?.from;
  if (status === "admin") return <Navigate to={from ? `${from.pathname}${from.search}` : "/admin"} replace />;
  if (status === "loading" && !submitting) return <AdminStatus loading title={strings.admin.checking} />;

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setErrorCode(null);
    setSubmitting(true);
    try {
      const session = await signIn(String(form.get("email")).trim(), String(form.get("password")));
      // Signed in, but only an admin_profiles row grants access. Sign anyone
      // else straight back out. Admins are redirected by the check above.
      const profile = await queryClient.fetchQuery(adminProfileQuery(session.user.id));
      if (!profile) {
        await signOut();
        setErrorCode("not_admin");
      }
    } catch (error) {
      setErrorCode(error.code ?? "fallback");
    } finally {
      setSubmitting(false);
    }
  }

  const errorMessage = errorCode ? (t.errors[errorCode] ?? t.errors.fallback) : null;

  return (
    <main className="flex min-h-dvh items-center justify-center px-gutter py-12">
      <title>Sign in | HORVEX Admin</title>
      <div className="w-full max-w-sm">
        <p className="text-center font-logo text-h3 tracking-wordmark text-fg">HORVEX</p>
        <h1 className="mt-6 text-center text-h3 text-fg">{t.title}</h1>
        <p className="mt-2 text-center text-small text-muted">{t.intro}</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" aria-describedby="login-error">
          <Input label={t.email} name="email" type="email" autoComplete="username" required autoFocus />
          <Input label={t.password} name="password" type="password" autoComplete="current-password" required />

          <div id="login-error" aria-live="polite">
            {errorMessage && (
              <p className="flex items-start gap-2 rounded-control border border-danger/40 bg-danger/10 px-4 py-3 text-small text-danger">
                <CircleAlert aria-hidden="true" size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                {errorMessage}
              </p>
            )}
          </div>

          <Button type="submit" size="lg" loading={submitting} className="w-full">
            {t.submit}
          </Button>
        </form>

        <p className="mt-6 text-center text-small text-muted">{t.forgot}</p>
      </div>
    </main>
  );
}

export default Login;
