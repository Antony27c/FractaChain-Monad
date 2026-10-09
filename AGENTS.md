# AGENTS.md

FractaChain: mercado onchain de activos reales argentinos sobre Monad testnet (chain 10143). Licitación primaria, mercado secundario en Kuru, redención de cosecha, wallet embebida de Privy con gas patrocinado. En vivo: https://fractachain-monad.up.railway.app

Este archivo es para agentes que modifican el **frontend** (`frontend/`). La meta: cambiar lo que haga falta sin romper el **golden path**. Cada archivo tiene un **alcance**:

| Alcance | Significa |
|---|---|
| **Libre** | Cambialo con confianza: no toca datos ni transacciones. |
| **Cuidado** | Cambialo si la tarea lo pide, respetando la columna "Respetá". Recorré el golden path después. |
| **Núcleo** | Sostiene el golden path. Un cambio por commit, con una razón concreta, y golden path completo después. |
| **Cerrado** | Se genera o pertenece a otro sistema. Se cambia por su vía, nunca a mano. |

## Dónde está cada verdad

| Necesitás | Leé |
|---|---|
| Direcciones desplegadas, qué se probó | `README.md` |
| Funciones, estados y errores de los contratos | `contracts/CONTRATOS.md` |
| Decisiones, estado y pendientes | `PROYECTO.md` |
| Variables de entorno, Railway, historial onchain | `frontend/README.md` |

## Golden path

Lo que hoy funciona. Recorrelo en `localhost:3000` (Edge o Chrome) antes de dar una tarea por terminada:

1. Entrar con email: aparece la wallet en el encabezado, con 0 MON.
2. "Verificarme (demo)" en un lote.
3. "Cargar 1.000 USDC de prueba" (aparece con saldo 0).
4. Aportar a una licitación abierta (si no hay, crear un lote en "Emitir lote" con mínimo 100 y máximo 250 USDC), finalizar, reclamar shards.
5. Lote exitoso: bid/ask en "Mercado secundario", Comprar, Vender, Agregar y Retirar liquidez.
6. Como emisor: Liquidar cosecha. Como tenedor: Canjear.
7. Menú de cuenta (tocar la dirección) y `/actividad` muestran todo lo anterior.

Cada paso ocurre sin MON: el gas lo paga Privy.

## Mapa del frontend

### Páginas (`src/app/`)

| Archivo | Rol | Alcance | Respetá |
|---|---|---|---|
| `page.tsx` (home) | Hero, métricas y lista de lotes (`useLots`). | Libre en layout y estilo | El orden `lots.reverse()` (más nuevo primero) viene del hook. Las métricas dependen de `contractsConfigured`. |
| `create/page.tsx` | Formulario "Emitir lote" → `IssuanceFactory.createIssuance`. | Cuidado | Las validaciones espejan al contrato: el supply cubre el hard cap, mínimo ≤ máximo, precio > 0. Precio y topes en 6 decimales, supply en 18, duración = días × 86400. |
| `lots/[offering]/page.tsx` | Detalle del lote: participación, aporte, finalizar, reclamar, reembolso; monta `SecondaryMarket` y `HarvestRedemptionPanel` si el lote está exitoso. | Cuidado | Los paneles salen según `lot.status` (`active`, `ready`, `succeeded`, `failed`). Aportar hace `approve` solo si `allowance < monto`, luego `contribute`. |
| `actividad/page.tsx` | Tabla "Mi actividad" desde `/api/activity`. | Libre en estilo | El shape `Activity` (`lib/activity.ts`) es el contrato con la ruta. |
| `api/activity/route.ts` | Lee `Transfer` ERC-20 del usuario en HyperSync y los clasifica por transacción. | Cuidado | Corre en servidor con `ENVIO_API_TOKEN`. La clasificación mira signo de USDC/shards y contraparte. Un contrato nuevo del flujo pide una regla nueva. |
| `orderbook/page.tsx` | Orderbook: selector de pares de lotes exitosos, libro L2 de Kuru (`/api/kuru/book`, cada 10 s) y `TradePanel`. Tocar un nivel precarga el monto (`preset`). | Cuidado | Un par sin mercado lleva a la página del lote. |
| `api/kuru/precisions/route.ts`, `api/kuru/book/route.ts` | Precisiones de mercado y libro L2 con el SDK de Kuru. | Cuidado | Son los únicos lugares donde entra `@kuru-labs/kuru-sdk`. El libro lee con viem y el SDK solo decodifica: el cliente HTTP de ethers falla dentro del bundle de Next. |
| `layout.tsx` | Fuentes, metadatos y orden de providers: `ThemeProvider` > `I18nProvider` > `Providers` > `CrystalBackdrop`, `Header`, `main`, `DevTools`. | Cuidado | Conservá ese orden. El script inline de `sc_theme` evita el parpadeo de tema. |
| `providers.tsx` | Elige modo dev (anvil) o Privy; arma wagmi y react-query. | Núcleo | En Privy: `PrivyProvider` (email, google, wallet; wallet embebida automática) > `QueryClientProvider` > `WagmiProvider`. |
| `globals.css` | Tema Tailwind 4, variables, `btn-lcd*`, `crystal-card`, `glass-panel`, `hero-lcd`, animaciones `reveal`/`skeleton`. | Libre | Cada color nuevo se define en claro y en `html.dark`. `--surface` y `crystal-card` son translúcidos: un menú flotante usa `bg-bg`. |

