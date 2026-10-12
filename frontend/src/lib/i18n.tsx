"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "es" | "en";

const dictionaries = {
  es: {
    "ui.themeToLight": "Cambiar a tema claro",
    "ui.themeToDark": "Cambiar a tema oscuro",
    "ui.langToEn": "Cambiar a inglés",
    "ui.langToEs": "Cambiar a español",
    "ui.menuOpen": "Abrir menú",
    "ui.menuClose": "Cerrar menú",
    "nav.lots": "Licitaciones",
    "nav.orderbook": "Orderbook",
    "nav.create": "Tokenizar",
    "auth.loading": "Cargando...",
    "auth.login": "Iniciar sesión",
    "auth.logout": "Cerrar sesión",
    "auth.wallet": "Tu wallet",
    "auth.preparing": "Preparando tu wallet...",
    "home.title": "Activos reales argentinos, ",
    "home.titleAccent": "fraccionados onchain",
    "home.lead": "Invertí en una fracción de una cosecha. Cada lote se financia en una licitación y luego se negocia en Kuru.",
    "home.viewLots": "Ver licitaciones",
    "home.openLots": "Licitaciones abiertas",
    "home.raised": "Recaudado",
    "home.lots": "Licitaciones",
    "home.empty": "Todavía no hay licitaciones",
    "home.emptyHint": "Cuando un emisor verificado abra una licitación, la vas a ver acá.",
  },
  en: {
    "ui.themeToLight": "Switch to light theme",
    "ui.themeToDark": "Switch to dark theme",
    "ui.langToEn": "Switch to English",
    "ui.langToEs": "Switch to Spanish",
    "ui.menuOpen": "Open menu",
    "ui.menuClose": "Close menu",
    "nav.lots": "Auctions",
    "nav.orderbook": "Orderbook",
    "nav.create": "Tokenize",
    "auth.loading": "Loading...",
    "auth.login": "Log in",
    "auth.logout": "Log out",
    "auth.wallet": "Your wallet",
    "auth.preparing": "Preparing your wallet...",
    "home.title": "Argentine real assets, ",
    "home.titleAccent": "fractionalized onchain",
    "home.lead": "Invest in a fraction of a harvest. Each lot is funded in an auction and then traded on Kuru.",
    "home.viewLots": "View auctions",
    "home.openLots": "Open auctions",
    "home.raised": "Raised",
    "home.lots": "Auctions",
    "home.empty": "No auctions yet",
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

export const currentLocale = (): Locale =>
  typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "es";

export function useT() {
  const { locale } = useI18n();
  return useCallback((es: string, en: string) => (locale === "en" ? en : es), [locale]);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("es");

  useEffect(() => {
    const saved = localStorage.getItem("sc_lang");
    if (saved === "en" || saved === "es") setLocale(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback((key: MessageKey) => dictionaries[locale][key], [locale]);

  const toggleLocale = useCallback(() => {
    const next: Locale = locale === "es" ? "en" : "es";
    setLocale(next);
    localStorage.setItem("sc_lang", next);
  }, [locale]);

  const value = useMemo(() => ({ locale, t, toggleLocale }), [locale, t, toggleLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
