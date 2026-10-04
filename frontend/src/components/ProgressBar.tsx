import type { CSSProperties } from "react";
import { formatUsdc } from "@/lib/format";

export function ProgressBar({
  raised,
  softCap,
  hardCap,
  index = 0,
}: {
  raised: bigint;
  softCap: bigint;
  hardCap: bigint;
  index?: number;
}) {
  const pct = (value: bigint) => (hardCap === 0n ? 0 : Math.min(100, Number((value * 10000n) / hardCap) / 100));
  const raisedPct = pct(raised);
  const reached = raised >= softCap;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-lg font-medium tabular-nums tracking-tight">{formatUsdc(raised)}</span>
        <span className="font-mono text-sm tabular-nums text-muted">{raisedPct.toFixed(1).replace(".", ",")}%</span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(raisedPct)}
        aria-label="Avance de la licitación respecto del máximo"
        className="relative mt-3 h-3 border-b border-line"
      >
        <div
          className="fill-in absolute bottom-0 left-0 h-1.5 w-full origin-left rounded-full bg-accent"
          style={{ transform: `scaleX(${raisedPct / 100})`, "--i": index } as CSSProperties}
        />
        <div className="absolute bottom-0 h-3 w-px bg-ink" style={{ left: `${pct(softCap)}%` }} />
      </div>

      <div className="mt-2 flex justify-between gap-3 text-xs text-muted">
        <span className={reached ? "font-medium text-ok" : undefined}>
          Mínimo {formatUsdc(softCap, 0)}
          {reached ? ", alcanzado" : ""}
        </span>
        <span>Máximo {formatUsdc(hardCap, 0)}</span>
      </div>
    </div>
  );
}
