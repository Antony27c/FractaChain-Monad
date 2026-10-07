"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { parseUnits } from "viem";
import { erc20Abi, kycRegistryAbi, offeringAbi } from "@/lib/abi";
import { addresses, USDC_DECIMALS } from "@/lib/env";
import { formatDate, formatPricePerShard, formatShards, formatUsdc, shortAddress, timeLeft } from "@/lib/format";
import { button, field, notice, panel } from "@/lib/ui";
import { useLots, useNow } from "@/hooks/useLots";
import { useInvestor } from "@/hooks/useInvestor";
import { useTx } from "@/hooks/useTx";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { SecondaryMarket } from "@/components/SecondaryMarket";

const SHARD_UNIT = 10n ** 18n;

const step = (i: number) => ({ "--i": i }) as CSSProperties;

function parseAmount(value: string): bigint | null {
  if (!value.trim()) return null;
  try {
    const parsed = parseUnits(value.replace(",", "."), USDC_DECIMALS);
    return parsed > 0n ? parsed : null;
  } catch {
    return null;
  }
}

const actionClass = `${button.primary} w-full`;

function LotSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando lote" className="skeleton mt-6 grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
      <div className="space-y-10">
        <div className="space-y-3">
          <div className="h-9 w-2/3 rounded-lg bg-line" />
          <div className="h-4 w-1/3 rounded-lg bg-line" />
        </div>
        <div className="space-y-3">
          <div className="h-6 w-1/4 rounded-lg bg-line" />
          <div className="h-2 rounded-full bg-line" />
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="h-10 rounded-lg bg-line" />
          <div className="h-10 rounded-lg bg-line" />
          <div className="h-10 rounded-lg bg-line" />
          <div className="h-10 rounded-lg bg-line" />
        </div>
      </div>
      <div className={`${panel} h-72`} />
    </div>
  );
}

