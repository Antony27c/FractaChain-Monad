"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, Scale, Sprout, Zap } from "lucide-react";
import { MockPageHeader, mock, selectable } from "@/components/MockPage";
import { useLanding } from "@/lib/landing";
import { useT } from "@/lib/i18n";

type Forward = {
  id: string;
  producer: string;
  commodity: "Soja" | "Maíz" | "Trigo";
  tons: number;
  strikePriceUsd: number;
  deliveryDate: [string, string];
  penaltyPercent: number;
  rolloverBonusPercent: number;
};

const FORWARDS: Forward[] = [
  { id: "FWD-SOJA-2026-01", producer: "1", commodity: "Soja", tons: 500, strikePriceUsd: 310, deliveryDate: ["15 de mayo de 2027", "May 15, 2027"], penaltyPercent: 20, rolloverBonusPercent: 10 },
  { id: "FWD-MAIZ-2026-04", producer: "2", commodity: "Maíz", tons: 1200, strikePriceUsd: 175, deliveryDate: ["30 de agosto de 2027", "August 30, 2027"], penaltyPercent: 20, rolloverBonusPercent: 10 },
];

const COMMODITY: Record<Forward["commodity"], [string, string]> = { Soja: ["Soja", "Soy"], Maíz: ["Maíz", "Corn"], Trigo: ["Trigo", "Wheat"] };

const fmt = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 0 });

