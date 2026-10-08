"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { formatUnits, parseUnits } from "viem";
import { BookOpen, Coins, Info, Layers, Route, ShieldCheck, Sprout, Target, type LucideIcon } from "lucide-react";
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

type Field = { key: keyof Form; label: string; hint: string; suffix?: string; placeholder?: string; numeric?: boolean };

const GROUPS: { title: string; why: string; icon: LucideIcon; fields: Field[] }[] = [
  {
    title: "¿Qué activo vas a fraccionar?",
    why: "Describí el activo real que respalda el lote. Estos datos quedan grabados en la blockchain y cualquier inversor puede verlos: son la base de la confianza.",
    icon: Sprout,
    fields: [
      { key: "assetType", label: "Tipo de activo", hint: "Qué es: soja, maíz, trigo, ganado...", placeholder: "Soja" },
      { key: "campaign", label: "Campaña", hint: "La temporada productiva a la que pertenece.", placeholder: "2026/27" },
      { key: "quantity", label: "Cantidad", hint: "Cuánto activo respalda el lote, en números enteros.", numeric: true },
      { key: "unit", label: "Unidad", hint: "En qué se mide la cantidad: tn, kg, cabezas...", placeholder: "tn" },
    ],
  },
  {
    title: "Tu token",
    why: "El lote se convierte en un token: una ficha digital que representa una parte del activo. Con este nombre aparece en las wallets y en el mercado.",
    icon: Coins,
    fields: [
      { key: "name", label: "Nombre", hint: "Un nombre claro para los inversores.", placeholder: "Shard Soja 2027" },
      { key: "symbol", label: "Símbolo", hint: "Abreviatura corta, como en la bolsa (3 a 8 letras).", placeholder: "SOJA27" },
    ],
  },
  {
    title: "Fraccionamiento y precio",
    why: "El activo se divide en muchas partes iguales llamadas shards. Fraccionar permite que cualquiera invierta desde montos chicos, sin comprar una cosecha entera.",
    icon: Layers,
    fields: [
      { key: "supply", label: "Cantidad de shards", hint: "Total de partes. Se crean una sola vez y nunca se pueden agregar más.", numeric: true },
      { key: "price", label: "Precio por shard", hint: "Lo que paga un inversor por cada parte durante la licitación.", suffix: "USDC", numeric: true },
    ],
  },
  {
    title: "Licitación",
    why: "Es la venta inicial: los inversores aportan USDC durante un plazo. Si se llega al mínimo, recibís los fondos; si no, a cada inversor se le devuelve su dinero automáticamente.",
    icon: Target,
    fields: [
      { key: "softCap", label: "Mínimo a recaudar", hint: "Lo que necesitás para que el lote tenga sentido. Por debajo, todo se reembolsa.", suffix: "USDC", numeric: true },
      { key: "hardCap", label: "Máximo a recaudar", hint: "Tope de la licitación. Al alcanzarlo, se puede cerrar antes de tiempo.", suffix: "USDC", numeric: true },
      { key: "days", label: "Duración", hint: "Cuánto tiempo queda abierta para recibir aportes.", suffix: "días", numeric: true },
    ],
  },
];

const GLOSSARY: [string, string][] = [
  ["USDC", "Un dólar digital: 1 USDC vale siempre 1 dólar estadounidense."],
  ["Shard", "Una fracción del activo. Quien la tiene, cobra su parte de la venta de la cosecha."],
  ["Licitación", "La venta inicial, con precio fijo, mínimo, máximo y un plazo."],
  ["Smart contract", "Un programa en la blockchain que ejecuta las reglas solo, sin intermediarios."],
];

const JOURNEY = [
  "Creás el lote y se abre la licitación.",
  "Los inversores verificados aportan USDC.",
  "Si se llega al mínimo, recibís los fondos y ellos sus shards. Si no, se reembolsa todo.",
  "Los shards se compran y venden en el mercado secundario.",
  "Al vender la cosecha, depositás el USDC y cada shard se canjea por su parte.",
];

