"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Building2, CheckCircle2, DollarSign, ShieldCheck, TrendingUp, Zap } from "lucide-react";
import { MockPageHeader, mock, selectable } from "@/components/MockPage";
import { useLanding } from "@/lib/landing";

type Stock = {
  symbol: string;
  companyName: string;
  tickerMerval: string;
  isin: string;
  totalSharesInCustody: number;
  lastAuditTimestamp: string;
  priceUsd: number;
  change24h: number;
};

const STOCKS: Stock[] = [
  { symbol: "tYPF", companyName: "YPF S.A. (Clase D)", tickerMerval: "YPFD", isin: "ARP700011037", totalSharesInCustody: 150000, lastAuditTimestamp: "2026-09-20 10:00 UTC", priceUsd: 28.5, change24h: 3.2 },
  { symbol: "tGGAL", companyName: "Grupo Financiero Galicia S.A.", tickerMerval: "GGAL", isin: "ARP432631215", totalSharesInCustody: 220000, lastAuditTimestamp: "2026-09-20 10:00 UTC", priceUsd: 41.2, change24h: -1.1 },
  { symbol: "tPAMP", companyName: "Pampa Energía S.A.", tickerMerval: "PAMP", isin: "ARP733691060", totalSharesInCustody: 85000, lastAuditTimestamp: "2026-09-20 10:00 UTC", priceUsd: 54.8, change24h: 1.8 },
];

const fmt = (n: number) => n.toLocaleString("es-AR");

