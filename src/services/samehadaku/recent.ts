import * as cheerio from "cheerio";
import type { AnimeSearchResult, Pagination } from "@/types/anime";
import { cacheGet, cacheSet, cacheKey, CacheTTL } from "@/lib/cache";
import { fetchHtml, getBaseUrl } from "./client";
import {
  SELECTORS,
  cleanText,
  extractSlug,
  absoluteUrl,
} from "./parser";

export async function getRecentAnime(
  page = 1,
  limit = 20
): Promise<{ results: AnimeSearchResult[]; pagination: Pagination }> {
  const key = cacheKey("recent", page, limit);
  const cached = cacheGet<{ results: AnimeSearchResult[]; pagination: Pagination }>(key);
  if (cached) return cached;

  const path = page > 1 ? `/page/${page}/` : "/";
  const html = await fetchHtml(path);
  const $ = cheerio.load(html);
  const base = getBaseUrl();
  const results: AnimeSearchResult[] = [];
  const seen = new Set<string>();

  $(SELECTORS.recentItem).each((_, el) => {
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
      $el.find("img").attr("src") || $el.find("img").attr("data-src") || null;
    const epText = cleanText($el.find(".epx, .episode, .status").first().text());
    const epMatch = epText.match(/(\d+)/);

    results.push({
      id: slug,
      slug,
      title,
      url: absoluteUrl(href, base),
      thumbnail: thumb ? absoluteUrl(thumb, base) : null,
      type: "TV",
      status: "Ongoing",
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
  cacheSet(key, payload, CacheTTL.recent);
  return payload;
}
