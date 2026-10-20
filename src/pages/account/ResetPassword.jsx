import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button, Input, Skeleton } from "../../components/common";
import { AuthShell, FormNotice } from "../../components/account/AuthParts";
import { MIN_PASSWORD, authErrorText, linkErrorText } from "../../components/account/authForm";
import { useCustomerSession, useUpdatePassword } from "../../hooks/useAccount";
import { takeLanding } from "../../services/customerAuth";
import { strings } from "../../lib/strings";

const t = strings.account;

// Reached from the reset email (the link signs the customer in with a recovery
// session) or from "Change password" on /account.
function ResetPassword() {
  const { session } = useCustomerSession();
  const [landing] = useState(takeLanding);
  const navigate = useNavigate();
  const update = useUpdatePassword();
  const [values, setValues] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  if (session === undefined && !landing.errorCode) {
    return (
      <AuthShell title={t.reset.title} subtitle={t.reset.checking}>
        <Skeleton className="h-48 w-full" />
      </AuthShell>
    );
  }

  if (!session) {
    return (
      <AuthShell title={t.reset.title}>
        <FormNotice>{linkErrorText(landing.errorCode) ?? t.reset.expired}</FormNotice>
        <Button as={Link} to="/account/forgot-password" size="lg" className="mt-6 w-full">
          {t.reset.requestNew}
        </Button>
      </AuthShell>
    );
  }

  const set = (key) => (event) => setValues((v) => ({ ...v, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (values.password.length < MIN_PASSWORD) next.password = t.errors.password;
    else if (values.confirm !== values.password) next.confirm = t.errors.confirm;
    setErrors(next);
    if (next.password) return passwordRef.current?.focus();
    if (next.confirm) return confirmRef.current?.focus();
    update.mutate(values.password, {
      onSuccess: () => navigate("/account", { replace: true, state: { notice: "passwordChanged" } }),
    });
  };

  return (
    <AuthShell title={t.reset.title} subtitle={t.reset.subtitle}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormNotice>{update.isError ? authErrorText(update.error) : null}</FormNotice>
        {/* Lets password managers file the new password under the right account. */}
        <input type="email" autoComplete="username" value={session.user.email ?? ""} readOnly hidden />
        <Input
          ref={passwordRef}
          label={t.fields.newPassword}
          type="password"
          autoComplete="new-password"
          hint={t.passwordHint}
          error={errors.password}
          value={values.password}
          onChange={set("password")}
        />
        <Input
          ref={confirmRef}
          label={t.fields.confirmPassword}
          type="password"
          autoComplete="new-password"
          error={errors.confirm}
          value={values.confirm}
          onChange={set("confirm")}
        />
        <Button type="submit" size="lg" loading={update.isPending} className="w-full">
          {t.reset.submit}
        </Button>
      </form>
    </AuthShell>
  );
}

export default ResetPassword;