### Componentes (`src/components/`)

| Archivo | Rol | Alcance | Respetá |
|---|---|---|---|
| `Header`, `ThemeToggle` (`LangToggle`), `CrystalBackdrop` | Navegación (Licitaciones `/market`, Orderbook `/orderbook`, Tokenizar `/create`), tema/idioma, fondo. | Libre | `Header` elige `DevAccountPicker` (dev) o `LoginButton`. |
| `LotCard`, `ProgressBar`, `StatusBadge` | Presentación de un lote. | Libre | Reciben el `Lot` de `useLots`; mantené sus props. |
| `LoginButton`, `AccountMenu` | Login, dirección, saldos, exportar wallet, vincular cuenta, link a `/actividad`. | Cuidado | Con sesión pero sin dirección muestra "Preparando tu wallet...". Los hooks de Privy viven solo bajo `PrivyProvider`. |
| `TestFundsButton` | `mint` de USDC de prueba si el saldo es 0. | Cuidado | Se oculta con `NEXT_PUBLIC_USDC_MINTABLE=false`. |
| `SecondaryMarket` | Estados del mercado: sin abrir, abierto (bid/ask, comisiones, links). Monta `OpenMarketForm`, `TradePanel`, `AddLiquidityForm`. | Cuidado | Solo el emisor ve `OpenMarketForm`. |
| `OpenMarketForm` | Crea el mercado (`deployProxy`) y siembra el vault. | Núcleo | Dirección del mercado desde el receipt (`MarketRegistered`). Si falla la siembra, el botón pasa a "Sembrar el vault". |
| `TradePanel` | Orden de mercado Comprar/Vender con estimación y tolerancia. | Núcleo | Unidades de Kuru (ver "Reglas"). `minAmountOut` = estimación con slippage. |
| `AddLiquidityForm` | Depositar y retirar liquidez del vault. | Núcleo | USDC del depósito = `quoteForVaultDeposit`. Retiro por porcentaje de `balanceOf`. |
| `HarvestRedemptionPanel` | Liquidar (emisor) y canjear (tenedor). | Cuidado | Se oculta sin `NEXT_PUBLIC_REDEMPTION`. La liquidación es única por lote. |
| `DevTools`, `DevAccountPicker` | Solo anvil local. | Libre | Inactivos fuera de `isDevMode && isLocal`. |

### Hooks y librerías (`src/hooks/`, `src/lib/`)

