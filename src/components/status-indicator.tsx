interface StatusIndicatorProps {
  ok: boolean;
  label: string;
  detail?: string;
}

export function StatusIndicator({ ok, label, detail }: StatusIndicatorProps) {
  return (
    <div className="flex items-center justify-between rounded-md border border-surface-border bg-surface-raised px-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {detail && <p className="text-xs text-ink-dim">{detail}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-green-400" : "bg-red-400"}`}
          aria-hidden
        />
        <span className={`text-sm font-medium ${ok ? "text-green-400" : "text-red-400"}`}>
          {ok ? "Operational" : "Unavailable"}
        </span>
      </div>
    </div>
  );
}
