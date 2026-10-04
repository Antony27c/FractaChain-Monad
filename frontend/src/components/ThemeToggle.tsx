"use client";

import { useRef } from "react";
import { useTheme } from "@/lib/theme";
import { useI18n } from "@/lib/i18n";

function ArgentinaFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 42" className={className} aria-hidden>
      <rect width="60" height="42" rx="3" fill="#74acdf" />
      <rect y="14" width="60" height="14" fill="#fff" />
      <circle cx="30" cy="21" r="4.2" fill="#f6b40e" />
      <circle cx="30" cy="21" r="1.6" fill="#85340a" />
    </svg>
  );
}

function UsFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 42" className={className} aria-hidden>
      <rect width="60" height="42" rx="3" fill="#b22234" />
      {[3.2, 9.6, 16, 22.4, 28.8, 35.2].map((y) => (
        <rect key={y} y={y} width="60" height="3.2" fill="#fff" />
      ))}
      <rect width="26" height="22.5" rx="2" fill="#3c3b6e" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const ref = useRef<HTMLButtonElement>(null);
  const dark = theme === "dark";

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => toggleTheme(ref.current)}
      aria-label={dark ? t("ui.themeToLight") : t("ui.themeToDark")}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </>
        ) : (
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        )}
      </svg>
    </button>
  );
}

export function LangToggle() {
  const { locale, toggleLocale, t } = useI18n();
  const es = locale === "es";

  return (
    <button
      type="button"
      onClick={toggleLocale}
      aria-label={es ? t("ui.langToEn") : t("ui.langToEs")}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-surface pl-1.5 pr-2.5"
    >
      {es ? <ArgentinaFlag className="h-3.5 w-5" /> : <UsFlag className="h-3.5 w-5" />}
      <span className="text-[11px] font-bold tracking-wide text-ink">{es ? "ES" : "EN"}</span>
    </button>
  );
}
