import { useState } from "react";
import { Container, Button, Reveal } from "../common";
import { MailIcon, CheckIcon, AlertIcon } from "../layout/icons";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | error | success

  function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim()) {
      setStatus("error");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setStatus("error");
      return;
    }

    // No backend exists yet — validation is real, submission is not.
    // Flip to a success state locally so the structure is ready to wire
    // up to a real subscribe endpoint later.
    setStatus("success");
  }

  function handleChange(e) {
    setEmail(e.target.value);
    if (status !== "idle") setStatus("idle");
  }

  return (
    <section className="bg-bg-secondary py-section-sm">
      <Container>
        <Reveal className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-bg">
            <MailIcon className="h-5 w-5 text-ink" />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-h2 text-ink">Stay in the Loop</h2>
            <p className="text-body text-ink-secondary">
              Get first access to new collections, exclusive offers and special drops.
            </p>
          </div>

          {status === "success" ? (
            <div
              role="status"
              className="flex w-full items-center justify-center gap-2 rounded border border-success/30 bg-success/10 px-4 py-3 text-small font-semibold text-success"
            >
              <CheckIcon className="h-4 w-4 shrink-0" />
              You're subscribed — welcome in!
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex w-full flex-col gap-3 sm:flex-row sm:items-start"
            >
              <div className="flex-1 text-left">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={handleChange}
                  aria-invalid={status === "error"}
                  aria-describedby={status === "error" ? "newsletter-error" : undefined}
                  className={`h-12 w-full rounded border bg-bg px-4 text-body text-ink placeholder:text-ink-secondary/70 transition-colors focus:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                    status === "error" ? "border-sale" : "border-border"
                  }`}
                />
                {status === "error" && (
                  <p
                    id="newsletter-error"
                    role="alert"
                    className="mt-2 flex items-center gap-1.5 text-small font-medium text-sale"
                  >
                    <AlertIcon className="h-4 w-4 shrink-0" />
                    Enter a valid email address.
                  </p>
                )}
              </div>
              <Button type="submit" variant="primary" size="lg" className="shrink-0">
                Subscribe
              </Button>
            </form>
          )}

          <p className="text-small text-ink-secondary">
            No spam. Unsubscribe anytime.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

export default Newsletter;
