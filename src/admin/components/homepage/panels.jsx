import { Badge } from "../../../components/common";
import { formatDateTime } from "../../../lib/format";
import { strings } from "../../strings";
import { heroHooks, promoHooks } from "../../hooks/useHomeContentAdmin";
import ContentPanel from "./ContentPanel";
import HeroModal from "./HeroModal";
import PromoModal from "./PromoModal";
import { MAX_HERO_ACTIVE, canActivateHero, heroActiveCount, heroState, promoShownIds, promoState } from "./contentRules";

const hero = strings.admin.homeContent.hero;
const promo = strings.admin.homeContent.promo;

function HeroInfo(row) {
  const state = heroState(row);
  const label =
    state === "scheduled"
      ? hero.state.scheduled(formatDateTime(row.active_from))
      : state === "ended"
        ? hero.state.ended(formatDateTime(row.active_to))
        : state === "live" && row.active_to
          ? hero.state.endsOn(formatDateTime(row.active_to))
          : hero.state[state];
  return (
    <>
      <p className="truncate text-body font-semibold text-fg">{row.title}</p>
      <p className="line-clamp-1 text-small text-muted">{[row.eyebrow, row.subtitle].filter(Boolean).join(" · ")}</p>
      <div>
        <Badge variant={state === "live" ? "success" : "neutral"}>{label}</Badge>
      </div>
    </>
  );
}

const heroConfig = {
  copy: hero,
  hooks: heroHooks,
  nameOf: (row) => row.title,
  thumb: (row) => row.image_desktop || row.image_mobile,
  info: HeroInfo,
  summary: (rows) => hero.count(rows.length, rows.filter((row) => heroState(row) === "live").length),
  // Switching a slide on counts against the cap of 3.
  guardOn: (rows, row) => (canActivateHero(rows, row) ? null : hero.messages.cap),
  canAdd: (rows) => heroActiveCount(rows) < MAX_HERO_ACTIVE,
  Modal: HeroModal,
  modalProp: "slide",
};

function PromoInfo(row, rows) {
  const state = promoState(row);
  const shown = promoShownIds(rows).has(row.id);
  const label =
    state === "ended"
      ? promo.state.ended(formatDateTime(row.countdown_to))
      : state === "live" && !shown
        ? promo.state.notShown
        : state === "live" && row.countdown_to
          ? promo.state.endsOn(formatDateTime(row.countdown_to))
          : promo.state[state];
  return (
    <>
      <p className="truncate text-body font-semibold text-fg">{row.title || promo.untitled}</p>
      <p className="line-clamp-1 text-small text-muted">{[row.subtitle, row.link].filter(Boolean).join(" · ")}</p>
      <div>
        <Badge variant={state === "live" && shown ? "success" : "neutral"}>{label}</Badge>
      </div>
    </>
  );
}

const promoConfig = {
  copy: promo,
  hooks: promoHooks,
  nameOf: (row) => row.title || promo.untitled,
  thumb: (row) => row.image || row.image_mobile,
  info: PromoInfo,
  summary: (rows) => promo.count(rows.length, promoShownIds(rows).size),
  Modal: PromoModal,
  modalProp: "banner",
};

export const HeroPanel = () => <ContentPanel config={heroConfig} />;
export const PromoPanel = () => <ContentPanel config={promoConfig} />;
