import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck } from "lucide-react";
import { Button, Input } from "../common";
import { useSendContactMessage } from "../../hooks/useContent";
import { normalizePhone } from "../../lib/format";
import { contactSchema } from "../../lib/validators";
import { strings } from "../../lib/strings";

const t = strings.contact;
const EMPTY = { name: "", phone: "", email: "", message: "", website: "" };

// Saves to contact_messages (anon insert, no read-back). Shown in admin later.
function ContactForm() {
  const { mutate, isPending, isError, reset: resetMutation } = useSendContactMessage();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(contactSchema), mode: "onTouched", defaultValues: EMPTY });

  const submit = handleSubmit((values) => {
    // Bots fill the hidden field: pretend success, send nothing.
    if (values.website) {
      setSent(true);
      return;
    }
    mutate(
      {
        name: values.name,
        phone: values.phone ? normalizePhone(values.phone) : null,
        email: values.email || null,
        message: values.message,
      },
      {
        onSuccess: () => {
          reset(EMPTY);
          setSent(true);
        },
      },
    );
  });

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-center gap-4 py-6 text-center">
        <CircleCheck size={40} strokeWidth={1} aria-hidden="true" className="text-gold" />
        <h3 className="text-h3 text-fg">{t.successTitle}</h3>
        <p className="text-body text-muted">{t.success}</p>
        <Button
          variant="link"
          onClick={() => {
            resetMutation();
            setSent(false);
          }}
        >
          {t.another}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Input label={t.fields.name} autoComplete="name" error={errors.name?.message} {...register("name")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t.fields.phone}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          optional
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input
          label={t.fields.email}
          type="email"
          autoComplete="email"
          optional
          error={errors.email?.message}
          {...register("email")}
        />
      </div>
      <p className="text-small text-muted">{t.formHint}</p>
      <Input label={t.fields.message} multiline maxLength={2000} error={errors.message?.message} {...register("message")} />

      {/* Honeypot: off-screen, not focusable, not announced. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      {isError && (
        <p role="alert" className="text-body text-danger">
          {t.errors.failed}
        </p>
      )}
      <Button type="submit" size="lg" loading={isPending} className="w-full sm:w-auto">
        {t.submit}
      </Button>
    </form>
  );
}

export default ContactForm;
