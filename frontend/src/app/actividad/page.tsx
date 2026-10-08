"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { ACTIVITY_LABELS, type Activity, type ActivityKind } from "@/lib/activity";
import { formatShards, formatUsdc } from "@/lib/format";
import { explorerTxUrl } from "@/lib/kuru";
import { notice, panel } from "@/lib/ui";

const TONE: Partial<Record<ActivityKind, string>> = {
  buy: "bg-ok/10 text-ok",
  sell: "bg-bad/10 text-bad",
  liquidity: "bg-accent/10 text-accent",
  redeem: "bg-accent/10 text-accent",
};

const signed = (value: bigint, format: (v: bigint) => string) =>
  value === 0n ? "-" : `${value > 0n ? "+" : "−"}${format(value > 0n ? value : -value)}`;

const price = (usdc: bigint, shards: bigint) => {
  if (usdc === 0n || shards === 0n) return null;
  const p = Math.abs(Number(usdc) / 1e6 / (Number(shards) / 1e18));
  return `${p.toLocaleString("es-AR", { maximumFractionDigits: 5 })} USDC`;
};

const date = (ts: number | null) =>
  ts ? new Date(ts * 1000).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "-";

export default function ActivityPage() {
  const { address } = useAccount();
  const { data, error, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["activity", address],
    enabled: Boolean(address),
    refetchInterval: 30000,
    queryFn: async () => {
      const res = await fetch(`/api/activity?address=${address}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "No se pudo leer el registro.");
      return body.items as Activity[];
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 md:px-6 md:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold leading-[1.1] tracking-tighter md:text-4xl">Mi actividad</h1>
          <p className="mt-3 max-w-[60ch] leading-relaxed text-muted">
            Todas tus operaciones onchain: compras y ventas en Kuru, aportes, reclamos, liquidez y canjes. Se leen de la
            cadena, así que aparecen aunque cambies de dispositivo.
          </p>
        </div>
        {address && (
          <button onClick={() => refetch()} disabled={isFetching} className="text-sm text-muted hover:text-ink">
            {isFetching ? "Actualizando..." : "Actualizar"}
          </button>
        )}
      </div>

      {!address && <p className="mt-8 text-muted">Iniciá sesión para ver tu actividad.</p>}
      {address && isLoading && <p className="mt-8 text-muted">Leyendo tu historial de la cadena...</p>}
      {error && (
        <p role="alert" className={`${notice.bad} mt-8`}>
          {error.message}
        </p>
      )}
      {data && data.length === 0 && <p className="mt-8 text-muted">Todavía no tenés operaciones.</p>}

      {data && data.length > 0 && (
        <div className={`${panel} mt-8 overflow-x-auto`}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Operación</th>
                <th className="px-4 py-3 font-medium">Lote</th>
                <th className="px-4 py-3 text-right font-medium">Shards</th>
                <th className="px-4 py-3 text-right font-medium">USDC</th>
                <th className="px-4 py-3 text-right font-medium">Precio</th>
                <th className="px-4 py-3 text-right font-medium">Tx</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => {
                const usdc = BigInt(a.usdcDelta);
                const shards = BigInt(a.shardDelta);
                const showPrice = a.kind === "buy" || a.kind === "sell" || a.kind === "redeem";
                return (
                  <tr key={a.hash} className="border-b border-line last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted">{date(a.timestamp)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TONE[a.kind] ?? "bg-ink/5 text-ink"}`}>
                        {ACTIVITY_LABELS[a.kind]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {a.offering && a.symbol ? (
                        <Link href={`/lots/${a.offering}`} className="underline underline-offset-2 hover:text-accent">
                          {a.symbol}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{signed(shards, (v) => formatShards(v))}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{signed(usdc, (v) => formatUsdc(v).replace(" USDC", ""))}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">{(showPrice && price(usdc, shards)) || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <a href={explorerTxUrl(a.hash)} target="_blank" rel="noreferrer" className="font-mono text-xs underline underline-offset-2 hover:text-accent">
                        {a.hash.slice(0, 8)}…
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
