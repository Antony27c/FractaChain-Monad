"use client";

import type { Lot } from "@/hooks/useLots";
import type { useKuruMarket } from "@/hooks/useKuruMarket";
import { explorerUrl, formatKuruPrice } from "@/lib/kuru";
import { shortAddress } from "@/lib/format";
import { OpenMarketForm } from "@/components/OpenMarketForm";
import { useT } from "@/lib/i18n";

const link = "font-mono underline underline-offset-2 hover:text-accent";

type Kuru = ReturnType<typeof useKuruMarket>;

export function MarketSummary({ lot, kuru }: { lot: Lot; kuru: Kuru }) {
  const t = useT();
  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted">
        {t(
          `${lot.symbol}/USDC cotiza en el order book de Kuru, sin motor de matching offchain.`,
          `${lot.symbol}/USDC trades on Kuru's order book, with no offchain matching engine.`,
        )}
      </p>
      <dl className="space-y-2">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("Precio de compra (bid)", "Bid price")}</dt>
          <dd className="font-mono font-medium tabular-nums">{kuru.bid !== undefined ? formatKuruPrice(kuru.bid) : "..."}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">{t("Precio de venta (ask)", "Ask price")}</dt>
          <dd className="font-mono font-medium tabular-nums">{kuru.ask !== undefined ? formatKuruPrice(kuru.ask) : "..."}</dd>
        </div>
        {kuru.takerFeeBps !== undefined && kuru.makerFeeBps !== undefined && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("Comisión taker / maker", "Taker / maker fee")}</dt>
            <dd className="font-mono tabular-nums">
              {(Number(kuru.takerFeeBps) / 100).toFixed(2)}% / {(Number(kuru.makerFeeBps) / 100).toFixed(2)}%
            </dd>
          </div>
        )}
        {kuru.market && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("Mercado", "Market")}</dt>
            <dd>
              <a href={explorerUrl(kuru.market)} target="_blank" rel="noreferrer" className={link}>
                {shortAddress(kuru.market)}
              </a>
            </dd>
          </div>
        )}
        {kuru.vault && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Vault</dt>
            <dd>
              <a href={explorerUrl(kuru.vault)} target="_blank" rel="noreferrer" className={link}>
                {shortAddress(kuru.vault)}
              </a>
            </dd>
          </div>
        )}
      </dl>
      <p className="text-xs text-muted">
        {t(
          "La app web de Kuru solo muestra mainnet: este mercado vive en Monad testnet y se opera onchain desde acá.",
          "Kuru's web app only shows mainnet: this market lives on Monad testnet and is traded onchain from here.",
        )}
      </p>
    </div>
  );
}

export function MarketClosed({ lot, kuru, account }: { lot: Lot; kuru: Kuru; account?: `0x${string}` }) {
  const t = useT();
  const isIssuer = Boolean(account && account.toLowerCase() === lot.issuer.toLowerCase());
  if (kuru.loading) return <p className="text-sm text-muted">{t("Buscando el mercado en Kuru...", "Looking up the market on Kuru...")}</p>;
  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted">
        {isIssuer
          ? t(`Con la licitación cerrada, abrí el mercado ${lot.symbol}/USDC en Kuru.`, `With the auction closed, open the ${lot.symbol}/USDC market on Kuru.`)
          : t("El emisor todavía no abrió el mercado en Kuru.", "The issuer has not opened the market on Kuru yet.")}
      </p>
      {isIssuer && <OpenMarketForm lot={lot} onOpened={kuru.register} />}
    </div>
  );
}