export default function StocksPage() {
  const { pages } = useLanding();
  const [selected, setSelected] = useState(STOCKS[0]);
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [shares, setShares] = useState(10);
  const [trading, setTrading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [alycAccount, setAlycAccount] = useState("ALYC-Balanz-49201");

  const total = shares * selected.priceUsd;

  const simulateTrade = () => {
    setTrading(true);
    setNotice(null);
    setTimeout(() => {
      setTrading(false);
      setNotice(`Simulación: ${side === "BUY" ? "compra" : "venta"} de ${shares} ${selected.symbol}. No se envió transacción.`);
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6 md:py-10">
      <MockPageHeader
        icon={TrendingUp}
        chip="Mercado secundario Merval"
        title={pages.stocksTitle}
        lead="Operá títulos líderes del panel principal de Bolsas y Mercados Argentinos (BYMA) con respaldo real e inmovilización en subcuenta comitente de Caja de Valores S.A."
        product="Merval"
      />

      <div className={`${mock.card} space-y-4 p-6`}>
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent-strong">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">Prueba de reserva en tiempo real (Proof of Reserve)</h3>
              <p className="text-[11px] text-muted">Auditoría criptográfica y conciliación diaria con Caja de Valores S.A.</p>
            </div>
          </div>
          <span className={`${mock.pill} inline-flex items-center gap-1.5 rounded-full text-[11px]`}>
            <CheckCircle2 className="h-3.5 w-3.5" /> 100.00% RESPALDADO 1:1
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Subcuenta comitente", "84920-CV (Segregada)"],
            ["Auditor externo", "PwC / CNV RG 1150"],
            ["Última conciliación", selected.lastAuditTimestamp],
            ["Liquidación", "Inmediata T+0"],
          ].map(([label, value]) => (
            <div key={label} className={`${mock.well} min-w-0 p-3`}>
              <span className={mock.label}>{label}</span>
              <span className="break-words font-mono font-semibold text-ink">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Activos disponibles</h3>
          <div className="space-y-3">
            {STOCKS.map((stock) => {
              const up = stock.change24h >= 0;
              return (
                <button
                  type="button"
                  key={stock.symbol}
                  onClick={() => setSelected(stock)}
                  className={`${selectable(selected.symbol === stock.symbol)} flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:justify-between sm:p-5`}
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-accent/10 font-mono text-base font-bold text-ink sm:h-12 sm:w-12">
                      {stock.symbol.slice(1, 5)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-ink">{stock.symbol}</span>
                        <span className="font-mono text-xs text-muted">({stock.tickerMerval})</span>
                        <span className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[9px] text-accent-strong">1:1 Custodia</span>
                      </div>
                      <div className="truncate text-xs text-muted">{stock.companyName}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted">ISIN: {stock.isin}</div>
                    </div>
                  </div>
                  <div className="shrink-0 space-y-1 pl-14 text-left sm:pl-0 sm:text-right">
                    <div className="font-mono text-base font-bold text-ink">
                      ${stock.priceUsd.toFixed(2)} <span className="font-sans text-xs text-muted">USD</span>
                    </div>
                    <div className={`inline-flex items-center gap-0.5 font-mono text-xs font-bold ${up ? "text-ok" : "text-bad"}`}>
                      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {up ? `+${stock.change24h}%` : `${stock.change24h}%`}
                    </div>
                    <div className="block font-mono text-[10px] text-muted">En custodia: {fmt(stock.totalSharesInCustody)}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className={`${mock.card} space-y-3 p-5`}>
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
              <DollarSign className="h-4 w-4 text-accent-strong" />
              Distribución automática de dividendos en USDC
            </h4>
            <p className="text-xs leading-relaxed text-muted">
              Cuando una sociedad cotizante paga dividendos, el smart contract distribuye USDC proporcionalmente a cada tenedor onchain, sin deducciones abusivas ni demoras bancarias.
            </p>
            <div className={`${mock.well} flex flex-col gap-1 p-3 text-xs sm:flex-row sm:items-center sm:justify-between`}>
              <span className="text-muted">Último dividendo tYPF pagado:</span>
              <span className="font-mono font-bold text-accent-strong">$0.85 USDC / token</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className={`${mock.card} sticky top-24 space-y-6 p-6 sm:p-8`}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-bold text-ink">Terminal de negociación</h3>
              <span className="font-mono text-xs font-bold text-accent-strong">
                {selected.symbol} • ${selected.priceUsd.toFixed(2)} USD
              </span>
            </div>

            <div className={`${mock.well} flex gap-1 p-1`}>
              {(["BUY", "SELL"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                    side === s ? (s === "BUY" ? "bg-[#7ed86a] text-black shadow-md" : "bg-red-500 text-white shadow-md") : "text-muted hover:text-ink"
                  }`}
                >
                  {s === "BUY" ? "Comprar" : "Vender"} {selected.symbol}
                </button>
              ))}
            </div>

            <label className="block space-y-1.5">
              <span className="flex flex-col gap-0.5 text-xs sm:flex-row sm:justify-between">
                <span className="font-medium text-muted">Cantidad de tokens (acciones):</span>
                <span className="font-mono text-muted">Disponibles: {fmt(selected.totalSharesInCustody)}</span>
              </span>
              <input
                type="number"
                min="1"
                max="10000"
                value={shares}
                onChange={(e) => setShares(Math.max(1, Number(e.target.value)))}
                className={mock.input}
              />
            </label>

            <div className={`${mock.well} space-y-2 p-4 text-xs`}>
              <div className="flex justify-between text-muted">
                <span>Precio unitario:</span>
                <span className="font-mono text-ink">${selected.priceUsd.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Comisión protocolo (0.1%):</span>
                <span className="font-mono text-accent-strong">${(total * 0.001).toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-sm font-bold text-ink">
                <span>Total estimado:</span>
                <span className="font-mono text-accent-strong">${(total * 1.001).toFixed(2)} USDC</span>
              </div>
            </div>

            {notice && (
              <div className={mock.ok}>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            <button type="button" disabled={trading} onClick={simulateTrade} className={side === "BUY" ? mock.action : mock.danger}>
              {trading ? (
                "Simulando (no onchain)..."
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  {side === "BUY" ? "Comprar" : "Vender"} {shares} {selected.symbol}
                </>
              )}
            </button>

            <div className="border-t border-line pt-2 text-center">
              <button type="button" onClick={() => setWithdrawOpen(!withdrawOpen)} className="text-xs text-muted underline transition-colors hover:text-ink">
                Solicitar destokenización a cuenta ALYC tradicional
              </button>
            </div>

            {withdrawOpen && (
              <div className="space-y-3 rounded-xl border border-warn/40 bg-warn/10 p-4 text-xs">
                <div className="flex items-center gap-2 font-semibold text-warn">
                  <Building2 className="h-4 w-4" /> Retiro a Caja de Valores
                </div>
                <p className="text-[11px] leading-relaxed text-muted">
                  Tus tokens se queman onchain y las acciones subyacentes se transfieren desde la subcuenta 84920 a tu ALYC receptora autorizada.
                </p>
                <input
                  type="text"
                  value={alycAccount}
                  onChange={(e) => setAlycAccount(e.target.value)}
                  placeholder="Número de comitente y ALYC"
                  aria-label="Número de comitente y ALYC"
                  className="w-full rounded-lg border border-line bg-bg/70 px-3 py-1.5 text-xs text-ink"
                />
                <button
                  type="button"
                  onClick={() => {
                    setNotice("Simulación: solicitud de destokenización radicada. Liquidación en Caja de Valores: 24 horas hábiles.");
                    setWithdrawOpen(false);
                  }}
                  className="w-full rounded-lg bg-amber-500 py-2 text-xs font-semibold text-black transition-all hover:bg-amber-400"
                >
                  Enviar orden de destokenización
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
