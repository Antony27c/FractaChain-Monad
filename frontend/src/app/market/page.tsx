"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { LotCard, LotCardSkeleton } from "@/components/LotCard";
import { useLots, useNow } from "@/hooks/useLots";
import { contractsConfigured } from "@/lib/env";
import { formatUsdc } from "@/lib/format";
import { button, notice } from "@/lib/ui";
import { useI18n } from "@/lib/i18n";

const step = (i: number) => ({ "--i": i }) as CSSProperties;

export default function MarketPage() {
  const { lots, isLoading, error } = useLots();
  const now = useNow();
  const { t } = useI18n();

  const openLots = lots.filter((lot) => lot.status === "active").length;
  const totalRaised = lots.reduce((sum, lot) => sum + lot.totalRaised, 0n);
  const [featured, ...rest] = lots;

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6">
      <section className="grid items-end gap-10 pb-12 pt-16 md:pb-16 md:pt-20 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <div>
          <h1 className="reveal max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tighter md:text-5xl" style={step(0)}>
            {t("home.title")}
            <span className="hero-lcd">{t("home.titleAccent")}</span>
          </h1>
          <p className="reveal mt-5 max-w-[52ch] text-base leading-relaxed text-muted" style={step(1)}>
            {t("home.lead")}
          </p>
          <div className="reveal mt-8 flex flex-wrap items-center gap-3" style={step(2)}>
            <a href="#lotes" className={button.primary}>
              {t("home.viewLots")}
            </a>
            <Link href="/create" className={button.secondary}>
              {t("nav.create")}
            </Link>
          </div>
        </div>

        {contractsConfigured && lots.length > 0 && (
          <dl className="reveal grid grid-cols-2 gap-6 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0" style={step(3)}>
            <div>
              <dt className="text-sm text-muted">{t("home.openLots")}</dt>
              <dd className="mt-1 font-mono text-3xl font-medium tabular-nums tracking-tight">{openLots}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">{t("home.raised")}</dt>
              <dd className="mt-1 font-mono text-3xl font-medium tabular-nums tracking-tight">
                {formatUsdc(totalRaised, 0).replace(" USDC", "")}
              </dd>
              <dd className="font-mono text-xs text-muted">USDC</dd>
            </div>
          </dl>
        )}
      </section>

      {!contractsConfigured && (
        <p className={notice.warn}>
          Faltan las direcciones de los contratos. Completá <code>NEXT_PUBLIC_FACTORY</code>,{" "}
          <code>NEXT_PUBLIC_KYC</code> y <code>NEXT_PUBLIC_USDC</code> en <code>.env.local</code>, o corré el deploy
          local (ver el README del frontend).
        </p>
      )}

      {contractsConfigured && (
        <section id="lotes" className="scroll-mt-6 pb-20">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">{t("home.lots")}</h2>

          {error && (
            <p role="alert" className={notice.bad}>
              No se pudieron leer los lotes. ¿Está corriendo la cadena? ({error.message.slice(0, 120)})
            </p>
          )}

          {isLoading && !error && (
            <div className="space-y-5" aria-busy="true" aria-label="Cargando lotes">
              <LotCardSkeleton featured />
              <div className="grid gap-5 md:grid-cols-2">
                <LotCardSkeleton />
                <LotCardSkeleton />
              </div>
            </div>
          )}

          {!isLoading && !error && lots.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
              <p className="text-lg font-medium tracking-tight">{t("home.empty")}</p>
              <p className="mx-auto mt-2 max-w-[44ch] text-sm text-muted">{t("home.emptyHint")}</p>
              <Link href="/create" className={`${button.primary} mt-6`}>
                {t("nav.create")}
              </Link>
            </div>
          )}

          {!isLoading && featured && (
            <div className="space-y-5">
              <LotCard key={featured.offering} lot={featured} now={now} index={0} featured />
              {rest.length > 0 && (
                <div className="grid gap-5 md:grid-cols-2">
                  {rest.map((lot, i) => (
                    <LotCard key={lot.offering} lot={lot} now={now} index={i + 1} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
