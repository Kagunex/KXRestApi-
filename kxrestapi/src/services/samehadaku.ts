import * as cheerio from "cheerio";
import type {
  Anime,
  AnimeSearchResult,
  Episode,
  Genre,
} from "@/types/anime";
import { getCache, setCache, cacheKey, CacheTTL } from "@/lib/cache";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FETCH_TIMEOUT = 12000;

function getBaseUrl(): string {
  const url = process.env.SAMEHADAKU_BASE_URL;
  if (!url) {
    throw new Error("SAMEHADAKU_BASE_URL is not configured");
  }
  return url.replace(/\/$/, "");
}

async function fetchHtml(path: string): Promise<string> {
  const base = getBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      signal: controller.signal,
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new UpstreamError(
        `Upstream returned ${res.status}`,
        res.status >= 500 ? 503 : 502
      );
    }

    return await res.text();
  } catch (err) {
    if (err instanceof UpstreamError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new UpstreamError("Upstream request timed out", 503);
    }
    throw new UpstreamError(
      "Failed to reach upstream source",
      503
    );
  } finally {
    clearTimeout(timeout);
  }
}

export class UpstreamError extends Error {
  status: number;
  constructor(message: string, status = 503) {
    super(message);
    this.name = "UpstreamError";
    this.status = status;
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

// --- Selectors (centralized for easy maintenance) ---
const SELECTORS = {
  search: {
    item: "article.animpost, div.animpost, .listupd article, .listupd .bs",
    title: "h2 a, .tt h2, .title a, a[title]",
    thumbnail: "img",
    type: ".type, .typez, span.type",
    status: ".status, span.status, .epx",
    link: "a",
  },
  anime: {
    title: "h1.entry-title, h1[itemprop='name'], .infox h1, h1",
    thumbnail: ".thumb img, .serie-thumb img, .infoanime img, img.wp-post-image",
    infoRow: ".spe span, .info-content span, .infox span, .anime-info span",
    genres: ".genxed a, .genre-info a, a[rel='tag'], .genres a",
    synopsis: ".entry-content p, .desc p, .sinopsis p, .synopsis p, #sinopsis p",
    episodes: ".listeps li, .episode-list li, .episodelist li, ul.episodelist li, .eplister li",
  },
  recent: {
    item: "article.animpost, .listupd article, .listupd .bs, .post-show article",
  },
  genres: {
    item: ".genres a, .genre-list a, a[href*='/genre/'], .tax_filter a",
  },
};

function extractSlug(href: string | undefined): string {
  if (!href) return "";
  try {
    const clean = href.replace(/\/$/, "");
    const parts = clean.split("/");
    return parts[parts.length - 1] || parts[parts.length - 2] || "";
  } catch {
    return "";
  }
}

function cleanText(text: string | undefined | null): string {
  return (text || "").replace(/\s+/g, " ").trim();
}

function absoluteUrl(href: string | undefined): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  const base = getBaseUrl();
  return href.startsWith("/") ? `${base}${href}` : `${base}/${href}`;
}

// --- Search ---
export async function searchAnime(query: string): Promise<AnimeSearchResult[]> {
  const key = cacheKey("search", query.toLowerCase());
  const cached = getCache<AnimeSearchResult[]>(key);
  if (cached) return cached;

  const html = await fetchHtml(`/?s=${encodeURIComponent(query)}`);
  const $ = cheerio.load(html);
  const results: AnimeSearchResult[] = [];
  const seen = new Set<string>();

  $(SELECTORS.search.item).each((_, el) => {
    const $el = $(el);
    const linkEl = $el.find(SELECTORS.search.link).first();
    const href = linkEl.attr("href") || $el.find("a").attr("href");
    const slug = extractSlug(href);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);

    const title =
      cleanText($el.find(SELECTORS.search.title).first().text()) ||
      cleanText(linkEl.attr("title")) ||
      cleanText($el.find("img").attr("alt")) ||
      slug;

    const thumb =
      $el.find(SELECTORS.search.thumbnail).attr("src") ||
      $el.find("img").attr("data-src") ||
      $el.find("img").attr("src") ||
      "";

    const typeText = cleanText($el.find(SELECTORS.search.type).first().text()) || "TV";
    const statusText =
      cleanText($el.find(SELECTORS.search.status).first().text()) || "";

    let latestEpisode = "";
    const epMatch = statusText.match(/(\d+)/);
    if (epMatch) latestEpisode = epMatch[1];

    results.push({
      id: slug,
      title,
      slug,
      url: absoluteUrl(href),
      thumbnail: absoluteUrl(thumb),
      type: typeText.includes("Movie") ? "Movie" : typeText.includes("OVA") ? "OVA" : "TV",
      status: /complete|selesai|completed/i.test(statusText)
        ? "Completed"
        : /ongoing|airing/i.test(statusText)
          ? "Ongoing"
          : statusText || "Unknown",
      latestEpisode,
    });
  });

