import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { ArrowLeft, Copy, ExternalLink } from "lucide-react";
import { Button, Skeleton } from "../../components/common";
import { strings } from "../../lib/strings";
import { slugify } from "../../lib/slug";
import { MainFields, MediaFields, SideFields } from "../components/products/ProductFields";
import {
  changedColumns,
  costOf,
  emptyForm,
  fieldId,
  isDirty,
  toForm,
  toPayload,
  validateForm,
} from "../components/products/productForm";
import {
  useAdminCategories,
  useAdminProduct,
  useDuplicateProduct,
  useProductCrud,
  useSaveProductCost,
} from "../hooks/useAdminProducts";

const t = strings.admin.productEditor;

function EditorSkeleton() {
  return (
    <div aria-busy="true" aria-label={strings.admin.checking} className="flex flex-col gap-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
  );
}

// Maps a failed save to a field error or a general message.
function describeFailure(error) {
  const code = error?.code;
  const where = `${error?.details ?? ""} ${error?.message ?? ""}`;
  if (code === "23505" && /slug/i.test(where)) return { field: "slug", message: t.messages.slugTaken };
  if (code === "23505" && /sku/i.test(where)) return { field: "sku", message: t.messages.skuTaken };
  if (code === "42501" || code === "PGRST116") return { message: t.messages.forbidden };
  return { message: t.messages.saveFailed };
}

