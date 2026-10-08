"use client";

import type { Lot } from "@/hooks/useLots";
import { useKuruMarket } from "@/hooks/useKuruMarket";
import { explorerUrl, formatKuruPrice } from "@/lib/kuru";
import { shortAddress } from "@/lib/format";
import { notice } from "@/lib/ui";
import { OpenMarketForm } from "@/components/OpenMarketForm";
import { TradePanel } from "@/components/TradePanel";

const link = "font-mono underline underline-offset-2 hover:text-accent";

export function SecondaryMarket({ lot, account }: { lot: Lot; account?: `0x${string}` }) {
  const kuru = useKuruMarket(lot.token);
  const isIssuer = Boolean(account && account.toLowerCase() === lot.issuer.toLowerCase());

  return (
    <div className={notice.accent}>
      <h3 className="font-semibold">Mercado secundario</h3>

      {kuru.loading && <p className="mt-2 text-muted">Buscando el mercado en Kuru...</p>}

      {!kuru.loading && kuru.market && (
        <>
          <p className="mt-2 text-muted">
            {lot.symbol}/USDC cotiza en el order book de Kuru, sin motor de matching offchain.
          </p>
          <dl className="mt-4 space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Compra (bid)</dt>
              <dd className="font-mono font-medium tabular-nums">{kuru.bid !== undefined ? formatKuruPrice(kuru.bid) : "..."}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Venta (ask)</dt>
              <dd className="font-mono font-medium tabular-nums">{kuru.ask !== undefined ? formatKuruPrice(kuru.ask) : "..."}</dd>
            </div>
            {kuru.takerFeeBps !== undefined && kuru.makerFeeBps !== undefined && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Comisión taker / maker</dt>
                <dd className="font-mono tabular-nums">
                  {(Number(kuru.takerFeeBps) / 100).toFixed(2)}% / {(Number(kuru.makerFeeBps) / 100).toFixed(2)}%
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Mercado</dt>
              <dd>
                <a href={explorerUrl(kuru.market)} target="_blank" rel="noreferrer" className={link}>
                  {shortAddress(kuru.market)}
                </a>
              </dd>
            </div>
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
          {kuru.info && <TradePanel lot={lot} market={kuru.info} account={account} />}
          <p className="mt-4 text-xs text-muted">
            La app web de Kuru solo muestra mainnet: este mercado vive en Monad testnet y se opera onchain desde acá.
          </p>
        </>
      )}

      {!kuru.loading && !kuru.market && (
        <>
          <p className="mt-2 text-muted">
            {isIssuer
              ? `Con la licitación cerrada, abrí el mercado ${lot.symbol}/USDC en Kuru.`
              : "El emisor todavía no abrió el mercado en Kuru."}
          </p>
          {isIssuer && <OpenMarketForm lot={lot} onOpened={kuru.register} />}
        </>
      )}
    </div>
  );
}
