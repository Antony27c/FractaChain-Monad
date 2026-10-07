"use client";

import { useState } from "react";
import { formatUnits, parseEventLogs, parseUnits } from "viem";
import { useReadContracts } from "wagmi";
import { erc20Abi } from "@/lib/abi";
import { addresses, USDC_DECIMALS } from "@/lib/env";
import { formatShards, formatUsdc, shortAddress } from "@/lib/format";
import { KURU_DEFAULTS, KURU_ROUTER, kuruRouterAbi, kuruVaultAbi, marketRegisteredEvent, minQuoteConsumed, quoteForShards } from "@/lib/kuru";
import { button, field, notice } from "@/lib/ui";
import { useTx } from "@/hooks/useTx";
import type { Lot } from "@/hooks/useLots";

type Deployed = { market: `0x${string}`; vault: `0x${string}` };

export function OpenMarketForm({ lot, onOpened }: { lot: Lot; onOpened: (market: `0x${string}`) => void }) {
  const tx = useTx();
  const [seed, setSeed] = useState("");
  const [deployed, setDeployed] = useState<Deployed | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);

  const { data } = useReadContracts({
    contracts: [
      { address: lot.token, abi: erc20Abi, functionName: "balanceOf", args: [lot.issuer] },
      { address: addresses.usdc, abi: erc20Abi, functionName: "balanceOf", args: [lot.issuer] },
    ],
    query: { refetchInterval: 12000 },
  });
  const shardBalance = data?.[0]?.status === "success" ? (data[0].result as bigint) : undefined;
  const usdcBalance = data?.[1]?.status === "success" ? (data[1].result as bigint) : undefined;

  const price = Number(formatUnits(lot.pricePerShard, USDC_DECIMALS));
  const priceTooHigh = price > KURU_DEFAULTS.maxPrice;

  let seedShards: bigint | null = null;
  try {
    seedShards = seed.trim() ? parseUnits(seed.trim().replace(",", "."), 18) : null;
  } catch {
    seedShards = null;
  }
  const seedQuote = seedShards ? quoteForShards(seedShards, lot.pricePerShard) : null;
  const enough =
    seedShards && seedQuote && shardBalance !== undefined && usdcBalance !== undefined
      ? seedShards <= shardBalance && seedQuote <= usdcBalance && seedQuote > 0n
      : false;

  const seedVault = async (target: Deployed) => {
    if (!seedShards || !seedQuote) return false;
    setStep("Sembrando el vault (3 firmas: 2 aprobaciones y el depósito)");
    return tx.run("Vault sembrado", [
      { address: lot.token, abi: erc20Abi, functionName: "approve", args: [target.vault, seedShards] },
      { address: addresses.usdc!, abi: erc20Abi, functionName: "approve", args: [target.vault, seedQuote] },
      {
        address: target.vault,
        abi: kuruVaultAbi,
        functionName: "deposit",
        args: [seedShards, seedQuote, minQuoteConsumed(seedQuote), lot.issuer],
      },
    ]);
  };

  const open = async () => {
    setFormError(null);
    if (!seedShards || !seedQuote || !enough) return;
    try {
      let target = deployed;
      if (!target) {
        setStep("Creando el mercado (1 firma)");
        const res = await fetch(`/api/kuru/precisions?price=${price}`);
        const precisions = await res.json();
        if (!res.ok) throw new Error(precisions.error ?? "No se pudieron calcular las precisiones.");

        const receipts = await tx.runWithReceipts("Mercado creado", {
          address: KURU_ROUTER,
          abi: kuruRouterAbi,
          functionName: "deployProxy",
          args: [
            0,
            lot.token,
            addresses.usdc!,
            BigInt(precisions.sizePrecision),
            Number(precisions.pricePrecision),
            Number(precisions.tickSize),
            BigInt(precisions.minSize),
            BigInt(precisions.maxSize),
            BigInt(KURU_DEFAULTS.takerFeeBps),
            BigInt(KURU_DEFAULTS.makerFeeBps),
            BigInt(KURU_DEFAULTS.ammSpread),
          ],
        });
        if (!receipts) return;
        const log = parseEventLogs({ abi: [marketRegisteredEvent], logs: receipts[0].logs, eventName: "MarketRegistered" })[0];
        if (!log) throw new Error("No se encontró el evento MarketRegistered en la transacción.");
        target = { market: log.args.market, vault: log.args.vaultAddress };
        setDeployed(target);
      }
      if (await seedVault(target)) onOpened(target.market);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "No se pudo abrir el mercado.");
    } finally {
      setStep(null);
    }
  };

  const busy = tx.pending !== null;

  if (priceTooHigh) {
    return (
      <p className={`${notice.warn} mt-4`}>
        El precio ({price} USDC) supera el máximo que soporta esta configuración de mercado ({KURU_DEFAULTS.maxPrice}).
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4 text-sm">
      <dl className="space-y-2">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Tus {lot.symbol}</dt>
          <dd className="font-mono tabular-nums">{shardBalance !== undefined ? formatShards(shardBalance) : "..."}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Tu saldo USDC</dt>
          <dd className="font-mono tabular-nums">{usdcBalance !== undefined ? formatUsdc(usdcBalance) : "..."}</dd>
        </div>
      </dl>

      <label className="block">
        <span className="font-medium">Shards a sembrar en el vault</span>
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          inputMode="decimal"
          placeholder="500000"
          disabled={busy}
          className={`${field} font-mono tabular-nums`}
        />
      </label>

      {seedShards && seedQuote ? (
        <p className="text-muted">
          Se depositan <span className="font-mono text-ink">{formatShards(seedShards)} {lot.symbol}</span> y{" "}
          <span className="font-mono text-ink">{formatUsdc(seedQuote)}</span>, al precio de la licitación.
        </p>
      ) : null}
      {seedShards && !enough && shardBalance !== undefined && usdcBalance !== undefined && (
        <p className="text-bad">Tu saldo de {lot.symbol} o de USDC no alcanza para esa siembra.</p>
      )}

      <p className="text-xs text-muted">El primer depósito fija el precio del vault y no se corrige después.</p>

      {deployed && (
        <p className={notice.warn}>
          El mercado ya se creó ({shortAddress(deployed.market)}). Falta sembrar el vault: volvé a tocar el botón para reintentar.
        </p>
      )}

      <button onClick={open} disabled={busy || !enough} className={`${button.primary} w-full`}>
        {busy ? "Procesando..." : deployed ? "Sembrar el vault" : "Abrir mercado"}
      </button>
      {step && <p className="text-xs text-muted">{step}</p>}

      {(formError || tx.error) && (
        <p role="alert" className={notice.bad}>
          {formError ?? tx.error}
        </p>
      )}
    </div>
  );
}
