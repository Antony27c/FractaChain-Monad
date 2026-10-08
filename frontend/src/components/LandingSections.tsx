"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  Building2,
  CheckCircle2,
  Coins,
  CreditCard,
  Droplets,
  Fingerprint,
  Gauge,
  Globe2,
  Info,
  KeyRound,
  Landmark,
  Layers,
  LineChart,
  Lock,
  Scale,
  ShieldCheck,
  ShoppingBasket,
  Wallet,
  Zap,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { MERVAL_NAMES, useLanding } from "@/lib/landing";

const h2 = "text-2xl font-extrabold text-ink sm:text-3xl lg:text-4xl";
const darkCta = "inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-3.5 text-sm font-bold text-bg";
const lightCta = "inline-flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-6 py-3.5 text-sm font-bold text-ink";
const tag = "shrink-0 rounded border border-line bg-surface px-2 py-0.5 font-lcd text-[10px] text-muted";

const PRODUCT_ICONS = [ShoppingBasket, LineChart, Landmark];
const PRODUCT_HREFS = ["/forwards", "/market", "/warrants"];

export function ProductsSection() {
  const copy = useLanding().products;
  return (
    <section className="space-y-6 sm:space-y-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="kicker">{copy.kicker}</p>
          <h2 className={`${h2} mt-1`}>{copy.title}</h2>
        </div>
        <p className="max-w-md text-sm text-muted">{copy.lead}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
        {copy.items.map((p, i) => {
          const Icon = PRODUCT_ICONS[i];
          return (
            <article key={p.title} className="crystal-card flex flex-col space-y-4 rounded-2xl p-5 sm:rounded-3xl sm:p-7">
              <div className="flex items-center justify-between">
                <span className="font-lcd text-xs text-muted">{p.kicker}</span>
                <Icon className="h-5 w-5 text-ink" />
              </div>
              <h3 className="text-xl font-extrabold leading-tight text-ink">{p.title}</h3>
              <p className="font-semibold text-ink">{p.lead}</p>
              <p className="flex-1 text-sm text-muted sm:text-base">
                {p.body}{" "}
                {p.tip && (
                  <span className="group relative inline-flex align-middle">
                    <button
                      type="button"
                      aria-label={p.tip}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-ink"
                    >
                      <Info className="h-3 w-3" />
                    </button>
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-64 -translate-x-1/2 rounded-xl border border-line bg-bg p-3 text-left text-xs font-normal leading-snug text-muted shadow-lg group-focus-within:block group-hover:block">
                      {p.tip}
                    </span>
                  </span>
                )}
              </p>
              <Link href={PRODUCT_HREFS[i]} className="inline-flex items-center gap-2 pt-2 text-sm font-bold text-ink">
                {p.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function IssuerCtaBanner() {
  const copy = useLanding().issuer;
  return (
    <section className="crystal-card space-y-6 rounded-2xl p-5 sm:rounded-3xl sm:p-8 lg:p-10">
      <div className="flex flex-col justify-between gap-5 sm:gap-6 lg:flex-row lg:items-center">
        <div className="max-w-2xl space-y-3">
          <p className="kicker">{copy.kicker}</p>
          <h2 className={`${h2} leading-snug`}>{copy.title}</h2>
          <p className="text-sm text-muted sm:text-base">{copy.body}</p>
        </div>
        <Link href="/create" className={`${darkCta} w-full shrink-0 sm:w-auto`}>
          <Building2 className="h-4 w-4" />
          {copy.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {copy.steps.map(([title, desc], i) => (
          <li key={title} className="space-y-1.5 rounded-2xl border border-line bg-surface p-4">
            <span className="font-lcd text-[10px] uppercase tracking-wider text-muted">{String(i + 1).padStart(2, "0")}</span>
            <div className="text-sm font-bold text-ink">{title}</div>
            <p className="text-xs leading-relaxed text-muted">{desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function InstitutionMark({ slug, alt, title, sub, fallback }: { slug: string; alt: string; title: string; sub: string; fallback: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <BrandLogo slug={slug} alt={alt} className="h-12 w-12 shrink-0 object-contain" fallback={fallback} />
      <div className="min-w-0 leading-tight">
        <div className="text-xs font-extrabold text-ink sm:text-sm">{title}</div>
        <div className="text-[11px] text-muted">{sub}</div>
      </div>
    </div>
  );
}

const REGULATION_ICONS = [ShieldCheck, Globe2, Scale];

export function RegulationSection() {
  const copy = useLanding().regulation;
  return (
    <section className="crystal-card space-y-6 rounded-2xl p-5 sm:space-y-8 sm:rounded-3xl sm:p-8 lg:p-12">
      <div className="max-w-3xl space-y-3">
        <p className="kicker">{copy.kicker}</p>
        <h2 className={h2}>{copy.title}</h2>
        <p className="text-sm leading-relaxed text-muted sm:text-base">{copy.body}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
        <InstitutionMark
          slug="cnv"
          alt="CNV"
          title={copy.cnv}
          sub={copy.cnvSub}
          fallback={
            <svg viewBox="0 0 64 64" className="h-12 w-12 shrink-0" aria-hidden>
              <circle cx="32" cy="32" r="30" fill="#0b3a6e" />
              <circle cx="32" cy="32" r="24" fill="none" stroke="#f4c430" strokeWidth="2.2" />
              <text x="32" y="28" textAnchor="middle" fill="#fff" fontSize="9" fontFamily="Georgia, serif" fontWeight="700">
                CNV
              </text>
              <text x="32" y="40" textAnchor="middle" fill="#f4c430" fontSize="5.2" fontFamily="Georgia, serif">
                ARGENTINA
              </text>
            </svg>
          }
        />
        <InstitutionMark
          slug="caja-de-valores"
          alt="Caja de Valores"
          title={copy.caja}
          sub={copy.cajaSub}
          fallback={
            <svg viewBox="0 0 64 64" className="h-12 w-12 shrink-0" aria-hidden>
              <rect x="4" y="4" width="56" height="56" rx="8" fill="#113355" />
              <path d="M16 40V24l16-8 16 8v16l-16 8-16-8z" fill="none" stroke="#fff" strokeWidth="2" />
              <path d="M32 16v32" stroke="#7ed86a" strokeWidth="2" />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-5 pt-2 md:grid-cols-3">
        {copy.cards.map(([title, desc], i) => {
          const Icon = REGULATION_ICONS[i];
          return (
            <div key={title} className="space-y-2">
              <Icon className="h-5 w-5" />
              <h3 className="font-extrabold text-ink">{title}</h3>
              <p className="text-sm leading-relaxed text-muted">{desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function MervalLogosSection() {
  const { merval } = useLanding();
  const loop = [...MERVAL_NAMES, ...MERVAL_NAMES];
  return (
    <section className="space-y-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="kicker">{merval.kicker}</p>
          <h2 className="mt-1 text-3xl font-extrabold text-ink sm:text-4xl">{merval.title}</h2>
        </div>
        <p className="max-w-md text-sm text-muted">{merval.lead}</p>
      </div>
      <div className="merval-reel">
        <div className="merval-reel-track">
          {loop.map((c, i) => (
            <Link
              key={`${c.ticker}-${i}`}
              href="/stocks"
              aria-label={c.name}
              tabIndex={i >= MERVAL_NAMES.length ? -1 : undefined}
              className="flex h-[88px] min-w-[140px] shrink-0 items-center justify-center px-4"
            >
              <BrandLogo slug={c.ticker.toLowerCase()} alt={c.name} className="h-14 w-auto max-w-[140px] object-contain" />
            </Link>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/stocks" className={darkCta}>
          {merval.ctaStocks}
        </Link>
        <Link href="/market" className={lightCta}>
          {merval.ctaBonds}
        </Link>
      </div>
      <p className="max-w-3xl border-l-2 border-accent pl-4 text-sm text-muted">{merval.stake}</p>
    </section>
  );
}

export function PartnersShowcase() {
  const copy = useLanding().partners;
  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
            <Building2 className="h-4 w-4" />
            {copy.kicker}
          </div>
          <h2 className="text-3xl font-extrabold text-ink">{copy.title}</h2>
        </div>
        <p className="max-w-md text-sm text-muted">{copy.lead}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {copy.items.map((p) => (
          <div key={p.name} className="crystal-card space-y-3 rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <BrandLogo
                slug={p.slug}
                alt={p.name}
                className="h-8 w-auto max-h-8 max-w-[6.5rem] object-contain object-left"
                fallback={<span className="text-base font-extrabold tracking-tight text-ink">{p.name}</span>}
              />
              <span className={tag}>{p.badge}</span>
            </div>
            <div>
              <div className="text-sm font-bold text-ink">{p.role}</div>
              <p className="mt-1 text-xs leading-relaxed text-muted">{p.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const NETWORK_ICONS: LucideIcon[] = [Layers, Gauge, Coins, Fingerprint, KeyRound];

export function NetworkSection() {
  const copy = useLanding().network;
  return (
    <section className="space-y-5 sm:space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
            <Globe2 className="h-4 w-4" />
            {copy.kicker}
          </div>
          <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">{copy.title}</h2>
        </div>
        <p className="max-w-md text-sm text-muted">{copy.body}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {copy.items.map(([title, desc], i) => {
          const Icon = NETWORK_ICONS[i];
          return (
            <div key={title} className="crystal-card space-y-3 rounded-2xl p-5">
              <Icon className="h-5 w-5 text-accent" />
              <div className="text-sm font-bold text-ink">{title}</div>
              <p className="text-xs leading-relaxed text-muted">{desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const LIQUIDITY_ICONS = [Zap, Activity, Wallet];

export function LiquidityFirstBanner() {
  const copy = useLanding().liquidity;
  return (
    <section className="crystal-card relative overflow-hidden rounded-2xl p-5 sm:rounded-3xl sm:p-8 lg:p-12">
      <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-leaf-200 opacity-70 blur-3xl dark:opacity-10" />
      <div className="relative z-10 space-y-6 sm:space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted">
          <Droplets className="h-3.5 w-3.5" />
          {copy.kicker}
        </div>
        <h2 className="max-w-3xl text-2xl font-extrabold leading-snug text-ink sm:text-3xl lg:text-4xl">{copy.title}</h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{copy.body}</p>
        <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
          {copy.cards.map(([title, desc], i) => {
            const Icon = LIQUIDITY_ICONS[i];
            return (
              <div key={title} className="space-y-2 rounded-2xl border border-line bg-surface p-5">
                <Icon className="h-5 w-5" />
                <h3 className="font-extrabold">{title}</h3>
                <p className="text-sm text-muted">{desc}</p>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4 sm:gap-3">
          <Link href="/market" className="btn-lcd btn-lcd-solid flex-1 justify-center px-5 py-2.5 text-xs sm:flex-none">
            {copy.market} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/warrants" className="btn-lcd btn-lcd-ghost flex-1 justify-center px-5 py-2.5 text-xs sm:flex-none">
            {copy.burst}
          </Link>
        </div>
      </div>
    </section>
  );
}

const SOON_ICONS: LucideIcon[] = [Landmark, Layers, Globe2, CreditCard];
const BADGE_ICONS: LucideIcon[] = [ShieldCheck, Lock, Zap, CheckCircle2];

export function SoonSection() {
  const { soon, soonItems, badges } = useLanding();
  return (
    <>
      <section className="space-y-5 sm:space-y-6">
        <h2 className="text-2xl font-extrabold sm:text-3xl">{soon}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {soonItems.map(([title, desc], i) => {
            const Icon = SOON_ICONS[i];
            return (
              <div key={title} className="crystal-card space-y-3 rounded-2xl p-5 sm:rounded-3xl sm:p-6">
                <Icon className="h-5 w-5" />
                <h4 className="font-extrabold">{title}</h4>
                <p className="text-sm text-muted">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="crystal-card grid grid-cols-1 gap-4 rounded-2xl p-5 sm:grid-cols-2 sm:gap-6 sm:rounded-3xl sm:p-8 md:grid-cols-4">
        {badges.map(([title, sub], i) => {
          const Icon = BADGE_ICONS[i];
          return (
            <div key={title} className="flex min-w-0 items-center gap-3">
              <Icon className="h-6 w-6 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-bold">{title}</div>
                <div className="text-[11px] text-muted">{sub}</div>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
