"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import type { Lot } from "@/hooks/useLots";
import { useKuruMarket } from "@/hooks/useKuruMarket";
import { addresses } from "@/lib/env";
import { panel } from "@/lib/ui";
import { ParticipationPanel } from "@/components/ParticipationPanel";
import { MarketClosed, MarketSummary } from "@/components/SecondaryMarket";
import { TradePanel } from "@/components/TradePanel";
import { AddLiquidityForm } from "@/components/AddLiquidityForm";
import { HarvestRedemptionPanel } from "@/components/HarvestRedemptionPanel";

type TabId = "position" | "trade" | "liquidity" | "harvest";

const cols = "grid gap-6 md:grid-cols-2 md:gap-8";

function Intro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted">{children}</p>
    </div>
  );
}

export function LotActions({ lot, account }: { lot: Lot; account?: `0x${string}` }) {
  const succeeded = lot.status === "succeeded";
  const kuru = useKuruMarket(lot.token);
  const [tab, setTab] = useState<TabId>("trade");

  const tabs: { id: TabId; label: string }[] = [
    { id: "position", label: "Mi posición" },
    { id: "trade", label: "Comerciar" },
    { id: "liquidity", label: "Liquidez" },
    ...(addresses.redemption ? [{ id: "harvest" as const, label: "Cosecha" }] : []),
  ];

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = tabs.findIndex((t) => t.id === tab);
    setTab(tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length].id);
  };

  if (!succeeded) {
    return (
      <div className={`${panel} reveal p-6`}>
        <Intro title="Tu participación">Aportá, finalizá o recuperá tus fondos según el estado del lote.</Intro>
        <ParticipationPanel lot={lot} />
      </div>
    );
  }

  const open = Boolean(kuru.info);
  const hide = (id: TabId) => (tab === id ? "" : "hidden");

  return (
    <div className={`${panel} reveal p-6`}>
      <div role="tablist" aria-label="Acciones del lote" onKeyDown={onKey} className="-mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-line px-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="panel-position" aria-labelledby="tab-position" className={hide("position")}>
        <Intro title="Tu participación">Tus saldos en este lote y los shards que podés reclamar.</Intro>
        <ParticipationPanel lot={lot} />
      </div>

      <div role="tabpanel" id="panel-trade" aria-labelledby="tab-trade" className={hide("trade")}>
        <Intro title="Mercado secundario">Comprá o vendé shards a precio de mercado en el order book de Kuru.</Intro>
        {kuru.loading || !open ? (
          <MarketClosed lot={lot} kuru={kuru} account={account} />
        ) : (
          <div className={cols}>
            <MarketSummary lot={lot} kuru={kuru} />
            <TradePanel lot={lot} market={kuru.info!} account={account} />
          </div>
        )}
      </div>

      <div role="tabpanel" id="panel-liquidity" aria-labelledby="tab-liquidity" className={hide("liquidity")}>
        <Intro title="Liquidez del vault">
          Depositá shards y USDC para que cada orden mueva menos el precio y cobrá parte de las comisiones.
        </Intro>
        {open && kuru.vault && kuru.vaultBestAsk !== undefined && account ? (
          <AddLiquidityForm lot={lot} market={kuru.info!} vault={kuru.vault} vaultBestAsk={kuru.vaultBestAsk} account={account} />
        ) : (
          <p className="text-sm text-muted">
            {account ? "El mercado todavía no está abierto." : "Iniciá sesión para aportar liquidez."}
          </p>
        )}
      </div>

      {addresses.redemption && (
        <div role="tabpanel" id="panel-harvest" aria-labelledby="tab-harvest" className={hide("harvest")}>
          <Intro title="Liquidación de la cosecha">
            Cuando el emisor vende la cosecha, cada {lot.symbol} se canjea por su parte proporcional en USDC.
          </Intro>
          <HarvestRedemptionPanel lot={lot} account={account} />
        </div>
      )}
    </div>
  );
}
