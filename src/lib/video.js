// Brand-film URL parser (B9a). Returns how to play a URL, or null when it isn't
// something we can play safely. Only https URLs are accepted.
//   { kind: "embed", src }  YouTube (privacy-enhanced) or Vimeo player iframe
//   { kind: "file", src }   direct .mp4 / .webm / .ogg file (e.g. Supabase Storage)
const YT_ID = /^[\w-]{11}$/;
const FILE_EXT = /\.(mp4|webm|ogg)$/i;

export function parseVideo(url) {
  if (typeof url !== "string" || !url.trim()) return null;
  let u;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;

  const host = u.hostname.replace(/^www\./, "");

  if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    let id = null;
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (u.pathname === "/watch") id = u.searchParams.get("v");
    else id = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1] ?? null;
    if (!id || !YT_ID.test(id)) return null;
    return { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1` };
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = u.pathname.match(/\/(\d{5,})/)?.[1];
    if (!id) return null;
    return { kind: "embed", src: `https://player.vimeo.com/video/${id}?autoplay=1` };
  }

  if (FILE_EXT.test(u.pathname)) return { kind: "file", src: u.toString() };
  return null;
}

/** True for a direct video file we can use as a muted background loop. */
export const isVideoFile = (url) => parseVideo(url)?.kind === "file";
