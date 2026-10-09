"use client";

import { useState } from "react";
import { formatUnits, keccak256, parseUnits, toBytes } from "viem";
import { useReadContracts } from "wagmi";
import { erc20Abi, harvestRedemptionAbi, shardTokenAbi } from "@/lib/abi";
import { addresses, SHARD_DECIMALS, USDC_DECIMALS } from "@/lib/env";
import { formatDate, formatShards, formatUsdc } from "@/lib/format";
import { button, field, notice } from "@/lib/ui";
import { useTx } from "@/hooks/useTx";
import { useI18n, useT } from "@/lib/i18n";
import type { Lot } from "@/hooks/useLots";

const SHARD_UNIT = 10n ** 18n;

const parse = (value: string, decimals: number) => {
  try {
    return value.trim() ? parseUnits(value.trim().replace(",", "."), decimals) : 0n;
  } catch {
    return 0n;
  }
};

const perShard = (amount: bigint, supply: bigint) =>
  supply > 0n ? `${Number(formatUnits((amount * SHARD_UNIT) / supply, USDC_DECIMALS)).toLocaleString("es-AR", { maximumFractionDigits: 6 })} USDC` : "-";

export function HarvestRedemptionPanel({ lot, account }: { lot: Lot; account?: `0x${string}` }) {
  const tx = useTx();
  const [amount, setAmount] = useState("");
  const [evidence, setEvidence] = useState("");
  const [shards, setShards] = useState("");
  const t = useT();
  const { locale } = useI18n();
  const redemption = addresses.redemption;
  const isIssuer = Boolean(account && account.toLowerCase() === lot.issuer.toLowerCase());

  const { data } = useReadContracts({
    contracts: [
      { address: redemption, abi: harvestRedemptionAbi, functionName: "settlementOf", args: [lot.token] },
      { address: lot.token, abi: shardTokenAbi, functionName: "totalSupply" },
      { address: lot.token, abi: erc20Abi, functionName: "balanceOf", args: [account!] },
      { address: addresses.usdc, abi: erc20Abi, functionName: "balanceOf", args: [account!] },
    ],
    query: { enabled: Boolean(redemption), refetchInterval: 12000 },
  });
  if (!redemption) return null;

  const ok = <T,>(i: number) => (data?.[i]?.status === "success" ? (data[i].result as T) : undefined);
  const settlement = ok<{
    amount: bigint;
    totalSupply: bigint;
    redeemedShards: bigint;
    paidOut: bigint;
    settledAt: bigint;
    evidenceURI: string;
  }>(0);
  const supply = ok<bigint>(1) ?? 0n;
  const shardBalance = account ? ok<bigint>(2) : undefined;
  const usdcBalance = account ? ok<bigint>(3) : undefined;
  const settled = Boolean(settlement && settlement.settledAt > 0n);

  const settleAmount = parse(amount, USDC_DECIMALS);
  const canSettle = settleAmount > 0n && usdcBalance !== undefined && settleAmount <= usdcBalance;

  const redeemShards = parse(shards, SHARD_DECIMALS);
  const payout = settlement && settled && settlement.totalSupply > 0n ? (redeemShards * settlement.amount) / settlement.totalSupply : 0n;
  const canRedeem = payout > 0n && shardBalance !== undefined && redeemShards <= shardBalance;

  const settle = async () => {
    if (!canSettle) return;
    const uri = evidence.trim();
    const done = await tx.run(t("Cosecha liquidada", "Harvest settled"), [
      { address: addresses.usdc!, abi: erc20Abi, functionName: "approve", args: [redemption, settleAmount] },
      {
        address: redemption,
        abi: harvestRedemptionAbi,
        functionName: "settle",
        args: [lot.token, settleAmount, uri, keccak256(toBytes(uri))],
      },
    ]);
    if (done) setAmount("");
  };

  const redeem = async () => {
    if (!canRedeem) return;
    const done = await tx.run(t("Shards canjeados", "Shards redeemed"), [
      { address: lot.token, abi: shardTokenAbi, functionName: "approve", args: [redemption, redeemShards] },
      { address: redemption, abi: harvestRedemptionAbi, functionName: "redeem", args: [lot.token, redeemShards] },
    ]);
    if (done) setShards("");
  };

  return (
    <div>

      {!settled && (
        <>
          <p className="text-sm text-muted">{t("Todavía no se liquidó la cosecha.", "The harvest has not been settled yet.")}</p>
          {isIssuer && account && (
            <div className="mt-4 space-y-4 text-sm">
              <label className="block">
                <span className="font-medium">{t("USDC de la venta", "Sale proceeds (USDC)")}</span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="300"
                  disabled={tx.pending !== null}
                  className={`${field} font-mono tabular-nums`}
                />
              </label>
              <label className="block">
                <span className="font-medium">{t("Evidencia de la venta (link)", "Sale evidence (link)")}</span>
                <input
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder={t("https://... (liquidación del acopio)", "https://... (elevator settlement)")}
                  disabled={tx.pending !== null}
                  className={field}
                />
              </label>
              {settleAmount > 0n && (
                <p className="text-muted">
                  {t(`Cada ${lot.symbol} va a valer`, `Each ${lot.symbol} will be worth`)} <span className="font-mono text-ink">{perShard(settleAmount, supply)}</span>.
                </p>
              )}
              {settleAmount > 0n && usdcBalance !== undefined && settleAmount > usdcBalance && (
                <p className="text-bad">{t("Tu saldo de USDC no alcanza", "Your USDC balance is not enough")} ({formatUsdc(usdcBalance)}).</p>
              )}
              <button onClick={settle} disabled={tx.pending !== null || !canSettle} className={`${button.primary} w-full`}>
                {tx.pending ? t("Procesando...", "Processing...") : t("Liquidar cosecha", "Settle harvest")}
              </button>
              <p className="text-xs text-muted">{t("Se liquida una sola vez. Son 2 firmas: aprobar el USDC y liquidar.", "It can only be settled once. 2 signatures: approve the USDC and settle.")}</p>
            </div>
          )}
        </>
      )}

      {settled && settlement && (
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("Total liquidado", "Total settled")}</dt>
              <dd className="font-mono tabular-nums">{formatUsdc(settlement.amount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("Valor por shard", "Value per shard")}</dt>
              <dd className="font-mono tabular-nums">{perShard(settlement.amount, settlement.totalSupply)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("Canjeado", "Redeemed")}</dt>
              <dd className="font-mono tabular-nums">
                {formatShards(settlement.redeemedShards)} {t("de", "of")} {formatShards(settlement.totalSupply)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("Fecha", "Date")}</dt>
              <dd>{formatDate(settlement.settledAt, locale)}</dd>
            </div>
            {settlement.evidenceURI && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{t("Evidencia", "Evidence")}</dt>
                <dd>
                  <a href={settlement.evidenceURI} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-accent">
                    {t("Ver documento", "View document")}
                  </a>
                </dd>
              </div>
            )}
          </dl>

          {account && (
            <div className="space-y-4 text-sm">
              <p className="text-muted">
                {t("Tenés", "You hold")} <span className="font-mono text-ink">{shardBalance !== undefined ? formatShards(shardBalance) : "..."} {lot.symbol}</span>.
              </p>
              <label className="block">
                <span className="font-medium">{t("Shards a canjear", "Shards to redeem")}</span>
                <input
                  value={shards}
                  onChange={(e) => setShards(e.target.value)}
                  inputMode="decimal"
                  placeholder="100"
                  disabled={tx.pending !== null}
                  className={`${field} font-mono tabular-nums`}
                />
              </label>
              {shardBalance !== undefined && shardBalance > 0n && (
                <button onClick={() => setShards(formatUnits(shardBalance, SHARD_DECIMALS))} className={button.chip}>
                  {t("Máx.", "Max")}
                </button>
              )}
              {payout > 0n && (
                <p className="text-muted">
                  {t("Recibís", "You receive")} <span className="font-mono text-ink">{formatUsdc(payout, 4)}</span>.
                </p>
              )}
              {redeemShards > 0n && shardBalance !== undefined && redeemShards > shardBalance && (
                <p className="text-bad">{t(`No tenés tantos ${lot.symbol}.`, `You don't have that many ${lot.symbol}.`)}</p>
              )}
              <button onClick={redeem} disabled={tx.pending !== null || !canRedeem} className={`${button.primary} w-full`}>
                {tx.pending ? t("Procesando...", "Processing...") : t("Canjear por USDC", "Redeem for USDC")}
              </button>
            </div>
          )}
        </div>
      )}

      {tx.error && <p role="alert" className={`${notice.bad} mt-3`}>{tx.error}</p>}
      {tx.success && !tx.error && <p role="status" className={`${notice.ok} mt-3`}>{tx.success}</p>}
    </div>
  );
}
