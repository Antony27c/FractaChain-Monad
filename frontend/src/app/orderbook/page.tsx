"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { ArrowRight, MousePointerClick } from "lucide-react";
import { useLots, type Lot } from "@/hooks/useLots";
import { useKuruMarket } from "@/hooks/useKuruMarket";
import { KURU_MARKETS, explorerUrl } from "@/lib/kuru";
import { shortAddress } from "@/lib/format";
import { useI18n, useT } from "@/lib/i18n";
import { button, notice, panel } from "@/lib/ui";
import { TradePanel, type TradePreset } from "@/components/TradePanel";

type Level = [number, number];

const step = (i: number) => ({ "--i": i }) as CSSProperties;

function useBook(market?: `0x${string}`) {
  return useQuery({
    queryKey: ["kuru-book", market],
    enabled: Boolean(market),
    refetchInterval: 10000,
    queryFn: async () => {
      const res = await fetch(`/api/kuru/book?market=${market}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Order book error");
      return body as { asks: Level[]; bids: Level[]; block: number };
    },
  });
}

function BookSide({
  levels,
  side,
  max,
  fmt,
  onPick,
}: {
  levels: Level[];
  side: "ask" | "bid";
  max: number;
  fmt: (n: number, d?: number) => string;
  onPick: (level: Level) => void;
}) {
  const ask = side === "ask";
  return (
    <>
      {levels.map((level) => {
        const [price, size] = level;
        return (
          <button
            key={`${side}-${price}`}
            type="button"
            onClick={() => onPick(level)}
            className="relative grid w-full grid-cols-3 px-4 py-1.5 text-right font-mono text-xs tabular-nums transition-colors hover:bg-ink/5"
          >
            <span
              aria-hidden
              className={`absolute inset-y-0 right-0 ${ask ? "bg-bad/10" : "bg-ok/10"}`}
              style={{ width: `${max ? (size / max) * 100 : 0}%` }}
            />
            <span className={`relative text-left font-medium ${ask ? "text-bad" : "text-ok"}`}>{fmt(price, 5)}</span>
            <span className="relative">{fmt(size, 2)}</span>
            <span className="relative text-muted">{fmt(price * size, 2)}</span>
          </button>
        );
      })}
    </>
  );
}

function Market({ lot, account }: { lot: Lot; account?: `0x${string}` }) {
  const t = useT();
  const { locale } = useI18n();
  const kuru = useKuruMarket(lot.token);
  const book = useBook(kuru.market);
  const [preset, setPreset] = useState<TradePreset>();

  const fmt = (n: number, d = 4) => n.toLocaleString(locale === "en" ? "en-US" : "es-AR", { maximumFractionDigits: d });
  const asks = book.data?.asks ?? [];
  const bids = book.data?.bids ?? [];
  const max = Math.max(0, ...asks.map((l) => l[1]), ...bids.map((l) => l[1]));
  const bestAsk = asks[0]?.[0];
  const bestBid = bids[0]?.[0];
  const mid = bestAsk && bestBid ? (bestAsk + bestBid) / 2 : bestAsk ?? bestBid;
  const spread = bestAsk && bestBid ? ((bestAsk - bestBid) / ((bestAsk + bestBid) / 2)) * 100 : undefined;

  const pick = ([price, size]: Level, side: "ask" | "bid") =>
    setPreset({
      side: side === "ask" ? "buy" : "sell",
      amount: side === "ask" ? (price * size).toFixed(2) : size.toFixed(2),
      nonce: Date.now(),
    });

  if (kuru.loading) return <p className="mt-8 text-muted">{t("Buscando el mercado en Kuru...", "Looking up the market on Kuru...")}</p>;

  if (!kuru.market || !kuru.info) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
        <p className="text-lg font-medium tracking-tight">
          {t(`El mercado ${lot.symbol}/USDC todavía no está abierto`, `The ${lot.symbol}/USDC market is not open yet`)}
        </p>
        <p className="mx-auto mt-2 max-w-[48ch] text-sm text-muted">
          {t(
            "El emisor lo abre desde la página del lote cuando termina la licitación.",
            "The issuer opens it from the lot page once the auction ends.",
          )}
        </p>
        <Link href={`/lots/${lot.offering}`} className={`${button.primary} mt-6`}>
          {t("Ir al lote", "Go to the lot")}
        </Link>
      </div>
    );
  }

  const stats: [string, string, string?][] = [
    [t("Mejor compra (bid)", "Best bid"), bestBid ? `${fmt(bestBid, 5)} USDC` : "-", "text-ok"],
    [t("Mejor venta (ask)", "Best ask"), bestAsk ? `${fmt(bestAsk, 5)} USDC` : "-", "text-bad"],
    [t("Precio medio", "Mid price"), mid ? `${fmt(mid, 5)} USDC` : "-"],
    [t("Spread", "Spread"), spread !== undefined ? `${fmt(spread, 2)}%` : "-"],
  ];

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className={`${panel} reveal overflow-hidden`} style={step(1)}>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
          <div>
            <p className="font-semibold tracking-tight">
              {lot.symbol}/USDC <span className="font-normal text-muted">· {lot.name}</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              {lot.asset.assetType}, {lot.asset.quantity.toString()} {lot.asset.unit}, {t("campaña", "season")} {lot.asset.campaign}
            </p>
          </div>
          <a href={explorerUrl(kuru.market)} target="_blank" rel="noreferrer" className="font-mono text-xs text-muted underline underline-offset-2 hover:text-accent">
            {t("Mercado", "Market")} {shortAddress(kuru.market)}
          </a>
        </div>

        <dl className="grid grid-cols-2 gap-4 border-b border-line p-5 text-sm sm:grid-cols-4">
          {stats.map(([k, v, tone]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{k}</dt>
              <dd className={`mt-1 font-mono font-medium tabular-nums ${tone ?? ""}`}>{v}</dd>
            </div>
          ))}
        </dl>

        <div className="grid grid-cols-3 px-4 pt-3 text-right text-[11px] uppercase tracking-wider text-muted">
          <span className="text-left">{t("Precio (USDC)", "Price (USDC)")}</span>
          <span>{t("Cantidad", "Size")} ({lot.symbol})</span>
          <span>{t("Total (USDC)", "Total (USDC)")}</span>
        </div>

        {book.error && <p className={`${notice.bad} m-4`}>{book.error.message}</p>}
        {book.isLoading && <p className="px-4 py-6 text-sm text-muted">{t("Leyendo el libro de órdenes...", "Reading the order book...")}</p>}

        {book.data && (
          <div className="py-2">
            {asks.length === 0 && <p className="px-4 py-2 text-xs text-muted">{t("Sin órdenes de venta", "No sell orders")}</p>}
            <BookSide levels={[...asks].reverse()} side="ask" max={max} fmt={fmt} onPick={(l) => pick(l, "ask")} />
            <div className="my-1 flex items-center justify-between border-y border-line bg-ink/5 px-4 py-2 font-mono text-sm tabular-nums">
              <span className="font-semibold">{mid ? `${fmt(mid, 5)} USDC` : "-"}</span>
              <span className="text-xs text-muted">
                {t("Spread", "Spread")} {spread !== undefined ? `${fmt(spread, 2)}%` : "-"}
              </span>
            </div>
            {bids.length === 0 && <p className="px-4 py-2 text-xs text-muted">{t("Sin órdenes de compra", "No buy orders")}</p>}
            <BookSide levels={bids} side="bid" max={max} fmt={fmt} onPick={(l) => pick(l, "bid")} />
          </div>
        )}

        <p className="flex items-center gap-2 border-t border-line px-5 py-3 text-xs text-muted">
          <MousePointerClick className="h-3.5 w-3.5 shrink-0" />
          {t(
            "Tocá un nivel para cargar esa cantidad en el panel. Incluye la liquidez del vault de Kuru; se actualiza cada 10 s.",
            "Click a level to load that amount into the panel. Includes Kuru's vault liquidity; refreshes every 10 s.",
          )}
        </p>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className={`${panel} reveal p-6`} style={step(2)}>
          <h2 className="mb-5 font-semibold tracking-tight">{t("Orden de mercado", "Market order")}</h2>
          <TradePanel lot={lot} market={kuru.info} account={account} preset={preset} />
        </div>
        <Link href={`/lots/${lot.offering}`} className="flex items-center justify-between rounded-2xl border border-line px-5 py-4 text-sm transition-colors hover:border-accent/60">
          <span>{t("Liquidez, cosecha y detalle del lote", "Liquidity, harvest and lot details")}</span>
          <ArrowRight className="h-4 w-4 text-muted" />
        </Link>
      </aside>
    </div>
  );
}

export default function OrderbookPage() {
  const t = useT();
  const { address } = useAccount();
  const { lots, isLoading } = useLots();
  const [selected, setSelected] = useState<string>();

  const pairs = lots.filter((l) => l.status === "succeeded");
  const listed = pairs.find((l) => KURU_MARKETS[l.token.toLowerCase()]);
  const current = pairs.find((l) => l.token === selected) ?? listed ?? pairs[0];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 md:px-6 md:pt-14">
      <header className="max-w-3xl">
        <p className="reveal text-xs font-bold uppercase tracking-wider text-accent-strong">{t("Mercado secundario", "Secondary market")}</p>
        <h1 className="reveal mt-2 text-3xl font-semibold leading-[1.1] tracking-tighter md:text-4xl" style={step(1)}>
          Orderbook
        </h1>
        <p className="reveal mt-3 max-w-[65ch] leading-relaxed text-muted" style={step(2)}>
          {t(
            "Los shards de cada licitación exitosa cotizan contra USDC en el order book de Kuru, 100% onchain en Monad. Sin motor de matching offchain.",
            "Shards from every successful auction trade against USDC on Kuru's order book, 100% onchain on Monad. No offchain matching engine.",
          )}
        </p>
      </header>

      {isLoading && <p className="mt-8 text-muted">{t("Cargando mercados...", "Loading markets...")}</p>}

      {!isLoading && pairs.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <p className="text-lg font-medium tracking-tight">{t("Todavía no hay mercados", "No markets yet")}</p>
          <p className="mx-auto mt-2 max-w-[48ch] text-sm text-muted">
            {t("Un mercado se abre cuando una licitación termina con éxito.", "A market opens when an auction succeeds.")}
          </p>
          <Link href="/market" className={`${button.primary} mt-6`}>
            {t("Ver licitaciones", "View auctions")}
          </Link>
        </div>
      )}

      {pairs.length > 0 && current && (
        <>
          <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label={t("Pares", "Pairs")}>
            {pairs.map((l) => (
              <button
                key={l.token}
                role="tab"
                aria-selected={l.token === current.token}
                onClick={() => setSelected(l.token)}
                className={`rounded-full border px-4 py-2 font-mono text-xs font-bold transition-colors ${
                  l.token === current.token ? "border-ink bg-ink text-bg" : "border-line bg-surface text-muted hover:text-ink"
                }`}
              >
                {l.symbol}/USDC
              </button>
            ))}
          </div>
          <Market key={current.token} lot={current} account={address} />
        </>
      )}
    </div>
  );
}
