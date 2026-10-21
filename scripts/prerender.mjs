// Runs after `vite build`. Writes, into dist/:
// - <route>/index.html for the key storefront pages, with that page's title,
//   description, canonical, Open Graph tags and JSON-LD in <head> (the body is
//   still the SPA), so link previews and crawlers without JS see real tags;
// - sitemap.xml (static pages, categories, collections, products, policies);
// - robots.txt with the Sitemap line;
// - a preload for hero slide 1 in the home page (dist/index.html), so the LCP
//   image downloads alongside the JS instead of after the API call. Every other
//   path falls back to dist/app.html (same shell, no hero preload; public/_redirects).
// Data is read with the public anon key (RLS shows only what visitors see).
// A failed read never fails the build: it warns and writes what it can.
// Snapshot: price or product changes show in these files after the next deploy.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import {
  breadcrumbLd,
  faqLd,
  headTags,
  organizationLd,
  productLd,
  serializeJsonLd,
  websiteLd,
} from "../src/lib/seo.js";
import { strings } from "../src/lib/strings.js";
import { heroPreloads } from "../src/lib/images.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const env = { ...loadEnv("production", root, ""), ...process.env };
const siteUrl = (env.VITE_SITE_URL || "").replace(/\/+$/, "") || null;

const log = (...args) => console.log("[prerender]", ...args);
const warn = (...args) => console.warn("[prerender] warning:", ...args);

// ------------------------------------------------------------------ data

const bySort = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0);

async function loadData() {
  const empty = { settings: null, products: [], categories: [], collections: [], pages: [], faqs: [], ratings: new Map(), heroSlide: null };
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    warn("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set; only static pages are written.");
    return empty;
  }
  const db = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const read = async (label, request) => {
    const { data, error } = await request;
    if (error) {
      warn(`couldn't read ${label}: ${error.message}`);
      return null;
    }
    return data;
  };

  const [settings, products, categories, collections, pages, faqs, reviews, heroSlides] = await Promise.all([
    read(
      "site_settings",
      db
        .from("site_settings")
        .select("brand_name, logo_url, logo_light_url, og_image_url, contact_phone, contact_email, address, socials, seo_title, seo_desc")
        .maybeSingle(),
    ),
    read(
      "products",
      db
        .from("products")
        .select(
          `id, slug, name, sku, price, stock, short_desc, description, seo_title, seo_desc, updated_at,
           images:product_images (url, sort_order),
           variants:product_variants (price_override, stock, sort_order),
           category:categories (slug, name)`,
        )
        .order("sort_order"),
    ),
    read("categories", db.from("categories").select("slug, name, description").order("sort_order")),
    read("collections", db.from("collections").select("slug, title, description").order("sort_order")),
    read("pages", db.from("pages").select("slug, title, content, seo_desc, updated_at")),
    read("faqs", db.from("faqs").select("question, answer").order("sort_order")),
    read("reviews", db.from("reviews").select("product_id, rating").eq("status", "approved")),
    // Same order as listHeroSlides(); RLS returns only live slides.
    read("hero_slides", db.from("hero_slides").select("image_desktop, image_mobile").order("sort_order").limit(1)),
  ]);

  // Same rounding as summarizeRatings() in services/products.js.
  const sums = new Map();
  for (const { product_id: id, rating } of reviews ?? []) {
    if (!id) continue;
    const entry = sums.get(id) ?? { sum: 0, count: 0 };
    sums.set(id, { sum: entry.sum + rating, count: entry.count + 1 });
  }
  const ratings = new Map(
    [...sums].map(([id, { sum, count }]) => [id, { average: Math.round((sum / count) * 10) / 10, count }]),
  );

  return {
    settings,
    products: (products ?? []).map((p) => ({ ...p, images: [...(p.images ?? [])].sort(bySort), variants: [...(p.variants ?? [])].sort(bySort) })),
    categories: categories ?? [],
    collections: collections ?? [],
    pages: pages ?? [],
    faqs: faqs ?? [],
    ratings,
    heroSlide: heroSlides?.[0] ?? null,
  };
}

// ------------------------------------------------------------------ html

const escapeHtml = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function renderHead(tags, jsonLd = []) {
  const lines = tags.map(({ tag, attrs, text }) => {
    if (tag === "title") return `<title data-seo>${escapeHtml(text)}</title>`;
    const attributes = Object.entries(attrs).map(([key, value]) => `${key}="${escapeHtml(value)}"`).join(" ");
    return `<${tag} data-seo ${attributes} />`;
  });
  for (const data of jsonLd.filter(Boolean)) {
    lines.push(`<script data-seo type="application/ld+json">${serializeJsonLd(data)}</script>`);
  }
  return lines.map((line) => `    ${line}`).join("\n");
}

const SEO_BLOCK = /( *)<!-- seo:start[\s\S]*?<!-- seo:end -->/;

function pageHtml(template, tags, jsonLd) {
  return template.replace(SEO_BLOCK, `    <!-- seo:start -->\n${renderHead(tags, jsonLd)}\n    <!-- seo:end -->`);
}

