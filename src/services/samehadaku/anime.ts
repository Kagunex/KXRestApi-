import * as cheerio from "cheerio";
import type { Anime, Episode } from "@/types/anime";
import { cacheGet, cacheSet, cacheKey, CacheTTL } from "@/lib/cache";
import { fetchHtml, getBaseUrl, NotFoundError } from "./client";
import {
  SELECTORS,
  cleanText,
  extractSlug,
  absoluteUrl,
  parseInfoValue,
  extractEpisodeNumber,
  detectType,
  detectStatus,
} from "./parser";

export async function getAnimeBySlug(slug: string): Promise<Anime> {
  const key = cacheKey("anime", slug);
  const cached = cacheGet<Anime>(key);
  if (cached) return cached;

  const html = await fetchHtml(`/anime/${slug}/`);
  const $ = cheerio.load(html);
  const base = getBaseUrl();

  const title =
    cleanText($(SELECTORS.animeTitle).first().text()) ||
    cleanText($("title").text().split("|")[0]) ||
    slug;

  if (
    !title ||
    /not found|404|page not found/i.test(title) ||
    $("body").text().toLowerCase().includes("tidak ditemukan")
  ) {
    throw new NotFoundError(`Anime "${slug}" not found`);
  }

  const thumbRaw =
    $(SELECTORS.animeThumb).first().attr("src") ||
    $(SELECTORS.animeThumb).first().attr("data-src") ||
    $("meta[property='og:image']").attr("content") ||
    null;

  const alternativeTitles: string[] = [];
  let type: string | null = null;
  let status: string | null = null;
  let released: string | null = null;
  let duration: string | null = null;
  let season: string | null = null;
  let studio: string | null = null;
  const producers: string[] = [];

  $(SELECTORS.animeInfo).each((_, el) => {
    const text = cleanText($(el).text());
    const lower = text.toLowerCase();
    const val = parseInfoValue(text);

    if (/japanese|synonym|judul lain|alternative/i.test(lower)) {
      if (val) alternativeTitles.push(val);
    } else if (/^type|^tipe/i.test(lower)) {
      type = detectType(val);
    } else if (/^status/i.test(lower)) {
      status = detectStatus(val);
    } else if (/released|aired|rilis|tanggal/i.test(lower)) {
      released = val || null;
    } else if (/duration|durasi/i.test(lower)) {
      duration = val || null;
    } else if (/season|musim/i.test(lower)) {
      season = val || null;
    } else if (/studio/i.test(lower)) {
      studio = val || null;
    } else if (/producer|produksi/i.test(lower)) {
      if (val) producers.push(...val.split(/,|\//).map((s) => s.trim()).filter(Boolean));
    }
  });

  const genres: string[] = [];
  $(SELECTORS.animeGenres).each((_, el) => {
    const g = cleanText($(el).text());
    if (g && !genres.includes(g)) genres.push(g);
  });

  let synopsis: string | null = null;
  $(SELECTORS.animeSynopsis).each((_, el) => {
    const p = cleanText($(el).text());
    if (p.length > (synopsis?.length ?? 0)) synopsis = p;
  });
  if (!synopsis) {
    const block = cleanText(
      $(".entry-content, .desc, .sinopsis, .synopsis").first().text()
    );
    synopsis = block || null;
  }

  // Count episodes from list
  let episodeCount: number | null = null;
  const epEls = $(SELECTORS.animeEpisodes);
  if (epEls.length > 0) episodeCount = epEls.length;

  const anime: Anime = {
    id: slug,
    slug,
    title,
    alternativeTitles,
    thumbnail: thumbRaw ? absoluteUrl(thumbRaw, base) : null,
    type,
    status,
    released,
    duration,
    season,
    studio,
    producers,
    genres,
    synopsis,
    episodeCount,
  };

  cacheSet(key, anime, CacheTTL.detail);
  return anime;
}

export async function getAnimeEpisodes(
  slug: string,
  page = 1,
  limit = 50
): Promise<{ anime: { id: string; slug: string; title: string }; episodes: Episode[]; total: number }> {
  const key = cacheKey("episodes", slug, page, limit);
  const cached = cacheGet<{
    anime: { id: string; slug: string; title: string };
    episodes: Episode[];
    total: number;
  }>(key);
  if (cached) return cached;

  // Reuse detail page which contains episode list
  const html = await fetchHtml(`/anime/${slug}/`);
  const $ = cheerio.load(html);
  const base = getBaseUrl();

  const title =
    cleanText($(SELECTORS.animeTitle).first().text()) ||
    cleanText($("title").text().split("|")[0]) ||
    slug;

  if (!title || /not found|404/i.test(title)) {
    throw new NotFoundError(`Anime "${slug}" not found`);
  }

  const episodes: Episode[] = [];
  const seen = new Set<string>();

  $(SELECTORS.animeEpisodes).each((_, el) => {
    const $el = $(el);
    const link = $el.find("a").first();
    const href = link.attr("href");
    const epSlug = extractSlug(href);
    if (!epSlug || seen.has(epSlug)) return;
    seen.add(epSlug);

    const epTitle = cleanText(link.text()) || cleanText($el.text()) || epSlug;
    const number = extractEpisodeNumber(epTitle, epSlug);
    const thumb =
      $el.find("img").attr("src") || $el.find("img").attr("data-src") || null;

    episodes.push({
      id: epSlug,
      animeId: slug,
      number,
      title: epTitle,
      slug: epSlug,
      url: absoluteUrl(href, base),
      thumbnail: thumb ? absoluteUrl(thumb, base) : null,
      releasedAt: null,
    });
  });

  episodes.sort((a, b) => {
    if (a.number === null && b.number === null) return 0;
    if (a.number === null) return 1;
    if (b.number === null) return -1;
    return a.number - b.number;
  });

  const total = episodes.length;
  const start = (page - 1) * limit;
  const sliced = episodes.slice(start, start + limit);

  const payload = {
    anime: { id: slug, slug, title },
    episodes: sliced,
    total,
  };
  cacheSet(key, payload, CacheTTL.episodes);
  return payload;
}

export async function getEpisodeById(id: string): Promise<Episode> {
  const key = cacheKey("episode", id);
  const cached = cacheGet<Episode>(key);
  if (cached) return cached;

  // Episode pages are typically /{episode-slug}/
  const html = await fetchHtml(`/${id}/`);
  const $ = cheerio.load(html);
  const base = getBaseUrl();

  const title =
    cleanText($("h1.entry-title, h1[itemprop='name'], h1").first().text()) ||
    cleanText($("title").text().split("|")[0]) ||
    id;

  if (!title || /not found|404/i.test(title)) {
    throw new NotFoundError(`Episode "${id}" not found`);
  }

  // Try to find parent anime link
  let animeId = "";
  $("a[href*='/anime/']").each((_, el) => {
    if (!animeId) {
      animeId = extractSlug($(el).attr("href"));
    }
  });

  const thumb =
    $("meta[property='og:image']").attr("content") ||
    $(".thumb img, .episode-thumb img").first().attr("src") ||
    null;

  const number = extractEpisodeNumber(title, id);

  const episode: Episode = {
    id,
    animeId: animeId || id,
    number,
    title,
    slug: id,
    url: absoluteUrl(`/${id}/`, base),
    thumbnail: thumb ? absoluteUrl(thumb, base) : null,
    releasedAt: null,
  };

  cacheSet(key, episode, CacheTTL.episodes);
  return episode;
}
