"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDate, formatPricePerShard, timeLeft } from "@/lib/format";
import { button, notice, panel } from "@/lib/ui";
import { useLots, useNow } from "@/hooks/useLots";
import { useInvestor } from "@/hooks/useInvestor";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { LotActions } from "@/components/LotActions";
import { AssetSheet } from "@/components/AssetSheet";
import { useI18n, useT } from "@/lib/i18n";

const step = (i: number) => ({ "--i": i }) as CSSProperties;

function LotSkeleton() {
  const t = useT();
  return (
    <div aria-busy="true" aria-label={t("Cargando lote", "Loading lot")} className="skeleton mt-6 grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-12">
      <div className="space-y-10">
        <div className="space-y-3">
          <div className="h-9 w-2/3 rounded-lg bg-line" />
          <div className="h-4 w-1/3 rounded-lg bg-line" />
        </div>
        <div className="space-y-3">
          <div className="h-6 w-1/4 rounded-lg bg-line" />
          <div className="h-2 rounded-full bg-line" />
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="h-10 rounded-lg bg-line" />
          <div className="h-10 rounded-lg bg-line" />
          <div className="h-10 rounded-lg bg-line" />
          <div className="h-10 rounded-lg bg-line" />
        </div>
      </div>
      <div className={`${panel} h-72`} />
    </div>
  );
}

export default function LotPage() {
  const { offering: offeringParam } = useParams<{ offering: string }>();
  const { lots, isLoading, error } = useLots();
  const now = useNow();
  const lot = lots.find((l) => l.offering.toLowerCase() === offeringParam.toLowerCase());
  const investor = useInvestor(lot?.offering);
  const t = useT();
  const { locale } = useI18n();

  const back = (
    <Link href="/market" className="text-sm text-muted transition-colors hover:text-ink">
      &larr; {t("Licitaciones", "Auctions")}
    </Link>
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-6 md:pt-10">
        {back}
        <LotSkeleton />
      </div>
    );
  }

  if (!lot && error) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-6 md:pt-10">
        {back}
        <p role="alert" className={`${notice.bad} mt-6`}>
          {t("No pudimos leer el lote de la cadena. Reintentando...", "We could not read the lot from the chain. Retrying...")} ({error.message.slice(0, 200)})
        </p>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-6 md:pt-10">
        {back}
        <div className="mt-6 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <p className="text-lg font-medium tracking-tight">{t("No encontramos ese lote", "We couldn't find that lot")}</p>
          <p className="mx-auto mt-2 max-w-[44ch] text-sm text-muted">
            {t("Puede que la dirección esté mal escrita o que el lote sea de otra red.", "The address may be mistyped, or the lot may be on another network.")}
          </p>
          <Link href="/market" className={`${button.primary} mt-6`}>
            {t("Ver licitaciones", "View auctions")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-6 md:pt-10">
      {back}

      <div className="mt-6 grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-12">
        <section className="lg:sticky lg:top-6 lg:self-start">
          <header className="reveal" style={step(0)}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-tighter md:text-4xl">{lot.name}</h1>
              <StatusBadge status={lot.status} />
            </div>
            <p className="mt-2 text-muted">
              {lot.asset.assetType}, {lot.asset.quantity.toString()} {lot.asset.unit}, {t("campaña", "season")} {lot.asset.campaign}
            </p>
          </header>

          <div className="reveal mt-10" style={step(1)}>
            <ProgressBar raised={lot.totalRaised} softCap={lot.softCap} hardCap={lot.hardCap} index={1} />
          </div>

          <dl
            className="reveal mt-10 grid grid-cols-2 gap-6 border-t border-line pt-6 text-sm sm:grid-cols-4"
            style={step(2)}
          >
            <div>
              <dt className="text-muted">{t("Precio por shard", "Price per shard")}</dt>
              <dd className="mt-1 font-mono font-medium tabular-nums">{formatPricePerShard(lot.pricePerShard)}</dd>
            </div>
            <div>
              <dt className="text-muted">Token</dt>
              <dd className="mt-1 font-mono font-medium">{lot.symbol}</dd>
            </div>
            <div>
              <dt className="text-muted">{t("Cierra", "Closes")}</dt>
              <dd className="mt-1 font-medium tabular-nums">{formatDate(lot.deadline, locale)}</dd>
            </div>
            <div>
              <dt className="text-muted">{t("Tiempo restante", "Time left")}</dt>
              <dd className="mt-1 font-mono font-medium tabular-nums">{timeLeft(lot.deadline, now, t("Finalizada", "Ended"))}</dd>
            </div>
          </dl>

          <div
            className="reveal mt-12 grid gap-10 border-t border-line pt-8"
            style={step(3)}
          >
            <div>
              <h2 className="font-semibold tracking-tight">{t("Cómo funciona", "How it works")}</h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted marker:font-mono marker:text-ink">
                <li>{t("Aportás USDC a precio fijo. Tu dirección debe estar verificada (KYC).", "You contribute USDC at a fixed price. Your address must be verified (KYC).")}</li>
                <li>{t("Si se alcanza el mínimo, el emisor recibe los fondos y vos reclamás tus shards.", "If the minimum is reached, the issuer receives the funds and you claim your shards.")}</li>
                <li>{t("Si no se alcanza, recuperás todo tu USDC.", "If it is not reached, you get all your USDC back.")}</li>
                <li>{t("Después, los shards se negocian en el order book de Kuru.", "Then the shards trade on Kuru's order book.")}</li>
              </ol>
            </div>
            <AssetSheet lot={lot} />
          </div>
        </section>

        <aside className="lg:min-w-0">
          <LotActions lot={lot} account={investor.address} />
        </aside>
      </div>
    </div>
  );
}
