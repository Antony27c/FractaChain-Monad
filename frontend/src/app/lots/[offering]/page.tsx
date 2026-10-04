"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { parseUnits } from "viem";
import { erc20Abi, kycRegistryAbi, offeringAbi } from "@/lib/abi";
import { addresses, USDC_DECIMALS } from "@/lib/env";
import { formatDate, formatPricePerShard, formatShards, formatUsdc, shortAddress, timeLeft } from "@/lib/format";
import { useLots, useNow } from "@/hooks/useLots";
import { useInvestor } from "@/hooks/useInvestor";
import { useTx } from "@/hooks/useTx";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";

const SHARD_UNIT = 10n ** 18n;

function parseAmount(value: string): bigint | null {
  if (!value.trim()) return null;
  try {
    const parsed = parseUnits(value.replace(",", "."), USDC_DECIMALS);
    return parsed > 0n ? parsed : null;
  } catch {
    return null;
  }
}

const buttonClass =
  "w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-neutral-300";

export default function LotPage() {
  const { offering: offeringParam } = useParams<{ offering: string }>();
  const { lots, isLoading } = useLots();
  const now = useNow();
  const lot = lots.find((l) => l.offering.toLowerCase() === offeringParam.toLowerCase());
  const investor = useInvestor(lot?.offering);
  const tx = useTx();
  const [amount, setAmount] = useState("");

  if (isLoading) return <p className="mx-auto max-w-6xl px-6 py-10 text-neutral-500">Cargando lote...</p>;
  if (!lot) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-neutral-600">No encontramos ese lote.</p>
        <Link href="/" className="text-violet-700 hover:underline">
          Volver a los lotes
        </Link>
      </div>
    );
  }

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

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-800">
        &larr; Lotes
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        <section className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">{lot.name}</h1>
                <p className="mt-1 text-neutral-600">
                  {lot.asset.assetType} · {lot.asset.quantity.toString()} {lot.asset.unit} · Campaña{" "}
                  {lot.asset.campaign}
                </p>
              </div>
              <StatusBadge status={lot.status} />
            </div>
            <div className="mt-6">
              <ProgressBar raised={lot.totalRaised} softCap={lot.softCap} hardCap={lot.hardCap} />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-5 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-neutral-500">Precio por shard</dt>
                <dd className="font-medium">{formatPricePerShard(lot.pricePerShard)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Token</dt>
                <dd className="font-mono font-medium">{lot.symbol}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Cierra</dt>
                <dd className="font-medium">{formatDate(lot.deadline)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Tiempo restante</dt>
                <dd className="font-medium">{timeLeft(lot.deadline, now)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="font-semibold">Cómo funciona</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-neutral-600">
              <li>Aportás USDC a precio fijo. Tu dirección debe estar verificada (KYC).</li>
              <li>Si se alcanza el mínimo, el emisor recibe los fondos y vos reclamás tus shards.</li>
              <li>Si no se alcanza, recuperás todo tu USDC.</li>
              <li>Después, los shards se negocian en el order book de Kuru.</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm">
            <h2 className="font-semibold">Contratos</h2>
            <dl className="mt-3 space-y-1 text-neutral-600">
              <div className="flex justify-between">
                <dt>Emisor</dt>
                <dd className="font-mono">{shortAddress(lot.issuer)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Token</dt>
                <dd className="font-mono">{shortAddress(lot.token)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Licitación</dt>
                <dd className="font-mono">{shortAddress(lot.offering)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="font-semibold">Tu participación</h2>

            {!investor.address && <p className="mt-3 text-sm text-neutral-600">Iniciá sesión para participar.</p>}

            {investor.address && (
              <div className="mt-3 space-y-4 text-sm">
                <dl className="space-y-1 text-neutral-600">
                  <div className="flex justify-between">
                    <dt>Saldo USDC</dt>
                    <dd className="font-medium text-neutral-900">{formatUsdc(investor.usdcBalance)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Tu aporte</dt>
                    <dd className="font-medium text-neutral-900">{formatUsdc(investor.contribution)}</dd>
                  </div>
                  {investor.contribution > 0n && (
                    <div className="flex justify-between">
                      <dt>Equivale a</dt>
                      <dd className="font-medium text-neutral-900">
                        {formatShards(myShards)} {lot.symbol}
                      </dd>
                    </div>
                  )}
                </dl>

                {!investor.verified && lot.status === "active" && (
                  <div className="rounded-xl bg-amber-50 p-4 text-amber-900">
                    <p>Tu dirección todavía no está verificada (KYC).</p>
                    {investor.openVerification ? (
                      <button onClick={verify} disabled={busy} className={`${buttonClass} mt-3`}>
                        {tx.pending === "Verificación completada" ? "Verificando..." : "Verificarme (demo)"}
                      </button>
                    ) : (
                      <p className="mt-2 text-xs">Pedí la verificación al emisor.</p>
                    )}
                  </div>
                )}

                {investor.verified && lot.status === "active" && (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-neutral-600">Monto a aportar (USDC)</span>
                      <input
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        inputMode="decimal"
                        placeholder="1000"
                        className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2"
                      />
                    </label>
                    <div className="flex gap-2 text-xs">
                      {[100n, 1000n, 10000n].map((preset) => (
                        <button
                          key={preset.toString()}
                          onClick={() => setAmount(preset.toString())}
                          className="rounded-lg border border-neutral-300 px-2 py-1 hover:bg-neutral-100"
                        >
                          {preset.toString()}
                        </button>
                      ))}
                      <button
                        onClick={() => setAmount((Number(remaining) / 1e6).toString())}
                        className="rounded-lg border border-neutral-300 px-2 py-1 hover:bg-neutral-100"
                      >
                        Máx.
                      </button>
                    </div>
                    {parsed && (
                      <p className="text-neutral-600">
                        Recibirás aprox.{" "}
                        <span className="font-medium text-neutral-900">
                          {formatShards(estimatedShards)} {lot.symbol}
                        </span>
                      </p>
                    )}
                    <button onClick={contribute} disabled={busy || !parsed} className={buttonClass}>
                      {tx.pending === "Aporte realizado" ? "Procesando..." : "Aportar"}
                    </button>
                  </div>
                )}

                {lot.status === "ready" && (
                  <div className="space-y-2">
                    <p className="text-neutral-600">
                      La licitación terminó. Cualquiera puede finalizarla para liquidar los fondos.
                    </p>
                    <button
                      onClick={() => simple("Licitación finalizada", "finalize")}
                      disabled={busy}
                      className={buttonClass}
                    >
                      {tx.pending === "Licitación finalizada" ? "Procesando..." : "Finalizar licitación"}
                    </button>
                  </div>
                )}

                {lot.status === "succeeded" && (
                  <div className="space-y-2">
                    <p className="text-emerald-700">La licitación fue exitosa.</p>
                    {investor.contribution > 0n ? (
                      <button
                        onClick={() => simple("Shards reclamados", "claim")}
                        disabled={busy}
                        className={buttonClass}
                      >
                        {tx.pending === "Shards reclamados"
                          ? "Procesando..."
                          : `Reclamar ${formatShards(myShards)} ${lot.symbol}`}
                      </button>
                    ) : (
                      <p className="text-neutral-600">No tenés shards pendientes de reclamar.</p>
                    )}
                  </div>
                )}

                {lot.status === "failed" && (
                  <div className="space-y-2">
                    <p className="text-red-700">No se alcanzó el mínimo. Los aportes se devuelven.</p>
                    {investor.contribution > 0n ? (
                      <button
                        onClick={() => simple("Reembolso realizado", "refund")}
                        disabled={busy}
                        className={buttonClass}
                      >
                        {tx.pending === "Reembolso realizado"
                          ? "Procesando..."
                          : `Reclamar reembolso de ${formatUsdc(investor.contribution)}`}
                      </button>
                    ) : (
                      <p className="text-neutral-600">No tenés aportes para reembolsar.</p>
                    )}
                  </div>
                )}

                {tx.error && <p className="rounded-xl bg-red-50 p-3 text-red-800">{tx.error}</p>}
                {tx.success && !tx.error && <p className="rounded-xl bg-emerald-50 p-3 text-emerald-800">{tx.success}</p>}
              </div>
            )}
          </div>

          {lot.status === "succeeded" && (
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6 text-sm text-violet-900">
              <h3 className="font-semibold">Mercado secundario</h3>
              <p className="mt-2">
                Con la licitación cerrada, el emisor abre el mercado {lot.symbol}/USDC en Kuru. Todavía no está
                conectado en esta pantalla.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
