import { useState } from "react";
import { Button, Card, Input, Skeleton } from "../../../components/common";
import { strings } from "../../../lib/strings";
import { useFreeDeliveryThreshold, useSaveFreeDeliveryThreshold } from "../../hooks/useSettingsAdmin";
import { parseThreshold } from "../settings/settingsForm";

const t = strings.admin.settings.threshold;

function ThresholdForm({ amount }) {
  const save = useSaveFreeDeliveryThreshold();
  const [value, setValue] = useState(amount == null ? "" : String(amount));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const parsed = parseThreshold(value);
    if (parsed.error) return setError(parsed.error);
    if (parsed.value === amount) return setNotice(t.unchanged);
    return save.mutate(parsed.value, {
      onSuccess: () => setNotice(t.saved(parsed.value)),
      onError: (err) => setFailure(err?.code === "42501" ? t.forbidden : t.failed),
    });
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <Input
        id="threshold-amount"
        label={t.label}
        inputMode="numeric"
        hint={t.hint}
        className="sm:w-64"
        value={value}
        error={error}
        onChange={(event) => {
          setValue(event.target.value);
          setError("");
          setNotice("");
          setFailure("");
        }}
      />
      <Button type="submit" loading={save.isPending} className="sm:mt-1">
        {save.isPending ? t.saving : t.save}
      </Button>
      <p role="status" className="text-small text-positive sm:mt-4">
        {notice}
      </p>
      {failure && (
        <p role="alert" className="text-small text-danger sm:mt-4">
          {failure}
        </p>
      )}
    </form>
  );
}

/** Free-delivery amount (site_settings, saved through a manager-level function). */
export default function ThresholdCard() {
  const { data, isPending, isError, refetch } = useFreeDeliveryThreshold();
  return (
    <Card as="section" aria-labelledby="threshold-title" className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="threshold-title" className="text-h3 text-fg">
          {t.title}
        </h2>
        <p className="max-w-prose text-small text-muted">{t.intro}</p>
      </div>
      {isPending && <Skeleton className="h-14 sm:w-64" />}
      {isError && data === undefined && (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-small text-danger">{t.error}</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {t.retry}
          </Button>
        </div>
      )}
      {data !== undefined && <ThresholdForm amount={data} />}
    </Card>
  );
}