export default function LotPage() {
  const { offering: offeringParam } = useParams<{ offering: string }>();
  const { lots, isLoading, error } = useLots();
  const now = useNow();
  const lot = lots.find((l) => l.offering.toLowerCase() === offeringParam.toLowerCase());
  const investor = useInvestor(lot?.offering);
  const tx = useTx();
  const [amount, setAmount] = useState("");

  const back = (
    <Link href="/" className="text-sm text-muted transition-colors hover:text-ink">
      &larr; Lotes
    </Link>
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 md:px-6 md:pt-10">
        {back}
        <LotSkeleton />
      </div>
    );
  }

  if (!lot && error) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 md:px-6 md:pt-10">
        {back}
        <p role="alert" className={`${notice.bad} mt-6`}>
          No pudimos leer el lote de la cadena. Reintentando... ({error.message.slice(0, 200)})
        </p>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 md:px-6 md:pt-10">
        {back}
        <div className="mt-6 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <p className="text-lg font-medium tracking-tight">No encontramos ese lote</p>
          <p className="mx-auto mt-2 max-w-[44ch] text-sm text-muted">
            Puede que la dirección esté mal escrita o que el lote sea de otra red.
          </p>
          <Link href="/" className={`${button.primary} mt-6`}>
            Ver lotes
          </Link>
        </div>
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
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 md:px-6 md:pt-10">
      {back}

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
        <section>
          <header className="reveal" style={step(0)}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-3xl font-semibold leading-[1.1] tracking-tighter md:text-4xl">{lot.name}</h1>
              <StatusBadge status={lot.status} />
            </div>
            <p className="mt-2 text-muted">
              {lot.asset.assetType}, {lot.asset.quantity.toString()} {lot.asset.unit}, campaña {lot.asset.campaign}
            </p>
          </header>

          <div className="reveal mt-10" style={step(1)}>
            <ProgressBar raised={lot.totalRaised} softCap={lot.softCap} hardCap={lot.hardCap} index={1} />
          </div>

          <dl
            className="reveal mt-10 grid grid-cols-2 gap-6 border-t border-line pt-6 text-sm sm:grid-cols-4"
            style={step(2)}
          >
            <div>
              <dt className="text-muted">Precio por shard</dt>
              <dd className="mt-1 font-mono font-medium tabular-nums">{formatPricePerShard(lot.pricePerShard)}</dd>
            </div>
            <div>
              <dt className="text-muted">Token</dt>
              <dd className="mt-1 font-mono font-medium">{lot.symbol}</dd>
            </div>
            <div>
              <dt className="text-muted">Cierra</dt>
              <dd className="mt-1 font-medium tabular-nums">{formatDate(lot.deadline)}</dd>
            </div>
            <div>
              <dt className="text-muted">Tiempo restante</dt>
              <dd className="mt-1 font-mono font-medium tabular-nums">{timeLeft(lot.deadline, now)}</dd>
            </div>
          </dl>

          <div
            className="reveal mt-12 grid gap-10 border-t border-line pt-8 md:grid-cols-[1.4fr_1fr]"
            style={step(3)}
          >
            <div>
              <h2 className="font-semibold tracking-tight">Cómo funciona</h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted marker:font-mono marker:text-ink">
                <li>Aportás USDC a precio fijo. Tu dirección debe estar verificada (KYC).</li>
                <li>Si se alcanza el mínimo, el emisor recibe los fondos y vos reclamás tus shards.</li>
                <li>Si no se alcanza, recuperás todo tu USDC.</li>
                <li>Después, los shards se negocian en el order book de Kuru.</li>
              </ol>
            </div>
            <div>
              <h2 className="font-semibold tracking-tight">Contratos</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Emisor</dt>
                  <dd className="font-mono">{shortAddress(lot.issuer)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Token</dt>
                  <dd className="font-mono">{shortAddress(lot.token)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Licitación</dt>
                  <dd className="font-mono">{shortAddress(lot.offering)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div className={`${panel} reveal p-6`} style={step(1)}>
            <h2 className="font-semibold tracking-tight">Tu participación</h2>

            {!investor.address && <p className="mt-3 text-sm text-muted">Iniciá sesión para participar.</p>}

            {investor.address && (
              <div className="mt-4 space-y-5 text-sm">
                <dl className="space-y-2">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Saldo USDC</dt>
                    <dd className="font-mono font-medium tabular-nums">
                      {investor.ready ? formatUsdc(investor.usdcBalance) : "..."}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Tu aporte</dt>
                    <dd className="font-mono font-medium tabular-nums">
                      {investor.ready ? formatUsdc(investor.contribution) : "..."}
                    </dd>
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
                  <div className="space-y-4 border-t border-line pt-5">
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
                        <button
                          key={preset.toString()}
                          onClick={() => setAmount(preset.toString())}
                          className={button.chip}
                        >
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
                  <div className="space-y-3 border-t border-line pt-5">
                    <p className="text-muted">
                      La licitación terminó. Cualquiera puede finalizarla para liquidar los fondos.
                    </p>
                    <button
                      onClick={() => simple("Licitación finalizada", "finalize")}
                      disabled={busy}
                      className={actionClass}
                    >
                      {tx.pending === "Licitación finalizada" ? "Procesando..." : "Finalizar licitación"}
                    </button>
                  </div>
                )}

                {lot.status === "succeeded" && (
                  <div className="space-y-3 border-t border-line pt-5">
                    <p className="font-medium text-ok">La licitación fue exitosa.</p>
                    {investor.contribution > 0n ? (
                      <button
                        onClick={() => simple("Shards reclamados", "claim")}
                        disabled={busy}
                        className={actionClass}
                      >
                        {tx.pending === "Shards reclamados"
                          ? "Procesando..."
                          : `Reclamar ${formatShards(myShards)} ${lot.symbol}`}
                      </button>
                    ) : (
                      <p className="text-muted">No tenés shards pendientes de reclamar.</p>
                    )}
                  </div>
                )}

                {lot.status === "failed" && (
                  <div className="space-y-3 border-t border-line pt-5">
                    <p className="font-medium text-bad">No se alcanzó el mínimo. Los aportes se devuelven.</p>
                    {investor.contribution > 0n ? (
                      <button
                        onClick={() => simple("Reembolso realizado", "refund")}
                        disabled={busy}
                        className={actionClass}
                      >
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
            )}
          </div>

          {lot.status === "succeeded" && <SecondaryMarket lot={lot} account={investor.address} />}
        </aside>
      </div>
    </div>
  );
}
