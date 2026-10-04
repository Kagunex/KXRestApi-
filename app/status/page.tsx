import { checkSourceReachable } from "@/services/samehadaku";
import { StatusIndicator } from "@/components/status-indicator";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const source = await checkSourceReachable();
  const apiOk = true;
  const overall = apiOk && source.ok;
  const checkedAt = new Date().toISOString();

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <h1 className="text-xl font-semibold text-ink">Status</h1>
      <p className="mt-1 text-sm text-ink-muted">KXRestApi service health</p>

      <div className="mt-8 space-y-3">
        <StatusIndicator
          ok={overall}
          label="KXRestApi"
          detail="Overall"
        />
        <StatusIndicator
          ok={apiOk}
          label="API"
          detail="Route handlers"
        />
        <StatusIndicator
          ok={source.ok}
          label="Samehadaku Source"
          detail={`${source.message}${source.latency > 0 ? ` · ${source.latency}ms` : ""}`}
        />
      </div>

      <p className="mt-6 text-xs text-ink-dim">
        Last checked: {checkedAt}
      </p>
      <p className="mt-2 text-xs text-ink-dim">
        Source status is checked server-side on each page load. Cloudflare
        protection on the upstream may occasionally affect reachability.
      </p>
    </div>
  );
}
