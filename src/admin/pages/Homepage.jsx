import { ExternalLink } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { Button } from "../../components/common";
import { strings } from "../../lib/strings";
import { HeroPanel, PromoPanel } from "../components/homepage/panels";
import SectionsPanel from "../components/homepage/SectionsPanel";

const t = strings.admin.homepage;
const tabsCopy = strings.admin.homeContent;

const TABS = [
  { id: "sections", Panel: SectionsPanel },
  { id: "hero", Panel: HeroPanel },
  { id: "promo", Panel: PromoPanel },
];

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus";

function Homepage() {
  const [params, setParams] = useSearchParams();
  const active = TABS.find((tab) => tab.id === params.get("tab")) ?? TABS[0];
  const { Panel } = active;

  const select = (id) => setParams(id === TABS[0].id ? {} : { tab: id }, { replace: true });

  return (
    <div className="flex flex-col gap-6">
      <title>{`${t.title} | WRISTORY Admin`}</title>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-h3 text-fg">{t.title}</h1>
        <Button as={Link} to="/" target="_blank" rel="noreferrer" variant="secondary" size="sm" className="gap-2">
          <ExternalLink aria-hidden="true" size={16} strokeWidth={1.5} />
          {t.viewStore}
        </Button>
      </div>

      <nav aria-label={tabsCopy.tabsLabel} className="-mx-1 flex gap-1 overflow-x-auto px-1">
        {TABS.map((tab) => {
          const current = tab.id === active.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={current ? "page" : undefined}
              onClick={() => select(tab.id)}
              className={`min-h-11 shrink-0 rounded-control px-4 text-small font-semibold transition-colors duration-fast ${focusRing} ${
                current ? "bg-brand text-obsidian" : "text-muted hover:text-fg"
              }`}
            >
              {tabsCopy.tabs[tab.id]}
            </button>
          );
        })}
      </nav>

      <Panel />
    </div>
  );
}

export default Homepage;
