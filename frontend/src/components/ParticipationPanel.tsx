"use client";

import { useState } from "react";
import { parseUnits } from "viem";
import { erc20Abi, kycRegistryAbi, offeringAbi } from "@/lib/abi";
import { addresses, USDC_DECIMALS } from "@/lib/env";
import { formatShards, formatUsdc } from "@/lib/format";
import { button, field, notice } from "@/lib/ui";
import type { Lot } from "@/hooks/useLots";
import { useInvestor } from "@/hooks/useInvestor";
import { useTx } from "@/hooks/useTx";
import { TestFundsButton } from "@/components/TestFundsButton";

const SHARD_UNIT = 10n ** 18n;
const actionClass = `${button.primary} w-full`;

function parseAmount(value: string): bigint | null {
  if (!value.trim()) return null;
  try {
    const parsed = parseUnits(value.replace(",", "."), USDC_DECIMALS);
    return parsed > 0n ? parsed : null;
  } catch {
    return null;
  }
}

export function ParticipationPanel({ lot }: { lot: Lot }) {
  const investor = useInvestor(lot.offering);
  const tx = useTx();
  const [amount, setAmount] = useState("");

  if (!investor.address) return <p className="text-sm text-muted">Iniciá sesión para participar.</p>;

  const parsed = parseAmount(amount);
  const estimatedShards = parsed ? (parsed * SHARD_UNIT) / lot.pricePerShard : 0n;
  const myShards = (investor.contribution * SHARD_UNIT) / lot.pricePerShard;
  const remaining = lot.hardCap - lot.totalRaised;
  const busy = tx.pending !== null;

  const verify = () =>
    tx.run("Verificación completada", { address: addresses.kyc!, abi: kycRegistryAbi, functionName: "verifyMyself" });

  const contribute = async () => {
    if (!parsed) return;
    const requests = [];
    if (investor.allowance < parsed) {
      requests.push({
        address: addresses.usdc!,
        abi: erc20Abi,
        functionName: "approve",
        args: [lot.offering, parsed],
      });
    }
    requests.push({ address: lot.offering, abi: offeringAbi, functionName: "contribute", args: [parsed] });
    if (await tx.run("Aporte realizado", requests)) setAmount("");
  };

  const simple = (label: string, functionName: "finalize" | "claim" | "refund") =>
    tx.run(label, { address: lot.offering, abi: offeringAbi, functionName });

  const hasAction = (investor.verified && lot.status === "active") || lot.status !== "active" || (investor.ready && !investor.verified);

  return (
    <div className={`grid gap-6 text-sm ${hasAction ? "md:grid-cols-2 md:gap-8" : ""}`}>
      <div className="space-y-5">
        <dl className="space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Saldo USDC</dt>
            <dd className="font-mono font-medium tabular-nums">{investor.ready ? formatUsdc(investor.usdcBalance) : "..."}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Tu aporte</dt>
            <dd className="font-mono font-medium tabular-nums">{investor.ready ? formatUsdc(investor.contribution) : "..."}</dd>
          </div>
          {investor.contribution > 0n && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Equivale a</dt>
              <dd className="font-mono font-medium tabular-nums">
                {formatShards(myShards)} {lot.symbol}
              </dd>
            </div>
          )}
        </dl>
        {tx.sponsored && <p className="text-xs text-muted">Gas patrocinado por Privy: no necesitás MON para operar.</p>}
        {investor.ready && <TestFundsButton account={investor.address} balance={investor.usdcBalance} />}
      </div>

      <div className="space-y-5">
        {investor.ready && !investor.verified && lot.status === "active" && (
          <div className={notice.warn}>
            <p>Tu dirección todavía no está verificada (KYC).</p>
            {investor.openVerification ? (
              <button onClick={verify} disabled={busy} className={`${actionClass} mt-3`}>
                {tx.pending === "Verificación completada" ? "Verificando..." : "Verificarme (demo)"}
              </button>
            ) : (
              <p className="mt-2 text-xs">Pedí la verificación al emisor.</p>
            )}
          </div>
        )}

        {investor.verified && lot.status === "active" && (
          <div className="space-y-4">
            <label className="block">
              <span className="font-medium">Monto a aportar (USDC)</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="1000"
                className={`${field} font-mono tabular-nums`}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {[100n, 1000n, 10000n].map((preset) => (
                <button key={preset.toString()} onClick={() => setAmount(preset.toString())} className={button.chip}>
                  {preset.toString()}
                </button>
              ))}
              <button onClick={() => setAmount((Number(remaining) / 1e6).toString())} className={button.chip}>
                Máx.
              </button>
            </div>
            {parsed && (
              <p className="text-muted">
                Recibirás aprox.{" "}
                <span className="font-mono font-medium tabular-nums text-ink">
                  {formatShards(estimatedShards)} {lot.symbol}
                </span>
              </p>
            )}
            <button onClick={contribute} disabled={busy || !parsed} className={actionClass}>
              {tx.pending === "Aporte realizado" ? "Procesando..." : "Aportar"}
            </button>
          </div>
        )}

        {lot.status === "ready" && (
          <div className="space-y-3">
            <p className="text-muted">La licitación terminó. Cualquiera puede finalizarla para liquidar los fondos.</p>
            <button onClick={() => simple("Licitación finalizada", "finalize")} disabled={busy} className={actionClass}>
              {tx.pending === "Licitación finalizada" ? "Procesando..." : "Finalizar licitación"}
            </button>
          </div>
        )}

        {lot.status === "succeeded" && (
          <div className="space-y-3">
            <p className="font-medium text-ok">La licitación fue exitosa.</p>
            {investor.contribution > 0n ? (
              <button onClick={() => simple("Shards reclamados", "claim")} disabled={busy} className={actionClass}>
                {tx.pending === "Shards reclamados" ? "Procesando..." : `Reclamar ${formatShards(myShards)} ${lot.symbol}`}
              </button>
            ) : (
              <p className="text-muted">No tenés shards pendientes de reclamar.</p>
            )}
          </div>
        )}

        {lot.status === "failed" && (
          <div className="space-y-3">
            <p className="font-medium text-bad">No se alcanzó el mínimo. Los aportes se devuelven.</p>
            {investor.contribution > 0n ? (
              <button onClick={() => simple("Reembolso realizado", "refund")} disabled={busy} className={actionClass}>
                {tx.pending === "Reembolso realizado"
                  ? "Procesando..."
                  : `Reclamar reembolso de ${formatUsdc(investor.contribution)}`}
              </button>
            ) : (
              <p className="text-muted">No tenés aportes para reembolsar.</p>
            )}
          </div>
        )}

        {tx.error && (
          <p role="alert" className={notice.bad}>
            {tx.error}
          </p>
        )}
        {tx.success && !tx.error && (
          <p role="status" className={notice.ok}>
            {tx.success}
          </p>
        )}
      </div>
    </div>
  );
}
