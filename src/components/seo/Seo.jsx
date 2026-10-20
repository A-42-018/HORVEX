import { useLocation } from "react-router";
import { useSiteSettings } from "../../hooks/useContent";
import { headTags } from "../../lib/seo";
import { SITE_URL } from "./siteUrl";

/**
 * Per-page <title>, description, canonical, robots, Open Graph and Twitter tags.
 * React 19 hoists them into <head> and removes them when the page unmounts.
 * Every storefront page renders exactly one <Seo>. `path` defaults to the current
 * pathname (query strings never reach the canonical).
 */
function Seo({ title, description, image, path, noindex, product }) {
  const { pathname } = useLocation();
  const { data: settings } = useSiteSettings();
  const tags = headTags({ settings, siteUrl: SITE_URL, path: path ?? pathname, title, description, image, noindex, product });

  return tags.map(({ tag: Tag, attrs, text }) => {
    const key = attrs ? `${Tag}-${attrs.name ?? attrs.property ?? attrs.rel}` : Tag;
    return text != null ? <Tag key={key}>{text}</Tag> : <Tag key={key} {...attrs} />;
  });
}

export default Seo;
