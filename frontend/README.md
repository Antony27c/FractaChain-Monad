# ShardChain: frontend

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

## Variables de entorno

| Variable | Qué es |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | App ID de Privy (solo fuera del modo dev). |
| `NEXT_PUBLIC_NETWORK` | `local` para anvil. Sin definir, usa Monad testnet. |
| `NEXT_PUBLIC_DEV_MODE` | `true` para saltear Privy y usar cuentas de anvil. |
| `NEXT_PUBLIC_RPC_URL` | RPC a usar (por defecto el de la cadena elegida). |
| `NEXT_PUBLIC_FACTORY`, `NEXT_PUBLIC_KYC`, `NEXT_PUBLIC_USDC` | Direcciones de los contratos. |
