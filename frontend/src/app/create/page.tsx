"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { formatUnits, parseUnits } from "viem";
import { issuanceFactoryAbi, kycRegistryAbi } from "@/lib/abi";
import { addresses, contractsConfigured } from "@/lib/env";
import { button, field, notice, panel } from "@/lib/ui";
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

type Field = { key: keyof Form; label: string; hint?: string };

const GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: "Token",
    fields: [
      { key: "name", label: "Nombre del token" },
      { key: "symbol", label: "Símbolo" },
    ],
  },
  {
    title: "Activo",
    fields: [
      { key: "assetType", label: "Tipo de activo", hint: "Ej.: Soja, Maíz, Trigo" },
      { key: "unit", label: "Unidad", hint: "Ej.: tn" },
      { key: "quantity", label: "Cantidad del activo" },
      { key: "campaign", label: "Campaña" },
    ],
  },
  {
    title: "Emisión y licitación",
    fields: [
      { key: "supply", label: "Cantidad de shards", hint: "Se emiten una sola vez" },
      { key: "price", label: "Precio por shard (USDC)" },
      { key: "softCap", label: "Mínimo a recaudar (USDC)", hint: "Si no se alcanza, se reembolsa" },
      { key: "hardCap", label: "Máximo a recaudar (USDC)" },
      { key: "days", label: "Duración (días)" },
    ],
  },
];

export default function CreatePage() {
  const [form, setForm] = useState<Form>(DEFAULTS);
  const [formError, setFormError] = useState<string | null>(null);
  const { address, verified, openVerification } = useVerification();
  const tx = useTx();

  if (!contractsConfigured) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <p className={notice.warn}>Faltan las direcciones de los contratos.</p>
      </div>
    );
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

      const supply = parseUnits(f.supply, 18);
      const pricePerShard = parseUnits(f.price, 6);
      if (pricePerShard <= 0n) throw new Error("El precio por shard debe ser mayor a cero.");
      // Mismo chequeo que IssuanceFactory: el supply tiene que cubrir el hard cap.
      const shardsForHardCap = (hardCap * 10n ** 18n) / pricePerShard;
      if (shardsForHardCap > supply) {
        throw new Error(
          `Con ese precio, el máximo necesita ${formatUnits(shardsForHardCap, 18)} shards y solo emitís ${f.supply}.`
        );
      }

      const ok = await tx.run("Lote creado", {
        address: addresses.factory!,
        abi: issuanceFactoryAbi,
        functionName: "createIssuance",
        args: [
          {
            name: f.name,
            symbol: f.symbol,
            asset: { assetType: f.assetType, unit: f.unit, quantity: BigInt(f.quantity), campaign: f.campaign },
            supply,
            pricePerShard,
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
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 md:px-6 md:pt-14">
      <div className="max-w-3xl">
        <h1 className="reveal text-3xl font-semibold leading-[1.1] tracking-tighter md:text-4xl">Emitir un lote</h1>
        <p className="reveal mt-3 max-w-[60ch] leading-relaxed text-muted" style={{ "--i": 1 } as CSSProperties}>
          Fraccioná un activo en shards y abrí una licitación primaria. Solo pueden emitir direcciones verificadas.
        </p>

        {!address && <p className="mt-8 text-muted">Iniciá sesión para emitir un lote.</p>}

        {address && !verified && (
          <div className={`${notice.warn} mt-8`}>
            <p>Tu dirección todavía no está verificada, así que no podés emitir lotes.</p>
            {openVerification && (
              <button onClick={verify} disabled={tx.pending !== null} className={`${button.primary} mt-3`}>
                {tx.pending === "Verificación completada" ? "Verificando..." : "Verificarme (demo)"}
              </button>
            )}
          </div>
        )}

        {address && verified && (
          <form
            className={`${panel} reveal mt-8 p-6 md:p-8`}
            style={{ "--i": 2 } as CSSProperties}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <div className="space-y-8">
              {GROUPS.map((group, i) => (
                <fieldset key={group.title} className={i > 0 ? "border-t border-line pt-8" : undefined}>
                  <legend className="font-semibold tracking-tight">{group.title}</legend>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    {group.fields.map(({ key, label, hint }) => (
                      <label key={key} className="block text-sm">
                        <span className="font-medium">{label}</span>
                        <input
                          value={form[key]}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          className={field}
                        />
                        {hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

            <div className="mt-8 space-y-4 border-t border-line pt-6">
              {(formError || tx.error) && (
                <p role="alert" className={notice.bad}>
                  {formError ?? tx.error}
                </p>
              )}
              {tx.success === "Lote creado" && (
                <p role="status" className={notice.ok}>
                  Lote creado.{" "}
                  <Link href="/" className="font-medium underline underline-offset-2">
                    Ver lotes
                  </Link>
                </p>
              )}
              <button type="submit" disabled={tx.pending !== null} className={`${button.primary} w-full sm:w-auto`}>
                {tx.pending ? "Creando..." : "Crear lote"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
