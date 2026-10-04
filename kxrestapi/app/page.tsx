"use client";

import { useState } from "react";
import { Send, Copy, Check, Loader2 } from "lucide-react";
import { JsonViewer } from "@/components/JsonViewer";

export default function HomePage() {
  const [query, setQuery] = useState("naruto");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [response, setResponse] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const copyJson = async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          KXRestApi
        </h1>
        <p className="mt-1 text-sm text-ink-muted">Anime REST API</p>
        <p className="mt-3 text-sm text-ink-dim max-w-md">
          Simple anime data API for developers.
        </p>
      </div>

      {/* Console */}
      <div className="rounded-md border border-surface-border bg-surface-raised">
        <div className="border-b border-surface-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent">
              GET
            </span>
            <code className="text-sm text-ink-muted">/api/search</code>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="shrink-0 text-sm text-ink-muted sm:w-8">
              q
            </label>
            <div className="flex flex-1 gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {(status !== null || response) && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {status !== null && (
                    <span className={`text-sm font-medium ${statusColor}`}>
                      {status}{" "}
                      {status >= 200 && status < 300 ? "OK" : ""}
                    </span>
                  )}
                  {responseTime !== null && (
                    <span className="text-xs text-ink-dim">
                      {responseTime}ms
                    </span>
                  )}
                </div>
                {response && (
                  <button
                    type="button"
                    onClick={copyJson}
                    className="inline-flex items-center gap-1 rounded border border-surface-border px-2 py-1 text-xs text-ink-muted hover:bg-surface-overlay hover:text-ink"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    Copy JSON
                  </button>
                )}
              </div>
              {response && <JsonViewer data={response} />}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { href: "/docs", label: "Documentation", desc: "All endpoints" },
          { href: "/status", label: "Status", desc: "Service health" },
          {
            href: "/api/health",
            label: "Health",
            desc: "GET /api/health",
            external: true,
          },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="rounded-md border border-surface-border bg-surface-raised px-4 py-3 transition-colors hover:border-accent/40 hover:bg-surface-overlay"
          >
            <p className="text-sm font-medium text-ink">{item.label}</p>
            <p className="mt-0.5 text-xs text-ink-dim">{item.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
