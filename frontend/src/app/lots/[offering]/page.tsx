"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDate, formatPricePerShard, shortAddress, timeLeft } from "@/lib/format";
import { button, notice, panel } from "@/lib/ui";
import { useLots, useNow } from "@/hooks/useLots";
import { useInvestor } from "@/hooks/useInvestor";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { LotActions } from "@/components/LotActions";

const step = (i: number) => ({ "--i": i }) as CSSProperties;

function LotSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando lote" className="skeleton mt-6 grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-12">
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

  const back = (
    <Link href="/market" className="text-sm text-muted transition-colors hover:text-ink">
      &larr; Lotes
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
          No pudimos leer el lote de la cadena. Reintentando... ({error.message.slice(0, 200)})
        </p>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-6 md:pt-10">
        {back}
        <div className="mt-6 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <p className="text-lg font-medium tracking-tight">No encontramos ese lote</p>
          <p className="mx-auto mt-2 max-w-[44ch] text-sm text-muted">
            Puede que la dirección esté mal escrita o que el lote sea de otra red.
          </p>
          <Link href="/market" className={`${button.primary} mt-6`}>
            Ver lotes
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
              {lot.asset.assetType}, {lot.asset.quantity.toString()} {lot.asset.unit}, campaña {lot.asset.campaign}
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
              <dt className="text-muted">Precio por shard</dt>
              <dd className="mt-1 font-mono font-medium tabular-nums">{formatPricePerShard(lot.pricePerShard)}</dd>
            </div>
            <div>
              <dt className="text-muted">Token</dt>
              <dd className="mt-1 font-mono font-medium">{lot.symbol}</dd>
            </div>
            <div>
              <dt className="text-muted">Cierra</dt>
              <dd className="mt-1 font-medium tabular-nums">{formatDate(lot.deadline)}</dd>
            </div>
            <div>
              <dt className="text-muted">Tiempo restante</dt>
              <dd className="mt-1 font-mono font-medium tabular-nums">{timeLeft(lot.deadline, now)}</dd>
            </div>
          </dl>

          <div
            className="reveal mt-12 grid gap-10 border-t border-line pt-8 xl:grid-cols-[1.4fr_1fr]"
            style={step(3)}
          >
            <div>
              <h2 className="font-semibold tracking-tight">Cómo funciona</h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted marker:font-mono marker:text-ink">
                <li>Aportás USDC a precio fijo. Tu dirección debe estar verificada (KYC).</li>
                <li>Si se alcanza el mínimo, el emisor recibe los fondos y vos reclamás tus shards.</li>
                <li>Si no se alcanza, recuperás todo tu USDC.</li>
                <li>Después, los shards se negocian en el order book de Kuru.</li>
              </ol>
            </div>
            <div>
              <h2 className="font-semibold tracking-tight">Contratos</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Emisor</dt>
                  <dd className="font-mono">{shortAddress(lot.issuer)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Token</dt>
                  <dd className="font-mono">{shortAddress(lot.token)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Licitación</dt>
                  <dd className="font-mono">{shortAddress(lot.offering)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <aside className="lg:min-w-0">
          <LotActions lot={lot} account={investor.address} />
        </aside>
      </div>
    </div>
  );
}
