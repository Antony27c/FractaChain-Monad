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
