import { useId, useRef, useState } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { LogOut, Package } from "lucide-react";
import { Button, Input, Skeleton } from "../../components/common";
import { AuthShell, FormNotice } from "../../components/account/AuthParts";
import { useCustomerSession, useMyOrders, useMyProfile, useSaveProfile, useSignOut } from "../../hooks/useAccount";
import { takeLanding } from "../../services/customerAuth";
import { formatDate, formatPhone, formatTaka, normalizePhone } from "../../lib/format";
import { strings } from "../../lib/strings";

const t = strings.account;
const statusLabel = (status) => (strings.trackOrder.steps[status] ?? strings.trackOrder[status])?.title ?? status;

function ProfileForm({ user, profile }) {
  const save = useSaveProfile();
  const [values, setValues] = useState(() => ({
    name: profile?.name ?? user.user_metadata?.name ?? "",
    phone: profile?.phone ? formatPhone(profile.phone) : "",
  }));
  const [errors, setErrors] = useState({});
  const nameRef = useRef(null);
  const phoneRef = useRef(null);

  const set = (key) => (event) => {
    save.reset();
    setValues((v) => ({ ...v, [key]: event.target.value }));
  };

  const submit = (event) => {
    event.preventDefault();
    const name = values.name.trim();
    const phone = values.phone.trim() ? normalizePhone(values.phone) : null;
    const next = {};
    if (name.length < 2 || name.length > 80) next.name = t.errors.name;
    if (values.phone.trim() && !phone) next.phone = strings.form.invalidPhone;
    setErrors(next);
    if (next.name) return nameRef.current?.focus();
    if (next.phone) return phoneRef.current?.focus();
    save.mutate({ userId: user.id, name, phone });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Input ref={nameRef} label={t.fields.name} autoComplete="name" maxLength={80} error={errors.name} value={values.name} onChange={set("name")} />
      <Input
        ref={phoneRef}
        label={t.fields.phone}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        optional
        error={errors.phone}
        value={values.phone}
        onChange={set("phone")}
      />
      <div aria-live="polite">
        <FormNotice>{save.isError ? t.home.saveFailed : null}</FormNotice>
        <FormNotice tone="success">{save.isSuccess ? t.home.saved : null}</FormNotice>
      </div>
      <Button type="submit" loading={save.isPending}>
        {t.home.save}
      </Button>
    </form>
  );
}

function Profile({ user }) {
  const profile = useMyProfile(user.id);
  if (profile.isPending) return <Skeleton className="h-56 w-full" />;
  if (profile.isError) {
    return (
      <div className="space-y-4">
        <FormNotice focus={false}>{t.home.profileFailed}</FormNotice>
        <Button variant="secondary" onClick={() => profile.refetch()}>
          {t.home.retry}
        </Button>
      </div>
    );
  }
  return <ProfileForm user={user} profile={profile.data} />;
}

function Orders({ userId }) {
  const orders = useMyOrders(userId);
  if (orders.isPending) return <Skeleton className="h-40 w-full" />;
  if (orders.isError) {
    return (
      <div className="space-y-4">
        <p className="text-body text-danger">{t.home.ordersFailed}</p>
        <Button variant="secondary" onClick={() => orders.refetch()}>
          {t.home.retry}
        </Button>
      </div>
    );
  }
  if (!orders.data.length) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Package size={40} strokeWidth={1} aria-hidden="true" className="text-gold" />
        <p className="text-body text-muted">{t.home.ordersEmpty}</p>
        <Button as={Link} to="/shop" variant="link">
          {t.home.shop}
        </Button>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {orders.data.map((o) => (
        <li key={o.order_number} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-4">
          <div className="min-w-0 flex-1">
            <p className="font-display text-h4 text-brand">{o.order_number}</p>
            <p className="text-small text-muted">
              {[formatDate(o.created_at), t.home.items(o.item_count), statusLabel(o.status)].join(" · ")}
            </p>
          </div>
          <p className="text-body tabular-nums text-fg">{formatTaka(o.total)}</p>
          <Button
            as={Link}
            to={`/track-order?order=${encodeURIComponent(o.order_number)}`}
            variant="secondary"
            size="sm"
            aria-label={t.home.trackLabel(o.order_number)}
          >
            {t.home.track}
          </Button>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, hint, children }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="rounded-card border border-line bg-surface p-5 sm:p-6">
      <h2 id={id} className="text-h3 text-fg">
        {title}
      </h2>
      {hint && <p className="mt-1 text-small text-muted">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function AccountHome() {
  const { session, event } = useCustomerSession();
  const { state } = useLocation();
  const [landing] = useState(takeLanding);
  const signOut = useSignOut();
  const profile = useMyProfile(session?.user.id);

  if (session === undefined) {
    return (
      <AuthShell title={t.eyebrow} wide>
        <Skeleton className="h-72 w-full" />
      </AuthShell>
    );
  }
  if (!session) {
    const notice = event === "SIGNED_OUT" ? "signedOut" : undefined;
    return <Navigate to="/account/login" replace state={{ from: "/account", notice, linkError: landing.errorCode }} />;
  }

  const { user } = session;
  const name = profile.data?.name ?? user.user_metadata?.name;
  const notice = landing.type === "signup" ? t.home.confirmed : state?.notice ? t.login[state.notice] : null;

  return (
    <AuthShell title={t.home.title(name?.split(" ")[0])} subtitle={t.home.signedInAs(user.email)} wide>
      <div className="space-y-6">
        <FormNotice tone="success">{notice}</FormNotice>
        <Section title={t.home.ordersTitle} hint={t.home.ordersHint}>
          <Orders userId={user.id} />
        </Section>
        <Section title={t.home.profileTitle} hint={t.home.profileHint}>
          <Profile user={user} />
        </Section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button as={Link} to="/account/reset-password" variant="link">
            {t.home.changePassword}
          </Button>
          <div className="flex flex-col gap-2 sm:items-end">
            <FormNotice>{signOut.isError ? t.authErrors.generic : null}</FormNotice>
            <Button variant="secondary" loading={signOut.isPending} onClick={() => signOut.mutate()}>
              <LogOut aria-hidden="true" size={18} strokeWidth={1.5} />
              {t.home.signOut}
            </Button>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}

export default AccountHome;
