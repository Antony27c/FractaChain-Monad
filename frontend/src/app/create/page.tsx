"use client";

import { useState } from "react";
import Link from "next/link";
import { parseUnits } from "viem";
import { issuanceFactoryAbi, kycRegistryAbi } from "@/lib/abi";
import { addresses, contractsConfigured } from "@/lib/env";
import { useVerification } from "@/hooks/useInvestor";
import { useTx } from "@/hooks/useTx";

const DEFAULTS = {
  name: "Shard Soja 2027",
  symbol: "SOJA27",
  assetType: "Soja",
  unit: "tn",
  quantity: "250",
  campaign: "2026/27",
  supply: "2500000",
  price: "0.10",
  softCap: "100000",
  hardCap: "250000",
  days: "14",
};

type Form = typeof DEFAULTS;

const FIELDS: { key: keyof Form; label: string; hint?: string }[] = [
  { key: "name", label: "Nombre del token" },
  { key: "symbol", label: "Símbolo" },
  { key: "assetType", label: "Tipo de activo", hint: "Ej.: Soja, Maíz, Trigo" },
  { key: "unit", label: "Unidad", hint: "Ej.: tn" },
  { key: "quantity", label: "Cantidad del activo" },
  { key: "campaign", label: "Campaña" },
  { key: "supply", label: "Cantidad de shards", hint: "Se emiten una sola vez" },
  { key: "price", label: "Precio por shard (USDC)" },
  { key: "softCap", label: "Mínimo a recaudar (USDC)", hint: "Si no se alcanza, se reembolsa" },
  { key: "hardCap", label: "Máximo a recaudar (USDC)" },
  { key: "days", label: "Duración (días)" },
];

export default function CreatePage() {
  const [form, setForm] = useState<Form>(DEFAULTS);
  const [formError, setFormError] = useState<string | null>(null);
  const { address, verified, openVerification } = useVerification();
  const tx = useTx();

  if (!contractsConfigured) {
    return <p className="mx-auto max-w-6xl px-6 py-10 text-neutral-600">Faltan las direcciones de los contratos.</p>;
  }

  const verify = () =>
    tx.run("Verificación completada", { address: addresses.kyc!, abi: kycRegistryAbi, functionName: "verifyMyself" });

  const submit = async () => {
    setFormError(null);
    try {
      const f = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim().replace(",", ".")])) as Form;
      if (!f.name || !f.symbol || !f.assetType || !f.unit || !f.campaign) throw new Error("Completá todos los campos.");
      const days = Number(f.days);
      if (!Number.isInteger(days) || days <= 0) throw new Error("La duración debe ser un número entero de días.");
      const softCap = parseUnits(f.softCap, 6);
      const hardCap = parseUnits(f.hardCap, 6);
      if (softCap <= 0n || softCap > hardCap) throw new Error("El mínimo debe ser mayor a cero y no superar al máximo.");

      const ok = await tx.run("Lote creado", {
        address: addresses.factory!,
        abi: issuanceFactoryAbi,
        functionName: "createIssuance",
        args: [
          {
            name: f.name,
            symbol: f.symbol,
            asset: { assetType: f.assetType, unit: f.unit, quantity: BigInt(f.quantity), campaign: f.campaign },
            supply: parseUnits(f.supply, 18),
            pricePerShard: parseUnits(f.price, 6),
            softCap,
            hardCap,
            duration: BigInt(days * 86400),
          },
        ],
      });
      if (ok) setForm(DEFAULTS);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Revisá los valores ingresados.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Emitir un lote</h1>
      <p className="mt-2 text-neutral-600">
        Fraccioná un activo en shards y abrí una licitación primaria. Solo pueden emitir direcciones verificadas.
      </p>

      {!address && <p className="mt-6 text-neutral-600">Iniciá sesión para emitir un lote.</p>}

      {address && !verified && (
        <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <p>Tu dirección todavía no está verificada, así que no podés emitir lotes.</p>
          {openVerification && (
            <button
              onClick={verify}
              disabled={tx.pending !== null}
              className="mt-3 rounded-xl bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700 disabled:bg-neutral-300"
            >
              Verificarme (demo)
            </button>
          )}
        </div>
      )}

      {address && verified && (
        <form
          className="mt-6 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map(({ key, label, hint }) => (
              <label key={key} className="block text-sm">
                <span className="text-neutral-600">{label}</span>
                <input
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2"
                />
                {hint && <span className="text-xs text-neutral-400">{hint}</span>}
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={tx.pending !== null}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white hover:bg-violet-700 disabled:bg-neutral-300"
          >
            {tx.pending ? "Creando..." : "Crear lote"}
          </button>

          {(formError || tx.error) && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{formError ?? tx.error}</p>
          )}
          {tx.success === "Lote creado" && (
            <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              Lote creado.{" "}
              <Link href="/" className="font-medium underline">
                Ver los lotes
              </Link>
            </p>
          )}
        </form>
      )}
    </div>
  );
}
