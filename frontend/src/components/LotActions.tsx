"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import type { Lot } from "@/hooks/useLots";
import { useKuruMarket } from "@/hooks/useKuruMarket";
import { addresses } from "@/lib/env";
import { panel } from "@/lib/ui";
import { useT } from "@/lib/i18n";
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
  const t = useT();

  const tabs: { id: TabId; label: string }[] = [
    { id: "position", label: t("Mi posición", "My position") },
    { id: "trade", label: t("Comerciar", "Trade") },
    { id: "liquidity", label: t("Liquidez", "Liquidity") },
    ...(addresses.redemption ? [{ id: "harvest" as const, label: t("Cosecha", "Harvest") }] : []),
  ];

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = tabs.findIndex((x) => x.id === tab);
    setTab(tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length].id);
  };

  if (!succeeded) {
    return (
      <div className={`${panel} reveal p-6`}>
        <Intro title={t("Tu participación", "Your participation")}>
          {t("Aportá, finalizá o recuperá tus fondos según el estado del lote.", "Contribute, finalize or recover your funds depending on the lot's status.")}
        </Intro>
        <ParticipationPanel lot={lot} />
      </div>
    );
  }

  const open = Boolean(kuru.info);
  const hide = (id: TabId) => (tab === id ? "" : "hidden");

  return (
    <div className={`${panel} reveal p-6`}>
      <div role="tablist" aria-label={t("Acciones del lote", "Lot actions")} onKeyDown={onKey} className="-mx-1 mb-6 flex gap-1 overflow-x-auto border-b border-line px-1">
        {tabs.map((x) => (
          <button
            key={x.id}
            id={`tab-${x.id}`}
            role="tab"
            aria-selected={tab === x.id}
            aria-controls={`panel-${x.id}`}
            tabIndex={tab === x.id ? 0 : -1}
            onClick={() => setTab(x.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === x.id ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="panel-position" aria-labelledby="tab-position" className={hide("position")}>
        <Intro title={t("Tu participación", "Your participation")}>
          {t("Tus saldos en este lote y los shards que podés reclamar.", "Your balances in this lot and the shards you can claim.")}
        </Intro>
        <ParticipationPanel lot={lot} />
      </div>

      <div role="tabpanel" id="panel-trade" aria-labelledby="tab-trade" className={hide("trade")}>
        <Intro title={t("Mercado secundario", "Secondary market")}>
          {t("Comprá o vendé shards a precio de mercado en el order book de Kuru.", "Buy or sell shards at market price on Kuru's order book.")}
        </Intro>
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
        <Intro title={t("Liquidez del vault", "Vault liquidity")}>
          {t(
            "Depositá shards y USDC para que cada orden mueva menos el precio y cobrá parte de las comisiones.",
            "Deposit shards and USDC so each order moves the price less, and earn a share of the fees.",
          )}
        </Intro>
        {open && kuru.vault && kuru.vaultBestAsk !== undefined && account ? (
          <AddLiquidityForm lot={lot} market={kuru.info!} vault={kuru.vault} vaultBestAsk={kuru.vaultBestAsk} account={account} />
        ) : (
          <p className="text-sm text-muted">
            {account
              ? t("El mercado todavía no está abierto.", "The market is not open yet.")
              : t("Iniciá sesión para aportar liquidez.", "Log in to provide liquidity.")}
          </p>
        )}
      </div>

      {addresses.redemption && (
        <div role="tabpanel" id="panel-harvest" aria-labelledby="tab-harvest" className={hide("harvest")}>
          <Intro title={t("Liquidación de la cosecha", "Harvest settlement")}>
            {t(
              `Cuando el emisor vende la cosecha, cada ${lot.symbol} se canjea por su parte proporcional en USDC.`,
              `When the issuer sells the harvest, each ${lot.symbol} redeems for its pro-rata share in USDC.`,
            )}
          </Intro>
          <HarvestRedemptionPanel lot={lot} account={account} />
        </div>
      )}
    </div>
  );
}
