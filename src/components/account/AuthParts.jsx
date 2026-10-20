import { useEffect, useRef } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { Container, SectionHeading } from "../common";
import { Seo } from "../seo";
import { strings } from "../../lib/strings";

const t = strings.account;

/** Page frame shared by the account pages: noindex, eyebrow + h1, narrow column. */
export function AuthShell({ title, subtitle, children, wide = false }) {
  return (
    <Container className="py-section-sm lg:py-section">
      <Seo title={typeof title === "string" ? title : t.eyebrow} noindex />
      <div className={`mx-auto ${wide ? "max-w-3xl" : "max-w-md"}`}>
        {/* md:!justify-center: keeps a short heading centred (SectionHeading's justify-between wins otherwise). */}
        <SectionHeading as="h1" eyebrow={t.eyebrow} title={title} subtitle={subtitle} className="md:!justify-center" />
        <div className="mt-10">{children}</div>
      </div>
    </Container>
  );
}

/**
 * Form-level message. Errors use role="alert" and take focus when they appear,
 * so keyboard and screen-reader users land on them.
 */
export function FormNotice({ tone = "error", children, focus = tone === "error" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (focus && children) ref.current?.focus();
  }, [focus, children]);
  if (!children) return null;
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-control border p-4 text-small focus:outline-none focus-visible:ring-1 focus-visible:ring-focus ${
        tone === "error" ? "border-danger text-danger" : "border-line text-positive"
      }`}
    >
      <Icon aria-hidden="true" size={18} strokeWidth={1.5} className="mt-0.5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
