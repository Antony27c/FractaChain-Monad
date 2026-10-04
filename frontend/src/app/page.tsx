"use client";

import Link from "next/link";
import { LotCard } from "@/components/LotCard";
import { useLots, useNow } from "@/hooks/useLots";
import { contractsConfigured } from "@/lib/env";

export default function Home() {
  const { lots, isLoading, error } = useLots();
  const now = useNow();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <section className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight">Activos reales argentinos, fraccionados onchain</h1>
        <p className="mt-3 max-w-2xl text-neutral-600">
          Invertí en una fracción de una cosecha o de stock certificado. Cada lote se financia en una licitación
          primaria y después sus shards se negocian en el order book de Kuru sobre Monad.
        </p>
      </section>

      {!contractsConfigured && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Faltan las direcciones de los contratos. Completá <code>NEXT_PUBLIC_FACTORY</code>,{" "}
          <code>NEXT_PUBLIC_KYC</code> y <code>NEXT_PUBLIC_USDC</code> en <code>.env.local</code>, o corré el deploy
          local (ver el README del frontend).
        </p>
      )}

      {contractsConfigured && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Lotes</h2>
            <Link href="/create" className="text-sm font-medium text-violet-700 hover:underline">
              Emitir un lote
            </Link>
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              No se pudieron leer los lotes. ¿Está corriendo la cadena? ({error.message.slice(0, 120)})
            </p>
          )}
          {isLoading && <p className="text-neutral-500">Cargando lotes...</p>}
          {!isLoading && !error && lots.length === 0 && (
            <p className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-neutral-500">
              Todavía no hay lotes. Emití el primero.
            </p>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            {lots.map((lot) => (
              <LotCard key={lot.offering} lot={lot} now={now} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
