import type { Metadata } from "next";
import { Lato, Share_Tech_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { DevTools } from "@/components/DevTools";
import { CrystalBackdrop } from "@/components/CrystalBackdrop";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-lato",
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-lcd",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["700", "800"],
  style: "italic",
  display: "swap",
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "FractaChain",
  description:
    "Mercado onchain de activos reales argentinos sobre Monad: licitación primaria y mercado secundario en Kuru.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${lato.variable} ${shareTechMono.variable} ${sourceSerif.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('sc_theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="relative flex min-h-[100dvh] flex-col bg-bg font-sans text-ink selection:bg-leaf-200 selection:text-black">
        <ThemeProvider>
          <I18nProvider>
            <Providers>
              <CrystalBackdrop />
              <Header />
              <main className="relative z-10 flex-1">{children}</main>
              <DevTools />
            </Providers>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
