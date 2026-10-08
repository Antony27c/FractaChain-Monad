"use client";

import { useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { erc20Abi } from "@/lib/abi";
import { formatShards, formatUsdc } from "@/lib/format";
import { kuruVaultAbi, minQuoteConsumed, quoteForVaultDeposit } from "@/lib/kuru";
import { button, field, notice } from "@/lib/ui";
import { useTx } from "@/hooks/useTx";
import type { Lot } from "@/hooks/useLots";
import type { useKuruMarket } from "@/hooks/useKuruMarket";

type MarketInfo = NonNullable<ReturnType<typeof useKuruMarket>["info"]>;

export function AddLiquidityForm({
  lot,
  market,
  vault,
  vaultBestAsk,
  account,
}: {
  lot: Lot;
  market: MarketInfo;
  vault: `0x${string}`;
  vaultBestAsk: bigint;
  account: `0x${string}`;
}) {
  const tx = useTx();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [withdrawPct, setWithdrawPct] = useState<number | null>(null);

  const { data } = useReadContracts({
    contracts: [
      { address: lot.token, abi: erc20Abi, functionName: "balanceOf", args: [account] },
      { address: market.quote, abi: erc20Abi, functionName: "balanceOf", args: [account] },
      { address: vault, abi: kuruVaultAbi, functionName: "totalAssets" },
      { address: vault, abi: kuruVaultAbi, functionName: "balanceOf", args: [account] },
      { address: vault, abi: kuruVaultAbi, functionName: "totalSupply" },
    ],
    query: { refetchInterval: 12000 },
  });
  const ok = <T,>(i: number) => (data?.[i]?.status === "success" ? (data[i].result as T) : undefined);
  const shardBalance = ok<bigint>(0);
  const usdcBalance = ok<bigint>(1);
  const assets = ok<readonly [bigint, bigint]>(2);
  const myShares = ok<bigint>(3);
  const totalShares = ok<bigint>(4);

  let base = 0n;
  try {
    base = amount.trim() ? parseUnits(amount.trim().replace(",", "."), market.baseDecimals) : 0n;
  } catch {
    base = 0n;
  }
  const quote = base > 0n ? quoteForVaultDeposit(base, vaultBestAsk, market.baseDecimals, market.quoteDecimals) : 0n;
  const enough =
    base > 0n && quote > 0n && shardBalance !== undefined && usdcBalance !== undefined
      ? base <= shardBalance && quote <= usdcBalance
      : false;
  const myPct = myShares && totalShares ? (Number(myShares) / Number(totalShares)) * 100 : 0;

  const withdrawShares = myShares && withdrawPct ? (withdrawPct === 100 ? myShares : (myShares * BigInt(withdrawPct)) / 100n) : 0n;
  const { data: preview } = useReadContract({
    address: vault,
    abi: kuruVaultAbi,
    functionName: "previewWithdraw",
    args: [withdrawShares],
    query: { enabled: withdrawShares > 0n },
  });

  const withdraw = async () => {
    if (withdrawShares === 0n) return;
    const done = await tx.run("Liquidez retirada", {
      address: vault,
      abi: kuruVaultAbi,
      functionName: "withdraw",
      args: [withdrawShares, account, account],
    });
    if (done) setWithdrawPct(null);
  };

  const deposit = async () => {
    if (!enough) return;
    const done = await tx.run("Liquidez agregada", [
      { address: lot.token, abi: erc20Abi, functionName: "approve", args: [vault, base] },
      { address: market.quote, abi: erc20Abi, functionName: "approve", args: [vault, quote] },
      { address: vault, abi: kuruVaultAbi, functionName: "deposit", args: [base, quote, minQuoteConsumed(quote), account] },
    ]);
    if (done) setAmount("");
  };

  return (
    <div className="mt-5 border-t border-line pt-5 text-sm">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between font-medium">
        <span>Liquidez del vault</span>
        <span className="text-muted">{open ? "Ocultar" : "Ver"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <p className="text-muted">
            Depositás shards y USDC al precio actual del vault. Más liquidez significa que cada orden mueve menos el precio,
            y los proveedores cobran parte de las comisiones. Podés retirar tu parte cuando quieras.
          </p>
          <dl className="space-y-2">
            {assets && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Liquidez del vault</dt>
                <dd className="text-right font-mono tabular-nums">
                  {formatShards(assets[0])} {lot.symbol}
                  <br />
                  {formatUsdc(assets[1])}
                </dd>
              </div>
            )}
            {myPct > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Tu parte del vault</dt>
                <dd className="font-mono tabular-nums">{myPct.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%</dd>
              </div>
            )}
          </dl>

          {myShares !== undefined && myShares > 0n && (
            <div className="space-y-3 rounded-xl border border-line p-4">
              <p className="font-medium">Retirar liquidez</p>
              <div className="flex flex-wrap gap-2">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setWithdrawPct(pct)}
                    disabled={tx.pending !== null}
                    className={`${button.chip} ${pct === withdrawPct ? "border-accent text-accent" : ""}`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              {withdrawPct && preview && (
                <p className="text-muted">
                  Retirás el {withdrawPct}% de tu parte y recibís{" "}
                  <span className="font-mono text-ink">{formatShards(preview[0])} {lot.symbol}</span> y{" "}
                  <span className="font-mono text-ink">{formatUsdc(preview[1])}</span>.
                </p>
              )}
              <button
                onClick={withdraw}
                disabled={tx.pending !== null || withdrawShares === 0n}
                className={`${button.secondary} w-full`}
              >
                {tx.pending === "Liquidez retirada" ? "Procesando..." : "Retirar liquidez"}
              </button>
              <p className="text-xs text-muted">Una sola firma. Recibís shards y USDC según la proporción actual del vault.</p>
            </div>
          )}

          <label className="block">
            <span className="font-medium">Shards a depositar ({lot.symbol})</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="1000"
              disabled={tx.pending !== null}
              className={`${field} font-mono tabular-nums`}
            />
          </label>
          {shardBalance !== undefined && (
            <button
              onClick={() => setAmount(formatUnits(shardBalance, market.baseDecimals))}
              className={button.chip}
            >
              Máx. {formatShards(shardBalance)}
            </button>
          )}

          {base > 0n && (
            <p className="text-muted">
              Se depositan <span className="font-mono text-ink">{formatShards(base)} {lot.symbol}</span> y{" "}
              <span className="font-mono text-ink">{formatUsdc(quote)}</span>.
            </p>
          )}
          {base > 0n && !enough && shardBalance !== undefined && usdcBalance !== undefined && (
            <p className="text-bad">Tu saldo de {lot.symbol} o de USDC no alcanza.</p>
          )}

          <button onClick={deposit} disabled={tx.pending !== null || !enough} className={`${button.primary} w-full`}>
            {tx.pending === "Liquidez agregada" ? "Procesando..." : "Agregar liquidez"}
          </button>
          <p className="text-xs text-muted">Son 3 firmas: dos aprobaciones y el depósito.</p>

          {tx.error && <p role="alert" className={notice.bad}>{tx.error}</p>}
          {tx.success && !tx.error && <p role="status" className={notice.ok}>{tx.success}</p>}
        </div>
      )}
    </div>
  );
}
