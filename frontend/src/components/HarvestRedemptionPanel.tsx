"use client";

import { useState } from "react";
import { formatUnits, keccak256, parseUnits, toBytes } from "viem";
import { useReadContracts } from "wagmi";
import { erc20Abi, harvestRedemptionAbi, shardTokenAbi } from "@/lib/abi";
import { addresses, SHARD_DECIMALS, USDC_DECIMALS } from "@/lib/env";
import { formatDate, formatShards, formatUsdc } from "@/lib/format";
import { button, field, notice } from "@/lib/ui";
import { useTx } from "@/hooks/useTx";
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
    const done = await tx.run("Cosecha liquidada", [
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
    const done = await tx.run("Shards canjeados", [
      { address: lot.token, abi: shardTokenAbi, functionName: "approve", args: [redemption, redeemShards] },
      { address: redemption, abi: harvestRedemptionAbi, functionName: "redeem", args: [lot.token, redeemShards] },
    ]);
    if (done) setShards("");
  };

  return (
    <div>

      {!settled && (
        <>
          <p className="text-sm text-muted">Todavía no se liquidó la cosecha.</p>
          {isIssuer && account && (
            <div className="mt-4 space-y-4 text-sm">
              <label className="block">
                <span className="font-medium">USDC de la venta</span>
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
                <span className="font-medium">Evidencia de la venta (link)</span>
                <input
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder="https://... (liquidación del acopio)"
                  disabled={tx.pending !== null}
                  className={field}
                />
              </label>
              {settleAmount > 0n && (
                <p className="text-muted">
                  Cada {lot.symbol} va a valer <span className="font-mono text-ink">{perShard(settleAmount, supply)}</span>.
                </p>
              )}
              {settleAmount > 0n && usdcBalance !== undefined && settleAmount > usdcBalance && (
                <p className="text-bad">Tu saldo de USDC no alcanza ({formatUsdc(usdcBalance)}).</p>
              )}
              <button onClick={settle} disabled={tx.pending !== null || !canSettle} className={`${button.primary} w-full`}>
                {tx.pending ? "Procesando..." : "Liquidar cosecha"}
              </button>
              <p className="text-xs text-muted">Se liquida una sola vez. Son 2 firmas: aprobar el USDC y liquidar.</p>
            </div>
          )}
        </>
      )}

      {settled && settlement && (
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Total liquidado</dt>
              <dd className="font-mono tabular-nums">{formatUsdc(settlement.amount)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Valor por shard</dt>
              <dd className="font-mono tabular-nums">{perShard(settlement.amount, settlement.totalSupply)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Canjeado</dt>
              <dd className="font-mono tabular-nums">
                {formatShards(settlement.redeemedShards)} de {formatShards(settlement.totalSupply)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Fecha</dt>
              <dd>{formatDate(settlement.settledAt)}</dd>
            </div>
            {settlement.evidenceURI && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Evidencia</dt>
                <dd>
                  <a href={settlement.evidenceURI} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-accent">
                    Ver documento
                  </a>
                </dd>
              </div>
            )}
          </dl>

          {account && (
            <div className="space-y-4 text-sm">
              <p className="text-muted">
                Tenés <span className="font-mono text-ink">{shardBalance !== undefined ? formatShards(shardBalance) : "..."} {lot.symbol}</span>.
              </p>
              <label className="block">
                <span className="font-medium">Shards a canjear</span>
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
                  Máx.
                </button>
              )}
              {payout > 0n && (
                <p className="text-muted">
                  Recibís <span className="font-mono text-ink">{formatUsdc(payout, 4)}</span>.
                </p>
              )}
              {redeemShards > 0n && shardBalance !== undefined && redeemShards > shardBalance && (
                <p className="text-bad">No tenés tantos {lot.symbol}.</p>
              )}
              <button onClick={redeem} disabled={tx.pending !== null || !canRedeem} className={`${button.primary} w-full`}>
                {tx.pending ? "Procesando..." : "Canjear por USDC"}
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
