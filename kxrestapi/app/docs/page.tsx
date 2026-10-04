"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ApiTester } from "@/components/ApiTester";

interface Endpoint {
  id: string;
  method: string;
  path: string;
  title: string;
  description: string;
  params?: {
    name: string;
    type: "query" | "path";
    required?: boolean;
    description: string;
    placeholder?: string;
    defaultValue?: string;
  }[];
  exampleResponse: unknown;
}

const endpoints: Endpoint[] = [
  {
    id: "health",
    method: "GET",
    path: "/api/health",
    title: "Health Check",
    description: "Returns the operational status of KXRestApi.",
    exampleResponse: {
      success: true,
      name: "KXRestApi",
      status: "operational",
      responseTime: 1,
    },
  },
  {
    id: "search",
    method: "GET",
    path: "/api/search",
    title: "Search Anime",
    description:
      "Search anime by title keyword. Returns a list of matching results with basic metadata.",
    params: [
      {
        name: "q",
        type: "query",
        required: true,
        description: "Search query string (max 100 characters)",
        placeholder: "naruto",
        defaultValue: "naruto",
      },
    ],
    exampleResponse: {
      success: true,
      query: "naruto",
      count: 1,
      data: [
        {
          id: "naruto",
          title: "Naruto",
          slug: "naruto",
          url: "https://v2.samehadaku.how/anime/naruto/",
          thumbnail: "https://example.com/thumb.jpg",
          type: "TV",
          status: "Completed",
          latestEpisode: "220",
        },
      ],
    },
  },
  {
    id: "anime",
    method: "GET",
    path: "/api/anime/:slug",
    title: "Anime Detail",
    description:
      "Get full metadata for a specific anime by its slug, including synopsis, genres, and episode list.",
    params: [
      {
        name: "slug",
        type: "path",
        required: true,
        description: "Anime slug identifier",
        placeholder: "naruto",
        defaultValue: "naruto",
      },
    ],
    exampleResponse: {
      success: true,
      data: {
        id: "naruto",
        title: "Naruto",
        alternativeTitles: ["ナルト"],
        thumbnail: "https://example.com/thumb.jpg",
        type: "TV",
        status: "Completed",
        score: "8.0",
        genres: ["Action", "Adventure"],
        synopsis: "Naruto Uzumaki, a mischievous adolescent ninja...",
        episodes: [
          { number: 1, title: "Episode 1", slug: "naruto-episode-1" },
        ],
        slug: "naruto",
      },
    },
  },
  {
    id: "episodes",
    method: "GET",
    path: "/api/anime/:slug/episodes",
    title: "Anime Episodes",
    description:
      "Returns the list of available episodes for an anime. Does not include video stream URLs.",
    params: [
      {
        name: "slug",
        type: "path",
        required: true,
        description: "Anime slug identifier",
        placeholder: "naruto",
        defaultValue: "naruto",
      },
    ],
    exampleResponse: {
      success: true,
      anime: { slug: "naruto", title: "Naruto" },
      count: 2,
      data: [
        { number: 1, title: "Episode 1", slug: "naruto-episode-1" },
        { number: 2, title: "Episode 2", slug: "naruto-episode-2" },
      ],
    },
  },
  {
    id: "genres",
    method: "GET",
    path: "/api/genres",
    title: "Genres",
    description: "Returns the list of available anime genres from the source.",
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
    id: "recent",
    method: "GET",
    path: "/api/recent",
    title: "Recent Anime",
    description: "Returns recently updated or newly added anime from the source.",
    exampleResponse: {
      success: true,
      count: 1,
      data: [
        {
          id: "some-anime",
          title: "Some Anime",
          slug: "some-anime",
          url: "https://v2.samehadaku.how/anime/some-anime/",
          thumbnail: "https://example.com/thumb.jpg",
          type: "TV",
          status: "Ongoing",
          latestEpisode: "12",
        },
      ],
    },
  },
];

export default function DocsPage() {
  const [active, setActive] = useState("search");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const current = endpoints.find((e) => e.id === active) || endpoints[0];

  return (
    <div className="mx-auto flex max-w-6xl">
      {/* Mobile sidebar toggle */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-lg lg:hidden"
        aria-label="Open endpoints"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-surface-border bg-surface transition-transform lg:static lg:translate-x-0 lg:shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-12 items-center justify-between border-b border-surface-border px-4 lg:h-auto lg:border-0 lg:px-4 lg:pt-6 lg:pb-2">
          <span className="text-sm font-semibold text-ink">KXRestApi</span>
          <button
            type="button"
            className="lg:hidden text-ink-muted"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-0.5 px-2 pb-6 lg:px-3">
          {endpoints.map((ep) => (
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
        </nav>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent">
              {current.method}
            </span>
            <code className="text-sm text-ink break-all">{current.path}</code>
          </div>
          <h1 className="text-xl font-semibold text-ink">{current.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{current.description}</p>
        </div>

        {/* Parameters */}
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
                    <th className="px-3 py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {current.params.map((p) => (
                    <tr
                      key={p.name}
                      className="border-b border-surface-border last:border-0"
                    >
                      <td className="px-3 py-2 font-mono text-accent">
                        {p.name}
                      </td>
                      <td className="px-3 py-2 text-ink-muted">{p.type}</td>
                      <td className="px-3 py-2 text-ink-muted">
                        {p.required ? "Yes" : "No"}
                      </td>
                      <td className="px-3 py-2 text-ink-muted">
                        {p.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Example response */}
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold text-ink">
            Example Response
          </h2>
          <pre className="overflow-x-auto rounded border border-surface-border bg-surface p-3 text-[13px] leading-relaxed text-ink-muted">
            {JSON.stringify(current.exampleResponse, null, 2)}
          </pre>
        </section>

        {/* Try it */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Try it</h2>
          <div className="rounded-md border border-surface-border bg-surface-raised p-4">
            <ApiTester
              method={current.method}
              path={
                current.path.includes(":slug")
                  ? current.path.replace(":slug", "[slug]")
                  : current.path
              }
              params={current.params?.map((p) => ({
                name: p.name,
                type: p.type,
                required: p.required,
                placeholder: p.placeholder,
                defaultValue: p.defaultValue,
              }))}
            />
          </div>
        </section>

        {/* Error format note */}
        <section className="mt-8 rounded border border-surface-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-semibold text-ink">Error Format</h2>
          <p className="mb-2 text-sm text-ink-muted">
            All errors follow a consistent structure:
          </p>
          <pre className="overflow-x-auto text-[13px] text-ink-muted">
{`{
  "success": false,
  "error": {
    "code": "INVALID_QUERY",
    "message": "Query parameter q is required"
  }
}`}
          </pre>
          <p className="mt-2 text-xs text-ink-dim">
            HTTP status codes: 400 invalid request · 404 not found · 429 rate
            limited · 500 internal · 502/503 upstream
          </p>
        </section>
      </div>
    </div>
  );
}
