import { formatUsdc } from "@/lib/format";

export function ProgressBar({ raised, softCap, hardCap }: { raised: bigint; softCap: bigint; hardCap: bigint }) {
  const pct = (value: bigint) => (hardCap === 0n ? 0 : Math.min(100, Number((value * 10000n) / hardCap) / 100));
  const reached = raised >= softCap;

  return (
    <div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className={`h-full rounded-full ${reached ? "bg-emerald-500" : "bg-violet-500"}`}
          style={{ width: `${pct(raised)}%` }}
        />
        <div className="absolute top-0 h-full w-0.5 bg-neutral-700" style={{ left: `${pct(softCap)}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-neutral-600">
        <span>{formatUsdc(raised)} recaudados</span>
        <span>
          Mínimo {formatUsdc(softCap, 0)} · Máximo {formatUsdc(hardCap, 0)}
        </span>
      </div>
    </div>
  );
}
