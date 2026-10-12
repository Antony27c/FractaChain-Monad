"use client";

import { useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { erc20Abi } from "@/lib/abi";
import { formatShards, formatUsdc } from "@/lib/format";
import { kuruVaultAbi, minQuoteConsumed, quoteForVaultDeposit } from "@/lib/kuru";
import { button, field, notice } from "@/lib/ui";
import { useTx } from "@/hooks/useTx";
import { useT } from "@/lib/i18n";
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
  const [amount, setAmount] = useState("");
  const [withdrawPct, setWithdrawPct] = useState<number | null>(null);
  const t = useT();
  const L = { withdraw: t("Liquidez retirada", "Liquidity withdrawn"), deposit: t("Liquidez agregada", "Liquidity added") };

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
    const done = await tx.run(L.withdraw, {
      address: vault,
      abi: kuruVaultAbi,
      functionName: "withdraw",
      args: [withdrawShares, account, account],
    });
    if (done) setWithdrawPct(null);
  };

  const deposit = async () => {
    if (!enough) return;
    const done = await tx.run(L.deposit, [
      { address: lot.token, abi: erc20Abi, functionName: "approve", args: [vault, base] },
      { address: market.quote, abi: erc20Abi, functionName: "approve", args: [vault, quote] },
      { address: vault, abi: kuruVaultAbi, functionName: "deposit", args: [base, quote, minQuoteConsumed(quote), account] },
    ]);
    if (done) setAmount("");
  };

  const withdrawBlock =
    myShares !== undefined && myShares > 0n ? (
      <div className="space-y-3 rounded-xl border border-line p-4">
        <p className="font-medium">{t("Retirar liquidez", "Withdraw liquidity")}</p>
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
            {t(`Retirás el ${withdrawPct}% de tu parte y recibís`, `You withdraw ${withdrawPct}% of your share and receive`)}{" "}
            <span className="font-mono text-ink">{formatShards(preview[0])} {lot.symbol}</span> {t("y", "and")}{" "}
            <span className="font-mono text-ink">{formatUsdc(preview[1])}</span>.
          </p>
        )}
        <button
          onClick={withdraw}
          disabled={tx.pending !== null || withdrawShares === 0n}
          className={`${button.secondary} w-full`}
        >
          {tx.pending === L.withdraw ? t("Procesando...", "Processing...") : t("Retirar liquidez", "Withdraw liquidity")}
        </button>
        <p className="text-xs text-muted">{t("Una sola firma. Recibís shards y USDC según la proporción actual del vault.", "One signature. You receive shards and USDC in the vault's current ratio.")}</p>
      </div>
    ) : null;

  return (
    <div className="grid gap-6 text-sm md:grid-cols-2 md:gap-8">
      <div className="space-y-4">
        <dl className="space-y-2">
          {assets && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("Liquidez del vault", "Vault liquidity")}</dt>
              <dd className="text-right font-mono tabular-nums">
                {formatShards(assets[0])} {lot.symbol}
                <br />
                {formatUsdc(assets[1])}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t("Tu parte del vault", "Your vault share")}</dt>
            <dd className="font-mono tabular-nums">{myPct.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%</dd>
          </div>
        </dl>
        {withdrawBlock ?? <p className="text-muted">{t("Todavía no aportaste liquidez a este vault.", "You haven't added liquidity to this vault yet.")}</p>}
      </div>

      <div className="space-y-4">
        <p className="font-medium">{t("Agregar liquidez", "Add liquidity")}</p>
        <label className="block">
          <span className="text-muted">{t("Shards a depositar", "Shards to deposit")} ({lot.symbol})</span>
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
          <button onClick={() => setAmount(formatUnits(shardBalance, market.baseDecimals))} className={button.chip}>
            {t("Máx.", "Max")} {formatShards(shardBalance)}
          </button>
        )}

        {base > 0n && (
          <p className="text-muted">
            {t("Se depositan", "Depositing")} <span className="font-mono text-ink">{formatShards(base)} {lot.symbol}</span> {t("y", "and")}{" "}
            <span className="font-mono text-ink">{formatUsdc(quote)}</span>.
          </p>
        )}
        {base > 0n && !enough && shardBalance !== undefined && usdcBalance !== undefined && (
          <p className="text-bad">{t(`Tu saldo de ${lot.symbol} o de USDC no alcanza.`, `Your ${lot.symbol} or USDC balance is not enough.`)}</p>
        )}

        <button onClick={deposit} disabled={tx.pending !== null || !enough} className={`${button.primary} w-full`}>
          {tx.pending === L.deposit ? t("Procesando...", "Processing...") : t("Agregar liquidez", "Add liquidity")}
        </button>
        <p className="text-xs text-muted">{t("Son 3 firmas: dos aprobaciones y el depósito.", "3 signatures: two approvals and the deposit.")}</p>

        {tx.error && <p role="alert" className={notice.bad}>{tx.error}</p>}
        {tx.success && !tx.error && <p role="status" className={notice.ok}>{tx.success}</p>}
      </div>
    </div>
  );
}
