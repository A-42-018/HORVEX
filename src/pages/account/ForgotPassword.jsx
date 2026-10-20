import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { MailCheck } from "lucide-react";
import { Button, Input } from "../../components/common";
import { AuthShell, FormNotice } from "../../components/account/AuthParts";
import { EMAIL_PATTERN, authErrorText } from "../../components/account/authForm";
import { usePasswordReset } from "../../hooks/useAccount";
import { strings } from "../../lib/strings";

const t = strings.account;

function Sent({ email }) {
  const headingRef = useRef(null);
  useEffect(() => headingRef.current?.focus(), []);
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface p-6 text-center">
      <MailCheck size={40} strokeWidth={1} aria-hidden="true" className="text-gold" />
      <h2 ref={headingRef} tabIndex={-1} className="text-h3 text-fg focus:outline-none">
        {t.forgot.sentTitle}
      </h2>
      <p className="text-body text-muted">{t.forgot.sent(email)}</p>
      <Button as={Link} to="/account/login" variant="link">
        {t.forgot.back}
      </Button>
    </div>
  );
}

function ForgotPassword() {
  const reset = usePasswordReset();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const emailRef = useRef(null);

  const submit = (event) => {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setError(t.errors.email);
      emailRef.current?.focus();
      return;
    }
    setError(null);
    reset.mutate(value);
  };

  return (
    <AuthShell title={t.forgot.title} subtitle={reset.isSuccess ? null : t.forgot.subtitle}>
      {reset.isSuccess ? (
        <Sent email={reset.variables} />
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <FormNotice>{reset.isError ? authErrorText(reset.error) : null}</FormNotice>
          <Input
            ref={emailRef}
            label={t.fields.email}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            error={error}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" size="lg" loading={reset.isPending} className="w-full">
            {t.forgot.submit}
          </Button>
          <div className="text-center">
            <Button as={Link} to="/account/login" variant="link" size="sm">
              {t.forgot.back}
            </Button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}

export default ForgotPassword;
