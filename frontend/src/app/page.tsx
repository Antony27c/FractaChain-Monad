"use client";

import Link from "next/link";
import { Building2, Layers, Sparkles, TrendingUp } from "lucide-react";
import { DynamicHeroText } from "@/components/DynamicHeroText";
import { HeroBackground } from "@/components/HeroBackground";
import { MoreThanRwaSection } from "@/components/MoreThanRwaSection";
import {
  IssuerCtaBanner,
  LiquidityFirstBanner,
  MervalLogosSection,
  NetworkSection,
  PartnersShowcase,
  ProductsSection,
  RegulationSection,
  SoonSection,
} from "@/components/LandingSections";
import { useLanding } from "@/lib/landing";

const cta = "flex w-full items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-[0.95rem] font-bold sm:w-auto";

export default function Home() {
  const { badge, lead, cta: ctaCopy } = useLanding();

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 pb-16 pt-3 sm:space-y-16 sm:pt-4 md:px-6 lg:space-y-24">
      <section className="relative mx-auto flex min-h-0 max-w-5xl flex-col items-center justify-start py-8 pb-6 text-center sm:min-h-[calc(100svh-5.75rem)] sm:justify-center sm:py-10">
        <HeroBackground />

        <div className="relative z-10 flex w-full flex-col items-center gap-4 sm:gap-5">
          <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-muted">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="text-left">{badge}</span>
          </div>
          <DynamicHeroText />
          <p className="hero-lead mx-auto px-1 text-[0.95rem] leading-relaxed text-muted sm:text-[1.2rem]">
            <span className="block">
              {lead.before} <strong className="font-bold text-ink">{lead.strong}</strong> {lead.l1End}
            </span>
            <span className="block">
              {lead.l2Pre}
              <strong className="font-semibold text-ink">{lead.strongCap}</strong>
              {lead.l2Post}
            </span>
            <span className="block">
              {lead.l3Pre}
              <strong className="font-semibold text-ink">{lead.strong90}</strong>
            </span>
          </p>
          <div className="flex w-full flex-col items-stretch justify-center gap-2.5 px-1 pt-1 sm:flex-row sm:flex-wrap sm:items-center lg:flex-nowrap">
            <Link href="/market" className={`${cta} bg-ink text-bg`}>
              <Layers className="h-4 w-4 shrink-0" />
              {ctaCopy.market}
            </Link>
            <Link href="/stocks" className={`${cta} border border-line bg-surface text-ink`}>
              <TrendingUp className="h-4 w-4 shrink-0" />
              {ctaCopy.stocks}
            </Link>
            <Link href="/create" className={`${cta} border border-line bg-surface/60 font-semibold text-ink`}>
              <Building2 className="h-4 w-4 shrink-0" />
              {ctaCopy.create}
            </Link>
          </div>
        </div>
      </section>

      <MoreThanRwaSection />

      <div className="below-fold space-y-12 md:space-y-16 lg:space-y-24">
        <ProductsSection />
        <IssuerCtaBanner />
        <RegulationSection />
        <MervalLogosSection />
        <PartnersShowcase />
        <NetworkSection />
        <LiquidityFirstBanner />
        <SoonSection />
      </div>
    </div>
  );
}
