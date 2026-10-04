import { checkSourceHealth } from "@/services/samehadaku";

export const dynamic = "force-dynamic";

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        ok ? "bg-green-400" : "bg-red-400"
      }`}
    />
  );
}

export default async function StatusPage() {
  const source = await checkSourceHealth();
  const apiOk = true; // this page rendered, so API layer is up

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <h1 className="text-xl font-semibold text-ink">Status</h1>
      <p className="mt-1 text-sm text-ink-muted">KXRestApi service health</p>

      <div className="mt-8 space-y-3">
        {/* Overall */}
        <div className="flex items-center justify-between rounded-md border border-surface-border bg-surface-raised px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">KXRestApi</p>
            <p className="text-xs text-ink-dim">Overall</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot ok={apiOk && source.ok} />
            <span
              className={`text-sm font-medium ${
                apiOk && source.ok ? "text-green-400" : "text-red-400"
              }`}
            >
              {apiOk && source.ok ? "Operational" : "Degraded"}
            </span>
          </div>
        </div>

        {/* API */}
        <div className="flex items-center justify-between rounded-md border border-surface-border bg-surface-raised px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">API</p>
            <p className="text-xs text-ink-dim">Route handlers</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot ok={apiOk} />
            <span className="text-sm font-medium text-green-400">
              Operational
            </span>
          </div>
        </div>

        {/* Source */}
        <div className="flex items-center justify-between rounded-md border border-surface-border bg-surface-raised px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">Samehadaku Source</p>
            <p className="text-xs text-ink-dim">
              {source.message}
              {source.latency > 0 && ` · ${source.latency}ms`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot ok={source.ok} />
            <span
              className={`text-sm font-medium ${
                source.ok ? "text-green-400" : "text-red-400"
              }`}
            >
              {source.ok ? "Operational" : "Unavailable"}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-ink-dim">
        Source status is checked server-side on each page load. Cloudflare
        protection on the upstream may occasionally affect reachability.
      </p>
    </div>
  );
}
