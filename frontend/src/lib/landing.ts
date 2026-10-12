"use client";

import { useI18n, type Locale } from "./i18n";

type Pair = readonly [string, string];

type LandingCopy = {
  badge: string;
  lead: { before: string; strong: string; l1End: string; l2Pre: string; strongCap: string; l2Post: string; l3Pre: string; strong90: string };
  cta: { market: string; stocks: string; create: string };
  hero: { invert: string; sectors: readonly { text: string; tag: string; yieldEst: string }[] };
  moreRwa: { kicker: string; title: string; body: string; points: readonly string[] };
  products: {
    kicker: string;
    title: string;
    lead: string;
    items: readonly { kicker: string; title: string; cta: string; lead: string; body: string; tip: string }[];
  };
  issuer: { kicker: string; title: string; body: string; steps: readonly Pair[]; cta: string };
  regulation: { kicker: string; title: string; body: string; cnv: string; cnvSub: string; caja: string; cajaSub: string; cards: readonly Pair[] };
  merval: { kicker: string; title: string; lead: string; ctaStocks: string; ctaBonds: string; stake: string };
  partners: { kicker: string; title: string; lead: string; items: readonly { name: string; slug?: string; role: string; badge: string; description: string }[] };
  network: { kicker: string; title: string; body: string; items: readonly Pair[] };
  liquidity: { kicker: string; title: string; body: string; cards: readonly Pair[]; market: string; burst: string };
  soon: string;
  soonItems: readonly Pair[];
  badges: readonly Pair[];
  footer: { blurb: string; markets: string; platform: string; activity: string; notice: string; legal: string };
  nav: { market: string; stocks: string; forwards: string; warrants: string };
  mock: { title: string; body: string; listing: string; tail: string };
  pages: { stocksTitle: string; forwardsTitle: string; warrantsTitle: string };
};

