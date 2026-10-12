"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LoginButton } from "./LoginButton";
import { DevAccountPicker } from "./DevAccountPicker";
import { BrandMark } from "./BrandMark";
import { LangToggle, ThemeToggle } from "./ThemeToggle";
import { useI18n } from "@/lib/i18n";
import { useLanding } from "@/lib/landing";
import { isDevMode } from "@/lib/env";

const navLink =
  "rounded-lg px-2.5 py-2 text-[13px] font-bold tracking-tight text-muted transition-colors hover:bg-ink/5 hover:text-ink";
const drawerLink =
  "flex min-h-11 items-center rounded-xl px-3 text-base font-bold tracking-tight text-ink transition-colors hover:bg-ink/5";

export function Header() {
  const { t } = useI18n();
  const { nav } = useLanding();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open]);

  const links = [
    { href: "/market", label: t("nav.lots") },
    { href: "/orderbook", label: t("nav.orderbook") },
    { href: "/create", label: t("nav.create") },
    { href: "/stocks", label: nav.stocks },
    { href: "/forwards", label: nav.forwards },
    { href: "/warrants", label: nav.warrants },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <BrandMark />
          <nav className="hidden items-center gap-0.5 xl:flex">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} className={navLink}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="hidden items-center gap-1.5 xl:flex">
            <LangToggle />
            <ThemeToggle />
          </div>
          {isDevMode ? <DevAccountPicker /> : <LoginButton />}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t("ui.menuClose") : t("ui.menuOpen")}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink xl:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="absolute inset-x-0 top-full border-b border-line bg-bg shadow-xl xl:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {links.map(({ href, label }) => (
              <Link key={href} href={href} className={drawerLink}>
                {label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2 border-t border-line pt-3">
              <LangToggle />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
