# FractaChain: frontend

Next.js + wagmi + viem sobre Monad testnet (chain ID 10143), con login de Privy.

## Cómo levantarlo

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` a `.env.local` y completar `NEXT_PUBLIC_PRIVY_APP_ID` con el App ID de Privy (dashboard.privy.io > la app > Settings > Basics). `.env.local` no se sube al repo.

3. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Abrir http://localhost:3000.

## Desarrollo local completo (sin Privy ni testnet)

Sirve para probar todo el flujo en tu máquina, con una cadena local (anvil) y un USDC de prueba. Requiere [Foundry](https://book.getfoundry.sh/getting-started/installation).

1. En una terminal, levantar la cadena local:

   ```bash
   anvil
   ```

2. En otra terminal, desplegar los contratos. Esto escribe `frontend/.env.development.local` con las direcciones (no se sube a git):

   ```bash
   cd contracts
   forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
   ```

3. Levantar el frontend (no hace falta el App ID de Privy en este modo):

   ```bash
   cd frontend
   npm run dev
   ```

En modo dev, el selector de la barra superior cambia entre cuentas de anvil: el emisor, un inversor verificado y dos sin verificar. El botón "Dev" (abajo a la derecha) carga USDC de prueba y avanza el tiempo de la cadena para poder cerrar licitaciones.

Si cambian los contratos, regenerar los ABIs del frontend con `npm run sync-abi` (después de `forge inspect ... > contracts/abi/...`, ver `contracts/CONTRATOS.md`).

## Mercado secundario (Kuru)

En la página de un lote exitoso, el panel "Mercado secundario" busca el mercado de Kuru del shard y muestra bid, ask, comisiones, vault y links al explorer. La app web de Kuru solo muestra mainnet, así que el mercado de testnet se consulta onchain.

- **Registro de mercados:** `src/lib/kuru.ts` (`KURU_MARKETS`, token en minúsculas a dirección del mercado). Los mercados abiertos desde la UI se guardan además en `localStorage` de ese navegador; para que los vea todo el mundo, agregarlos al registro.
- **Abrir mercado:** si estás conectado con la wallet del emisor y el lote todavía no tiene mercado, el panel muestra "Abrir mercado". Crea el mercado en el Router de Kuru (`deployProxy`) y siembra el vault (2 aprobaciones y un depósito). El primer depósito fija el precio del vault. Necesita MON para el gas y shards y USDC en la wallet del emisor.
- **Comprar y vender:** con el mercado abierto, el panel permite operar con órdenes de mercado (IOC) contra el order book de Kuru. Estima el resultado antes de firmar, aplica una tolerancia de slippage (0,5 / 1 / 3 %) como `minAmountOut` y pide la aprobación del token solo si no alcanza la actual. Los montos de compra usan las unidades de `pricePrecision` y los de venta las de `sizePrecision` del mercado (`lib/kuru.ts`).
- **Precisiones:** las calcula `/api/kuru/precisions` en el servidor con `@kuru-labs/kuru-sdk` (no entra al bundle del navegador).

## Variables de entorno

| Variable | Qué es |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | App ID de Privy (solo fuera del modo dev). |
| `NEXT_PUBLIC_NETWORK` | `local` para anvil. Sin definir, usa Monad testnet. |
| `NEXT_PUBLIC_DEV_MODE` | `true` para saltear Privy y usar cuentas de anvil. |
| `NEXT_PUBLIC_RPC_URL` | RPC a usar (por defecto el de la cadena elegida). |
| `NEXT_PUBLIC_FACTORY`, `NEXT_PUBLIC_KYC`, `NEXT_PUBLIC_USDC` | Direcciones de los contratos. |
