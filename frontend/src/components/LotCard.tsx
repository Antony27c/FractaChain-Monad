import Link from "next/link";
import type { Lot } from "@/hooks/useLots";
import { formatPricePerShard, timeLeft } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";

export function LotCard({ lot, now }: { lot: Lot; now: bigint }) {
  return (
    <Link
      href={`/lots/${lot.offering}`}
      className="block rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-violet-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{lot.name}</h3>
          <p className="mt-1 text-sm text-neutral-600">
            {lot.asset.assetType} · {lot.asset.quantity.toString()} {lot.asset.unit} · Campaña {lot.asset.campaign}
          </p>
        </div>
        <StatusBadge status={lot.status} />
      </div>

      <div className="mt-5">
        <ProgressBar raised={lot.totalRaised} softCap={lot.softCap} hardCap={lot.hardCap} />
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-4 text-sm">
        <div>
          <dt className="text-neutral-500">Precio</dt>
          <dd className="font-medium">{formatPricePerShard(lot.pricePerShard)}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Token</dt>
          <dd className="font-mono font-medium">{lot.symbol}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Cierra en</dt>
          <dd className="font-medium">{timeLeft(lot.deadline, now)}</dd>
        </div>
      </dl>
    </Link>
  );
}