| Archivo | Rol | Alcance | Respetá |
|---|---|---|---|
| `hooks/useTx.ts` | **Toda** escritura onchain. Wallet embebida: `sponsor: true`, con reintento sin patrocinio si el patrocinio falla. Modo dev: wagmi. | Núcleo | Elige la implementación por la constante `isDevMode`: mantené ese patrón. API: `run`, `runWithReceipts`, `pending`, `error`, `success`, `sponsored`. |
| `hooks/useLots.ts` | Lotes: `getIssuances` + 9 lecturas por lote; estado derivado (`ready` si pasó el plazo o llegó al tope). | Núcleo | La caché `lastGood` evita parpadeo; el polling es de 12 s. |
| `hooks/useInvestor.ts` | Saldo, allowance, KYC y aporte del usuario (`useInvestor`, `useVerification`). | Cuidado | `useSticky` conserva el último valor bueno. |
| `hooks/useKuruMarket.ts` | Resuelve y valida el mercado de un shard; expone precisiones, vault, bid/ask. | Núcleo | Un mercado es válido solo si `baseAsset` coincide con el token del lote. |
| `lib/env.ts` | Cadenas, direcciones y flags. | Núcleo | `monadTestnet` conserva `contracts.multicall3`: sin él cada lectura es una request y el RPC limita. |
| `lib/wagmi.ts` | Config wagmi, RPC con respaldo público. | Núcleo | `ssr: true` se mantiene. |
| `lib/kuru.ts` | Router, `KURU_MARKETS`, ABIs de Kuru, helpers de unidades. | Núcleo | Los helpers (`truncateDecimals`, `precisionDecimals`, `applySlippage`, `quoteForVaultDeposit`, `minQuoteConsumed`, `quoteForShards`) son la única forma de convertir montos. |
| `lib/abi.ts` | ABIs de los contratos propios. | Cerrado | Se regenera con `npm run sync-abi` tras `forge inspect <Contrato> abi --json > contracts/abi/<Contrato>.json`. |
| `lib/errors.ts` | Error de contrato → mensaje en español. | Libre | Un error nuevo del contrato se agrega aquí con su nombre exacto. |
| `lib/format.ts` | Formato de USDC, shards, precio, fechas (es-AR). | Libre | Usa decimales de `lib/env.ts`. |
| `lib/ui.ts` | Clases `button`, `field`, `panel`, `notice`. | Libre | Reutilizalas en vez de repetir clases. |
| `lib/activity.ts` | Tipos y etiquetas de la actividad. | Cuidado | Un tipo nuevo se suma aquí, en la ruta y en el color de `actividad/page.tsx`. |
| `lib/i18n.tsx`, `lib/theme.tsx` | Idioma (`sc_lang`) y tema (`sc_theme`). | Cuidado | Toda la UI es bilingüe. Strings de un componente: `const t = useT(); t("español", "english")`. Strings compartidos: claves de `useI18n`. Textos de la landing: `lib/landing.ts`. Fuera de React (`lib/errors.ts`): `currentLocale()`. |
| `lib/dev.ts`, `lib/dev-context.tsx` | Cuentas de anvil. | Libre | Solo modo dev. |

### Configuración

| Archivo | Alcance | Respetá |
|---|---|---|
| `next.config.ts` | Núcleo | `output: "standalone"` (lo exige el Dockerfile), `allowedDevOrigins`, alias que silencian paquetes opcionales de Privy. |
| `Dockerfile`, `.dockerignore` | Cuidado | Cada `NEXT_PUBLIC_*` nueva se declara como `ARG` para llegar al build. |
| `package.json` | Cuidado | `viem` va fijo en 2.56.5; `overrides` fija `ox` para `permissionless`. Cambiar versiones de `next`, `wagmi`, `viem` o Privy exige `build` y golden path completos. Una dependencia nueva se elige con versión publicada hace más de 7 días. |
| `.env.local`, `.env*` | Cerrado | Fuera de git. No se leen ni se muestran. |

## Qué se puede hacer, por tipo de tarea

| Tarea | Alcance | Cómo |
|---|---|---|
| Rediseñar estilos, tipografía, espaciados, animaciones | Libre | Tocá `globals.css`, `lib/ui.ts` y clases Tailwind. Definí cada color en claro y en `html.dark`. Probá los dos temas. |
| Cambiar textos y copy | Libre | La UI está en español. Para un string compartido seguí el patrón de `useI18n` con las dos lenguas. |
| Texto nuevo en la UI | Libre | Siempre en los dos idiomas: `useT()` con `t("español", "english")`. Un string sin traducir queda en español al cambiar a inglés. |
| Reordenar o rediseñar páginas y tarjetas | Libre | Mantené las props y los hooks que cada componente consume. |
| Página nueva | Cuidado | Carpeta en `src/app/<ruta>/page.tsx`, con `"use client"` si lee datos. Sumá el link en `Header`. |
| Componente nuevo de solo lectura | Cuidado | Leé con `useReadContracts` (agrupa por Multicall3); usá `ABI` de `lib/abi.ts`. |
| Componente nuevo que escribe en cadena | Cuidado | Mandá todo por `useTx().run`. Mostrá `tx.pending`, `tx.error`, `tx.success` como los paneles existentes. |
| Nuevo mensaje de error | Libre | Una línea en `lib/errors.ts`. |
| Nuevo mercado de Kuru para otro lote | Cuidado | Una línea en `KURU_MARKETS` (token en minúsculas → dirección). |
| Nueva variable de entorno | Cuidado | `NEXT_PUBLIC_*` si el navegador la necesita: declarala en `lib/env.ts`, como `ARG` en el `Dockerfile` y en `frontend/README.md`. Un secreto va sin ese prefijo, solo en rutas de servidor. |
| Nuevo endpoint de servidor | Cuidado | `src/app/api/<nombre>/route.ts`; valida entradas; el secreto se lee de `process.env`. |
| Integrar un contrato nuevo | Cuidado | ABI en `contracts/abi/`, luego `npm run sync-abi`; escritura por `useTx`; mensajes de error en `lib/errors.ts`; regla nueva en `/api/activity` si mueve fondos. |
| Cambiar el flujo de transacciones o el gas patrocinado | Núcleo | Solo con una razón concreta, en `hooks/useTx.ts`, y golden path completo. |
| Cambiar cadena, RPC o Multicall3 | Núcleo | `lib/env.ts` y `lib/wagmi.ts`; verificá que los lotes carguen en segundos. |
| Tocar contratos, direcciones desplegadas o la fábrica | Cerrado | Es otra tarea: cambia ABIs y direcciones, y rompe lotes y mercados existentes. |

