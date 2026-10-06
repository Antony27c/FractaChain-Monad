"use client";

import Link from "next/link";
import { LoginButton } from "./LoginButton";
import { DevAccountPicker } from "./DevAccountPicker";
import { LangToggle, ThemeToggle } from "./ThemeToggle";
import { useI18n } from "@/lib/i18n";
import { isDevMode } from "@/lib/env";

const navLink =
  "rounded-lg px-2.5 py-2 text-[13px] font-bold tracking-tight text-muted transition-colors hover:bg-ink/5 hover:text-ink";

export function Header() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="text-[1.45rem] font-extrabold leading-none tracking-[-0.04em] text-ink">
            FractaChain
          </Link>
          <nav className="flex items-center gap-0.5">
            <Link href="/" className={navLink}>
              {t("nav.lots")}
            </Link>
            <Link href="/create" className={navLink}>
              {t("nav.create")}
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
