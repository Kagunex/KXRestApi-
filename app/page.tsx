"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { JsonViewer } from "@/components/json-viewer";
import Link from "next/link";

export default function HomePage() {
  const [query, setQuery] = useState("naruto");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [response, setResponse] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    const q = query.trim();

    if (!q) {
      setError("Query is required");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);
    setResponse(null);
    setResponseTime(null);

    const start = Date.now();

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);

      setResponseTime(Date.now() - start);
      setStatus(res.status);

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setResponseTime(Date.now() - start);
    } finally {
      setLoading(false);
    }
  };

  const statusColor =
    status === null
      ? ""
      : status >= 200 && status < 300
        ? "text-green-400"
        : status >= 400 && status < 500
          ? "text-yellow-400"
          : "text-red-400";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          KXRestApi
        </h1>

        <p className="mt-1 text-sm text-ink-muted">
          Anime data, served clean.
        </p>
      </div>

      <div className="rounded-md border border-surface-border bg-surface-raised">
        <div className="border-b border-surface-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent">
              GET
            </span>

            <code className="text-sm text-ink-muted">
              /api/search
            </code>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label
              htmlFor="home-q"
              className="shrink-0 text-sm text-ink-muted sm:w-8"
            >
              q
            </label>

            <div className="flex flex-1 gap-2">
              <input
                id="home-q"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSend();
                  }
                }}
                placeholder="naruto"
                className="w-full rounded border border-surface-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:border-accent focus:outline-none"
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={loading}
                className="inline-flex shrink-0 items-center gap-1.5 rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
              >
                {loading ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden
                  />
                ) : (
                  <Send
                    className="h-4 w-4"
                    aria-hidden
                  />
                )}

                <span className="hidden sm:inline">
                  Send
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {(status !== null || response !== null) && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                {status !== null && (
                  <span
                    className={`text-sm font-medium ${statusColor}`}
                  >
                    {status}{" "}
                    {status >= 200 && status < 300
                      ? "OK"
                      : ""}
                  </span>
                )}

                {responseTime !== null && (
                  <span className="text-xs text-ink-dim">
                    {responseTime}ms
                  </span>
                )}
              </div>

              {response !== null && (
                <JsonViewer data={response} />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          {
            href: "/docs",
            label: "Documentation",
            desc: "All endpoints",
          },
          {
            href: "/status",
            label: "Status",
            desc: "Service health",
          },
          {
            href: "/api/health",
            label: "Health",
            desc: "GET /api/health",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md border border-surface-border bg-surface-raised px-4 py-3 transition-colors hover:border-accent/40 hover:bg-surface-overlay"
          >
            <p className="text-sm font-medium text-ink">
              {item.label}
            </p>

            <p className="mt-0.5 text-xs text-ink-dim">
              {item.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
