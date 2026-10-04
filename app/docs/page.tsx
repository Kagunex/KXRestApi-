"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ApiTester, type ParamField } from "@/components/api-tester";

interface Endpoint {
  id: string;
  group: string;
  method: string;
  path: string;
  title: string;
  description: string;
  params?: ParamField[];
  exampleResponse: unknown;
}

const endpoints: Endpoint[] = [
  {
    id: "health",
    group: "System",
    method: "GET",
    path: "/api/health",
    title: "Health Check",
    description: "Returns the operational status of KXRestApi.",
    exampleResponse: {
      success: true,
      name: "KXRestApi",
      status: "operational",
      timestamp: "2026-01-01T00:00:00.000Z",
      responseTime: 1,
    },
  },
  {
    id: "search",
    group: "Anime",
    method: "GET",
    path: "/api/search",
    title: "Search Anime",
    description: "Search anime by title keyword. Supports pagination.",
    params: [
      { name: "q", type: "query", required: true, placeholder: "naruto", defaultValue: "naruto" },
      { name: "page", type: "query", placeholder: "1", defaultValue: "1" },
      { name: "limit", type: "query", placeholder: "20", defaultValue: "10" },
    ],
    exampleResponse: {
      success: true,
      query: "naruto",
      pagination: { page: 1, limit: 10, total: 1, hasNext: false },
      data: [
        {
          id: "naruto",
          slug: "naruto",
          title: "Naruto",
          url: "https://v2.samehadaku.how/anime/naruto/",
          thumbnail: null,
          type: "TV",
          status: "Completed",
          latestEpisode: "220",
        },
      ],
    },
  },
  {
    id: "anime",
    group: "Anime",
    method: "GET",
    path: "/api/anime/:slug",
    title: "Anime Detail",
    description: "Get full metadata for a specific anime by slug.",
    params: [
      { name: "slug", type: "path", required: true, placeholder: "naruto", defaultValue: "naruto" },
    ],
    exampleResponse: {
      success: true,
      data: {
        id: "naruto",
        slug: "naruto",
        title: "Naruto",
        alternativeTitles: [],
        thumbnail: null,
        type: "TV",
        status: "Completed",
        released: null,
        duration: null,
        season: null,
        studio: null,
        producers: [],
        genres: ["Action", "Adventure"],
        synopsis: "...",
        episodeCount: 220,
      },
    },
  },
  {
    id: "episodes",
    group: "Anime",
    method: "GET",
    path: "/api/anime/:slug/episodes",
    title: "Anime Episodes",
    description: "List available episodes for an anime. Does not include video stream URLs.",
    params: [
      { name: "slug", type: "path", required: true, placeholder: "naruto", defaultValue: "naruto" },
      { name: "page", type: "query", placeholder: "1", defaultValue: "1" },
      { name: "limit", type: "query", placeholder: "50", defaultValue: "20" },
    ],
    exampleResponse: {
      success: true,
      anime: { id: "naruto", slug: "naruto", title: "Naruto" },
      pagination: { page: 1, limit: 20, total: 220, hasNext: true },
      data: [{ id: "naruto-episode-1", animeId: "naruto", number: 1, title: "Episode 1", slug: "naruto-episode-1", url: "...", thumbnail: null, releasedAt: null }],
    },
  },
  {
    id: "episode",
    group: "Anime",
    method: "GET",
    path: "/api/episode/:id",
    title: "Episode Detail",
    description: "Get metadata for a single episode. Does not return video stream URLs.",
    params: [
      { name: "id", type: "path", required: true, placeholder: "naruto-episode-1", defaultValue: "naruto-episode-1" },
    ],
    exampleResponse: {
      success: true,
      data: {
        id: "naruto-episode-1",
        animeId: "naruto",
        number: 1,
        title: "Episode 1",
        slug: "naruto-episode-1",
        url: "...",
        thumbnail: null,
        releasedAt: null,
      },
    },
  },
  {
    id: "recent",
    group: "Discovery",
    method: "GET",
    path: "/api/recent",
    title: "Recent Anime",
    description: "Recently updated anime from the source.",
    params: [
      { name: "page", type: "query", placeholder: "1", defaultValue: "1" },
      { name: "limit", type: "query", placeholder: "20", defaultValue: "10" },
    ],
    exampleResponse: {
      success: true,
      pagination: { page: 1, limit: 10, total: 10, hasNext: false },
      data: [],
    },
  },
  {
    id: "genres",
    group: "Discovery",
    method: "GET",
    path: "/api/genres",
    title: "Genres",
    description: "List of available genres.",
    exampleResponse: {
      success: true,
      count: 3,
      data: [
        { name: "Action", slug: "action" },
        { name: "Adventure", slug: "adventure" },
        { name: "Comedy", slug: "comedy" },
      ],
    },
  },
  {
    id: "genre",
    group: "Discovery",
    method: "GET",
    path: "/api/genre/:slug",
    title: "Anime by Genre",
    description: "List anime filtered by genre slug.",
    params: [
      { name: "slug", type: "path", required: true, placeholder: "action", defaultValue: "action" },
      { name: "page", type: "query", placeholder: "1", defaultValue: "1" },
      { name: "limit", type: "query", placeholder: "20", defaultValue: "10" },
    ],
    exampleResponse: {
      success: true,
      genre: "action",
      pagination: { page: 1, limit: 10, total: 10, hasNext: false },
      data: [],
    },
  },
  {
    id: "schedule",
    group: "Discovery",
    method: "GET",
    path: "/api/schedule",
    title: "Schedule",
    description: "Release schedule if available from source. May return empty when source does not provide structured schedule data.",
    exampleResponse: {
      success: true,
      note: "Schedule data is not available from the current source adapter.",
      data: [],
    },
  },
];