const es: LandingCopy = {
  badge: "Mercado RWA onchain · Monad",
  lead: {
    before: "El primer mercado",
    strong: "crypto RWA",
    l1End: "de Argentina.",
    l2Pre: "Conectamos el ",
    strongCap: "mercado de capitales",
    l2Post: " con las empresas de manera 100% trazable,",
    l3Pre: "brindando exposición a inversores de ",
    strong90: "más de 90 países.",
  },
  cta: { market: "Explorar lotes", stocks: "Acciones Merval", create: "Emitir lote" },
  hero: {
    invert: "Invertí",
    sectors: [
      { text: "en producción industrial", tag: "Manufactura & alimentos", yieldEst: "12–16% TNA" },
      { text: "en vinos", tag: "Valles Calchaquíes & Cuyo", yieldEst: "15.2% TNA USD" },
      { text: "en aceite de oliva", tag: "San Juan & La Rioja", yieldEst: "13.9% TNA USD" },
      { text: "en lácteos", tag: "Cuenca Santa Fe & Córdoba", yieldEst: "12.8% TNA USD" },
      { text: "en materias primas", tag: "Commodities agro", yieldEst: "14.5% TNA USD" },
      { text: "en soja", tag: "Zona Núcleo Pampeana", yieldEst: "14.0% TNA USD" },
      { text: "en maíz", tag: "Región Centro", yieldEst: "13.8% TNA USD" },
      { text: "en tabaco", tag: "Valles de Salta & Jujuy", yieldEst: "16.8% TNA USD" },
      { text: "en acopios de trigo", tag: "Warrants Ley 9643", yieldEst: "14.1% TNA USD" },
      { text: "en YPF", tag: "tYPF · maqueta", yieldEst: "DIVID. USD" },
      { text: "en Galicia", tag: "tGGAL · maqueta", yieldEst: "DIVID. USD" },
      { text: "en bonos", tag: "Bopreal / AL30", yieldEst: "Cupón USD" },
      { text: "en todo", tag: "Consumo · Acciones · Deuda", yieldEst: "RWA" },
      { text: "global", tag: "Monad · USDC · Merval", yieldEst: "24/7" },
    ],
  },
  moreRwa: {
    kicker: "Alcance global",
    title: "More than RWA",
    body: "No solo somos la solución para tokenizar tu producción o las acciones de tu empresa: te conectamos con inversores globales en más de 90 países y liquidez T+0.",
    points: ["Inversores en más de 90 países", "Liquidez T+0 onchain", "Diseño bajo marco CNV · Ley 26.831"],
  },
  products: {
    kicker: "Productos",
    title: "Todo sobre un mismo riel",
    lead: "Consumo, inversión y crédito contra producción. Todo liquida onchain.",
    items: [
      {
        kicker: "01",
        title: "Consumo",
        cta: "Ver forwards",
        lead: "Contratos de producción para consumo, respaldados en blockchain.",
        body: "Tokenizá y vendé tu producción de manera totalmente segura, a un costo muy bajo y respaldado por el Código Civil y Comercial (CCC). No hace falta constituir un fideicomiso.",
        tip: "Al ser un contrato de consumo a futuro, no es necesario constituir un fideicomiso para tokenizar tu producción. Regulado por el Código Civil y Comercial de la Nación — Ley 26.994.",
      },
      {
        kicker: "02",
        title: "Inversión",
        cta: "Ir a los lotes",
        lead: "Licitaciones primarias y mercado secundario.",
        body: "Te acompañamos en todo el proceso: invertí en la licitación primaria y negociá tu posición en el mercado secundario de Kuru, todo onchain.",
        tip: "",
      },
      {
        kicker: "03",
        title: "Lending y stake",
        cta: "Stake o préstamo",
        lead: "Stakeá tus acciones o recibí préstamos poniendo tu producción en garantía.",
        body: "Con nosotros recibís rendimientos al stakear tus acciones del Merval u otras acciones y tokenizaciones de producción.",
        tip: "",
      },
    ],
  },
  issuer: {
    kicker: "Para empresas",
    title: "Tokenizá tu producción o las acciones de tu empresa y levantá capital",
    body: "Cotizar en el Merval o BYMA exige costos y un tamaño que la mayoría de las empresas no alcanza: con nuestra estructura tu empresa sale a mercado sin esa barrera, bajo el mismo marco regulatorio CNV. Te acompañamos de la licitación primaria al listado en el secundario.",
    steps: [
      ["Estructurá la emisión", "Definís el activo, el precio por shard y los topes mínimo y máximo de la licitación."],
      ["Licitación primaria", "Abrís tu licitación y los inversores verificados aportan USDC hasta el cierre."],
      ["Mercado secundario", "Si se alcanza el mínimo, los shards cotizan en el libro de órdenes de Kuru."],
    ],
    cta: "Emitir un lote",
  },
  regulation: {
    kicker: "Marco legal",
    title: "Marco CNV. Inversión global. Diseñado para el sandbox.",
    body: "El diseño sigue el sandbox de la CNV (RG 1150 / Ley 26.831): cada token está pensado 1:1 con un activo real en Caja de Valores, con warrants bajo la Ley 9643 y forwards del Código Civil. No es una habilitación ya obtenida. Un inversor en Madrid, Miami o São Paulo usaría el mismo marco que un comitente en Buenos Aires.",
    cnv: "Comisión Nacional de Valores",
    cnvSub: "Diseñado para el sandbox RG 1150/2026 · Ley 26.831",
    caja: "Caja de Valores S.A.",
    cajaSub: "Custodia 1:1 (objetivo de diseño)",
    cards: [
      ["Diseño regulado", "PSAV, AML/CFT y KYC onchain. El marco es el de la CNV; la habilitación todavía no está otorgada."],
      ["Cualquier inversor del mundo", "Liquidación onchain en Monad. El riel es global; el título sigue siendo argentino y custodiado."],
      ["Tres productos, un expediente", "Consumo, futuros licitables y lending contra stock. Misma custodia, mismo regulador."],
    ],
  },
  merval: {
    kicker: "Renta variable y deuda",
    title: "Acciones tokenizadas y bonos",
    lead: "tYPF, tGGAL y el resto del panel líder: 1 token = 1 acción custodiada (hoy es una maqueta). También deuda soberana y ON en el roadmap.",
    ctaStocks: "Ver acciones Merval",
    ctaBonds: "Lotes y licitaciones",
    stake: "También podés poner en stake tus acciones y recibir renta sobre las acciones puestas en stake, además de los dividendos que correspondan de tus acciones argentinas o títulos de deuda.",
  },
  partners: {
    kicker: "Building blocks",
    title: "Integraciones y referencias",
    lead: "Monad, Kuru, Privy y Envio están integrados hoy. BYMA, Caja de Valores y Matba Rofex son la infraestructura del mercado argentino que tomamos como referencia: no tenemos acuerdos con ellos.",
    items: [
      { name: "BYMA", slug: "byma", role: "Bolsas y Mercados Argentinos", badge: "Referencia", description: "Infraestructura bursátil y estándares de mercado que toma como referencia el diseño." },
      { name: "Caja de Valores", slug: "caja-de-valores", role: "Depositario Central de Valores", badge: "Referencia", description: "Depositario central al que apunta el diseño para custodiar activos tokenizados. Sin acuerdo vigente." },
      { name: "Matba Rofex", slug: "matba-rofex", role: "Mercado a Término Agropecuario", badge: "Referencia", description: "Cotizaciones públicas de futuros de granos (soja, maíz, trigo) como precio de referencia." },
      { name: "Monad", role: "Red blockchain EVM", badge: "Infraestructura L1", description: "Blockchain compatible con EVM de alto rendimiento donde viven las licitaciones, los shards y la redención." },
      { name: "Kuru", role: "Libro de órdenes onchain", badge: "Mercado secundario", description: "CLOB y vault de liquidez sobre Monad para comprar y vender shards después de la licitación." },
      { name: "Privy", role: "Wallet embebida", badge: "Onboarding", description: "Entrás con email o Google y obtenés una wallet al instante, con gas patrocinado." },
      { name: "Envio HyperSync", role: "Indexación de datos", badge: "Historial", description: "Lectura rápida del historial onchain para mostrar tu actividad completa." },
    ],
  },
  network: {
    kicker: "La red",
    title: "¿Por qué Monad?",
    body: "Una blockchain compatible con EVM, rápida y de bajo costo. Con el KYC onchain, cualquier inversor de cualquier parte del mundo puede invertir.",
    items: [
      ["Compatible con EVM", "Contratos Solidity y herramientas estándar de Ethereum."],
      ["Rápida y barata", "Confirmaciones en segundos y fees mínimos por operación."],
      ["Sin gas para vos", "El gas de cada operación lo patrocina la plataforma."],
      ["Solo KYC", "Con la verificación onchain ya podés invertir."],
      ["Tu wallet, tus claves", "Wallet embebida con email; podés exportar la clave cuando quieras."],
    ],
  },
  liquidity: {
    kicker: "Liquidez primero",
    title: "Tokenizar sin mercado secundario no sirve.",
    body: "Cada lote exitoso pasa a un libro de órdenes con liquidez en Kuru. Entrás y salís cuando hace falta.",
    cards: [
      ["Burst loans", "Accedé a préstamos instantáneos poniendo como colateral tu producción (vinos, quesos, tabaco, maíz) con warrants Ley 9643: liquidez en segundos sin vender tu producción."],
      ["CLOB 24/7", "Libro de órdenes onchain y operación las 24 horas, con vault de liquidez."],
      ["Redención de cosecha", "Al liquidarse la cosecha, cada tenedor canjea sus shards por USDC directamente en el contrato."],
    ],
    market: "Mercado secundario",
    burst: "Burst loan",
  },
  soon: "Próximamente",
  soonItems: [
    ["Bonos soberanos", "Bopreal / AL30 con cupón onchain."],
    ["ETFs sectoriales", "Agro, energía y bancos."],
    ["Carbono agro", "Siembra directa verificada."],
    ["Tarjeta Mastercard", "Pagá con Mastercard gastando el saldo de tus acciones."],
    ["Productos DeFi", "Lo mejor del mundo DeFi se combina con el mercado tradicional."],
  ],
  badges: [
    ["Diseñado para", "Sandbox CNV"],
    ["Kuru", "Order book onchain"],
    ["Monad", "Testnet"],
    ["KYC", "Onchain"],
  ],
  footer: {
    blurb: "RWA argentino y Merval tokenizado sobre",
    markets: "Mercados",
    platform: "Plataforma",
    activity: "Mi actividad",
    notice: "Aviso",
    legal: "Diseñado para el sandbox de tokenización de la CNV (RG 1150/2026); no es una autorización obtenida. Merval, forwards y warrants son maquetas, sin acuerdos con BYMA ni Caja de Valores. Forwards y warrants: Art. 1131 CCyC y Ley 9643.",
  },
  nav: { market: "Licitaciones", stocks: "Merval", forwards: "Forwards", warrants: "Warrants" },
  mock: {
    title: "Maqueta: no opera onchain",
    body: "{product} es un simulador de producto. El flujo vivo es el de los",
    listing: "lotes",
    tail: ": licitación, mercado secundario en Kuru y redención en Monad testnet.",
  },
  pages: {
    stocksTitle: "Acciones tokenizadas del Merval",
    forwardsTitle: "Forwards de producción",
    warrantsTitle: "Warrants y burst loans",
  },
};

