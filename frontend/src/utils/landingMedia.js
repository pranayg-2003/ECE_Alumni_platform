/** Convert a YouTube watch or share URL to an embed URL, or null if not YouTube. */
export function youtubeEmbedUrl(input) {
  if (!input || typeof input !== "string") return null;
  const u = input.trim();
  const m = u.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([\w-]{11})/i);
  if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1&mute=1`;
  return null;
}

/** Full-screen style hero: autoplay, loop (requires playlist=id), muted. */
export function youtubeHeroEmbedSrc(input) {
  const u = input && String(input).trim();
  if (!u) return null;
  const m = u.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([\w-]{11})/i);
  if (!m) return null;
  const id = m[1];
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&mute=1&autoplay=1&loop=1&playlist=${id}&controls=0`;
}

/** Heuristic: treat URL as video file suitable for <video src>. */
export function urlLooksLikeVideoFile(url) {
  if (!url || typeof url !== "string") return false;
  const u = url.toLowerCase();
  if (u.includes("/video/upload/")) return true;
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(u);
}