  // Fallback: broader selector if nothing found
  if (results.length === 0) {
    $("article, .bs, .animepost").each((_, el) => {
      const $el = $(el);
      const href = $el.find("a").first().attr("href");
      const slug = extractSlug(href);
      if (!slug || seen.has(slug)) return;
      if (!href?.includes("/anime/") && !href?.includes("samehadaku")) return;
      seen.add(slug);

      const title =
        cleanText($el.find("h2, .tt, .title").first().text()) ||
        cleanText($el.find("img").attr("alt")) ||
        slug;
      const thumb =
        $el.find("img").attr("src") ||
        $el.find("img").attr("data-src") ||
        "";

      results.push({
        id: slug,
        title,
        slug,
        url: absoluteUrl(href),
        thumbnail: absoluteUrl(thumb),
        type: "TV",
        status: "Unknown",
        latestEpisode: "",
      });
    });
  }

  setCache(key, results, CacheTTL.search);
  return results;
}

// --- Anime Detail ---
export async function getAnimeBySlug(slug: string): Promise<Anime> {
  const key = cacheKey("anime", slug);
  const cached = getCache<Anime>(key);
  if (cached) return cached;

  const html = await fetchHtml(`/anime/${slug}/`);
  const $ = cheerio.load(html);

  const title =
    cleanText($(SELECTORS.anime.title).first().text()) ||
    cleanText($("title").text().split("|")[0]) ||
    slug;

  if (!title || title.toLowerCase().includes("not found") || title.toLowerCase().includes("404")) {
    throw new NotFoundError(`Anime "${slug}" not found`);
  }

  const thumbnail =
    absoluteUrl(
      $(SELECTORS.anime.thumbnail).first().attr("src") ||
        $(SELECTORS.anime.thumbnail).first().attr("data-src") ||
        $("meta[property='og:image']").attr("content")
    ) || "";

  const alternativeTitles: string[] = [];
  let type = "TV";
  let status = "Unknown";
  let score = "";

  $(SELECTORS.anime.infoRow).each((_, el) => {
    const text = cleanText($(el).text());
    const lower = text.toLowerCase();
    if (lower.includes("japanese") || lower.includes("synonym") || lower.includes("judul lain")) {
      const val = text.split(":").slice(1).join(":").trim();
      if (val) alternativeTitles.push(val);
    }
    if (lower.includes("type") || lower.includes("tipe")) {
      type = text.split(":").slice(1).join(":").trim() || type;
    }
    if (lower.includes("status")) {
      status = text.split(":").slice(1).join(":").trim() || status;
    }
    if (lower.includes("score") || lower.includes("rating")) {
      score = text.split(":").slice(1).join(":").trim() || score;
    }
  });

  // Also check common info containers
  $(".info-content, .infox, .spe").find("span, b, strong").each((_, el) => {
    const text = cleanText($(el).text());
    const lower = text.toLowerCase();
    if (lower.startsWith("status")) {
      status = text.replace(/status\s*:?/i, "").trim() || status;
    }
    if (lower.startsWith("type") || lower.startsWith("tipe")) {
      type = text.replace(/(type|tipe)\s*:?/i, "").trim() || type;
    }
  });

  const genres: string[] = [];
  $(SELECTORS.anime.genres).each((_, el) => {
    const g = cleanText($(el).text());
    if (g && !genres.includes(g)) genres.push(g);
  });

  let synopsis = "";
  $(SELECTORS.anime.synopsis).each((_, el) => {
    const p = cleanText($(el).text());
    if (p.length > synopsis.length) synopsis = p;
  });
  if (!synopsis) {
    synopsis = cleanText($(".entry-content, .desc, .sinopsis, .synopsis").first().text());
  }

  const episodes: Episode[] = [];
  const epSeen = new Set<string>();

  $(SELECTORS.anime.episodes).each((_, el) => {
    const $el = $(el);
    const link = $el.find("a").first();
    const href = link.attr("href");
    const epSlug = extractSlug(href);
    if (!epSlug || epSeen.has(epSlug)) return;
    epSeen.add(epSlug);

    const epTitle = cleanText(link.text()) || cleanText($el.text());
    const numMatch = epTitle.match(/(?:episode|ep\.?)\s*(\d+)/i) || epSlug.match(/(\d+)/);
    const number = numMatch ? parseInt(numMatch[1], 10) : episodes.length + 1;

    episodes.push({
      number,
      title: epTitle || `Episode ${number}`,
      slug: epSlug,
    });
  });

  // Sort episodes ascending
  episodes.sort((a, b) => a.number - b.number);

  const anime: Anime = {
    id: slug,
    title,
    alternativeTitles,
    thumbnail,
    type,
    status,
    score,
    genres,
    synopsis,
    episodes,
    slug,
  };

  setCache(key, anime, CacheTTL.detail);
  return anime;
}

