"use client";

import { useEffect, useState } from "react";
import { formatUnits, parseUnits, zeroAddress } from "viem";
import { useReadContracts, useSimulateContract } from "wagmi";
import { erc20Abi } from "@/lib/abi";
import { formatShards, formatUsdc } from "@/lib/format";
import { SLIPPAGE_OPTIONS_BPS, applySlippage, kuruTradeAbi, precisionDecimals, truncateDecimals } from "@/lib/kuru";
import { button, field, notice } from "@/lib/ui";
import { useTx } from "@/hooks/useTx";
import { useT } from "@/lib/i18n";
import type { Lot } from "@/hooks/useLots";
import type { useKuruMarket } from "@/hooks/useKuruMarket";

type Side = "buy" | "sell";
type MarketInfo = NonNullable<ReturnType<typeof useKuruMarket>["info"]>;

function useDebounced<T>(value: T, ms = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function TradePanel({ lot, market, account }: { lot: Lot; market: MarketInfo; account?: `0x${string}` }) {
  const tx = useTx();
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState<number>(100);
  const t = useT();

  const buy = side === "buy";
  const inDecimals = buy ? market.quoteDecimals : market.baseDecimals;
  const precDecimals = precisionDecimals(buy ? market.pricePrecision : market.sizePrecision);
  const tokenIn = buy ? market.quote : lot.token;

  const clean = truncateDecimals(amount, precDecimals);
  let tokenAmount = 0n;
  let units = 0n;
  try {
    if (clean && Number(clean) > 0) {
      tokenAmount = parseUnits(clean, inDecimals);
      units = parseUnits(clean, precDecimals);
    }
  } catch {
    tokenAmount = 0n;
    units = 0n;
  }

  const { data } = useReadContracts({
    contracts: [
      { address: lot.token, abi: erc20Abi, functionName: "balanceOf", args: [account!] },
      { address: market.quote, abi: erc20Abi, functionName: "balanceOf", args: [account!] },
      { address: tokenIn, abi: erc20Abi, functionName: "allowance", args: [account!, market.address] },
    ],
    query: { enabled: Boolean(account), refetchInterval: 12000 },
  });
  const shardBalance = data?.[0]?.status === "success" ? (data[0].result as bigint) : undefined;
  const usdcBalance = data?.[1]?.status === "success" ? (data[1].result as bigint) : undefined;
  const allowance = data?.[2]?.status === "success" ? (data[2].result as bigint) : 0n;
  const balanceIn = buy ? usdcBalance : shardBalance;

  const debouncedUnits = useDebounced(units);
  const estimate = useSimulateContract({
    address: market.address,
    abi: kuruTradeAbi,
    functionName: buy ? "placeAndExecuteMarketBuy" : "placeAndExecuteMarketSell",
    args: [debouncedUnits, 0n, false, false] as never,
    account: zeroAddress,
    query: { enabled: debouncedUnits > 0n, retry: false },
  });
  const out = debouncedUnits === units && estimate.data ? (estimate.data.result as bigint) : undefined;
  const minOut = out !== undefined ? applySlippage(out, slippage) : undefined;

  const insufficient = balanceIn !== undefined && tokenAmount > balanceIn;
  const canTrade = Boolean(account) && tokenAmount > 0n && minOut !== undefined && !insufficient;

  const effectivePrice =
    out && tokenAmount > 0n
      ? buy
        ? Number(formatUnits(tokenAmount, inDecimals)) / Number(formatUnits(out, market.baseDecimals))
        : Number(formatUnits(out, market.quoteDecimals)) / Number(formatUnits(tokenAmount, inDecimals))
      : undefined;

  const trade = async () => {
    if (!canTrade || minOut === undefined) return;
    const requests = [];
    if (allowance < tokenAmount) {
      requests.push({ address: tokenIn, abi: erc20Abi, functionName: "approve", args: [market.address, tokenAmount] });
    }
    requests.push({
      address: market.address,
      abi: kuruTradeAbi,
      functionName: buy ? "placeAndExecuteMarketBuy" : "placeAndExecuteMarketSell",
      args: [units, minOut, false, false],
    });
    if (await tx.run(buy ? t("Compra realizada", "Purchase completed") : t("Venta realizada", "Sale completed"), requests)) setAmount("");
  };

  const label = buy ? t("Comprar", "Buy") : t("Vender", "Sell");
  const busy = tx.pending !== null;

  return (
    <div className="text-sm">
      <div className="flex gap-2">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setSide(s);
              setAmount("");
            }}
            disabled={busy}
            className={`${s === side ? button.primary : button.secondary} flex-1`}
          >
            {s === "buy" ? t("Comprar", "Buy") : t("Vender", "Sell")}
          </button>
        ))}
      </div>

      {!account && <p className="mt-4 text-muted">{t("Iniciá sesión para operar.", "Log in to trade.")}</p>}

      {account && (
        <div className="mt-4 space-y-4">
          <dl className="space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("Tu saldo USDC", "Your USDC balance")}</dt>
              <dd className="font-mono tabular-nums">{usdcBalance !== undefined ? formatUsdc(usdcBalance) : "..."}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">{t("Tus", "Your")} {lot.symbol}</dt>
              <dd className="font-mono tabular-nums">{shardBalance !== undefined ? formatShards(shardBalance) : "..."}</dd>
            </div>
          </dl>

          <label className="block">
            <span className="font-medium">{buy ? t("Monto a gastar (USDC)", "Amount to spend (USDC)") : t(`Cantidad a vender (${lot.symbol})`, `Amount to sell (${lot.symbol})`)}</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder={buy ? "10" : "100"}
              disabled={busy}
              className={`${field} font-mono tabular-nums`}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {buy ? (
              [1, 10, 100].map((p) => (
                <button key={p} onClick={() => setAmount(String(p))} className={button.chip}>
                  {p}
                </button>
              ))
            ) : null}
            <button
              onClick={() => balanceIn !== undefined && setAmount(truncateDecimals(formatUnits(balanceIn, inDecimals), precDecimals))}
              className={button.chip}
            >
              {t("Máx.", "Max")}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted">{t("Tolerancia", "Slippage")}</span>
            {SLIPPAGE_OPTIONS_BPS.map((bps) => (
              <button
                key={bps}
                onClick={() => setSlippage(bps)}
                className={`${button.chip} ${bps === slippage ? "border-accent text-accent" : ""}`}
              >
                {bps / 100}%
              </button>
            ))}
          </div>

          {tokenAmount > 0n && (
            <div className="space-y-1 text-muted">
              {out !== undefined ? (
                <>
                  <p>
                    {t("Recibirás aprox.", "You'll receive approx.")}{" "}
                    <span className="font-mono font-medium tabular-nums text-ink">
                      {buy ? `${formatShards(out, 4)} ${lot.symbol}` : formatUsdc(out, 4)}
                    </span>
                  </p>
                  <p>
                    {t("Mínimo garantizado:", "Guaranteed minimum:")}{" "}
                    <span className="font-mono tabular-nums">
                      {buy ? `${formatShards(minOut!, 4)} ${lot.symbol}` : formatUsdc(minOut!, 4)}
                    </span>
                  </p>
                  {effectivePrice !== undefined && (
                    <p>
                      {t("Precio efectivo:", "Effective price:")}{" "}
                      <span className="font-mono tabular-nums">{effectivePrice.toLocaleString("es-AR", { maximumFractionDigits: 5 })} USDC</span>
                    </p>
                  )}
                </>
              ) : estimate.error ? (
                <p className="text-bad">{t("No se pudo estimar la orden: el monto está fuera de lo que acepta el mercado.", "Could not quote the order: the amount is outside what the market accepts.")}</p>
              ) : (
                <p>{t("Calculando...", "Calculating...")}</p>
              )}
            </div>
          )}
          {insufficient && <p className="text-bad">{t("Tu saldo no alcanza para esa operación.", "Your balance is not enough for that trade.")}</p>}

          <button onClick={trade} disabled={busy || !canTrade} className={`${button.primary} w-full`}>
            {busy ? t("Procesando...", "Processing...") : label}
          </button>
          {tx.sponsored && <p className="text-xs text-muted">{t("Gas patrocinado por Privy: no necesitás MON.", "Gas sponsored by Privy: no MON needed.")}</p>}
          {allowance < tokenAmount && tokenAmount > 0n && (
            <p className="text-xs text-muted">{t("Primero se pide una aprobación del token y después la orden (2 firmas).", "First a token approval, then the order (2 signatures).")}</p>
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
      )}
    </div>
  );
}