## Flujos de datos

**Lectura**: `useLots` pide `getIssuances` al `IssuanceFactory` y, por lote, nombre, símbolo, activo, estado, recaudado, topes, plazo y precio, todo agrupado por Multicall3 y refrescado cada 12 s. `useInvestor` y `useKuruMarket` siguen el mismo patrón. El estado `ready` se deriva en el cliente con la hora del último bloque (`useNow`).

**Escritura**: el componente arma uno o más `TxRequest` (`address`, `abi`, `functionName`, `args`) y llama a `useTx().run`. El hook envía en orden (aprobaciones primero), espera cada receipt, invalida las consultas y publica `success` o un error traducido por `errors.ts`.

**Historial**: `/api/activity` consulta HyperSync porque `eth_getLogs` está limitado a 100 bloques en el RPC público y el evento `Trade` de Kuru no tiene campos indexados.

## Reglas

- **Unidades**: USDC 6 decimales, shards 18. En Kuru, las compras van en unidades de `pricePrecision` del mercado y las ventas en las de `sizePrecision`; `minAmountOut` va en unidades crudas del token que recibís. Todo monto pasa por los helpers de `lib/kuru.ts`.
- **Kuru V1**: el mercado se crea con `Router.deployProxy`. El despliegue V2 (`AccountCore`, `SpotRouter`) tiene otra arquitectura y no se usa.
- **`@kuru-labs/kuru-sdk` es solo de servidor**: en un componente cliente infla el bundle y rompe el build.
- **`NEXT_PUBLIC_*` es público**, también el RPC. Los secretos (`ENVIO_API_TOKEN`) se leen solo en rutas de servidor.
- **Privy**: cada dominio nuevo va en *Allowed origins* del dashboard, incluido `http://localhost:3000`. Brave con Shields bloquea la wallet embebida: probá en Edge o Chrome.
- **Mercado nuevo**: sin `KURU_MARKETS` solo lo ve el navegador del emisor.

## Verificar un cambio

Desde `frontend/`, en este orden:

1. `npx tsc --noEmit`
2. `npx eslint src`
3. `npm run build`: apagá `next dev` antes; los dos comparten `.next` y el servidor de desarrollo queda en 500. Se arregla con `rm -rf .next` y relanzando `npm run dev`.
4. El golden path a mano.

Contratos: `forge test` en `contracts/` (Foundry en `~/.foundry/bin`). En Windows, si `localhost:3000` no responde, buscá el proceso con `netstat -ano | grep :3000` y cerralo antes de relanzar.

## Git y entrega

- Una rama por tarea (`feat/<tema>`) y PR a `main`. Railway despliega desde `main`, a mano.
- Un commit por funcionalidad o implementación, con mensaje corto en inglés y en imperativo (`Add liquidity provision to the Kuru vault`). Los commits no llevan firmas de agente ni `Co-Authored-By`.
- `.env*` queda fuera de git. Las claves (`contracts/.env`, `ENVIO_API_TOKEN`) no se leen, imprimen ni commitean.
- Los contratos desplegados (direcciones en `README.md`) se mantienen: redesplegar uno rompe lotes y mercados existentes.

## Deploy (Railway)

Servicio con *Root Directory* = `frontend` y `frontend/Dockerfile`. Las `NEXT_PUBLIC_*` se incrustan al construir: cambiarlas exige redeploy. `ENVIO_API_TOKEN` se lee al ejecutar. Detalle en `frontend/README.md`.