const num = (v: string) => {
  const n = Number(v.trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const fmt = (n: number, max = 2) => n.toLocaleString("es-AR", { maximumFractionDigits: max });

function Summary({ form }: { form: Form }) {
  const price = num(form.price);
  const supply = num(form.supply);
  const soft = num(form.softCap);
  const hard = num(form.hardCap);
  const qty = num(form.quantity);
  const days = num(form.days);
  const sold = price ? hard / price : 0;
  const pct = supply ? (sold / supply) * 100 : 0;
  const close = days
    ? new Date(Date.now() + days * 86400000).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
    : "-";
  const issues = [
    sold > supply && supply > 0
      ? `Con ese precio, el máximo necesita ${fmt(sold, 0)} shards y solo emitís ${fmt(supply, 0)}. Subí la cantidad o el precio.`
      : null,
    soft > hard && hard > 0 ? "El mínimo no puede ser mayor que el máximo." : null,
  ].filter((m): m is string => Boolean(m));

  const rows: [string, string][] = [
    ["Shards vendidos si se llena", sold ? `${fmt(sold, 0)} (${fmt(pct, 1)}%)` : "-"],
    ["Shards que te quedan", supply && sold <= supply ? fmt(supply - sold, 0) : "-"],
    ["Valor implícito por unidad", qty && hard ? `${fmt(hard / qty)} USDC / ${form.unit || "u."}` : "-"],
    ["Inversión mínima", price ? `${fmt(price, 6)} USDC` : "-"],
    ["Cierre estimado", close],
  ];

  return (
    <div className={`${panel} p-6`}>
      <p className="text-xs font-bold uppercase tracking-wider text-muted">Vista previa</p>
      <p className="mt-2 text-lg font-semibold tracking-tight">{form.name || "Tu lote"}</p>
      <p className="text-sm text-muted">
        {form.assetType || "Activo"}, {form.quantity || "0"} {form.unit}, campaña {form.campaign || "-"}
      </p>
      <div className="mt-5">
        <div className="flex justify-between text-xs text-muted">
          <span>Mínimo {soft ? fmt(soft) : "-"} USDC</span>
          <span>Máximo {hard ? fmt(hard) : "-"} USDC</span>
        </div>
        <div className="relative mt-2 h-2 rounded-full bg-line">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-accent/60"
            style={{ width: hard ? `${Math.min(100, (soft / hard) * 100)}%` : "0%" }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted">La parte verde es lo que hace falta recaudar para que la licitación sea exitosa.</p>
      </div>
      <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-muted">{k}</dt>
            <dd className="text-right font-mono tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {issues.map((m) => (
        <p key={m} className={`${notice.warn} mt-4`}>
          {m}
        </p>
      ))}
    </div>
  );
}

