# KXRestApi

Anime data, served clean.

KXRestApi is a lightweight REST API that provides structured anime metadata, with a built-in documentation UI and interactive API tester. Designed to deploy on Vercel as a single Next.js project.

## Features

- Clean, consistent JSON REST API
- Server-side HTML parsing (no scraping logic in the browser)
- Interactive API tester in the docs UI
- Mobile-first documentation
- In-memory caching and rate limiting (per-instance)
- Request ID and response time headers
- Ready for Vercel deployment

## Stack

- Next.js (App Router)
- TypeScript (strict)
- Tailwind CSS
- Cheerio (server-side parsing)
- Lucide React

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Service health check |
| GET | `/api/search?q=` | Search anime (`page`, `limit`) |
| GET | `/api/anime/[slug]` | Anime detail |
| GET | `/api/anime/[slug]/episodes` | Episode list (`page`, `limit`) |
| GET | `/api/episode/[id]` | Episode metadata |
| GET | `/api/recent` | Recent anime (`page`, `limit`) |
| GET | `/api/genres` | Genre list |
| GET | `/api/genre/[slug]` | Anime by genre |
| GET | `/api/schedule` | Schedule (empty if unavailable) |

## Quick Start

```bash
git clone <repo>
cd kxrestapi
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
```

## Environment

| Name | Value |
|------|-------|
| `SAMEHADAKU_BASE_URL` | `https://v2.samehadaku.how` |

## Deployment (Vercel)

1. Push to GitHub.
2. Import in Vercel.
3. Set `SAMEHADAKU_BASE_URL`.
4. Deploy.

No Express, no `app.listen()`, no `PORT`.

## Request Examples

```bash
curl "https://YOUR-DOMAIN.vercel.app/api/health"
curl "https://YOUR-DOMAIN.vercel.app/api/search?q=naruto&limit=5"
curl "https://YOUR-DOMAIN.vercel.app/api/anime/naruto"
curl "https://YOUR-DOMAIN.vercel.app/api/anime/naruto/episodes"
curl "https://YOUR-DOMAIN.vercel.app/api/recent"
curl "https://YOUR-DOMAIN.vercel.app/api/genres"
```

## Response Headers

| Header | Description |
|--------|-------------|
| `X-Request-Id` | Request identifier |
| `X-Response-Time` | Processing time (e.g. `142ms`) |

## Error Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Query parameter q is required"
  }
}
```

| Status | Code |
|--------|------|
| 400 | INVALID_REQUEST |
| 404 | NOT_FOUND |
| 429 | RATE_LIMITED |
| 500 | INTERNAL_ERROR |
| 502 | SOURCE_ERROR |
| 503 | SOURCE_UNAVAILABLE |

## Caching

In-memory, per serverless instance:

| Resource | TTL |
|----------|-----|
| Search | 30s |
| Anime detail | 5m |
| Episodes | 3m |
| Recent | 1m |
| Genres | 30m |

Cold starts reset the cache. Suitable as a short-TTL dedup layer. Swap `src/lib/cache.ts` for Redis/KV when needed.

## Rate Limiting

60 requests per IP per minute (in-memory, per instance).

Not global across Vercel regions. Interface in `src/lib/rate-limit.ts` allows a Redis-backed implementation later.

## Architecture

```
app/api/**/route.ts          → Route Handlers
src/services/samehadaku/     → Source adapter (client, parser, search, anime, …)
src/lib/                     → cache, rate-limit, validation, response, request-id
components/                  → UI (navbar, api-tester, json-viewer, …)
```

All upstream requests are server-side. The browser never talks to Samehadaku.

## Source Attribution

Metadata is parsed from [Samehadaku](https://v2.samehadaku.how). KXRestApi is not affiliated. This project does **not** proxy or return copyrighted video stream URLs — only structured metadata.

## Limitations

- Upstream may use Cloudflare; occasional 403/challenge → 503.
- HTML structure changes require selector updates in `src/services/samehadaku/parser.ts`.
- In-memory cache and rate limits reset on cold starts.
- Schedule endpoint returns empty when source has no structured schedule data.
- Public read-only API; no authentication.

## License

MIT
