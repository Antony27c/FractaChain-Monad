"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { formatUnits, parseUnits } from "viem";
import { useReadContract } from "wagmi";
import { BookOpen, Coins, Info, Layers, Route, ShieldCheck, Sprout, Target, type LucideIcon } from "lucide-react";
import { erc20Abi, issuanceFactoryAbi, kycRegistryAbi } from "@/lib/abi";
import { addresses, contractsConfigured, USDC_DECIMALS } from "@/lib/env";
import { formatUsdc } from "@/lib/format";
import { button, field, notice, panel } from "@/lib/ui";
import { useVerification } from "@/hooks/useInvestor";
import { useTx } from "@/hooks/useTx";
import { TestFundsButton } from "@/components/TestFundsButton";
import { useI18n, useT } from "@/lib/i18n";

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

type Tr = [string, string];

type Field = { key: keyof Form; label: Tr; hint: Tr; suffix?: Tr; placeholder?: string; numeric?: boolean };

const GROUPS: { title: Tr; why: Tr; icon: LucideIcon; fields: Field[] }[] = [
  {
    title: ["¿Qué activo vas a fraccionar?", "What asset will you fractionalize?"],
    why: [
      "Describí el activo real que respalda el lote. Estos datos quedan grabados en la blockchain y cualquier inversor puede verlos: son la base de la confianza.",
      "Describe the real asset backing the lot. This data is recorded on the blockchain and any investor can see it: it is the basis of trust.",
    ],
    icon: Sprout,
    fields: [
      { key: "assetType", label: ["Tipo de activo", "Asset type"], hint: ["Qué es: soja, maíz, trigo, ganado...", "What it is: soy, corn, wheat, cattle..."], placeholder: "Soja" },
      { key: "campaign", label: ["Campaña", "Season"], hint: ["La temporada productiva a la que pertenece.", "The production season it belongs to."], placeholder: "2026/27" },
      { key: "quantity", label: ["Cantidad", "Quantity"], hint: ["Cuánto activo respalda el lote, en números enteros.", "How much of the asset backs the lot, in whole numbers."], numeric: true },
      { key: "unit", label: ["Unidad", "Unit"], hint: ["En qué se mide la cantidad: tn, kg, cabezas...", "How the quantity is measured: tn, kg, head..."], placeholder: "tn" },
    ],
  },
  {
    title: ["Tu token", "Your token"],
    why: [
      "El lote se convierte en un token: una ficha digital que representa una parte del activo. Con este nombre aparece en las wallets y en el mercado.",
      "The lot becomes a token: a digital unit that represents a share of the asset. This is the name shown in wallets and on the market.",
    ],
    icon: Coins,
    fields: [
      { key: "name", label: ["Nombre", "Name"], hint: ["Un nombre claro para los inversores.", "A clear name for investors."], placeholder: "Shard Soja 2027" },
      { key: "symbol", label: ["Símbolo", "Symbol"], hint: ["Abreviatura corta, como en la bolsa (3 a 8 letras).", "Short ticker, like on a stock exchange (3 to 8 letters)."], placeholder: "SOJA27" },
    ],
  },
  {
    title: ["Fraccionamiento y precio", "Fractionalization and price"],
    why: [
      "El activo se divide en muchas partes iguales llamadas shards. Fraccionar permite que cualquiera invierta desde montos chicos, sin comprar una cosecha entera.",
      "The asset is split into many equal parts called shards. Fractionalizing lets anyone invest small amounts without buying a whole harvest.",
    ],
    icon: Layers,
    fields: [
      { key: "supply", label: ["Cantidad de shards", "Number of shards"], hint: ["Total de partes. Se crean una sola vez y nunca se pueden agregar más.", "Total parts. They are created once and more can never be added."], numeric: true },
      { key: "price", label: ["Precio por shard", "Price per shard"], hint: ["Lo que paga un inversor por cada parte durante la licitación.", "What an investor pays for each part during the auction."], suffix: ["USDC", "USDC"], numeric: true },
    ],
  },
  {
    title: ["Licitación", "Auction"],
    why: [
      "Es la venta inicial: los inversores aportan USDC durante un plazo. Si se llega al mínimo, recibís los fondos; si no, a cada inversor se le devuelve su dinero automáticamente.",
      "It's the initial sale: investors contribute USDC for a set period. If the minimum is reached, you receive the funds; if not, every investor is refunded automatically.",
    ],
    icon: Target,
    fields: [
      { key: "softCap", label: ["Mínimo a recaudar", "Minimum raise"], hint: ["Lo que necesitás para que el lote tenga sentido. Por debajo, todo se reembolsa.", "What you need for the lot to make sense. Below it, everything is refunded."], suffix: ["USDC", "USDC"], numeric: true },
      { key: "hardCap", label: ["Máximo a recaudar", "Maximum raise"], hint: ["Tope de la licitación. Al alcanzarlo, se puede cerrar antes de tiempo.", "The auction cap. Once reached, it can close early."], suffix: ["USDC", "USDC"], numeric: true },
      { key: "days", label: ["Duración", "Duration"], hint: ["Cuánto tiempo queda abierta para recibir aportes.", "How long it stays open for contributions."], suffix: ["días", "days"], numeric: true },
    ],
  },
];

