// Head tags and JSON-LD for the storefront. Pure functions with no browser or
// Vite globals, so the build script (scripts/prerender.mjs) shares them with
// the <Seo> component and both write the same tags.

export const DEFAULT_BRAND = "WRISTORY";
export const DEFAULT_TITLE = "WRISTORY — Premium Watches";
export const DEFAULT_DESCRIPTION =
  "WRISTORY — premium wristwatches for men and women. Cash on delivery across Bangladesh.";
export const CURRENCY = "BDT";

const isHttpUrl = (value) => /^https?:\/\//i.test(value ?? "");

/** Joins a site origin and a path ("/shop") into an absolute URL. */
export const absoluteUrl = (siteUrl, path = "/") =>
  isHttpUrl(path) ? path : `${String(siteUrl ?? "").replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

/** Plain text, whitespace collapsed, cut on a word boundary to `max` chars. */
export function clip(text, max = 160) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s.,;:–—-]+$/, "")}…`;
}

/** Site-wide defaults from the site_settings row (any field may be missing). */
export function siteDefaults(settings) {
  const brand = settings?.brand_name?.trim() || DEFAULT_BRAND;
  return {
    brand,
    title: settings?.seo_title?.trim() || DEFAULT_TITLE,
    description: settings?.seo_desc?.trim() || DEFAULT_DESCRIPTION,
    image: isHttpUrl(settings?.og_image_url) ? settings.og_image_url : null,
  };
}

/**
 * The full tag list for one page: [{ tag: "title" | "meta" | "link", attrs, text? }].
 * `title` is the page's own title ("Shop"); the brand is appended. Omit it on home.
 * `product` adds og:type product and the price tags.
 */
export function headTags({ settings, siteUrl, path = "/", title, description, image, noindex = false, product }) {
  const site = siteDefaults(settings);
  const fullTitle = title ? `${title} | ${site.brand}` : site.title;
  const desc = clip(description || site.description, 170);
  const url = siteUrl ? absoluteUrl(siteUrl, path) : null;
  const ogImage = isHttpUrl(image) ? image : site.image;

  const meta = (key, value, content) => content != null && content !== "" && { tag: "meta", attrs: { [key]: value, content: String(content) } };
  return [
    { tag: "title", text: fullTitle },
    meta("name", "description", desc),
    noindex && meta("name", "robots", "noindex, follow"),
    url && !noindex && { tag: "link", attrs: { rel: "canonical", href: url } },
    meta("property", "og:site_name", site.brand),
    meta("property", "og:type", product ? "product" : "website"),
    meta("property", "og:title", fullTitle),
    meta("property", "og:description", desc),
    meta("property", "og:url", url),
    meta("property", "og:image", ogImage),
    meta("property", "og:locale", "en_US"),
    product && meta("property", "product:price:amount", product.price),
    product && meta("property", "product:price:currency", CURRENCY),
    meta("name", "twitter:card", ogImage ? "summary_large_image" : "summary"),
    meta("name", "twitter:title", fullTitle),
    meta("name", "twitter:description", desc),
    meta("name", "twitter:image", ogImage),
  ].filter(Boolean);
}

/** JSON for a <script type="application/ld+json">, safe to inline in HTML. */
export const serializeJsonLd = (data) =>
  JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");

// ---------------------------------------------------------------- JSON-LD

const SOCIAL_KEYS = ["instagram", "facebook", "tiktok", "youtube"];

export function organizationLd(settings, siteUrl) {
  const site = siteDefaults(settings);
  const logo = [settings?.logo_url, settings?.logo_light_url].find(isHttpUrl);
  const sameAs = SOCIAL_KEYS.map((key) => settings?.socials?.[key]).filter(isHttpUrl);
  const phone = settings?.contact_phone?.trim();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.brand,
    url: absoluteUrl(siteUrl, "/"),
    ...(logo && { logo }),
    ...(sameAs.length && { sameAs }),
    ...(settings?.contact_email && { email: settings.contact_email }),
    ...(phone && {
      contactPoint: { "@type": "ContactPoint", telephone: phone, contactType: "customer service", areaServed: "BD" },
    }),
    ...(settings?.address && {
      address: { "@type": "PostalAddress", streetAddress: settings.address, addressCountry: "BD" },
    }),
  };
}

/** WebSite with the sitelinks search box (the shop page takes ?search=). */
export function websiteLd(settings, siteUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteDefaults(settings).brand,
    url: absoluteUrl(siteUrl, "/"),
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl(siteUrl, "/shop")}?search={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * crumbs: [{ name, path }]; "Home" is added first. Only the last crumb may lack a
 * path (Google requires `item` on the others), so pathless middle crumbs are dropped.
 */
export function breadcrumbLd(crumbs, siteUrl) {
  const all = [{ name: "Home", path: "/" }, ...crumbs];
  const items = all.filter((crumb, i) => crumb.path || i === all.length - 1);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      ...(crumb.path && { item: absoluteUrl(siteUrl, crumb.path) }),
    })),
  };
}

/** Product + Offer (BDT, availability) + AggregateRating when it has approved reviews. */
export function productLd(product, { siteUrl, settings, rating } = {}) {
  const variants = product.variants ?? [];
  const stock = variants.length ? variants.reduce((sum, v) => sum + (v.stock ?? 0), 0) : product.stock;
  const prices = variants.length ? variants.map((v) => v.price_override ?? product.price) : [product.price];
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const url = absoluteUrl(siteUrl, `/product/${product.slug}`);
  const availability = `https://schema.org/${stock > 0 ? "InStock" : "OutOfStock"}`;
  const images = (product.images ?? []).map((img) => img.url).filter(isHttpUrl);

  const offers =
    low === high
      ? { "@type": "Offer", price: low, priceCurrency: CURRENCY, availability, url, itemCondition: "https://schema.org/NewCondition" }
      : { "@type": "AggregateOffer", lowPrice: low, highPrice: high, offerCount: variants.length, priceCurrency: CURRENCY, availability, url };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url,
    ...(images.length && { image: images }),
    ...((product.seo_desc || product.short_desc || product.description) && {
      description: clip(product.seo_desc || product.short_desc || product.description, 500),
    }),
    ...(product.sku && { sku: product.sku }),
    brand: { "@type": "Brand", name: siteDefaults(settings).brand },
    ...(product.category?.name && { category: product.category.name }),
    offers: { ...offers, seller: { "@type": "Organization", name: siteDefaults(settings).brand } },
    ...(rating?.count > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: rating.average, reviewCount: rating.count, bestRating: 5, worstRating: 1 },
    }),
  };
}

export function faqLd(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
