import { Suspense, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { ExternalLink, LogOut, Menu, Moon, Sun } from "lucide-react";
import { Drawer, IconButton, Skeleton } from "../../components/common";
import { strings } from "../strings";
import { selectUnseen, useOrderAlerts } from "../../store/orderAlerts";
import AlertBell from "../components/alerts/AlertBell";
import AlertCount from "../components/alerts/AlertCount";
import NewOrderToasts from "../components/alerts/NewOrderToasts";
import { useAuth } from "../auth/authContext";
import { hasRole } from "../auth/roles";
import { useNewOrderAlerts } from "../hooks/useNewOrderAlerts";
import { BOTTOM_BAR_IDS, NAV_GROUPS } from "./adminNav";
import { useAdminTheme } from "./useAdminTheme";

const t = strings.admin.shell;
const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus";

// Active link: tinted fill plus a gold bar on the left edge that scales in.
const linkClass = ({ isActive }) =>
  `relative flex min-h-11 items-center gap-3 rounded-control px-3 text-small font-semibold transition-colors duration-fast before:absolute before:inset-y-2.5 before:left-0 before:w-0.5 before:rounded-pill before:bg-brand before:transition-transform before:duration-base ${focusRing} ${
    isActive ? "bg-brand/10 text-fg before:scale-y-100" : "text-muted before:scale-y-0 hover:bg-fg/5 hover:text-fg"
  }`;

function GroupedNav({ groups, unseen, onNavigate }) {
  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="px-3 pb-2 text-badge text-muted/80">{t.groups[group.id]}</p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map(({ id, to, end, icon: Icon }) => (
              <li key={id}>
                <NavLink to={to} end={end} onClick={onNavigate} className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <Icon aria-hidden="true" size={20} strokeWidth={1.5} className={isActive ? "text-brand" : ""} />
                      {t.items[id]}
                      {id === "orders" && <AlertCount count={unseen} className="ml-auto" />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("") || "?";

function UserBlock({ profile, signingOut, onSignOut }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-fg/[0.03] p-2 pl-3">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/15 text-small font-semibold text-brand"
      >
        {initialsOf(profile.name)}
      </span>
      <p className="min-w-0 flex-1 text-small leading-tight text-muted">
        <span className="block truncate font-semibold text-fg">{profile.name}</span>
        {strings.admin.roles[profile.role]}
      </p>
      <IconButton label={strings.admin.signOut} variant="ghost" onClick={onSignOut} disabled={signingOut}>
        <LogOut aria-hidden="true" size={18} strokeWidth={1.5} />
      </IconButton>
    </div>
  );
}

function Wordmark({ className = "" }) {
  return (
    <p className={`flex items-center gap-2 ${className}`}>
      <span className="font-logo text-small tracking-wordmark text-fg">WRISTORY</span>
      <span className="rounded-pill border border-line px-2 py-0.5 text-badge text-muted">{t.nav}</span>
    </p>
  );
}

// Shown while a page's chunk loads (pages are lazy, see AdminApp): a page-shaped skeleton.
function PageLoading() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">{strings.admin.loadingPage}</span>
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

// Section name for the top bar: the nav item whose path is the longest prefix of the URL.
function sectionOf(groups, pathname) {
  const items = groups.flatMap((group) => group.items);
  const match = items
    .filter(({ to, end }) => (end ? pathname === to || pathname === `${to}/` : pathname.startsWith(to)))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return match ? t.items[match.id] : null;
}

function AdminLayout() {
  const { profile, signOut } = useAuth();
  const { pathname } = useLocation();
  const { theme, toggle } = useAdminTheme();
  const [signingOut, setSigningOut] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const alertStatus = useNewOrderAlerts();
  const unseen = useOrderAlerts(selectUnseen);

  const groups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => hasRole(profile.role, item.minRole)),
      })).filter((group) => group.items.length > 0),
    [profile.role],
  );
  const bottomItems = useMemo(
    () =>
      BOTTOM_BAR_IDS.map((id) => groups.flatMap((g) => g.items).find((item) => item.id === id)).filter(Boolean),
    [groups],
  );

  // Close the sheet on navigation and send focus to the new page.
  useEffect(() => {
    setMoreOpen(false);
    document.getElementById("admin-main")?.focus({ preventScroll: true });
  }, [pathname]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      // The local session is cleared even when the server call fails.
      setSigningOut(false);
    }
  }

  const light = theme === "light";
  const section = sectionOf(groups, pathname);
  const ThemeIcon = light ? Moon : Sun;
  const themeLabel = light ? t.theme.toDark : t.theme.toLight;

  return (
    <div className={`admin-ui ${light ? "section-ivory" : "bg-obsidian text-fg"} min-h-dvh lg:flex`}>
      <title>{`${unseen > 0 ? `(${unseen}) ` : ""}Admin | WRISTORY`}</title>
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-control focus:bg-raised focus:px-4 focus:py-3 focus:text-small focus:text-fg"
      >
        {t.skip}
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden w-admin-nav shrink-0 border-r border-line bg-surface lg:block">
        {/* Only the nav scrolls on short screens; the wordmark and user block stay put. */}
        <div className="sticky top-0 flex h-dvh flex-col gap-3 px-3 pb-3 pt-4">
          <Wordmark className="min-h-11 px-3" />
          <nav aria-label={t.nav} className="-mx-3 min-h-0 flex-1 overflow-y-auto px-3 [scrollbar-width:thin]">
            <GroupedNav groups={groups} unseen={unseen} />
          </nav>
          <UserBlock profile={profile} signingOut={signingOut} onSignOut={handleSignOut} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-line bg-surface/85 px-gutter py-2 backdrop-blur-md">
          <Wordmark className="lg:hidden" />
          {section && (
            <p className="hidden min-w-0 items-center gap-2 text-small lg:flex">
              <span className="text-muted">{t.nav}</span>
              <span aria-hidden="true" className="text-muted">/</span>
              <span className="truncate font-semibold text-fg">{section}</span>
            </p>
          )}
          <div className="ml-auto flex items-center gap-1">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className={`mr-1 hidden min-h-11 items-center gap-2 rounded-control border border-line px-3 text-small font-semibold text-muted transition-colors duration-fast hover:border-control hover:text-fg sm:inline-flex ${focusRing}`}
            >
              <ExternalLink aria-hidden="true" size={18} strokeWidth={1.5} />
              {t.viewStore}
            </a>
            <AlertBell status={alertStatus} />
            <IconButton label={themeLabel} variant="ghost" onClick={toggle}>
              <ThemeIcon aria-hidden="true" size={20} strokeWidth={1.5} />
            </IconButton>
          </div>
        </header>

        <main
          id="admin-main"
          tabIndex={-1}
          className="flex-1 px-gutter pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 outline-none lg:pb-12 lg:pt-8"
        >
          {/* Keyed by path so each page fades up on arrival (transform/opacity only). */}
          <div key={pathname} className="mx-auto w-full max-w-admin animate-route-enter">
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      {/* Mobile bottom bar */}
      <nav
        aria-label={t.primaryNav}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="flex">
          {bottomItems.map(({ id, to, end, icon: Icon }) => (
            <li key={id} className="min-w-0 flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `group flex min-h-14 flex-col items-center justify-center gap-0.5 px-0.5 text-badge normal-case tracking-normal transition-colors duration-fast ${focusRing} ${
                    isActive ? "is-active text-brand" : "text-muted hover:text-fg"
                  }`
                }
              >
                <span className="relative flex h-7 w-12 items-center justify-center rounded-pill transition-colors duration-fast group-[.is-active]:bg-brand/15">
                  <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
                  {id === "orders" && <AlertCount count={unseen} className="absolute -right-1 -top-1.5" />}
                </span>
                <span className="max-w-full truncate">{t.items[id]}</span>
              </NavLink>
            </li>
          ))}
          <li className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-0.5 text-badge normal-case tracking-normal text-muted transition-colors duration-fast hover:text-fg ${focusRing}`}
            >
              <span className="flex h-7 w-12 items-center justify-center">
                <Menu aria-hidden="true" size={20} strokeWidth={1.5} />
              </span>
              {t.more}
            </button>
          </li>
        </ul>
      </nav>

      <Drawer
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        title={t.moreTitle}
        side="left"
        tone={light ? "ivory" : "dark"}
        footer={<UserBlock profile={profile} signingOut={signingOut} onSignOut={handleSignOut} />}
      >
        <nav aria-label={t.nav}>
          <GroupedNav groups={groups} unseen={unseen} onNavigate={() => setMoreOpen(false)} />
        </nav>
      </Drawer>

      <NewOrderToasts />
    </div>
  );
}

export default AdminLayout;
