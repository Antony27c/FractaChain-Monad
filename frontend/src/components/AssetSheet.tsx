"use client";

import { useReadContract } from "wagmi";
import { ShieldCheck } from "lucide-react";
import { shardTokenAbi } from "@/lib/abi";
import { explorerUrl } from "@/lib/kuru";
import { formatShards, shortAddress } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { Lot } from "@/hooks/useLots";
import { useKuruMarket } from "@/hooks/useKuruMarket";

const link = "font-mono underline underline-offset-2 hover:text-accent";

function Addr({ address }: { address: `0x${string}` }) {
  return (
    <a href={explorerUrl(address)} target="_blank" rel="noreferrer" className={link}>
      {shortAddress(address)}
    </a>
  );
}

export function AssetSheet({ lot }: { lot: Lot }) {
  const t = useT();
  const kuru = useKuruMarket(lot.token);
  const { data: supply } = useReadContract({ address: lot.token, abi: shardTokenAbi, functionName: "totalSupply" });

  const rows: [string, React.ReactNode][] = [
    [t("Activo", "Asset"), `${lot.asset.assetType}, ${lot.asset.quantity.toString()} ${lot.asset.unit}`],
    [t("Campaña", "Season"), lot.asset.campaign],
    [t("Supply total", "Total supply"), supply !== undefined ? `${formatShards(supply, 0)} ${lot.symbol}` : "..."],
    [t("Emisor", "Issuer"), <Addr key="i" address={lot.issuer} />],
    [t("Token", "Token"), <Addr key="t" address={lot.token} />],
    [t("Licitación", "Auction"), <Addr key="o" address={lot.offering} />],
    [t("Mercado Kuru", "Kuru market"), kuru.market ? <Addr key="m" address={kuru.market} /> : t("Sin abrir", "Not open")],
    [t("Vault de liquidez", "Liquidity vault"), kuru.vault ? <Addr key="v" address={kuru.vault} /> : "-"],
  ];

  return (
    <div>
      <h2 className="flex items-center gap-2 font-semibold tracking-tight">
        <ShieldCheck className="h-4 w-4 text-accent-strong" />
        {t("Ficha del activo", "Asset sheet")}
      </h2>
      <dl className="mt-4 space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-muted">{k}</dt>
            <dd className="text-right">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-muted">
        {t(
          "Todos los datos se leen de Monad testnet y se pueden verificar en el explorer.",
          "All data is read from Monad testnet and can be verified in the explorer.",
        )}
      </p>
    </div>
  );
}
