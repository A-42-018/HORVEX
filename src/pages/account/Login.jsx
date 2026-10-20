import { useRef, useState } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { Button, Input } from "../../components/common";
import { AuthShell, FormNotice } from "../../components/account/AuthParts";
import { authErrorText, focusFirstError, linkErrorText, validateCredentials } from "../../components/account/authForm";
import { useCustomerSession, useResendConfirmation, useSignIn } from "../../hooks/useAccount";
import { strings } from "../../lib/strings";

const t = strings.account;

// Shown when the account exists but the email isn't confirmed yet (or the link expired).
function ResendConfirmation({ email }) {
  const resend = useResendConfirmation();
  if (resend.isSuccess) return <FormNotice tone="success">{t.login.resent}</FormNotice>;
  return (
    <>
      <FormNotice>{resend.isError ? authErrorText(resend.error) : null}</FormNotice>
      <Button variant="secondary" loading={resend.isPending} onClick={() => resend.mutate(email)} className="w-full">
        {t.login.resend}
      </Button>
    </>
  );
}

function Login() {
  const { session } = useCustomerSession();
  const { state } = useLocation();
  const signIn = useSignIn();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // Signed in (now or already): back to where they were headed.
  if (session) return <Navigate to={state?.from ?? "/account"} replace />;

  const set = (key) => (event) => setValues((v) => ({ ...v, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const next = validateCredentials(values);
    setErrors(next);
    if (Object.keys(next).length) return focusFirstError(next, { email: emailRef, password: passwordRef }, ["email", "password"]);
    signIn.mutate({ email: values.email.trim(), password: values.password });
  };

  const notice = state?.notice ? t.login[state.notice] : null;

  return (
    <AuthShell title={t.login.title} subtitle={t.login.subtitle}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormNotice>{signIn.isError ? authErrorText(signIn.error) : linkErrorText(state?.linkError)}</FormNotice>
        {!signIn.isError && <FormNotice tone="success">{notice}</FormNotice>}
        {signIn.error?.code === "email_not_confirmed" && <ResendConfirmation email={signIn.variables.email} />}
        <Input
          ref={emailRef}
          label={t.fields.email}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          error={errors.email}
          value={values.email}
          onChange={set("email")}
        />
        <Input
          ref={passwordRef}
          label={t.fields.password}
          type="password"
          autoComplete="current-password"
          error={errors.password}
          value={values.password}
          onChange={set("password")}
        />
        <div className="flex justify-end">
          <Button as={Link} to="/account/forgot-password" variant="link" size="sm">
            {t.login.forgot}
          </Button>
        </div>
        <Button type="submit" size="lg" loading={signIn.isPending} className="w-full">
          {t.login.submit}
        </Button>
      </form>

      <p className="mt-8 flex flex-wrap items-center justify-center gap-x-2 text-small text-muted">
        {t.login.noAccount}
        <Button as={Link} to="/account/register" state={state} variant="link" size="sm">
          {t.login.register}
        </Button>
      </p>
      <p className="mt-4 text-center text-small text-muted">{t.optionalNote}</p>
    </AuthShell>
  );
}

export default Login;
