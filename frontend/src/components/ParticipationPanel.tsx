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
import { useT } from "@/lib/i18n";

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
  const t = useT();
  const L = {
    verify: t("Verificación completada", "Verification completed"),
    contribute: t("Aporte realizado", "Contribution sent"),
    finalize: t("Licitación finalizada", "Auction finalized"),
    claim: t("Shards reclamados", "Shards claimed"),
    refund: t("Reembolso realizado", "Refund completed"),
  };

  if (!investor.address) return <p className="text-sm text-muted">{t("Iniciá sesión para participar.", "Log in to participate.")}</p>;

  const parsed = parseAmount(amount);
  const estimatedShards = parsed ? (parsed * SHARD_UNIT) / lot.pricePerShard : 0n;
  const myShards = (investor.contribution * SHARD_UNIT) / lot.pricePerShard;
  const remaining = lot.hardCap - lot.totalRaised;
  const busy = tx.pending !== null;

  const verify = () =>
    tx.run(L.verify, { address: addresses.kyc!, abi: kycRegistryAbi, functionName: "verifyMyself" });

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
    if (await tx.run(L.contribute, requests)) setAmount("");
  };

  const simple = (label: string, functionName: "finalize" | "claim" | "refund") =>
    tx.run(label, { address: lot.offering, abi: offeringAbi, functionName });

  const hasAction = (investor.verified && lot.status === "active") || lot.status !== "active" || (investor.ready && !investor.verified);

  return (
    <div className={`grid gap-6 text-sm ${hasAction ? "md:grid-cols-2 md:gap-8" : ""}`}>
      <div className="space-y-5">
        <dl className="space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("Saldo USDC", "USDC balance")}</dt>
            <dd className="font-mono font-medium tabular-nums">{investor.ready ? formatUsdc(investor.usdcBalance) : "..."}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("Tu aporte", "Your contribution")}</dt>
            <dd className="font-mono font-medium tabular-nums">{investor.ready ? formatUsdc(investor.contribution) : "..."}</dd>
          </div>
          {investor.contribution > 0n && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("Equivale a", "Equals")}</dt>
              <dd className="font-mono font-medium tabular-nums">
                {formatShards(myShards)} {lot.symbol}
              </dd>
            </div>
          )}
        </dl>
        {tx.sponsored && <p className="text-xs text-muted">{t("Gas patrocinado por Privy: no necesitás MON para operar.", "Gas sponsored by Privy: you don't need MON to operate.")}</p>}
        {investor.ready && <TestFundsButton account={investor.address} balance={investor.usdcBalance} />}
      </div>

      <div className="space-y-5">
        {investor.ready && !investor.verified && lot.status === "active" && (
          <div className={notice.warn}>
            <p>{t("Tu dirección todavía no está verificada (KYC).", "Your address is not verified yet (KYC).")}</p>
            {investor.openVerification ? (
              <button onClick={verify} disabled={busy} className={`${actionClass} mt-3`}>
                {tx.pending === L.verify ? t("Verificando...", "Verifying...") : t("Verificarme (demo)", "Verify me (demo)")}
              </button>
            ) : (
              <p className="mt-2 text-xs">{t("Pedí la verificación al emisor.", "Ask the issuer to verify you.")}</p>
            )}
          </div>
        )}

        {investor.verified && lot.status === "active" && (
          <div className="space-y-4">
            <label className="block">
              <span className="font-medium">{t("Monto a aportar (USDC)", "Amount to contribute (USDC)")}</span>
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
                {t("Máx.", "Max")}
              </button>
            </div>
            {parsed && (
              <p className="text-muted">
                {t("Recibirás aprox.", "You'll receive approx.")}{" "}
                <span className="font-mono font-medium tabular-nums text-ink">
                  {formatShards(estimatedShards)} {lot.symbol}
                </span>
              </p>
            )}
            <button onClick={contribute} disabled={busy || !parsed} className={actionClass}>
              {tx.pending === L.contribute ? t("Procesando...", "Processing...") : t("Aportar", "Contribute")}
            </button>
          </div>
        )}

        {lot.status === "ready" && (
          <div className="space-y-3">
            <p className="text-muted">{t("La licitación terminó. Cualquiera puede finalizarla para liquidar los fondos.", "The auction has ended. Anyone can finalize it to settle the funds.")}</p>
            <button onClick={() => simple(L.finalize, "finalize")} disabled={busy} className={actionClass}>
              {tx.pending === L.finalize ? t("Procesando...", "Processing...") : t("Finalizar licitación", "Finalize auction")}
            </button>
          </div>
        )}

        {lot.status === "succeeded" && (
          <div className="space-y-3">
            <p className="font-medium text-ok">{t("La licitación fue exitosa.", "The auction succeeded.")}</p>
            {investor.contribution > 0n ? (
              <button onClick={() => simple(L.claim, "claim")} disabled={busy} className={actionClass}>
                {tx.pending === L.claim ? t("Procesando...", "Processing...") : `${t("Reclamar", "Claim")} ${formatShards(myShards)} ${lot.symbol}`}
              </button>
            ) : (
              <p className="text-muted">{t("No tenés shards pendientes de reclamar.", "You have no shards left to claim.")}</p>
            )}
          </div>
        )}

        {lot.status === "failed" && (
          <div className="space-y-3">
            <p className="font-medium text-bad">{t("No se alcanzó el mínimo. Los aportes se devuelven.", "The minimum was not reached. Contributions are refunded.")}</p>
            {investor.contribution > 0n ? (
              <button onClick={() => simple(L.refund, "refund")} disabled={busy} className={actionClass}>
                {tx.pending === L.refund
                  ? t("Procesando...", "Processing...")
                  : `${t("Reclamar reembolso de", "Claim refund of")} ${formatUsdc(investor.contribution)}`}
              </button>
            ) : (
              <p className="text-muted">{t("No tenés aportes para reembolsar.", "You have no contributions to refund.")}</p>
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