// Mirrors the <link rel="preload"> the hero renders (React hoists it, the browser dedupes).
function heroPreloadHtml(slide) {
  if (!slide) return "";
  return heroPreloads(slide)
    .map(
      ({ image, media }) =>
        `    <link rel="preload" as="image" href="${escapeHtml(image.src)}"${
          image.srcSet ? ` imagesrcset="${escapeHtml(image.srcSet)}" imagesizes="100vw"` : ""
        } media="${media}" fetchpriority="high" />\n`,
    )
    .join("");
}

async function writePage(route, html) {
  const dir = path.join(dist, route);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "index.html"), html);
}

// ------------------------------------------------------------------ routes

function buildRoutes(data) {
  const { settings } = data;
  const head = (options) => headTags({ settings, siteUrl, ...options });
  const crumbs = (list) => breadcrumbLd(list, siteUrl);
  const routes = [];
  const add = (route, tags, jsonLd = [], lastmod) => routes.push({ route, tags, jsonLd, lastmod });

  const shop = strings.listing.shop;
  add("/shop", head({ path: "/shop", title: shop, description: strings.listing.shopIntro }), [crumbs([{ name: shop }])]);
  add("/faq", head({ path: "/faq", title: strings.faqPage.title, description: strings.faqPage.subtitle }), [
    data.faqs.length && faqLd(data.faqs),
  ]);
  add("/contact", head({ path: "/contact", title: strings.contact.eyebrow, description: strings.contact.subtitle }));

  for (const c of data.categories) {
    const route = `/category/${c.slug}`;
    add(route, head({ path: route, title: c.name, description: c.description }), [
      crumbs([{ name: shop, path: "/shop" }, { name: c.name }]),
    ]);
  }
  for (const c of data.collections) {
    const route = `/collection/${c.slug}`;
    add(route, head({ path: route, title: c.title, description: c.description }), [crumbs([{ name: c.title }])]);
  }
  for (const p of data.products) {
    const route = `/product/${p.slug}`;
    const tags = head({
      path: route,
      title: p.seo_title || p.name,
      description: p.seo_desc || p.short_desc || p.description,
      image: p.images[0]?.url,
      product: { price: p.price },
    });
    const trail = [
      { name: shop, path: "/shop" },
      ...(p.category ? [{ name: p.category.name, path: `/category/${p.category.slug}` }] : []),
      { name: p.name, path: route },
    ];
    add(route, tags, [productLd(p, { siteUrl, settings, rating: data.ratings.get(p.id) }), crumbs(trail)], p.updated_at);
  }
  for (const page of data.pages) {
    const route = page.slug === "about" ? "/about" : `/policy/${page.slug}`;
    add(route, head({ path: route, title: page.title, description: page.seo_desc || page.content }), [], page.updated_at);
  }
  return routes;
}

// ------------------------------------------------------------------ sitemap

function sitemap(routes) {
  const urls = ["/", ...routes.map((r) => r.route)].map((route) => {
    const entry = routes.find((r) => r.route === route);
    const lastmod = entry?.lastmod ? `<lastmod>${new Date(entry.lastmod).toISOString().slice(0, 10)}</lastmod>` : "";
    return `  <url><loc>${escapeHtml(`${siteUrl}${route}`)}</loc>${lastmod}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

// ------------------------------------------------------------------ main

const template = await readFile(path.join(dist, "index.html"), "utf8");
if (!SEO_BLOCK.test(template)) throw new Error("dist/index.html has no <!-- seo:start --> … <!-- seo:end --> block");

const data = await loadData();
const routes = buildRoutes(data);

// dist/index.html is home; dist/app.html is the same shell without the hero
// preload, the SPA fallback for every other path. Both get the site defaults and
// Organization/WebSite data but no canonical or og:url.
const fallbackTags = headTags({ settings: data.settings, siteUrl: null, path: "/" });
const shell = pageHtml(template, fallbackTags, [organizationLd(data.settings, siteUrl ?? ""), websiteLd(data.settings, siteUrl ?? "")]);
await writeFile(path.join(dist, "app.html"), shell);
await writeFile(path.join(dist, "index.html"), shell.replace("  </head>", `${heroPreloadHtml(data.heroSlide)}  </head>`));
for (const { route, tags, jsonLd } of routes) await writePage(route, pageHtml(template, tags, jsonLd));
log(`wrote ${routes.length + 1} pages (${data.products.length} products)`);

const robots = await readFile(path.join(root, "public", "robots.txt"), "utf8");
if (siteUrl) {
  await writeFile(path.join(dist, "sitemap.xml"), sitemap(routes));
  await writeFile(path.join(dist, "robots.txt"), `${robots.trimEnd()}\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  log(`sitemap.xml: ${routes.length + 1} URLs on ${siteUrl}`);
} else {
  warn("VITE_SITE_URL not set; sitemap.xml and canonical URLs skipped.");
}
