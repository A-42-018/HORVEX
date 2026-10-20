import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { MailCheck } from "lucide-react";
import { Button, Input } from "../../components/common";
import { AuthShell, FormNotice } from "../../components/account/AuthParts";
import { authErrorText, focusFirstError, validateCredentials } from "../../components/account/authForm";
import { useCustomerSession, useResendConfirmation, useSignUp } from "../../hooks/useAccount";
import { strings } from "../../lib/strings";

const t = strings.account;

function CheckEmail({ email }) {
  const resend = useResendConfirmation();
  const headingRef = useRef(null);
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-6 text-center">
      <MailCheck size={40} strokeWidth={1} aria-hidden="true" className="text-gold" />
      <h2 ref={headingRef} tabIndex={-1} className="text-h3 text-fg focus:outline-none">
        {t.register.checkEmailTitle}
      </h2>
      <p className="text-body text-muted">{t.register.checkEmail(email)}</p>
      <p className="text-small text-muted">{t.register.checkEmailHint}</p>
      <div className="w-full" aria-live="polite">
        {resend.isSuccess ? (
          <FormNotice tone="success">{t.register.resent}</FormNotice>
        ) : (
          <>
            <FormNotice>{resend.isError ? authErrorText(resend.error) : null}</FormNotice>
            <Button variant="secondary" loading={resend.isPending} onClick={() => resend.mutate(email)} className="mt-2 w-full">
              {t.register.resend}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Register() {
  const { session } = useCustomerSession();
  const { state } = useLocation();
  const signUp = useSignUp();
  const [values, setValues] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  // "Confirm email" is off: sign-up signs straight in and lands on the account page.
  if (session) {
    const notice = signUp.isSuccess ? "welcome" : undefined;
    return <Navigate to={state?.from ?? "/account"} replace state={{ notice }} />;
  }
  // Fallback if confirmation is ever switched back on: no session until the link is clicked.
  if (signUp.isSuccess && signUp.data.needsConfirmation) {
    return (
      <AuthShell title={t.register.title}>
        <CheckEmail email={signUp.variables.email} />
      </AuthShell>
    );
  }

  const set = (key) => (event) => setValues((v) => ({ ...v, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const name = values.name.trim();
    const next = {
      ...(name.length < 2 || name.length > 80 ? { name: t.errors.name } : {}),
      ...validateCredentials(values, { newPassword: true }),
    };
    if (!next.password && values.confirm !== values.password) next.confirm = t.errors.confirm;
    setErrors(next);
    if (Object.keys(next).length) return focusFirstError(next, { name: nameRef, email: emailRef, password: passwordRef, confirm: confirmRef }, ["name", "email", "password", "confirm"]);
    signUp.mutate({ name, email: values.email.trim(), password: values.password });
  };

  return (
    <AuthShell title={t.register.title} subtitle={t.register.subtitle}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <FormNotice>{signUp.isError ? authErrorText(signUp.error) : null}</FormNotice>
        <Input
          ref={nameRef}
          label={t.fields.name}
          autoComplete="name"
          maxLength={80}
          error={errors.name}
          value={values.name}
          onChange={set("name")}
        />
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
        <Button type="submit" size="lg" loading={signUp.isPending} className="w-full">
          {t.register.submit}
        </Button>
      </form>

      <p className="mt-8 flex flex-wrap items-center justify-center gap-x-2 text-small text-muted">
        {t.register.haveAccount}
        <Button as={Link} to="/account/login" state={state} variant="link" size="sm">
          {t.register.signIn}
        </Button>
      </p>
      <p className="mt-4 text-center text-small text-muted">{t.optionalNote}</p>
    </AuthShell>
  );
}

export default Register;
