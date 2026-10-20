import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button, IconButton, Input, Select, Skeleton } from "../../../components/common";
import { strings } from "../../strings";
import { useProductImages } from "../../hooks/useProductImages";
import {
  useAddProductVariant,
  useDeleteProductVariant,
  useProductVariants,
  useReorderProductVariants,
  useUpdateProductVariant,
} from "../../hooks/useProductVariants";
import {
  MAX_VARIANTS,
  VARIANT_LIMITS,
  changedVariantColumns,
  emptyVariant,
  toVariantForm,
  toVariantPayload,
  validateVariant,
} from "./variantForm";

const t = strings.admin.productEditor.variants;

function describeFailure(error) {
  const code = error?.code;
  const where = `${error?.details ?? ""} ${error?.message ?? ""}`;
  if (code === "23505" && /sku/i.test(where)) return { field: "sku", message: t.errors.skuTaken };
  if (code === "42501" || code === "PGRST116") return { message: t.errors.forbidden };
  return { message: t.errors.saveFailed };
}

/**
 * One variant's form. `variant` is the saved row, or null for a new one.
 * Saves on its own button (not the product form's), like the images section.
 */
function VariantRow({ variant, index, total, images, busy, onSave, onRemove, onMove, onCancel }) {
  const isNew = !variant;
  const [form, setForm] = useState(() => (variant ? toVariantForm(variant) : emptyVariant()));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const uid = variant?.id ?? "new";
  const id = (key) => `pv-${uid}-${key}`;
  const n = index + 1;

  const saved = variant ? toVariantPayload(toVariantForm(variant)) : null;
  const payloadNow = Object.keys(validateVariant(form)).length === 0 ? toVariantPayload(form) : null;
  const dirty = isNew || (payloadNow ? Object.keys(changedVariantColumns(payloadNow, saved)).length > 0 : JSON.stringify(form) !== JSON.stringify(toVariantForm(variant)));

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    setMessage(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validateVariant(form);
    if (Object.keys(found).length) {
      setErrors(found);
      setMessage({ kind: "error", text: t.messages.fixErrors });
      const [first] = Object.keys(found);
      document.getElementById(id(first))?.focus();
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const values = toVariantPayload(form);
      const outcome = await onSave(variant, values);
      // A new row unmounts after it's added; a saved one stays and confirms.
      if (!isNew) setMessage({ kind: "ok", text: outcome ?? t.messages.saved });
    } catch (error) {
      const { field, message: text } = describeFailure(error);
      if (field) {
        setErrors({ [field]: text });
        document.getElementById(id(field))?.focus();
      }
      setMessage({ kind: "error", text });
    } finally {
      setSaving(false);
    }
  };

  const swatchValid = /^#[0-9a-f]{6}$/i.test(form.swatchHex.trim());
  const imageOptions = [
    { value: "", label: t.fields.imageNone },
    ...images.map((image, i) => ({ value: image.id, label: t.fields.imageOption(i + 1, image.alt) })),
  ];
  const chosenImage = images.find((image) => image.id === form.imageId);
  const disabled = saving || busy;

  return (
    <li className="rounded-card border border-line bg-raised p-4">
      <form noValidate onSubmit={submit} className="flex flex-col gap-4" aria-label={isNew ? t.add : t.position(n, total)}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-small font-semibold text-fg">{isNew ? t.add : t.position(n, total)}</p>
          {!isNew && (
            <div className="flex gap-1">
              <IconButton
                label={t.actions.moveUp(n)}
                variant="ghost"
                disabled={busy || index === 0}
                onClick={() => onMove(index, -1)}
              >
                <ArrowUp aria-hidden="true" size={20} strokeWidth={1.5} />
              </IconButton>
              <IconButton
                label={t.actions.moveDown(n)}
                variant="ghost"
                disabled={busy || index === total - 1}
                onClick={() => onMove(index, 1)}
              >
                <ArrowDown aria-hidden="true" size={20} strokeWidth={1.5} />
              </IconButton>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id={id("name")}
            label={t.fields.name}
            hint={t.fields.nameHint}
            value={form.name}
            maxLength={VARIANT_LIMITS.name}
            error={errors.name}
            onChange={(event) => set("name", event.target.value)}
          />
          <Input
            id={id("sku")}
            label={t.fields.sku}
            hint={t.fields.skuHint}
            optional
            value={form.sku}
            maxLength={VARIANT_LIMITS.sku}
            error={errors.sku}
            onChange={(event) => set("sku", event.target.value)}
          />
          <Input
            id={id("stock")}
            label={t.fields.stock}
            inputMode="numeric"
            value={form.stock}
            error={errors.stock}
            onChange={(event) => set("stock", event.target.value)}
          />
          <Input
            id={id("priceOverride")}
            label={t.fields.price}
            hint={t.fields.priceHint}
            optional
            inputMode="numeric"
            value={form.priceOverride}
            error={errors.priceOverride}
            onChange={(event) => set("priceOverride", event.target.value)}
          />
          <div className="flex items-start gap-3">
            <Input
              id={id("swatchHex")}
              className="flex-1"
              label={t.fields.swatch}
              hint={t.fields.swatchHint}
              optional
              value={form.swatchHex}
              maxLength={7}
              error={errors.swatchHex}
              onChange={(event) => set("swatchHex", event.target.value)}
            />
            <input
              type="color"
              aria-label={t.fields.swatchPicker}
              value={swatchValid ? form.swatchHex.trim().toLowerCase() : "#000000"}
              onChange={(event) => set("swatchHex", event.target.value)}
              className="mt-1.5 h-11 w-11 shrink-0 cursor-pointer rounded-control border border-control bg-raised p-1"
            />
          </div>
          <div className="flex items-start gap-3">
            <Select
              id={id("imageId")}
              className="flex-1"
              label={t.fields.image}
              placeholder={null}
              options={imageOptions}
              value={form.imageId}
              onChange={(event) => set("imageId", event.target.value)}
            />
            {chosenImage && (
              <img src={chosenImage.url} alt="" className="mt-1 h-12 w-10 shrink-0 rounded-control object-cover" />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" loading={saving} disabled={busy || !dirty}>
            {saving ? (isNew ? t.adding : t.actions.saving) : isNew ? t.add : t.actions.save}
          </Button>
          {isNew ? (
            <Button size="sm" variant="ghost" disabled={disabled} onClick={onCancel}>
              {t.actions.cancelNew}
            </Button>
          ) : (
            <>
              {dirty && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => {
                    setForm(toVariantForm(variant));
                    setErrors({});
                    setMessage(null);
                  }}
                >
                  {t.actions.reset}
                </Button>
              )}
              {confirming ? (
                <div role="alertdialog" aria-label={t.actions.removeConfirm} className="flex flex-wrap items-center gap-2">
                  <p className="text-small text-danger">{t.actions.removeConfirm}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={disabled}
                    onClick={() => {
                      setConfirming(false);
                      onRemove(variant);
                    }}
                  >
                    {t.actions.removeYes}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                    {t.actions.removeNo}
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-2"
                  disabled={disabled}
                  aria-label={t.actions.removeLabel(n)}
                  onClick={() => setConfirming(true)}
                >
                  <Trash2 aria-hidden="true" size={16} strokeWidth={1.5} />
                  {t.actions.remove}
                </Button>
              )}
            </>
          )}
        </div>

        <div role="status" aria-live="polite">
          {message?.kind === "ok" && <p className="text-small text-positive">{message.text}</p>}
        </div>
        {message?.kind === "error" && (
          <p role="alert" className="text-small text-danger">
            {message.text}
          </p>
        )}
      </form>
    </li>
  );
}

/** Add, edit, reorder and remove the variants of one saved product. */
export default function ProductVariants({ productId }) {
  const variantsQuery = useProductVariants(productId);
  const imagesQuery = useProductImages(productId);
  const add = useAddProductVariant(productId);
  const update = useUpdateProductVariant();
  const remove = useDeleteProductVariant();
  const reorder = useReorderProductVariants(productId);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState(null); // { kind, text }

  if (!productId) return <p className="text-small text-muted">{t.newProduct}</p>;

  const variants = variantsQuery.data ?? [];
  const images = imagesQuery.data ?? [];
  const busy = add.isPending || update.isPending || remove.isPending || reorder.isPending;

  const saveVariant = async (variant, values) => {
    setNotice(null);
    if (!variant) {
      const sortOrder = variants.reduce((max, row) => Math.max(max, row.sort_order), -1) + 1;
      await add.mutateAsync({ values, sortOrder });
      setAdding(false);
      setNotice({ kind: "ok", text: t.messages.added });
      return undefined;
    }
    const patch = changedVariantColumns(values, toVariantPayload(toVariantForm(variant)));
    if (Object.keys(patch).length) await update.mutateAsync({ id: variant.id, patch });
    return undefined;
  };

  const removeVariant = (variant) => {
    setNotice(null);
    remove.mutate(variant, {
      onSuccess: () => setNotice({ kind: "ok", text: t.messages.removed }),
      onError: () => setNotice({ kind: "error", text: t.errors.removeFailed }),
    });
  };

  const move = (index, delta) => {
    const to = index + delta;
    if (to < 0 || to >= variants.length) return;
    const next = [...variants];
    [next[index], next[to]] = [next[to], next[index]];
    setNotice({ kind: "ok", text: t.messages.moved(to + 1, variants.length) });
    reorder.mutate(next, { onError: () => setNotice({ kind: "error", text: t.errors.reorderFailed }) });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-small text-muted">
        {t.intro} {t.introNote}
      </p>

      <div role="status" aria-live="polite">
        {notice?.kind === "ok" && <p className="text-small text-positive">{notice.text}</p>}
      </div>
      {notice?.kind === "error" && (
        <p role="alert" className="text-small text-danger">
          {notice.text}
        </p>
      )}

      {variantsQuery.isPending ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          <Skeleton className="h-40" />
        </div>
      ) : variantsQuery.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-small text-danger">{t.loadError}</p>
          <Button size="sm" variant="secondary" onClick={() => variantsQuery.refetch()}>
            {t.retry}
          </Button>
        </div>
      ) : (
        <>
          {variants.length === 0 && !adding && <p className="text-small text-muted">{t.empty}</p>}
          {(variants.length > 0 || adding) && (
            <ul className="flex flex-col gap-3">
              {variants.map((variant, index) => (
                <VariantRow
                  key={variant.id}
                  variant={variant}
                  index={index}
                  total={variants.length}
                  images={images}
                  busy={busy}
                  onSave={saveVariant}
                  onRemove={removeVariant}
                  onMove={move}
                />
              ))}
              {adding && (
                <VariantRow
                  key="new"
                  variant={null}
                  index={variants.length}
                  total={variants.length + 1}
                  images={images}
                  busy={remove.isPending || reorder.isPending}
                  onSave={saveVariant}
                  onCancel={() => setAdding(false)}
                />
              )}
            </ul>
          )}
          {!adding &&
            (variants.length >= MAX_VARIANTS ? (
              <p className="text-small text-muted">{t.limit(MAX_VARIANTS)}</p>
            ) : (
              <Button size="sm" variant="secondary" className="gap-2 self-start" disabled={busy} onClick={() => setAdding(true)}>
                <Plus aria-hidden="true" size={16} strokeWidth={1.5} />
                {t.add}
              </Button>
            ))}
        </>
      )}
    </div>
  );
}
