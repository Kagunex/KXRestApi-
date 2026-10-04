import * as cheerio from "cheerio";
import type { Genre, AnimeSearchResult, Pagination } from "@/types/anime";
import { cacheGet, cacheSet, cacheKey, CacheTTL } from "@/lib/cache";
import { fetchHtml, getBaseUrl } from "./client";
import {
  SELECTORS,
  cleanText,
  extractSlug,
  absoluteUrl,
  detectType,
  detectStatus,
} from "./parser";

const FALLBACK_GENRES: Genre[] = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy",
  "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life",
  "Sports", "Supernatural", "Thriller", "Mecha", "Music",
  "School", "Shounen", "Shoujo", "Seinen", "Josei",
].map((name) => ({
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
}));

export async function getGenres(): Promise<Genre[]> {
  const key = cacheKey("genres");
  const cached = cacheGet<Genre[]>(key);
  if (cached) return cached;

  const html = await fetchHtml("/");
  const $ = cheerio.load(html);
  const genres: Genre[] = [];
  const seen = new Set<string>();

  $(SELECTORS.genreItem).each((_, el) => {
    const $el = $(el);
    const name = cleanText($el.text());
    const href = $el.attr("href") || "";
    const slug = extractSlug(href);
    if (!name || !slug || seen.has(slug)) return;
    if (!/genre/i.test(href)) return;
    seen.add(slug);
    genres.push({ name, slug });
  });

  const result = genres.length > 0 ? genres : FALLBACK_GENRES;
  cacheSet(key, result, CacheTTL.genres);
  return result;
}

export async function getAnimeByGenre(
  genreSlug: string,
  page = 1,
  limit = 20
): Promise<{ results: AnimeSearchResult[]; pagination: Pagination }> {
  const key = cacheKey("genre", genreSlug, page, limit);
  const cached = cacheGet<{ results: AnimeSearchResult[]; pagination: Pagination }>(key);
  if (cached) return cached;

  const path =
    page > 1
      ? `/genre/${genreSlug}/page/${page}/`
      : `/genre/${genreSlug}/`;

  const html = await fetchHtml(path);
  const $ = cheerio.load(html);
  const base = getBaseUrl();
  const results: AnimeSearchResult[] = [];
  const seen = new Set<string>();

  $(SELECTORS.searchItem).each((_, el) => {
    const $el = $(el);
    const href =
      $el.find("a").first().attr("href");
    const slug = extractSlug(href);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);

    const title =
      cleanText($el.find(SELECTORS.searchTitle).first().text()) ||
      cleanText($el.find("img").attr("alt")) ||
      slug;
    const thumb =
      $el.find("img").attr("src") || $el.find("img").attr("data-src") || null;
    const typeText = cleanText($el.find(SELECTORS.searchType).first().text());
    const statusText = cleanText($el.find(SELECTORS.searchStatus).first().text());
    const epMatch = statusText.match(/(\d+)/);

    results.push({
      id: slug,
      slug,
      title,
      url: absoluteUrl(href, base),
      thumbnail: thumb ? absoluteUrl(thumb, base) : null,
      type: detectType(typeText),
      status: detectStatus(statusText),
      latestEpisode: epMatch ? epMatch[1] : null,
    });
  });

  const sliced = results.slice(0, limit);
  const pagination: Pagination = {
    page,
    limit,
    total: sliced.length,
    hasNext: results.length > limit,
  };

  const payload = { results: sliced, pagination };
  cacheSet(key, payload, CacheTTL.genreAnime);
  return payload;
}
