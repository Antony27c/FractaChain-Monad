"use client";

import Link from "next/link";
import { LoginButton } from "./LoginButton";
import { DevAccountPicker } from "./DevAccountPicker";
import { BrandMark } from "./BrandMark";
import { LangToggle, ThemeToggle } from "./ThemeToggle";
import { useI18n } from "@/lib/i18n";
import { useLanding } from "@/lib/landing";
import { isDevMode } from "@/lib/env";

const navLink =
  "rounded-lg px-2.5 py-2 text-[13px] font-bold tracking-tight text-muted transition-colors hover:bg-ink/5 hover:text-ink";

export function Header() {
  const { t } = useI18n();
  const { nav } = useLanding();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <BrandMark />
          <nav className="flex items-center gap-0.5 overflow-x-auto">
            <Link href="/market" className={navLink}>
              {t("nav.lots")}
            </Link>
            <Link href="/create" className={navLink}>
              {t("nav.create")}
            </Link>
            <Link href="/stocks" className={`${navLink} hidden lg:inline-flex`}>
              {nav.stocks}
            </Link>
            <Link href="/forwards" className={`${navLink} hidden lg:inline-flex`}>
              {nav.forwards}
            </Link>
            <Link href="/warrants" className={`${navLink} hidden lg:inline-flex`}>
              {nav.warrants}
            </Link>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <LangToggle />
          <ThemeToggle />
          {isDevMode ? <DevAccountPicker /> : <LoginButton />}
        </div>
      </div>
    </header>
  );
}
