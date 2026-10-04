"use client";

import { useState, useCallback } from "react";
import { Send, Copy, Check, Loader2 } from "lucide-react";
import { JsonViewer } from "./JsonViewer";

interface ParamField {
  name: string;
  type: "query" | "path";
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}

interface ApiTesterProps {
  method?: string;
  path: string;
  params?: ParamField[];
  description?: string;
}

export function ApiTester({
  method = "GET",
  path,
  params = [],
  description,
}: ApiTesterProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    params.forEach((p) => {
      if (p.defaultValue) init[p.name] = p.defaultValue;
    });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [response, setResponse] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const buildUrl = useCallback(() => {
    let url = path;
    const queryParts: string[] = [];

    params.forEach((p) => {
      const val = values[p.name]?.trim() || "";
      if (p.type === "path") {
        url = url.replace(`:${p.name}`, encodeURIComponent(val || `{${p.name}}`));
        url = url.replace(`[${p.name}]`, encodeURIComponent(val || `{${p.name}}`));
      } else if (val) {
        queryParts.push(`${p.name}=${encodeURIComponent(val)}`);
      }
    });

    if (queryParts.length) {
      url += (url.includes("?") ? "&" : "?") + queryParts.join("&");
    }
    return url;
  }, [path, params, values]);

  const handleSend = async () => {
    // Validate required
    for (const p of params) {
      if (p.required && !values[p.name]?.trim()) {
        setError(`Parameter "${p.name}" is required`);
        setStatus(null);
        setResponse(null);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setStatus(null);
    setResponse(null);
    setResponseTime(null);

    const url = buildUrl();
    const start = Date.now();

    try {
      const res = await fetch(url);
      const elapsed = Date.now() - start;
      setResponseTime(elapsed);
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

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(
        typeof window !== "undefined"
          ? `${window.location.origin}${buildUrl()}`
          : buildUrl()
      );
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const copyJson = async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 1500);
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
    <div className="space-y-4">
      {description && (
        <p className="text-sm text-ink-muted">{description}</p>
      )}

      {/* Method + Path */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent">
          {method}
        </span>
        <code className="text-sm text-ink-muted break-all">{path}</code>
      </div>

      {/* Params */}
      {params.length > 0 && (
        <div className="space-y-2">
          {params.map((p) => (
            <div key={p.name} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <label className="w-28 shrink-0 text-sm text-ink-muted">
                {p.name}
                {p.required && <span className="text-red-400">*</span>}
                <span className="ml-1 text-xs text-ink-dim">
                  ({p.type})
                </span>
              </label>
              <input
                type="text"
                value={values[p.name] || ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [p.name]: e.target.value }))
                }
                placeholder={p.placeholder || p.name}
                className="w-full rounded border border-surface-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:border-accent focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send
        </button>
        <button
          type="button"
          onClick={copyUrl}
          className="inline-flex items-center gap-1.5 rounded border border-surface-border bg-surface px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-surface-overlay hover:text-ink"
        >
          {copiedUrl ? (
            <Check className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          Copy URL
        </button>
      </div>

      {/* Request preview */}
      <div className="rounded border border-surface-border bg-surface px-3 py-2">
        <p className="text-xs text-ink-dim mb-1">Request</p>
        <code className="text-sm break-all text-ink">
          {method} {buildUrl()}
        </code>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Response */}
      {(status !== null || response) && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              {status !== null && (
                <span className={`text-sm font-medium ${statusColor}`}>
                  {status} {status >= 200 && status < 300 ? "OK" : ""}
                </span>
              )}
              {responseTime !== null && (
                <span className="text-xs text-ink-dim">{responseTime}ms</span>
              )}
            </div>
            {response && (
              <button
                type="button"
                onClick={copyJson}
                className="inline-flex items-center gap-1 rounded border border-surface-border px-2 py-1 text-xs text-ink-muted hover:bg-surface-overlay hover:text-ink"
              >
                {copiedJson ? (
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
  );
}
