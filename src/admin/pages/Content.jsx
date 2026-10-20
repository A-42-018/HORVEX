import { ExternalLink } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { Button } from "../../components/common";
import { strings } from "../../lib/strings";
import AnnouncementsPanel from "../components/content/AnnouncementsPanel";
import PagesPanel from "../components/content/PagesPanel";
import { FaqPanel, TestimonialsPanel } from "../components/content/panels";

const t = strings.admin.content;

const TABS = [
  { id: "announcements", Panel: AnnouncementsPanel },
  { id: "faq", Panel: FaqPanel },
  { id: "testimonials", Panel: TestimonialsPanel },
  { id: "pages", Panel: PagesPanel },
];

const focusRing = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus";

function Content() {
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

      <nav aria-label={t.tabsLabel} className="-mx-1 flex gap-1 overflow-x-auto px-1">
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
              {t.tabs[tab.id]}
            </button>
          );
        })}
      </nav>

      <Panel />
    </div>
  );
}

export default Content;