export default function ForwardsPage() {
  const { pages } = useLanding();
  const t = useT();
  const [selected, setSelected] = useState(FORWARDS[0]);
  const [action, setAction] = useState<"NONE" | "PENALTY" | "ROLLOVER">("NONE");
  const [done, setDone] = useState(false);

  const total = selected.tons * selected.strikePriceUsd;
  const penalty = total * (selected.penaltyPercent / 100);
  const rolloverTons = selected.tons * (1 + selected.rolloverBonusPercent / 100);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => {
      setDone(false);
      setAction("NONE");
    }, 4000);
    return () => clearTimeout(id);
  }, [done]);

  const option = (active: boolean, activeClass: string) =>
    `w-full space-y-1.5 rounded-xl border p-4 text-left transition-all ${active ? activeClass : "border-line bg-ink/5 text-muted hover:border-ink/20"}`;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6 md:py-10">
      <MockPageHeader
        icon={Sprout}
        chip={t("Marco legal CCyC Art. 1131", "Legal basis: Civil Code Art. 1131")}
        title={pages.forwardsTitle}
        lead={t(
          "Contratos de compraventa futura de granos con cláusulas resolutorias automatizadas en smart contracts, para resarcimiento directo o refinanciación en especie.",
          "Forward grain sale contracts with termination clauses automated in smart contracts, for direct compensation or in-kind refinancing.",
        )}
        product="Forwards"
      />

      <div className={`${mock.card} flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center`}>
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-ink">
            <Scale className="h-4 w-4 text-accent-strong" />
            {t("Amparo del Código Civil y Comercial de la Nación", "Backed by Argentina's Civil and Commercial Code")}
          </span>
          <p className="max-w-2xl text-xs text-muted">
            {t(
              "Conforme al Art. 1131 del CCyC (venta de cosas futuras), la promesa de entrega queda sujeta a la condición resolutoria de que la cosa llegue a existir. Se estipula contractualmente una penalidad rescisoria del 20% o el rollover en especie con bonificación del +10% en kilogramos.",
              "Under Civil Code Art. 1131 (sale of future goods), the delivery promise is subject to the condition that the goods come to exist. The contract sets a 20% termination penalty or an in-kind rollover with a +10% bonus in kilograms.",
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{t("Contratos forwards activos", "Active forward contracts")}</h3>
          <div className="space-y-3">
            {FORWARDS.map((fwd) => (
              <button
                type="button"
                key={fwd.id}
                onClick={() => setSelected(fwd)}
                className={`${selectable(selected.id === fwd.id)} w-full space-y-3 p-4 text-left sm:p-5`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-all font-mono text-sm font-bold text-ink sm:text-base">{fwd.id}</span>
                      <span className="rounded border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent-strong">{t(...COMMODITY[fwd.commodity])}</span>
                    </div>
                    <div className="break-words text-xs text-muted">
                      {t("Productor de ejemplo", "Example producer")} {fwd.producer}
                    </div>
                  </div>
                  <span className={`${mock.pill} shrink-0 self-start`}>${fwd.strikePriceUsd} USD/Tn</span>
                </div>
                <div className="grid grid-cols-1 gap-2 border-t border-line pt-2 text-xs sm:grid-cols-3">
                  <div>
                    <span className={mock.label}>{t("Volumen comprometido", "Committed volume")}</span>
                    <span className="font-mono font-bold text-ink">{fwd.tons} {t("toneladas", "tons")}</span>
                  </div>
                  <div>
                    <span className={mock.label}>{t("Valor nocional", "Notional value")}</span>
                    <span className="font-mono font-bold text-accent-strong">${fmt(fwd.tons * fwd.strikePriceUsd)} USDC</span>
                  </div>
                  <div>
                    <span className={mock.label}>{t("Fecha de entrega", "Delivery date")}</span>
                    <span className="font-mono font-bold text-ink">{t(...fwd.deliveryDate)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className={`${mock.card} space-y-6 p-6 sm:p-8`}>
            <h3 className="text-base font-bold text-ink">{t("Simulador de resolución contractual", "Contract resolution simulator")}</h3>

            <div className={`${mock.well} space-y-2 p-4 text-xs text-muted`}>
              <div>
                {t("Contrato seleccionado:", "Selected contract:")} <strong className="font-mono text-ink">{selected.id}</strong>
              </div>
              <div>
                {t("Valor total de entrega:", "Total delivery value:")} <strong className="font-mono text-accent-strong">${fmt(total)} USDC</strong>
              </div>
            </div>

            <div className="space-y-3">
              <span className="block text-xs font-medium text-muted">{t("Seleccioná la cláusula a ejecutar:", "Choose the clause to execute:")}</span>

              <button type="button" onClick={() => setAction("PENALTY")} className={option(action === "PENALTY", "border-bad/40 bg-bad/10 text-ink")}>
                <span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-1 text-xs font-bold text-bad">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {t("Cláusula de rescisión (20%)", "Termination clause (20%)")}
                  </span>
                  <span className="font-mono text-xs font-bold text-ink">-${fmt(penalty)} USDC</span>
                </span>
                <span className="block text-[11px] text-muted">
                  {t(
                    "En caso de rescisión unilateral por siniestro o default, el smart contract retiene el 20% del nocional como compensación por daños y perjuicios preacordados.",
                    "On unilateral termination due to a loss event or default, the smart contract withholds 20% of the notional as pre-agreed damages.",
                  )}
                </span>
              </button>

              <button type="button" onClick={() => setAction("ROLLOVER")} className={option(action === "ROLLOVER", "border-accent bg-accent/10 text-ink")}>
                <span className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-1 text-xs font-bold text-accent-strong">
                    <RefreshCw className="h-3.5 w-3.5 shrink-0" /> {t("Rollover en especie (+10% kg)", "In-kind rollover (+10% kg)")}
                  </span>
                  <span className="font-mono text-xs font-bold text-ink">{rolloverTons.toFixed(0)} Tn</span>
                </span>
                <span className="block text-[11px] text-muted">
                  {t(
                    "Refinanciación acordada: el productor difiere la entrega a la siguiente campaña con una prima física del 10% adicional en granos para el inversor.",
                    "Agreed refinancing: the producer defers delivery to the next season with an extra 10% physical premium in grain for the investor.",
                  )}
                </span>
              </button>
            </div>

            {done && (
              <div className={mock.ok}>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>
                  {action === "PENALTY"
                    ? t(
                        `Simulación: penalidad del 20% ($${fmt(penalty)} USDC). No se envió transacción.`,
                        `Simulation: 20% penalty ($${fmt(penalty)} USDC). No transaction was sent.`,
                      )
                    : t(
                        `Simulación: rollover +10% de grano (${rolloverTons.toFixed(0)} Tn). No se envió transacción.`,
                        `Simulation: +10% grain rollover (${rolloverTons.toFixed(0)} t). No transaction was sent.`,
                      )}
                </span>
              </div>
            )}

            <button type="button" disabled={action === "NONE"} onClick={() => setDone(true)} className={mock.action}>
              <Zap className="h-4 w-4" />
              {t("Simular resolución (no onchain)", "Simulate resolution (not onchain)")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
