import { useId } from "react";
import { Container, Reveal, SectionHeading } from "../common";
import { InstagramIcon } from "../layout/icons";
import { useHomeSections, useSiteSettings } from "../../hooks/useContent";
import { responsiveImage } from "../../lib/images";
import { staggerDelay } from "../../lib/motion";
import { strings } from "../../lib/strings";

// Instagram / Facebook grid (roadmap §6.1 #13): up to 6 square tiles linked to
// real posts. Posts come from `home_sections.social_grid.config.posts`
// [{image, link, alt?}]; the profile link from `site_settings.socials.instagram`.
// Only https image/link URLs are used. No posts → the section is omitted (the
// seed row is hidden until the admin adds real posts); no fake tiles.

const MAX_POSTS = 6;
const isHttps = (v) => /^https:\/\/\S+$/i.test(String(v ?? "").trim());

function cleanPosts(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p) => p && isHttps(p.image) && isHttps(p.link))
    .slice(0, MAX_POSTS)
    .map((p) => ({
      image: p.image.trim(),
      link: p.link.trim(),
      alt: typeof p.alt === "string" ? p.alt.trim() : "",
    }));
}

function SocialShowcase() {
  const uid = useId();
  const { data: sections } = useHomeSections();
  const { data: settings } = useSiteSettings();
  const section = sections?.find((s) => s.key === "social_grid");
  const posts = cleanPosts(section?.config?.posts);
  if (!posts.length) return null;

  const profile = isHttps(settings?.socials?.instagram) ? settings.socials.instagram.trim() : null;

  return (
    <section aria-labelledby={`${uid}-title`} className="section-dark py-section-sm lg:py-section">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          eyebrow={strings.social.eyebrow}
          title={section?.title || strings.social.title}
          subtitle={section?.subtitle || undefined}
          id={`${uid}-title`}
        />

        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {posts.map((post, i) => {
            const img = responsiveImage(post.image, { aspect: [1, 1], widths: [240, 360, 540] });
            return (
              <li key={post.link}>
                <Reveal
                  as="a"
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  delay={staggerDelay(i)}
                  aria-label={strings.social.viewPost(i + 1)}
                  className="group relative block aspect-square overflow-hidden rounded-card border border-line bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <img
                    src={img.src}
                    srcSet={img.srcSet}
                    sizes={img.srcSet ? "(min-width: 1024px) 16vw, (min-width: 768px) 30vw, 46vw" : undefined}
                    alt={post.alt}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-slow ease-out group-hover:scale-105"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center bg-obsidian/0 transition-colors duration-base group-hover:bg-obsidian/50 group-focus-visible:bg-obsidian/50"
                  >
                    <InstagramIcon className="h-6 w-6 text-ivory opacity-0 transition-opacity duration-base group-hover:opacity-100 group-focus-visible:opacity-100" />
                  </span>
                </Reveal>
              </li>
            );
          })}
        </ul>

        {profile && (
          <a
            href={profile}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 self-center text-small text-brand underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <InstagramIcon className="h-5 w-5" aria-hidden="true" />
            {strings.social.follow}
          </a>
        )}
      </Container>
    </section>
  );
}

export default SocialShowcase;