const GLOSSARY: [Tr, Tr][] = [
  [["USDC", "USDC"], ["Un dólar digital: 1 USDC vale siempre 1 dólar estadounidense.", "A digital dollar: 1 USDC is always worth 1 US dollar."]],
  [["Shard", "Shard"], ["Una fracción del activo. Quien la tiene, cobra su parte de la venta de la cosecha.", "A fraction of the asset. Its holder gets a share of the harvest sale."]],
  [["Licitación", "Auction"], ["La venta inicial, con precio fijo, mínimo, máximo y un plazo.", "The initial sale, with a fixed price, minimum, maximum and deadline."]],
  [["Smart contract", "Smart contract"], ["Un programa en la blockchain que ejecuta las reglas solo, sin intermediarios.", "A program on the blockchain that enforces the rules by itself, with no intermediaries."]],
];

const JOURNEY: Tr[] = [
  ["Creás el lote y se abre la licitación.", "You create the lot and the auction opens."],
  ["Los inversores verificados aportan USDC.", "Verified investors contribute USDC."],
  ["Si se llega al mínimo, recibís los fondos y ellos sus shards. Si no, se reembolsa todo.", "If the minimum is reached, you get the funds and they get their shards. If not, everything is refunded."],
  ["Los shards se compran y venden en el mercado secundario.", "Shards are bought and sold on the secondary market."],
  ["Al vender la cosecha, depositás el USDC y cada shard se canjea por su parte.", "When the harvest is sold, you deposit the USDC and each shard redeems for its share."],
];

