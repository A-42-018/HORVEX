import { useId, useState } from "react";
import { Check } from "lucide-react";
import { Button, Container, Input, Reveal } from "../common";
import { useHomeSections, useSubscribe } from "../../hooks/useContent";
import { EVENTS, track } from "../../lib/analytics";
import { normalizePhone } from "../../lib/format";
import { responsiveImage } from "../../lib/images";
import { strings } from "../../lib/strings";

// Join the Circle (roadmap §6.1 #14): lifestyle photo under a dark overlay and
// one field that takes a WhatsApp number or an email. Saves to `subscribers`
// (anon insert only). Copy and image come from `home_sections.newsletter`
// (title/subtitle, config.image), falling back to strings.circle.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IMAGE_WIDTHS = [640, 960, 1280, 1920, 2560];

/** → { phone } | { email } | null */
function parseContact(raw) {
  const value = raw.trim();
  if (!value) return null;
  if (value.includes("@")) {
    return EMAIL_RE.test(value) && value.length <= 254 ? { email: value.toLowerCase() } : null;
  }
  const phone = normalizePhone(value);
  return phone ? { phone } : null;
}

function Newsletter() {
  const uid = useId();
  const { data } = useHomeSections();
  const section = data?.find((s) => s.key === "newsletter");
  const image = section?.config?.image ? responsiveImage(section.config.image, { aspect: [16, 9], widths: IMAGE_WIDTHS }) : null;
  const { mutate, isPending, isSuccess } = useSubscribe();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (isPending) return;
    const contact = parseContact(value);
    if (!contact) {
      setError(strings.circle.errors.invalid);
      return;
    }
    setError("");
    mutate(
      { ...contact, source: "home_circle" },
      {
        onSuccess: () => track(EVENTS.generateLead, { method: contact.phone ? "whatsapp" : "email" }),
        onError: () => setError(strings.circle.errors.failed),
      },
    );
  }

  return (
    <section
      aria-labelledby={`${uid}-title`}
      className="section-dark relative isolate flex items-center overflow-hidden bg-obsidian py-section-sm lg:min-h-[36rem] lg:py-section"
    >
      {image?.src && (
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={image.srcSet ? "100vw" : undefined}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-obsidian/70" />

      <Container>
        <Reveal className="mx-auto flex max-w-xl flex-col items-center gap-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <p className="text-eyebrow">{strings.circle.eyebrow}</p>
            <h2 id={`${uid}-title`} className="text-h2 text-fg">
              {section?.title && section.title !== strings.circle.eyebrow ? section.title : strings.circle.title}
            </h2>
            <p className="text-body text-fg/80">{section?.subtitle || strings.circle.subtitle}</p>
          </div>

          {isSuccess ? (
            <p
              role="status"
              className="flex w-full items-center justify-center gap-2 rounded-control border border-brand px-4 py-4 text-body text-brand"
            >
              <Check aria-hidden="true" size={20} strokeWidth={1.5} className="shrink-0" />
              {strings.circle.success}
            </p>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-start">
              <Input
                label={strings.circle.label}
                name="contact"
                type="text"
                inputMode="email"
                autoComplete="email tel"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError("");
                }}
                error={error}
                className="flex-1"
              />
              <Button type="submit" size="lg" loading={isPending} className="shrink-0 sm:h-14">
                {isPending ? strings.circle.submitting : strings.circle.submit}
              </Button>
            </form>
          )}

          <p className="text-small text-fg/70">{strings.circle.note}</p>
        </Reveal>
      </Container>
    </section>
  );
}

export default Newsletter;
