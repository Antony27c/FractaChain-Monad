"use client";

import type { CSSProperties } from "react";
import { useT } from "@/lib/i18n";
import Link from "next/link";
import type { Lot } from "@/hooks/useLots";
import { formatPricePerShard, timeLeft } from "@/lib/format";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";

export function LotCard({
  lot,
  now,
  index = 0,
  featured = false,
}: {
  lot: Lot;
  now: bigint;
  index?: number;
  featured?: boolean;
}) {
  const t = useT();
  return (
    <Link
      href={`/lots/${lot.offering}`}
      style={{ "--i": index } as CSSProperties}
      className={`reveal crystal-card group block rounded-2xl transition duration-300 hover:-translate-y-0.5 hover:border-accent/50 active:translate-y-0 active:scale-[0.99] ${
        featured ? "p-6 md:p-8" : "p-6"
      }`}
    >
      <div className={featured ? "grid gap-8 md:grid-cols-[1.1fr_1fr] md:gap-12" : "space-y-6"}>
        <div className="flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3
                className={`font-semibold tracking-tight ${featured ? "text-2xl md:text-3xl md:leading-tight" : "text-lg"}`}
              >
                {lot.name}
              </h3>
              <StatusBadge status={lot.status} />
            </div>
            <p className="mt-2 text-sm text-muted">
              {lot.asset.assetType}, {lot.asset.quantity.toString()} {lot.asset.unit}, {t("campaña", "season")} {lot.asset.campaign}
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted">{t("Precio", "Price")}</dt>
              <dd className="mt-1 font-mono font-medium tabular-nums">{formatPricePerShard(lot.pricePerShard)}</dd>
            </div>
            <div>
              <dt className="text-muted">Token</dt>
              <dd className="mt-1 font-mono font-medium">{lot.symbol}</dd>
            </div>
            <div>
              <dt className="text-muted">{t("Plazo", "Time left")}</dt>
              <dd className="mt-1 font-mono font-medium tabular-nums">{timeLeft(lot.deadline, now, t("Finalizada", "Ended"))}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col justify-end">
          <ProgressBar raised={lot.totalRaised} softCap={lot.softCap} hardCap={lot.hardCap} index={index} />
        </div>
      </div>
    </Link>
  );
}

export function LotCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      aria-hidden
      className={`skeleton rounded-2xl border border-line bg-surface ${featured ? "p-6 md:p-8" : "p-6"}`}
    >
      <div className={featured ? "grid gap-8 md:grid-cols-[1.1fr_1fr] md:gap-12" : "space-y-6"}>
        <div className="space-y-4">
          <div className="h-6 w-2/3 rounded-lg bg-line" />
          <div className="h-4 w-1/2 rounded-lg bg-line" />
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="h-9 rounded-lg bg-line" />
            <div className="h-9 rounded-lg bg-line" />
            <div className="h-9 rounded-lg bg-line" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-6 w-1/3 rounded-lg bg-line" />
          <div className="h-2 rounded-full bg-line" />
          <div className="h-4 w-full rounded-lg bg-line" />
        </div>
      </div>
    </div>
  );
}