// --- Episodes only ---
export async function getEpisodes(slug: string): Promise<{
  anime: { slug: string; title: string };
  episodes: Episode[];
}> {
  const anime = await getAnimeBySlug(slug);
  return {
    anime: { slug: anime.slug, title: anime.title },
    episodes: anime.episodes,
  };
}

// --- Recent ---
export async function getRecentAnime(): Promise<AnimeSearchResult[]> {
  const key = cacheKey("recent");
  const cached = getCache<AnimeSearchResult[]>(key);
  if (cached) return cached;

  const html = await fetchHtml("/");
  const $ = cheerio.load(html);
  const results: AnimeSearchResult[] = [];
  const seen = new Set<string>();

  $(SELECTORS.recent.item).each((_, el) => {
    const $el = $(el);
    const href = $el.find("a").first().attr("href");
    const slug = extractSlug(href);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);

    const title =
      cleanText($el.find("h2, .tt, .title, a[title]").first().text()) ||
      cleanText($el.find("img").attr("alt")) ||
      slug;

    const thumb =
      $el.find("img").attr("src") ||
      $el.find("img").attr("data-src") ||
      "";

    const epText = cleanText($el.find(".epx, .episode, .status").first().text());
    const epMatch = epText.match(/(\d+)/);

    results.push({
      id: slug,
      title,
      slug,
      url: absoluteUrl(href),
      thumbnail: absoluteUrl(thumb),
      type: "TV",
      status: "Ongoing",
      latestEpisode: epMatch ? epMatch[1] : "",
    });
  });

  setCache(key, results.slice(0, 20), CacheTTL.recent);
  return results.slice(0, 20);
}

// --- Genres ---
export async function getGenres(): Promise<Genre[]> {
  const key = cacheKey("genres");
  const cached = getCache<Genre[]>(key);
  if (cached) return cached;

  const html = await fetchHtml("/");
  const $ = cheerio.load(html);
  const genres: Genre[] = [];
  const seen = new Set<string>();

  $(SELECTORS.genres.item).each((_, el) => {
    const $el = $(el);
    const name = cleanText($el.text());
    const href = $el.attr("href") || "";
    const slug = extractSlug(href);
    if (!name || !slug || seen.has(slug)) return;
    if (!href.includes("genre") && !href.includes("genres")) return;
    seen.add(slug);
    genres.push({ name, slug });
  });

  // Fallback common genres if parsing fails
  if (genres.length === 0) {
    const fallback = [
      "Action", "Adventure", "Comedy", "Drama", "Fantasy",
      "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life",
      "Sports", "Supernatural", "Thriller", "Mecha", "Music",
    ];
    fallback.forEach((name) => {
      genres.push({
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
      });
    });
  }

  setCache(key, genres, CacheTTL.genres);
  return genres;
}

// --- Health check against source ---
export async function checkSourceHealth(): Promise<{
  ok: boolean;
  latency: number;
  message: string;
}> {
  const start = Date.now();
  try {
    const base = getBaseUrl();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(base, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const latency = Date.now() - start;
    if (res.ok || res.status === 403 || res.status === 503) {
      // 403/503 often means Cloudflare challenge, source is reachable
      return {
        ok: true,
        latency,
        message: res.ok ? "reachable" : "reachable (protected)",
      };
    }
    return {
      ok: false,
      latency,
      message: `status ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      latency: Date.now() - start,
      message: err instanceof Error ? err.message : "unreachable",
    };
  }
}