const en: LandingCopy = {
  badge: "Onchain RWA market · Monad",
  lead: {
    before: "Argentina's first",
    strong: "crypto RWA market.",
    l1End: "",
    l2Pre: "We connect the ",
    strongCap: "capital markets",
    l2Post: " with companies in a fully traceable way,",
    l3Pre: "giving exposure to investors in ",
    strong90: "90+ countries.",
  },
  cta: { market: "Explore lots", stocks: "Merval stocks", create: "Issue a lot" },
  hero: {
    invert: "Invest",
    sectors: [
      { text: "in industrial production", tag: "Manufacturing & food", yieldEst: "12–16% APR" },
      { text: "in wine", tag: "Calchaquíes & Cuyo", yieldEst: "15.2% USD APR" },
      { text: "in olive oil", tag: "San Juan & La Rioja", yieldEst: "13.9% USD APR" },
      { text: "in dairy", tag: "Santa Fe & Córdoba basin", yieldEst: "12.8% USD APR" },
      { text: "in raw materials", tag: "Agro commodities", yieldEst: "14.5% USD APR" },
      { text: "in soy", tag: "Pampean core", yieldEst: "14.0% USD APR" },
      { text: "in corn", tag: "Central region", yieldEst: "13.8% USD APR" },
      { text: "in tobacco", tag: "Salta & Jujuy valleys", yieldEst: "16.8% USD APR" },
      { text: "in wheat warehouses", tag: "Law 9643 warrants", yieldEst: "14.1% USD APR" },
      { text: "in YPF", tag: "tYPF · mockup", yieldEst: "USD DIV." },
      { text: "in Galicia", tag: "tGGAL · mockup", yieldEst: "USD DIV." },
      { text: "in bonds", tag: "Bopreal / AL30", yieldEst: "USD coupon" },
      { text: "in everything", tag: "Commodities · Stocks · Debt", yieldEst: "RWA" },
      { text: "globally", tag: "Monad · USDC · Merval", yieldEst: "24/7" },
    ],
  },
  moreRwa: {
    kicker: "Global reach",
    title: "More than RWA",
    body: "We're not just the way to tokenize your production or your company's shares: we connect you with global investors in 90+ countries and T+0 liquidity.",
    points: ["Investors in 90+ countries", "T+0 onchain liquidity", "Designed under the CNV framework · Law 26,831"],
  },
  products: {
    kicker: "Products",
    title: "Everything on one rail",
    lead: "Consumption, investment and credit against production. Everything settles onchain.",
    items: [
      {
        kicker: "01",
        title: "Consumption",
        cta: "See forwards",
        lead: "Production contracts for consumption, backed onchain.",
        body: "Tokenize and sell your production securely, at a very low cost and backed by Argentina's Civil and Commercial Code (CCC). No trust (fideicomiso) required.",
        tip: "As a forward consumption contract, no trust needs to be set up to tokenize your production. Regulated by Argentina's Civil and Commercial Code — Law 26,994.",
      },
      {
        kicker: "02",
        title: "Investment",
        cta: "Go to lots",
        lead: "Primary auctions and secondary market.",
        body: "We walk you through the whole process: invest in the primary auction and trade your position on Kuru's secondary market, all onchain.",
        tip: "",
      },
      {
        kicker: "03",
        title: "Lending and stake",
        cta: "Stake or borrow",
        lead: "Stake your stocks or get loans collateralized by your production.",
        body: "Earn yield by staking your Merval stocks or any other tokenized production assets.",
        tip: "",
      },
    ],
  },
  issuer: {
    kicker: "For companies",
    title: "Tokenize your production or your company's shares and raise capital",
    body: "Listing on Merval or BYMA demands costs and a scale most companies cannot reach: our structure takes your company to market without that barrier, under the same CNV regulatory framework. We walk you from the primary auction to the secondary-market listing.",
    steps: [
      ["Structure the issuance", "You define the asset, the price per shard and the auction's minimum and maximum caps."],
      ["Primary auction", "You open your auction and verified investors contribute USDC until it closes."],
      ["Secondary market", "If the minimum is reached, shards trade on Kuru's order book."],
    ],
    cta: "Issue a lot",
  },
  regulation: {
    kicker: "Legal framework",
    title: "CNV framework. Global investment. Designed for the sandbox.",
    body: "The design follows the CNV sandbox (RG 1150 / Law 26.831): each token is meant 1:1 with a real asset at Caja de Valores, with warrants under Law 9643 and forwards under the Civil Code. That authorization has not been granted. An investor in Madrid, Miami or São Paulo would use the same framework as an account holder in Buenos Aires.",
    cnv: "National Securities Commission",
    cnvSub: "Designed for the RG 1150/2026 sandbox · Law 26.831",
    caja: "Caja de Valores S.A.",
    cajaSub: "1:1 custody (design goal)",
    cards: [
      ["Regulatory design", "VASP, AML/CFT and onchain KYC. The framework is the CNV one; authorization has not been granted."],
      ["Any investor in the world", "Onchain settlement on Monad. The rail is global; the security stays Argentine and custodied."],
      ["Three products, one file", "Consumption, auctioned forwards and lending against inventory. Same custody, same regulator."],
    ],
  },
  merval: {
    kicker: "Equities and debt",
    title: "Tokenized stocks and bonds",
    lead: "tYPF, tGGAL and the rest of the leading panel: designed as 1 token = 1 custodied share (a mockup today). Sovereign debt and notes are on the roadmap.",
    ctaStocks: "See Merval stocks",
    ctaBonds: "Lots and auctions",
    stake: "You can also stake your shares and earn yield on staked positions, on top of any dividends from your Argentine stocks or debt securities.",
  },
  partners: {
    kicker: "Building blocks",
    title: "Integrations and references",
    lead: "Monad, Kuru, Privy and Envio are integrated today. BYMA, Caja de Valores and Matba Rofex are the Argentine market infrastructure we use as a reference: we have no agreements with them.",
    items: [
      { name: "BYMA", slug: "byma", role: "Bolsas y Mercados Argentinos", badge: "Reference", description: "Exchange infrastructure and market standards the design takes as a reference." },
      { name: "Caja de Valores", slug: "caja-de-valores", role: "Central Securities Depository", badge: "Reference", description: "Central securities depository the design targets for custody of tokenized assets. No agreement in place." },
      { name: "Matba Rofex", slug: "matba-rofex", role: "Agricultural futures market", badge: "Reference", description: "Public grain futures quotes (soy, corn, wheat) as a reference price." },
      { name: "Monad", role: "EVM blockchain", badge: "L1 infrastructure", description: "High-performance EVM-compatible blockchain where auctions, shards and redemption live." },
      { name: "Kuru", role: "Onchain order book", badge: "Secondary market", description: "CLOB and liquidity vault on Monad to buy and sell shards after the auction." },
      { name: "Privy", role: "Embedded wallet", badge: "Onboarding", description: "Sign in with email or Google and get a wallet instantly, with sponsored gas." },
      { name: "Envio HyperSync", role: "Data indexing", badge: "History", description: "Fast reads of onchain history to show your full activity." },
    ],
  },
  network: {
    kicker: "The network",
    title: "Why Monad?",
    body: "A fast, low-cost, EVM-compatible blockchain. With onchain KYC, any investor anywhere in the world can invest.",
    items: [
      ["EVM compatible", "Solidity contracts and standard Ethereum tooling."],
      ["Fast and cheap", "Confirmations in seconds and minimal fees per operation."],
      ["No gas for you", "The platform sponsors the gas of every operation."],
      ["KYC only", "With onchain verification you can invest right away."],
      ["Your wallet, your keys", "Embedded wallet with email; export the key whenever you want."],
    ],
  },
  liquidity: {
    kicker: "Liquidity first",
    title: "Tokenizing without a secondary market does not work.",
    body: "Every successful lot moves to an order book with liquidity on Kuru. You get in and out when you need to.",
    cards: [
      ["Burst loans", "Get instant loans collateralized by your production (wine, cheese, tobacco, corn) with Law 9643 warrants: liquidity in seconds without selling it."],
      ["CLOB 24/7", "Onchain order book trading 24 hours a day, with a liquidity vault."],
      ["Harvest redemption", "Once the harvest settles, each holder redeems shards for USDC directly in the contract."],
    ],
    market: "Secondary market",
    burst: "Burst loan",
  },
  soon: "Coming soon",
  soonItems: [
    ["Sovereign bonds", "Bopreal / AL30 with onchain coupon."],
    ["Sector ETFs", "Agri, energy and banks."],
    ["Agro carbon", "Verified no-till."],
    ["Mastercard card", "Pay with Mastercard, spending from your stocks."],
    ["DeFi products", "The best of the DeFi world meets traditional markets."],
  ],
  badges: [
    ["Designed for", "CNV sandbox"],
    ["Kuru", "Onchain order book"],
    ["Monad", "Testnet"],
    ["KYC", "Onchain"],
  ],
  footer: {
    blurb: "Argentine RWA and tokenized Merval on",
    markets: "Markets",
    platform: "Platform",
    activity: "My activity",
    notice: "Notice",
    legal: "Designed for the CNV tokenization sandbox (RG 1150/2026); no authorization has been obtained. Merval, forwards and warrants are mockups, with no agreements with BYMA or Caja de Valores. Forwards and warrants: Civil Code Art. 1131 and Law 9643.",
  },
  nav: { market: "Auctions", stocks: "Merval", forwards: "Forwards", warrants: "Warrants" },
  mock: {
    title: "Mockup: not onchain",
    body: "{product} is a product simulator. The live flow is the",
    listing: "lots",
    tail: ": auction, Kuru secondary market and redemption on Monad testnet.",
  },
  pages: {
    stocksTitle: "Tokenized Merval stocks",
    forwardsTitle: "Production forwards",
    warrantsTitle: "Warrants and burst loans",
  },
};

const copies: Record<Locale, LandingCopy> = { es, en };

export function useLanding() {
  const { locale } = useI18n();
  return copies[locale];
}

export const MERVAL_NAMES = [
  { ticker: "YPFD", name: "YPF" },
  { ticker: "GGAL", name: "Galicia" },
  { ticker: "PAMP", name: "Pampa Energía" },
  { ticker: "BMA", name: "Banco Macro" },
  { ticker: "TECO2", name: "Telecom" },
  { ticker: "TXAR", name: "Ternium" },
  { ticker: "VIST", name: "Vista Energy" },
  { ticker: "TGSU2", name: "TGS" },
  { ticker: "CEPU", name: "Central Puerto" },
  { ticker: "ALUA", name: "Aluar" },
  { ticker: "CRES", name: "Cresud" },
  { ticker: "BYMA", name: "BYMA" },
] as const;
