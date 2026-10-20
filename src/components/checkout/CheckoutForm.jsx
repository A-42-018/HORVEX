import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "../common";
import AreaSelector from "./AreaSelector";
import { DISTRICTS, findDistrict, isOutsideDhaka } from "../../lib/districts";
import { createCheckoutSchema } from "../../lib/validators";
import { strings } from "../../lib/strings";

const t = strings.checkout;
const DISTRICT_LIST_ID = "checkout-districts";

/**
 * Guest COD form (roadmap §6.7). Collects and validates; the parent decides
 * what a valid submit does. `onSubmit` receives trimmed values with `district`
 * already resolved ("Dhaka" for zones that don't ask for one).
 */
function CheckoutForm({
  id,
  zones,
  initialZoneId,
  onSubmit,
  onZoneChange,
  confirmLabel = t.confirm,
  confirmDisabled = false,
  submitting = false,
  children,
}) {
  const zoneById = useMemo(() => new Map(zones.map((z) => [String(z.id), z])), [zones]);
  const needsDistrict = (zoneId) => isOutsideDhaka(zoneById.get(zoneId));
  const schema = useMemo(() => createCheckoutSchema((id) => isOutsideDhaka(zoneById.get(id))), [zoneById]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      zoneId: zoneById.has(initialZoneId) ? initialZoneId : "",
      district: "",
      email: "",
      note: "",
      website: "",
    },
  });

  const zoneId = watch("zoneId");
  const outside = needsDistrict(zoneId);

  // Zones can arrive after the first render, or the prefilled zone may be gone:
  // fall back to the first zone so the area is never left blank.
  useEffect(() => {
    if (!zoneById.has(zoneId) && zones.length > 0) setValue("zoneId", String(zones[0].id));
  }, [zoneById, zones, zoneId, setValue]);

  // Lets the page quote the zone the shopper has picked right now.
  useEffect(() => {
    if (zoneById.has(zoneId)) onZoneChange?.(zoneId);
  }, [zoneById, zoneId, onZoneChange]);

  const submit = handleSubmit((values) =>
    onSubmit({ ...values, district: outside ? findDistrict(values.district) : "Dhaka" }),
  );

  return (
    <form id={id} onSubmit={submit} noValidate className="space-y-6">
      <Input
        label={t.fields.name}
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Input
        label={t.fields.phone}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        hint={t.fields.phoneHint}
        error={errors.phone?.message}
        {...register("phone")}
      />
      <Input
        label={t.fields.address}
        multiline
        autoComplete="street-address"
        hint={t.fields.addressHint}
        error={errors.address?.message}
        {...register("address")}
      />

      <Controller
        name="zoneId"
        control={control}
        render={({ field }) => (
          <AreaSelector zones={zones} value={field.value} onChange={field.onChange} error={errors.zoneId?.message} />
        )}
      />

      {outside && (
        <>
          <Input
            label={t.fields.district}
            list={DISTRICT_LIST_ID}
            autoComplete="off"
            autoCapitalize="words"
            hint={t.fields.districtHint}
            error={errors.district?.message}
            {...register("district")}
          />
          <datalist id={DISTRICT_LIST_ID}>
            {DISTRICTS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </>
      )}

      <Input
        label={t.fields.email}
        type="email"
        inputMode="email"
        autoComplete="email"
        optional
        hint={t.fields.emailHint}
        error={errors.email?.message}
        {...register("email")}
      />
      <Input label={t.fields.note} multiline optional error={errors.note?.message} {...register("note")} />

      {/* Honeypot (roadmap §6.7): off-screen, skipped by keyboards and screen readers. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>

      <div className="rounded-control border border-line bg-surface p-4">
        <p className="text-body text-fg">{t.payment.title}</p>
        <p className="mt-1 text-small text-muted">{t.payment.body}</p>
      </div>

      {children}

      <div className="grid gap-3">
        {/* Below lg the page's sticky bar submits this form instead. */}
        <div className="hidden lg:block">
          <Button type="submit" size="lg" loading={submitting} disabled={confirmDisabled} className="w-full">
            {confirmLabel}
          </Button>
        </div>
        <p className="text-center text-small text-muted">{t.confirmNote}</p>
      </div>
    </form>
  );
}

export default CheckoutForm;