const groups = ["Anime", "Discovery", "System"];

export default function DocsPage() {
  const [active, setActive] = useState("search");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const current = endpoints.find((e) => e.id === active) || endpoints[0];

  return (
    <div className="mx-auto flex max-w-6xl">
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-lg lg:hidden"
        aria-label="Open endpoints menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform overflow-y-auto border-r border-surface-border bg-surface transition-transform lg:static lg:translate-x-0 lg:shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-12 items-center justify-between border-b border-surface-border px-4 lg:h-auto lg:border-0 lg:px-4 lg:pb-2 lg:pt-6">
          <span className="text-sm font-semibold text-ink">KXRestApi</span>
          <button
            type="button"
            className="text-ink-muted lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-4 px-2 pb-6 lg:px-3" aria-label="Endpoints">
          {groups.map((group) => (
            <div key={group}>
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-ink-dim">
                {group}
              </p>
              <div className="space-y-0.5">
                {endpoints
                  .filter((e) => e.group === group)
                  .map((ep) => (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => {
                        setActive(ep.id);
                        setSidebarOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors ${
                        active === ep.id
                          ? "bg-surface-overlay text-ink"
                          : "text-ink-muted hover:bg-surface-overlay hover:text-ink"
                      }`}
                    >
                      <span className="shrink-0 rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                        {ep.method}
                      </span>
                      <span className="truncate font-mono text-xs">{ep.path}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent">
              {current.method}
            </span>
            <code className="break-all text-sm text-ink">{current.path}</code>
          </div>
          <h1 className="text-xl font-semibold text-ink">{current.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{current.description}</p>
        </div>

        {current.params && current.params.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-ink">Parameters</h2>
            <div className="overflow-x-auto rounded border border-surface-border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-surface text-ink-dim">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Required</th>
                  </tr>
                </thead>
                <tbody>
                  {current.params.map((p) => (
                    <tr key={p.name} className="border-b border-surface-border last:border-0">
                      <td className="px-3 py-2 font-mono text-accent">{p.name}</td>
                      <td className="px-3 py-2 text-ink-muted">{p.type}</td>
                      <td className="px-3 py-2 text-ink-muted">{p.required ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold text-ink">Example Response</h2>
          <pre className="overflow-x-auto rounded border border-surface-border bg-surface p-3 text-[13px] leading-relaxed text-ink-muted">
            {JSON.stringify(current.exampleResponse, null, 2)}
          </pre>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Try it</h2>
          <div className="rounded-md border border-surface-border bg-surface-raised p-4">
            <ApiTester
              method={current.method}
              path={
                current.path
                  .replace(":slug", "[slug]")
                  .replace(":id", "[id]")
              }
              params={current.params}
            />
          </div>
        </section>

        <section className="mt-8 rounded border border-surface-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-ink">Error Format</h2>
          <p className="mb-2 text-sm text-ink-muted">All errors follow a consistent structure:</p>
          <pre className="overflow-x-auto text-[13px] text-ink-muted">{`{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Query parameter q is required"
  }
}`}</pre>
          <p className="mt-2 text-xs text-ink-dim">
            400 INVALID_REQUEST · 404 NOT_FOUND · 429 RATE_LIMITED · 500 INTERNAL_ERROR · 502 SOURCE_ERROR · 503 SOURCE_UNAVAILABLE
          </p>
        </section>
      </div>
    </div>
  );
}
