import * as cheerio from "cheerio";
import type { AnimeSearchResult, Pagination } from "@/types/anime";
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

export async function searchAnime(
  query: string,
  page = 1,
  limit = 20
): Promise<{ results: AnimeSearchResult[]; pagination: Pagination }> {
  const key = cacheKey("search", query.toLowerCase(), page, limit);
  const cached = cacheGet<{ results: AnimeSearchResult[]; pagination: Pagination }>(key);
  if (cached) return cached;

  const path =
    page > 1
      ? `/page/${page}/?s=${encodeURIComponent(query)}`
      : `/?s=${encodeURIComponent(query)}`;

  const html = await fetchHtml(path);
  const $ = cheerio.load(html);
  const base = getBaseUrl();
  const results: AnimeSearchResult[] = [];
  const seen = new Set<string>();

  $(SELECTORS.searchItem).each((_, el) => {
    const $el = $(el);
    const href =
      $el.find(SELECTORS.searchLink).first().attr("href") ||
      $el.find("a").first().attr("href");
    const slug = extractSlug(href);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);

    const title =
      cleanText($el.find(SELECTORS.searchTitle).first().text()) ||
      cleanText($el.find("a").first().attr("title")) ||
      cleanText($el.find("img").attr("alt")) ||
      slug;

    const thumbRaw =
      $el.find(SELECTORS.searchThumb).attr("src") ||
      $el.find("img").attr("data-src") ||
      $el.find("img").attr("src") ||
      null;

    const typeText = cleanText($el.find(SELECTORS.searchType).first().text());
    const statusText = cleanText($el.find(SELECTORS.searchStatus).first().text());
    const epMatch = statusText.match(/(\d+)/);

    results.push({
      id: slug,
      slug,
      title,
      url: absoluteUrl(href, base),
      thumbnail: thumbRaw ? absoluteUrl(thumbRaw, base) : null,
      type: detectType(typeText),
      status: detectStatus(statusText),
      latestEpisode: epMatch ? epMatch[1] : null,
    });
  });

  // Fallback broader scan
  if (results.length === 0) {
    $("article, .bs, .animepost").each((_, el) => {
      const $el = $(el);
      const href = $el.find("a").first().attr("href");
      const slug = extractSlug(href);
      if (!slug || seen.has(slug)) return;
      if (!href) return;
      seen.add(slug);

      const title =
        cleanText($el.find("h2, .tt, .title").first().text()) ||
        cleanText($el.find("img").attr("alt")) ||
        slug;
      const thumb =
        $el.find("img").attr("src") || $el.find("img").attr("data-src") || null;

      results.push({
        id: slug,
        slug,
        title,
        url: absoluteUrl(href, base),
        thumbnail: thumb ? absoluteUrl(thumb, base) : null,
        type: "TV",
        status: null,
        latestEpisode: null,
      });
    });
  }

  const sliced = results.slice(0, limit);
  const pagination: Pagination = {
    page,
    limit,
    total: sliced.length,
    hasNext: results.length > limit || ($(`.pagination a, .nav-links a`).text().toLowerCase().includes("next")),
  };

  const payload = { results: sliced, pagination };
  cacheSet(key, payload, CacheTTL.search);
  return payload;
}
