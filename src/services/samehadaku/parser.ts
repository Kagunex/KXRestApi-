/** Centralized CSS selectors — update here when source HTML changes */
export const SELECTORS = {
  searchItem: "article.animpost, div.animpost, .listupd article, .listupd .bs, .bs",
  searchTitle: "h2 a, .tt h2, .title a, a[title], .tt",
  searchThumb: "img",
  searchType: ".type, .typez, span.type",
  searchStatus: ".status, span.status, .epx, .episode",
  searchLink: "a",

  animeTitle: "h1.entry-title, h1[itemprop='name'], .infox h1, h1",
  animeThumb: ".thumb img, .serie-thumb img, .infoanime img, img.wp-post-image, .thumbook img",
  animeInfo: ".spe span, .info-content span, .infox span, .anime-info span, .spe > span",
  animeGenres: ".genxed a, .genre-info a, a[rel='tag'], .genres a",
  animeSynopsis: ".entry-content p, .desc p, .sinopsis p, .synopsis p, #sinopsis p, .entry-content",
  animeEpisodes: ".listeps li, .episode-list li, .episodelist li, ul.episodelist li, .eplister li, .eplister ul li",

  recentItem: "article.animpost, .listupd article, .listupd .bs, .post-show article, .bs",
  genreItem: ".genres a, .genre-list a, a[href*='/genre/'], .tax_filter a, .genre a",
} as const;

export function cleanText(text: string | undefined | null): string {
  return (text || "").replace(/\s+/g, " ").trim();
}

export function extractSlug(href: string | undefined | null): string {
  if (!href) return "";
  try {
    const clean = href.split("?")[0].replace(/\/$/, "");
    const parts = clean.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  } catch {
    return "";
  }
}

export function absoluteUrl(href: string | undefined | null, base: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return href.startsWith("/") ? `${base}${href}` : `${base}/${href}`;
}

export function parseInfoValue(text: string): string {
  const idx = text.indexOf(":");
  if (idx === -1) return text.trim();
  return text.slice(idx + 1).trim();
}

export function extractEpisodeNumber(text: string, slug: string): number | null {
  const fromTitle = text.match(/(?:episode|ep\.?)\s*(\d+)/i);
  if (fromTitle) return parseInt(fromTitle[1], 10);
  const fromSlug = slug.match(/(?:episode|ep)[_-]?(\d+)/i) || slug.match(/(\d+)$/);
  if (fromSlug) return parseInt(fromSlug[1], 10);
  return null;
}

export function detectType(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes("movie")) return "Movie";
  if (t.includes("ova")) return "OVA";
  if (t.includes("ona")) return "ONA";
  if (t.includes("special")) return "Special";
  if (t.includes("tv") || t.includes("series")) return "TV";
  return text || null;
}

export function detectStatus(text: string): string | null {
  const t = text.toLowerCase();
  if (/complete|selesai|completed|finished/.test(t)) return "Completed";
  if (/ongoing|airing|currently/.test(t)) return "Ongoing";
  if (/upcoming|not yet|hiatus/.test(t)) return "Upcoming";
  return text || null;
}
