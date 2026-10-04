"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "es" | "en";

const dictionaries = {
  es: {
    "ui.themeToLight": "Cambiar a tema claro",
    "ui.themeToDark": "Cambiar a tema oscuro",
    "ui.langToEn": "Cambiar a inglés",
    "ui.langToEs": "Cambiar a español",
    "nav.lots": "Lotes",
    "nav.create": "Emitir lote",
    "auth.loading": "Cargando...",
    "auth.login": "Iniciar sesión",
    "auth.logout": "Cerrar sesión",
    "home.title": "Activos reales argentinos, ",
    "home.titleAccent": "fraccionados onchain",
    "home.lead": "Invertí en una fracción de una cosecha. Cada lote se financia en una licitación y luego se negocia en Kuru.",
    "home.viewLots": "Ver lotes",
    "home.openLots": "Lotes abiertos",
    "home.raised": "Recaudado",
    "home.lots": "Lotes",
    "home.empty": "Todavía no hay lotes",
    "home.emptyHint": "Cuando un emisor verificado abra una licitación, la vas a ver acá.",
  },
  en: {
    "ui.themeToLight": "Switch to light theme",
    "ui.themeToDark": "Switch to dark theme",
    "ui.langToEn": "Switch to English",
    "ui.langToEs": "Switch to Spanish",
    "nav.lots": "Lots",
    "nav.create": "Issue lot",
    "auth.loading": "Loading...",
    "auth.login": "Log in",
    "auth.logout": "Log out",
    "home.title": "Argentine real assets, ",
    "home.titleAccent": "fractionalized onchain",
    "home.lead": "Invest in a fraction of a harvest. Each lot is funded in an auction and then traded on Kuru.",
    "home.viewLots": "View lots",
    "home.openLots": "Open lots",
    "home.raised": "Raised",
    "home.lots": "Lots",
    "home.empty": "No lots yet",
    "home.emptyHint": "When a verified issuer opens an auction, you'll see it here.",
  },
} as const;

export type MessageKey = keyof (typeof dictionaries)["es"];

type I18nCtx = { locale: Locale; t: (key: MessageKey) => string; toggleLocale: () => void };

const I18nContext = createContext<I18nCtx>({
  locale: "es",
  t: (key) => dictionaries.es[key],
  toggleLocale: () => {},
});

export const useI18n = () => useContext(I18nContext);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("es");

  useEffect(() => {
    const saved = localStorage.getItem("sc_lang");
    if (saved === "en" || saved === "es") setLocale(saved);
  }, []);

  const t = useCallback((key: MessageKey) => dictionaries[locale][key], [locale]);

  const toggleLocale = useCallback(() => {
    const next: Locale = locale === "es" ? "en" : "es";
    setLocale(next);
    localStorage.setItem("sc_lang", next);
    document.documentElement.lang = next;
  }, [locale]);

  const value = useMemo(() => ({ locale, t, toggleLocale }), [locale, t, toggleLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
