"use client";

import { useEffect, useState } from "react";
import { Building, CheckCircle2, FileText, Zap } from "lucide-react";
import { MockPageHeader, mock } from "@/components/MockPage";
import { useLanding } from "@/lib/landing";

type Commodity = "Soja" | "Maíz" | "Trigo";

type Warrant = {
  id: string;
  certificateNumber: string;
  warehouseCompany: string;
  commodity: Commodity;
  tons: number;
  collateralValueUsd: number;
  loanAmountUsd: number;
  ltvPercent: number;
  healthFactor: number;
};

const WARRANTS: Warrant[] = [
  { id: "WAR-9643-001", certificateNumber: "CD-CU-2026-9481", warehouseCompany: "Control Union Argentina S.A. (Almacén Gral. Depósito)", commodity: "Soja", tons: 1000, collateralValueUsd: 310000, loanAmountUsd: 170500, ltvPercent: 55, healthFactor: 1.36 },
  { id: "WAR-9643-002", certificateNumber: "CD-SGS-2026-1120", warehouseCompany: "SGS Argentina Warrant S.A.", commodity: "Maíz", tons: 2500, collateralValueUsd: 437500, loanAmountUsd: 240625, ltvPercent: 55, healthFactor: 1.36 },
];

const PRICES: Record<Commodity, number> = { Soja: 310, Maíz: 175, Trigo: 220 };

const fmt = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 0 });

export default function WarrantsPage() {
  const { pages } = useLanding();
  const [commodity, setCommodity] = useState<Commodity>("Soja");
  const [tons, setTons] = useState(500);
  const [ltv, setLtv] = useState(55);
  const [notice, setNotice] = useState<string | null>(null);

  const price = PRICES[commodity];
  const collateral = tons * price;
  const loan = collateral * (ltv / 100);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(id);
  }, [notice]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6 md:py-10">
      <MockPageHeader
        icon={FileText}
        chip="Régimen nacional Ley 9643"
        title={pages.warrantsTitle}
        lead="Monetizá granos almacenados en silobolsas y plantas de acopio autorizadas. Obtené liquidez inmediata en USDC con una relación préstamo-valor (LTV) del 50% al 60% bajo custodia de empresas de warrants registradas."
        product="Warrants"
      />

      <div className={`${mock.card} flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center`}>
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-bold text-ink">
            <Building className="h-4 w-4 text-accent-strong" />
            Certificación de Almacén General de Depósito
          </span>
          <p className="max-w-2xl text-xs text-muted">
            Los títulos se emiten duplicados: Certificado de Depósito (acredita propiedad) y Warrant (acredita derecho creditorio y prenda comercial) de acuerdo con la Ley 9643 y reglamentaciones de la SAGyP.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Warrants activos en bóveda</h3>
          <div className="space-y-3">
            {WARRANTS.map((war) => (
              <div key={war.id} className={`${mock.card} space-y-3 p-4 sm:p-5`}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-bold text-ink">{war.id}</span>
                      <span className="max-w-full truncate rounded border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent-strong">
                        {war.certificateNumber}
                      </span>
                    </div>
                    <div className="mt-0.5 break-words text-xs text-muted">{war.warehouseCompany}</div>
                  </div>
                  <span className={`${mock.pill} shrink-0 self-start`}>LTV {war.ltvPercent}%</span>
                </div>
                <div className="grid grid-cols-1 gap-2 border-t border-line pt-2 text-xs sm:grid-cols-3">
                  <div>
                    <span className={mock.label}>Colateral ({war.commodity})</span>
                    <span className="break-words font-mono font-bold text-ink">
                      {war.tons} Tn (${fmt(war.collateralValueUsd)})
                    </span>
                  </div>
                  <div>
                    <span className={mock.label}>Préstamo USDC otorgado</span>
                    <span className="font-mono font-bold text-accent-strong">${fmt(war.loanAmountUsd)}</span>
                  </div>
                  <div>
                    <span className={mock.label}>Salud del colateral</span>
                    <span className="font-mono font-bold text-ink">{war.healthFactor}x (seguro)</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <div className={`${mock.card} space-y-6 p-6 sm:p-8`}>
            <h3 className="text-base font-bold text-ink">Calculadora de préstamo con warrants</h3>

            <div className="space-y-1.5">
              <span className="text-xs font-medium text-muted">Commodity en silobolsa</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(Object.keys(PRICES) as Commodity[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCommodity(c)}
                    className={`rounded-xl border px-2 py-2 text-xs font-semibold transition-all ${
                      commodity === c ? "border-accent bg-accent/10 text-accent-strong" : "border-line bg-surface text-muted"
                    }`}
                  >
                    <span className="sm:hidden">{c}</span>
                    <span className="hidden sm:inline">
                      {c} (${PRICES[c]}/Tn)
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-muted">Cantidad de toneladas depositadas</span>
              <input
                type="number"
                min="50"
                step="50"
                value={tons}
                onChange={(e) => setTons(Math.max(50, Number(e.target.value)))}
                className={`${mock.input} text-xs`}
              />
            </label>

            <label className="block space-y-2">
              <span className="flex justify-between text-xs">
                <span className="text-muted">LTV solicitado:</span>
                <span className="font-mono font-bold text-accent-strong">{ltv}% LTV</span>
              </span>
              <input
                type="range"
                min="50"
                max="60"
                step="1"
                value={ltv}
                onChange={(e) => setLtv(Number(e.target.value))}
                className="h-2 w-full cursor-pointer rounded-lg accent-[#7ed86a]"
              />
              <span className="flex flex-col gap-0.5 font-mono text-[10px] text-muted sm:flex-row sm:justify-between">
                <span>50% (Conservador)</span>
                <span className="hidden sm:inline">55% (Estándar)</span>
                <span>60% (Máximo)</span>
              </span>
            </label>

            <div className={`${mock.well} space-y-2 p-4 font-mono text-xs`}>
              <div className="flex justify-between text-muted">
                <span>Valor del grano:</span>
                <span className="text-ink">${fmt(collateral)} USD</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Préstamo a recibir (USDC):</span>
                <span className="font-bold text-accent-strong">${fmt(loan)} USDC</span>
              </div>
              <div className="flex justify-between border-t border-line pt-1 text-[10px] text-muted">
                <span>Precio de liquidación (75% LTV):</span>
                <span className="text-bad">${(price * 0.75).toFixed(1)} USD/Tn</span>
              </div>
            </div>

            {notice && (
              <div className={mock.ok}>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setNotice(`Simulación: préstamo de $${fmt(loan)} USDC contra ${tons} Tn de ${commodity}. No se envió transacción.`)}
              className={mock.action}
            >
              <Zap className="h-4 w-4" />
              Simular préstamo (no onchain)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
