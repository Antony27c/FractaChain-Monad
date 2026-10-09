"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { useLanding } from "@/lib/landing";
import { useI18n } from "@/lib/i18n";

const heading = "mb-3 text-xs font-extrabold uppercase tracking-wider text-ink";
const link = "transition-colors hover:text-ink";

export function Footer() {
  const { footer, nav } = useLanding();
  const { t } = useI18n();

  return (
    <footer className="relative z-10 border-t border-line pb-8 pt-8 text-sm text-muted sm:pb-10 sm:pt-14">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 flex flex-col justify-between gap-8 sm:mb-10 md:flex-row md:items-start md:gap-12">
          <div className="max-w-sm shrink-0 space-y-4">
            <BrandMark />
            <p className="text-sm leading-relaxed">
              {footer.blurb} <strong className="text-ink">Monad</strong>.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className={heading}>{footer.markets}</h4>
              <ul className="space-y-2">
                <li><Link href="/market" className={link}>{nav.market}</Link></li>
                <li><Link href="/orderbook" className={link}>{t("nav.orderbook")}</Link></li>
                <li><Link href="/stocks" className={link}>{nav.stocks}</Link></li>
                <li><Link href="/forwards" className={link}>{nav.forwards}</Link></li>
                <li><Link href="/warrants" className={link}>{nav.warrants}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className={heading}>{footer.platform}</h4>
              <ul className="space-y-2">
                <li><Link href="/create" className={link}>{t("nav.create")}</Link></li>
                <li><Link href="/actividad" className={link}>{footer.activity}</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="crystal-card mb-8 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
            <Lock className="h-4 w-4" /> {footer.notice}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed">{footer.legal}</p>
        </div>
        <div className="flex justify-between font-lcd text-xs">
          <p suppressHydrationWarning>© {new Date().getFullYear()} FractaChain</p>
          <p>MONAD TESTNET</p>
        </div>
      </div>
    </footer>
  );
}