function EditorForm({ productId, loaded }) {
  const isNew = !productId;
  const navigate = useNavigate();
  const location = useLocation();
  const categoriesQuery = useAdminCategories();
  const crud = useProductCrud();
  const saveCost = useSaveProductCost();
  const duplicate = useDuplicateProduct();

  const initialForm = useMemo(() => (loaded ? toForm(loaded.product, loaded.costPrice) : emptyForm()), [loaded]);
  const [form, setForm] = useState(initialForm);
  // What's saved on the server (as far as this form knows): dirty checks and diffs compare against it.
  const [base, setBase] = useState({
    form: initialForm,
    payload: loaded ? toPayload(initialForm, loaded.product.specs) : null,
    specs: loaded?.product.specs ?? {},
    status: loaded?.product.status ?? null,
    slug: loaded?.product.slug ?? "",
  });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(
    location.state?.notice === "created" ? { kind: "ok", text: t.messages.created } : null,
  );
  const slugEdited = useRef(!isNew);

  const dirty = isDirty(form, base.form);
  const saving = crud.create.isPending || crud.update.isPending || saveCost.isPending;

  // Warn before a tab close or reload throws away unsaved edits.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const categories = useMemo(() => {
    const rows = categoriesQuery.data ?? [];
    const options = rows.map((row) => ({
      value: row.id,
      label: row.is_visible === false ? t.fields.hiddenCategory(row.name) : row.name,
    }));
    // Keep a category the list didn't return (e.g. still loading) selectable.
    if (form.categoryId && !options.some((option) => option.value === form.categoryId)) {
      options.push({ value: form.categoryId, label: "…" });
    }
    return options;
  }, [categoriesQuery.data, form.categoryId]);

  const clearError = (key) => setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  const set = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // A new product's slug follows its name until the slug is edited by hand.
      if (key === "name" && !slugEdited.current) next.slug = slugify(value);
      return next;
    });
    clearError(key);
    if (key === "name" && !slugEdited.current) clearError("slug");
    setBanner(null);
  };
  const setSpec = (key, value) => {
    setForm((prev) => ({ ...prev, specs: { ...prev.specs, [key]: value } }));
    clearError(`specs.${key}`);
    setBanner(null);
  };
  const onSlugEdit = (value) => {
    slugEdited.current = true;
    set("slug", value.toLowerCase());
  };
  const toggleBadge = (badge) =>
    setForm((prev) => ({
      ...prev,
      badges: prev.badges.includes(badge) ? prev.badges.filter((b) => b !== badge) : [...prev.badges, badge],
    }));

  const focusFirstError = (found) => {
    const [first] = Object.keys(found);
    if (first) document.getElementById(fieldId(first))?.focus();
  };

  const save = async (statusOverride) => {
    const next = { ...form, status: statusOverride ?? form.status };
    const found = validateForm(next);
    const count = Object.keys(found).length;
    if (count) {
      setErrors(found);
      setBanner({ kind: "error", text: t.messages.fixErrors(count) });
      focusFirstError(found);
      return;
    }

    const payload = toPayload(next, base.specs);
    const cost = costOf(next);
    const baseCost = costOf(base.form);
    setErrors({});
    setBanner(null);

    let id = productId;
    try {
      if (isNew) {
        id = (await crud.create.mutateAsync(payload)).id;
      } else {
        const patch = changedColumns(payload, base.payload);
        if (Object.keys(patch).length === 0 && cost === baseCost) {
          setForm(next);
          setBanner({ kind: "ok", text: t.messages.noChanges });
          return;
        }
        if (Object.keys(patch).length) await crud.update.mutateAsync({ id, patch });
      }
    } catch (error) {
      const { field, message } = describeFailure(error);
      if (field) {
        setErrors({ [field]: message });
        focusFirstError({ [field]: message });
      }
      setBanner({ kind: "error", text: message });
      return;
    }

    // The product row is saved; the cost is a second write (admin-only table).
    const savedForm = { ...next };
    let costFailed = false;
    if (isNew ? cost != null : cost !== baseCost) {
      try {
        await saveCost.mutateAsync({ productId: id, costPrice: cost });
      } catch {
        costFailed = true;
        savedForm.costPrice = base.form.costPrice;
      }
    }

    const wasStatus = base.status;
    setForm(next);
    setBase({ form: savedForm, payload, specs: payload.specs, status: payload.status, slug: payload.slug });

    if (isNew) {
      navigate(`/admin/products/${id}`, { replace: true, state: { notice: "created" } });
      return;
    }
    let text = t.messages.saved;
    if (payload.status === "active" && wasStatus !== "active") text = t.messages.published;
    else if (payload.status !== "active" && wasStatus === "active") text = t.messages.unpublished;
    setBanner(costFailed ? { kind: "error", text: t.messages.costFailed } : { kind: "ok", text });
  };

  const onDuplicate = () => {
    setBanner(null);
    duplicate.mutate(productId, {
      onSuccess: ({ copy }) =>
        navigate(`/admin/products/${copy.id}`, { state: { notice: "duplicated", name: copy.name } }),
      onError: () => setBanner({ kind: "error", text: t.messages.duplicateFailed }),
    });
  };

  const title = isNew ? t.titleNew : form.name.trim() || t.titleEdit;
  const noticeFromNav = location.state?.notice === "duplicated" ? t.messages.duplicated(location.state.name) : null;

  return (
    <div className="flex flex-col gap-6">
      <title>{`${isNew ? t.titleNew : t.titleEdit} | WRISTORY Admin`}</title>

      <div className="flex flex-col gap-3">
        <Link
          to="/admin/products"
          className="inline-flex min-h-11 items-center gap-2 self-start text-small text-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"
        >
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={1.5} />
          {t.back}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-h3 text-fg">{title}</h1>
          {!isNew && (
            <div className="flex flex-wrap items-center gap-3">
              {base.status === "active" && (
                <Button
                  as="a"
                  href={`/product/${base.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <ExternalLink aria-hidden="true" size={16} strokeWidth={1.5} />
                  {t.viewOnStore}
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={onDuplicate}
                loading={duplicate.isPending}
                disabled={dirty || saving}
                aria-describedby={dirty ? "pe-duplicate-note" : undefined}
              >
                {!duplicate.isPending && <Copy aria-hidden="true" size={16} strokeWidth={1.5} />}
                {duplicate.isPending ? t.actions.duplicating : t.actions.duplicate}
              </Button>
            </div>
          )}
        </div>
        {dirty && !isNew && (
          <p id="pe-duplicate-note" className="text-small text-muted">
            {t.actions.duplicateDirty}
          </p>
        )}
      </div>

      <div role="status" aria-live="polite">
        {(banner?.kind === "ok" || (!banner && noticeFromNav && !dirty)) && (
          <p className="text-small text-positive">{banner?.text ?? noticeFromNav}</p>
        )}
      </div>
      {banner?.kind === "error" && (
        <p role="alert" className="text-small text-danger">
          {banner.text}
        </p>
      )}

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        className="flex flex-col gap-6"
      >
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-6">
            <MainFields
              form={form}
              errors={errors}
              set={set}
              setSpec={setSpec}
              isNew={isNew}
              categories={categories}
              variantCount={loaded?.variantCount ?? 0}
              onSlugEdit={onSlugEdit}
            />
          </div>
          <div className="flex flex-col gap-6">
            <SideFields form={form} errors={errors} set={set} toggleBadge={toggleBadge} />
          </div>
        </div>

        {/* Sits above the mobile bottom bar (3.5rem + home-bar inset). */}
        <div className="sticky bottom-[calc(3.5625rem+env(safe-area-inset-bottom))] z-20 -mx-gutter flex flex-wrap items-center gap-3 border-t border-line bg-surface px-gutter py-3 lg:bottom-0">
          <Button type="submit" size="sm" loading={saving} disabled={!isNew && !dirty}>
            {saving ? t.actions.saving : isNew ? t.actions.create : t.actions.save}
          </Button>
          {form.status !== "active" && (
            <Button variant="secondary" size="sm" disabled={saving} onClick={() => save("active")}>
              {isNew ? t.actions.createPublish : t.actions.publishNow}
            </Button>
          )}
          {!isNew && base.status === "active" && (
            <Button variant="ghost" size="sm" disabled={saving} onClick={() => save("draft")}>
              {t.actions.unpublish}
            </Button>
          )}
          {dirty && <span className="text-small text-muted">{t.messages.unsaved}</span>}
        </div>
      </form>
      <MediaFields isNew={isNew} productId={productId} />
    </div>
  );
}

function ProductEditor() {
  const { productId } = useParams();
  const { data, isPending, isError, refetch } = useAdminProduct(productId);

  if (!productId) return <EditorForm key="new" productId={null} loaded={null} />;
  if (isPending) return <EditorSkeleton />;

  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-small text-danger">{t.loadError}</p>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          {t.retry}
        </Button>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex flex-col items-start gap-3">
        <h1 className="text-h3 text-fg">{t.notFound.title}</h1>
        <p className="text-small text-muted">{t.notFound.body}</p>
        <Button as={Link} to="/admin/products" variant="secondary" size="sm">
          {t.back}
        </Button>
      </div>
    );
  }
  // Keyed by id only: a background refetch must never overwrite unsaved edits.
  return <EditorForm key={productId} productId={productId} loaded={data} />;
}

export default ProductEditor;
