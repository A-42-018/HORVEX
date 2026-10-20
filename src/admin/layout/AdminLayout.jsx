import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { ExternalLink, LogOut, Menu, Moon, Sun } from "lucide-react";
import { Drawer, IconButton } from "../../components/common";
import { strings } from "../../lib/strings";
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

const linkClass = ({ isActive }) =>
  `flex min-h-11 items-center gap-3 rounded-control px-3 text-small font-semibold transition-colors duration-fast ${focusRing} ${
    isActive ? "bg-fg/10 text-brand" : "text-muted hover:bg-fg/5 hover:text-fg"
  }`;

function GroupedNav({ groups, unseen, onNavigate }) {
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.id}>
          <p className="px-3 pb-2 text-badge text-muted">{t.groups[group.id]}</p>
          <ul className="flex flex-col gap-1">
            {group.items.map(({ id, to, end, icon: Icon }) => (
              <li key={id}>
                <NavLink to={to} end={end} onClick={onNavigate} className={linkClass}>
                  <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
                  {t.items[id]}
                  {id === "orders" && <AlertCount count={unseen} className="ml-auto" />}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function UserBlock({ profile, signingOut, onSignOut }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="min-w-0 text-small text-muted">
        <span className="block truncate font-semibold text-fg">{profile.name}</span>
        {strings.admin.roles[profile.role]}
      </p>
      <button
        type="button"
        onClick={onSignOut}
        disabled={signingOut}
        className={`inline-flex min-h-11 items-center gap-3 rounded-control px-3 text-small font-semibold text-fg hover:bg-fg/5 disabled:opacity-50 ${focusRing}`}
      >
        <LogOut aria-hidden="true" size={20} strokeWidth={1.5} />
        {strings.admin.signOut}
      </button>
    </div>
  );
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
  const ThemeIcon = light ? Moon : Sun;
  const themeLabel = light ? t.theme.toDark : t.theme.toLight;

  return (
    <div className={`${light ? "section-ivory" : "bg-obsidian text-fg"} min-h-dvh lg:flex`}>
      <title>{`${unseen > 0 ? `(${unseen}) ` : ""}Admin | WRISTORY`}</title>
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-control focus:bg-raised focus:px-4 focus:py-3 focus:text-small focus:text-fg"
      >
        {t.skip}
      </a>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block">
        <div className="sticky top-0 flex h-dvh flex-col gap-6 overflow-y-auto px-3 py-6">
          <p className="px-3 font-logo text-small tracking-wordmark text-fg">WRISTORY</p>
          <nav aria-label={t.nav} className="flex-1">
            <GroupedNav groups={groups} unseen={unseen} />
          </nav>
          <UserBlock profile={profile} signingOut={signingOut} onSignOut={handleSignOut} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-surface px-gutter py-2">
          <p className="font-logo text-small tracking-wordmark text-fg lg:hidden">WRISTORY</p>
          <span className="hidden text-eyebrow lg:inline">{t.nav}</span>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className={`hidden min-h-11 items-center gap-2 rounded-control px-3 text-small font-semibold text-muted hover:text-fg sm:inline-flex ${focusRing}`}
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
          className="flex-1 px-gutter pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 outline-none lg:pb-10 lg:pt-10"
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom bar */}
      <nav
        aria-label={t.primaryNav}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="flex">
          {bottomItems.map(({ id, to, end, icon: Icon }) => (
            <li key={id} className="min-w-0 flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-badge ${focusRing} ${
                    isActive ? "text-brand" : "text-muted"
                  }`
                }
              >
                <span className="relative">
                  <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
                  {id === "orders" && <AlertCount count={unseen} className="absolute -right-3 -top-2" />}
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
              className={`flex min-h-14 w-full flex-col items-center justify-center gap-1 px-1 text-badge text-muted ${focusRing}`}
            >
              <Menu aria-hidden="true" size={20} strokeWidth={1.5} />
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