const num = (v: string) => {
  const n = Number(v.trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};
const fmt = (n: number, max = 2) => n.toLocaleString("es-AR", { maximumFractionDigits: max });

type SummaryProps = { form: Form; account: `0x${string}`; balance?: bigint; onDemoCaps: () => void };

function Summary({ form, account, balance, onDemoCaps }: SummaryProps) {
  const t = useT();
  const { locale } = useI18n();
  const price = num(form.price);
  const supply = num(form.supply);
  const soft = num(form.softCap);
  const hard = num(form.hardCap);
  const qty = num(form.quantity);
  const days = num(form.days);
  const sold = price ? hard / price : 0;
  const pct = supply ? (sold / supply) * 100 : 0;
  const close = days
    ? new Date(Date.now() + days * 86400000).toLocaleDateString(locale === "en" ? "en-US" : "es-AR", { day: "numeric", month: "long", year: "numeric" })
    : "-";
  const issues = [
    sold > supply && supply > 0
      ? t(
          `Con ese precio, el máximo necesita ${fmt(sold, 0)} shards y solo emitís ${fmt(supply, 0)}. Subí la cantidad o el precio.`,
          `At that price, the maximum needs ${fmt(sold, 0)} shards and you only issue ${fmt(supply, 0)}. Raise the supply or the price.`,
        )
      : null,
    soft > hard && hard > 0 ? t("El mínimo no puede ser mayor que el máximo.", "The minimum cannot exceed the maximum.") : null,
  ].filter((m): m is string => Boolean(m));
  const funds = balance !== undefined ? Number(formatUnits(balance, USDC_DECIMALS)) : undefined;
  const short =
    funds !== undefined && soft > funds
      ? t(
          `Tu saldo (${fmt(funds)} USDC) no alcanza el mínimo de ${fmt(soft)} USDC. Si probás el flujo vos solo, la licitación no va a llegar al mínimo y terminará en reembolso.`,
          `Your balance (${fmt(funds)} USDC) does not reach the ${fmt(soft)} USDC minimum. If you test the flow alone, the auction won't reach the minimum and will end in a refund.`,
        )
      : null;
  const gap = funds !== undefined && !short && hard > funds ? hard - funds : 0;

  const rows: [string, string][] = [
    [t("Shards vendidos si se llena", "Shards sold if filled"), sold ? `${fmt(sold, 0)} (${fmt(pct, 1)}%)` : "-"],
    [t("Shards que te quedan", "Shards you keep"), supply && sold <= supply ? fmt(supply - sold, 0) : "-"],
    [t("Valor implícito por unidad", "Implied value per unit"), qty && hard ? `${fmt(hard / qty)} USDC / ${form.unit || "u."}` : "-"],
    [t("Inversión mínima", "Minimum investment"), price ? `${fmt(price, 6)} USDC` : "-"],
    [t("Cierre estimado", "Estimated close"), close],
  ];

  return (
    <div className={`${panel} p-6`}>
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{t("Vista previa", "Preview")}</p>
      <p className="mt-2 text-lg font-semibold tracking-tight">{form.name || t("Tu lote", "Your lot")}</p>
      <p className="text-sm text-muted">
        {form.assetType || t("Activo", "Asset")}, {form.quantity || "0"} {form.unit}, {t("campaña", "season")} {form.campaign || "-"}
      </p>
      <div className="mt-5">
        <div className="flex justify-between text-xs text-muted">
          <span>{t("Mínimo", "Minimum")} {soft ? fmt(soft) : "-"} USDC</span>
          <span>{t("Máximo", "Maximum")} {hard ? fmt(hard) : "-"} USDC</span>
        </div>
        <div className="relative mt-2 h-2 rounded-full bg-line">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-accent/60"
            style={{ width: hard ? `${Math.min(100, (soft / hard) * 100)}%` : "0%" }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {t("La parte verde es lo que hace falta recaudar para que la licitación sea exitosa.", "The green part is what must be raised for the auction to succeed.")}
        </p>
      </div>
      <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4">
            <dt className="text-muted">{k}</dt>
            <dd className="text-right font-mono tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted">{t("Tu saldo USDC", "Your USDC balance")}</span>
          <span className="font-mono tabular-nums">{balance !== undefined ? formatUsdc(balance) : "..."}</span>
        </div>
        {balance !== undefined && <TestFundsButton account={account} balance={balance} />}
        {gap > 0 && (
          <p className="text-xs text-muted">
            {t(
              `Te faltan ${fmt(gap)} USDC para llenar el máximo vos solo. No es un problema: la licitación igual es exitosa y cierra al vencer el plazo.`,
              `You are ${fmt(gap)} USDC short of filling the maximum alone. That's fine: the auction still succeeds and closes at the deadline.`,
            )}
          </p>
        )}
        {short && (
          <div className={notice.warn}>
            <p>{short}</p>
            <button type="button" onClick={onDemoCaps} className={`${button.secondary} mt-3`}>
              {t("Usar topes de demo (100 / 250 USDC)", "Use demo caps (100 / 250 USDC)")}
            </button>
          </div>
        )}
      </div>
      {issues.map((m) => (
        <p key={m} className={`${notice.warn} mt-4`}>
          {m}
        </p>
      ))}
    </div>
  );
}

function Guide() {
  const t = useT();
  return (
    <div className="space-y-4">
      <div className={`${panel} p-6`}>
        <p className="flex items-center gap-2 font-semibold tracking-tight">
          <Route className="h-4 w-4 text-accent-strong" />
          {t("Qué pasa después", "What happens next")}
        </p>
        <ol className="mt-4 space-y-3 text-sm">
          {JOURNEY.map((s, i) => (
            <li key={s[0]} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 font-mono text-xs font-bold text-accent-strong">
                {i + 1}
              </span>
              <span className="text-muted">{t(...s)}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className={`${panel} p-6`}>
        <p className="flex items-center gap-2 font-semibold tracking-tight">
          <BookOpen className="h-4 w-4 text-accent-strong" />
          {t("Glosario rápido", "Quick glossary")}
        </p>
        <dl className="mt-4 space-y-3 text-sm">
          {GLOSSARY.map(([k, v]) => (
            <div key={k[0]}>
              <dt className="font-medium">{t(...k)}</dt>
              <dd className="text-muted">{t(...v)}</dd>
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
  const { data: balance } = useReadContract({
    address: addresses.usdc,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: Boolean(address && addresses.usdc), refetchInterval: 12000 },
  });
  const t = useT();
  const L = { verify: t("Verificación completada", "Verification completed"), created: t("Lote creado", "Lot created") };

  if (!contractsConfigured) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <p className={notice.warn}>{t("Faltan las direcciones de los contratos.", "Contract addresses are missing.")}</p>
      </div>
    );
  }

  const verify = () =>
    tx.run(L.verify, { address: addresses.kyc!, abi: kycRegistryAbi, functionName: "verifyMyself" });

  const submit = async () => {
    setFormError(null);
    try {
      const f = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim().replace(",", ".")])) as Form;
      if (!f.name || !f.symbol || !f.assetType || !f.unit || !f.campaign) throw new Error(t("Completá todos los campos.", "Fill in all the fields."));
      const days = Number(f.days);
      if (!Number.isInteger(days) || days <= 0) throw new Error(t("La duración debe ser un número entero de días.", "Duration must be a whole number of days."));
      const softCap = parseUnits(f.softCap, 6);
      const hardCap = parseUnits(f.hardCap, 6);
      if (softCap <= 0n || softCap > hardCap) throw new Error(t("El mínimo debe ser mayor a cero y no superar al máximo.", "The minimum must be above zero and not exceed the maximum."));

      const supply = parseUnits(f.supply, 18);
      const pricePerShard = parseUnits(f.price, 6);
      if (pricePerShard <= 0n) throw new Error(t("El precio por shard debe ser mayor a cero.", "The price per shard must be greater than zero."));
      // Mismo chequeo que IssuanceFactory: el supply tiene que cubrir el hard cap.
      const shardsForHardCap = (hardCap * 10n ** 18n) / pricePerShard;
      if (shardsForHardCap > supply) {
        throw new Error(
          t(
            `Con ese precio, el máximo necesita ${formatUnits(shardsForHardCap, 18)} shards y solo emitís ${f.supply}.`,
            `At that price, the maximum needs ${formatUnits(shardsForHardCap, 18)} shards and you only issue ${f.supply}.`,
          ),
        );
      }

      const ok = await tx.run(L.created, {
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
      setFormError(e instanceof Error ? e.message : t("Revisá los valores ingresados.", "Check the values you entered."));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 md:px-6 md:pt-14">
      <header className="max-w-3xl">
        <p className="reveal text-xs font-bold uppercase tracking-wider text-accent-strong">{t("Para productores y emisores", "For producers and issuers")}</p>
        <h1
          className="reveal mt-2 text-3xl font-semibold leading-[1.1] tracking-tighter md:text-4xl"
          style={{ "--i": 1 } as CSSProperties}
        >
          {t("Emitir un lote", "Issue a lot")}
        </h1>
        <p className="reveal mt-3 max-w-[65ch] leading-relaxed text-muted" style={{ "--i": 2 } as CSSProperties}>
          {t(
            "Convertí un activo real, como una cosecha, en partes digitales que cualquiera puede comprar. Recibís financiamiento por adelantado y los inversores participan del resultado de la venta. Todo queda registrado en la blockchain.",
            "Turn a real asset, like a harvest, into digital parts anyone can buy. You get financing up front and investors share in the sale's outcome. Everything is recorded on the blockchain.",
          )}
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-10">
        <div className="min-w-0">
          {!address && (
            <div className={`${panel} flex items-start gap-3 p-6 text-sm`}>
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent-strong" />
              <div>
                <p className="font-medium">{t("Iniciá sesión para emitir un lote.", "Log in to issue a lot.")}</p>
                <p className="mt-1 text-muted">
                  {t(
                    "Con tu email se crea una wallet automáticamente. No necesitás tener cripto ni pagar comisiones de red.",
                    "A wallet is created automatically with your email. You don't need crypto or to pay network fees.",
                  )}
                </p>
              </div>
            </div>
          )}

          {address && ready && !verified && (
            <div className={`${notice.warn} flex items-start gap-3`}>
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">{t("Primero tenés que verificar tu identidad.", "First you need to verify your identity.")}</p>
                <p className="mt-1">
                  {t(
                    "Solo emisores verificados (KYC) pueden crear lotes: así los inversores saben que detrás hay una persona o empresa real.",
                    "Only verified issuers (KYC) can create lots: that way investors know there is a real person or company behind it.",
                  )}
                </p>
                {openVerification && (
                  <button onClick={verify} disabled={tx.pending !== null} className={`${button.primary} mt-3`}>
                    {tx.pending === L.verify ? t("Verificando...", "Verifying...") : t("Verificarme (demo)", "Verify me (demo)")}
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
                <fieldset key={group.title[0]} className={`${panel} reveal p-6 md:p-7`} style={{ "--i": i + 2 } as CSSProperties}>
                  <legend className="sr-only">{t(...group.title)}</legend>
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-strong">
                      <group.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted">{t("Paso", "Step")} {i + 1}</p>
                      <h2 className="font-semibold tracking-tight">{t(...group.title)}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{t(...group.why)}</p>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    {group.fields.map(({ key, label, hint, suffix, placeholder, numeric }) => (
                      <label key={key} className="block text-sm">
                        <span className="font-medium">{t(...label)}</span>
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
                              {t(...suffix)}
                            </span>
                          )}
                        </span>
                        <span className="mt-1.5 block text-xs leading-relaxed text-muted">{t(...hint)}</span>
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
                {tx.success === L.created && (
                  <p role="status" className={notice.ok}>
                    {t("Lote creado.", "Lot created.")}{" "}
                    <Link href="/market" className="font-medium underline underline-offset-2">
                      {t("Ver lotes", "View lots")}
                    </Link>
                  </p>
                )}
                <p className="text-sm text-muted">
                  {t(
                    "Revisá la vista previa: una vez creado, el lote no se puede editar. Es una sola firma y el gas lo paga la app.",
                    "Check the preview: once created, the lot can't be edited. It's a single signature and the app pays the gas.",
                  )}
                </p>
                <button type="submit" disabled={tx.pending !== null} className={`${button.primary} w-full sm:w-auto`}>
                  {tx.pending ? t("Creando...", "Creating...") : t("Crear lote", "Create lot")}
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {address && verified && (
            <Summary
              form={form}
              account={address}
              balance={balance}
              onDemoCaps={() => setForm({ ...form, softCap: "100", hardCap: "250" })}
            />
          )}
          <Guide />
        </aside>
      </div>
    </div>
  );
}