function Guide() {
  return (
    <div className="space-y-4">
      <div className={`${panel} p-6`}>
        <p className="flex items-center gap-2 font-semibold tracking-tight">
          <Route className="h-4 w-4 text-accent-strong" />
          Qué pasa después
        </p>
        <ol className="mt-4 space-y-3 text-sm">
          {JOURNEY.map((s, i) => (
            <li key={s} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-xs font-bold text-accent-strong">
                {i + 1}
              </span>
              <span className="text-muted">{s}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className={`${panel} p-6`}>
        <p className="flex items-center gap-2 font-semibold tracking-tight">
          <BookOpen className="h-4 w-4 text-accent-strong" />
          Glosario rápido
        </p>
        <dl className="mt-4 space-y-3 text-sm">
          {GLOSSARY.map(([k, v]) => (
            <div key={k}>
              <dt className="font-medium">{k}</dt>
              <dd className="text-muted">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export default function CreatePage() {
  const [form, setForm] = useState<Form>(DEFAULTS);
  const [formError, setFormError] = useState<string | null>(null);
  const { address, ready, verified, openVerification } = useVerification();
  const tx = useTx();

  if (!contractsConfigured) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
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
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 md:px-6 md:pt-14">
      <header className="max-w-3xl">
        <p className="reveal text-xs font-bold uppercase tracking-wider text-accent-strong">Para productores y emisores</p>
        <h1
          className="reveal mt-2 text-3xl font-semibold leading-[1.1] tracking-tighter md:text-4xl"
          style={{ "--i": 1 } as CSSProperties}
        >
          Emitir un lote
        </h1>
        <p className="reveal mt-3 max-w-[65ch] leading-relaxed text-muted" style={{ "--i": 2 } as CSSProperties}>
          Convertí un activo real, como una cosecha, en partes digitales que cualquiera puede comprar. Recibís financiamiento
          por adelantado y los inversores participan del resultado de la venta. Todo queda registrado en la blockchain.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
        <div className="min-w-0">
          {!address && (
            <div className={`${panel} flex items-start gap-3 p-6 text-sm`}>
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent-strong" />
              <div>
                <p className="font-medium">Iniciá sesión para emitir un lote.</p>
                <p className="mt-1 text-muted">
                  Con tu email se crea una wallet automáticamente. No necesitás tener cripto ni pagar comisiones de red.
                </p>
              </div>
            </div>
          )}

          {address && ready && !verified && (
            <div className={`${notice.warn} flex items-start gap-3`}>
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Primero tenés que verificar tu identidad.</p>
                <p className="mt-1">
                  Solo emisores verificados (KYC) pueden crear lotes: así los inversores saben que detrás hay una persona o
                  empresa real.
                </p>
                {openVerification && (
                  <button onClick={verify} disabled={tx.pending !== null} className={`${button.primary} mt-3`}>
                    {tx.pending === "Verificación completada" ? "Verificando..." : "Verificarme (demo)"}
                  </button>
                )}
              </div>
            </div>
          )}

          {address && verified && (
            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
            >
              {GROUPS.map((group, i) => (
                <fieldset key={group.title} className={`${panel} reveal p-6 md:p-7`} style={{ "--i": i + 2 } as CSSProperties}>
                  <legend className="sr-only">{group.title}</legend>
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-strong">
                      <group.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted">Paso {i + 1}</p>
                      <h2 className="font-semibold tracking-tight">{group.title}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{group.why}</p>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    {group.fields.map(({ key, label, hint, suffix, placeholder, numeric }) => (
                      <label key={key} className="block text-sm">
                        <span className="font-medium">{label}</span>
                        <span className="relative block">
                          <input
                            value={form[key]}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                            placeholder={placeholder}
                            inputMode={numeric ? "decimal" : undefined}
                            className={`${field} ${numeric ? "font-mono tabular-nums" : ""} ${suffix ? "pr-16" : ""}`}
                          />
                          {suffix && (
                            <span className="pointer-events-none absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-xs text-muted">
                              {suffix}
                            </span>
                          )}
                        </span>
                        <span className="mt-1.5 block text-xs leading-relaxed text-muted">{hint}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}

              <div className={`${panel} space-y-4 p-6`}>
                {(formError || tx.error) && (
                  <p role="alert" className={notice.bad}>
                    {formError ?? tx.error}
                  </p>
                )}
                {tx.success === "Lote creado" && (
                  <p role="status" className={notice.ok}>
                    Lote creado.{" "}
                    <Link href="/market" className="font-medium underline underline-offset-2">
                      Ver lotes
                    </Link>
                  </p>
                )}
                <p className="text-sm text-muted">
                  Revisá la vista previa: una vez creado, el lote no se puede editar. Es una sola firma y el gas lo paga la app.
                </p>
                <button type="submit" disabled={tx.pending !== null} className={`${button.primary} w-full sm:w-auto`}>
                  {tx.pending ? "Creando..." : "Crear lote"}
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {address && verified && <Summary form={form} />}
          <Guide />
        </aside>
      </div>
    </div>
  );
}
