# KXRestApi

Anime data, served clean.

KXRestApi is a lightweight REST API that provides structured anime metadata. It includes a built-in documentation UI and interactive API tester. Designed to deploy on Vercel as a single Next.js project.

## Features

- Clean, consistent JSON REST API
- Server-side HTML parsing (no scraping logic exposed to the browser)
- Interactive API tester in the docs UI
- Mobile-first documentation
- In-memory caching and basic rate limiting
- Ready for Vercel deployment

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Cheerio (server-side parsing)
- Lucide React (icons)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Service health check |
| GET | `/api/search?q=` | Search anime by keyword |
| GET | `/api/anime/[slug]` | Anime detail by slug |
| GET | `/api/anime/[slug]/episodes` | Episode list for an anime |
| GET | `/api/genres` | Available genres |
| GET | `/api/recent` | Recently updated anime |

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url>
cd kxrestapi
npm install
```

### 2. Environment

Copy the example env file:

```bash
cp .env.example .env
```

Contents of `.env`:

```
SAMEHADAKU_BASE_URL=https://v2.samehadaku.how
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build

```bash
npm run build
```

## Deployment (Vercel)

1. Push the repository to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set the environment variable:

   | Name | Value |
   |------|-------|
   | `SAMEHADAKU_BASE_URL` | `https://v2.samehadaku.how` |

4. Deploy. No special build settings required.

The project uses Next.js Route Handlers only. There is no Express server, no `app.listen()`, and no `PORT` requirement.

## Request Examples

### Health

```bash
curl "https://YOUR-DOMAIN.vercel.app/api/health"
```

```json
{
  "success": true,
  "name": "KXRestApi",
  "status": "operational",
  "responseTime": 1
}
```

### Search

```bash
curl "https://YOUR-DOMAIN.vercel.app/api/search?q=naruto"
```

```json
{
  "success": true,
  "query": "naruto",
  "count": 10,
  "data": [
    {
      "id": "naruto",
      "title": "Naruto",
      "slug": "naruto",
      "url": "...",
      "thumbnail": "...",
      "type": "TV",
      "status": "Completed",
      "latestEpisode": "220"
    }
  ]
}
```

### Anime Detail

```bash
curl "https://YOUR-DOMAIN.vercel.app/api/anime/naruto"
```

### Episodes

```bash
curl "https://YOUR-DOMAIN.vercel.app/api/anime/naruto/episodes"
```

### Genres

```bash
curl "https://YOUR-DOMAIN.vercel.app/api/genres"
```

### Recent

```bash
curl "https://YOUR-DOMAIN.vercel.app/api/recent"
```

## Error Format

All errors use a consistent shape:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUERY",
    "message": "Query parameter q is required"
  }
}
```

| HTTP Status | Meaning |
|-------------|---------|
| 400 | Invalid request (missing/invalid parameters) |
| 404 | Resource not found |
| 429 | Rate limited |
| 500 | Internal error |
| 502 / 503 | Upstream source problem |

Stack traces are never returned to the client.

## Caching

In-memory cache (per serverless instance):

| Resource | TTL |
|----------|-----|
| Search | 30 seconds |
| Anime detail | 5 minutes |
| Genres | 30 minutes |
| Recent | 30 seconds |

Cache is process-local. On Vercel, cold starts reset the cache. This is intentional and keeps the project free of external cache services.

## Rate Limiting

Simple in-memory rate limit: **60 requests per IP per minute**.

Limitations on serverless:

- State is per-instance, not global across all edge/serverless regions.
- Cold starts reset counters.
- Sufficient for basic abuse protection; not a replacement for a dedicated gateway.

## Architecture

```
app/api/.../route.ts   →  Next.js Route Handlers (REST endpoints)
src/services/samehadaku.ts  →  Server-side fetch + Cheerio parsing
src/lib/cache.ts       →  In-memory cache + rate limiter
src/lib/response.ts    →  Consistent JSON response helpers
src/types/anime.ts     →  Shared TypeScript types
```

All upstream requests happen server-side. The browser never talks to the source site.

## Source Attribution

Metadata is parsed from [Samehadaku](https://v2.samehadaku.how). KXRestApi is not affiliated with Samehadaku. This project does **not** proxy or return copyrighted video stream URLs — only structured metadata (titles, thumbnails, episode lists, genres, etc.).

## Limitations

- Upstream site may use Cloudflare protection. Occasional 403/challenge responses can cause temporary upstream errors.
- HTML structure changes on the source may break selectors. Selectors are centralized in `src/services/samehadaku.ts` for easy updates.
- In-memory cache and rate limits reset on cold starts (serverless).
- No authentication or API keys. Public read-only API.

## License

MIT
