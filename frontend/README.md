# FractaChain: frontend

Next.js + wagmi + viem on Monad testnet (chain ID 10143), with Privy login.

## Running it

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_PRIVY_APP_ID` to your Privy App ID (dashboard.privy.io > your app > Settings > Basics). `.env.local` is not committed to the repo.

3. Start the development server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Full local development (no Privy, no testnet)

Lets you test the whole flow on your machine, with a local chain (anvil) and a test USDC. Requires [Foundry](https://book.getfoundry.sh/getting-started/installation).

1. In one terminal, start the local chain:

   ```bash
   anvil
   ```

2. In another terminal, deploy the contracts. This writes `frontend/.env.development.local` with the addresses (not committed to git):

   ```bash
   cd contracts
   forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
   ```

3. Start the frontend (no Privy App ID needed in this mode):

   ```bash
   cd frontend
   npm run dev
   ```

In dev mode, the picker in the top bar switches between anvil accounts: the issuer, a verified investor and two unverified ones. The "Dev" button (bottom right) loads test USDC and advances chain time so auctions can be closed.

If the contracts change, regenerate the frontend ABIs with `npm run sync-abi` (after `forge inspect ... > contracts/abi/...`, see [`contracts/CONTRACTS.md`](../contracts/CONTRACTS.md)).

## Secondary market (Kuru)

On the page of a successful lot, the "Secondary market" panel looks up the shard's Kuru market and shows bid, ask, fees, vault and explorer links. Kuru's web app only shows mainnet, so the testnet market is read onchain.

- **Market registry:** `src/lib/kuru.ts` (`KURU_MARKETS`, lowercase token to market address). Markets opened from the UI are also saved in that browser's `localStorage`; for everyone to see them, add them to the registry.
- **Open market:** if you are connected with the issuer's wallet and the lot has no market yet, the panel shows "Open market". It creates the market on Kuru's Router (`deployProxy`) and seeds the vault (2 approvals and a deposit). The first deposit sets the vault price. It needs MON for gas and shards and USDC in the issuer's wallet.
- **Buy and sell:** with the market open, the panel lets you trade with market orders (IOC) against Kuru's order book. It quotes the result before signing, applies a slippage tolerance (0.5 / 1 / 3%) as `minAmountOut` and asks for a token approval only if the current one is not enough. Buy amounts use the market's `pricePrecision` units and sell amounts its `sizePrecision` units (`lib/kuru.ts`).
- **Precisions:** computed server-side by `/api/kuru/precisions` with `@kuru-labs/kuru-sdk` (it stays out of the browser bundle).

## Deploy on Railway (Docker)

The frontend has a `Dockerfile` that builds Next.js in `standalone` mode and serves it with `node server.js`.

1. In Railway: **New Project > Deploy from GitHub repo** and pick this repo.
2. In the service, **Settings > Root Directory** = `frontend`. Railway detects the `Dockerfile` on its own.
3. In **Variables**, set the same ones as `.env.local`: `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_FACTORY`, `NEXT_PUBLIC_KYC`, `NEXT_PUBLIC_USDC`, `NEXT_PUBLIC_REDEMPTION` and, if used, `NEXT_PUBLIC_RPC_URL`. Do **not** set `NEXT_PUBLIC_DEV_MODE` or `NEXT_PUBLIC_NETWORK`. For "My activity", also add `ENVIO_API_TOKEN` (read at runtime, no rebuild needed).
4. **Settings > Networking > Generate Domain** to get the public URL.
5. In the Privy dashboard, add that URL (`https://<app>.up.railway.app`) under **Allowed origins**; otherwise login fails.

`NEXT_PUBLIC_*` variables are embedded in the bundle at build time: if you change one, Railway rebuilds and redeploys. Anything starting with `NEXT_PUBLIC_` is visible in the browser, including the RPC; with a private RPC, restrict it by domain at the provider, or use the public one (`https://testnet-rpc.monad.xyz`).

## My activity (onchain history)

The `/actividad` page (also reachable from the account menu) lists all of the user's operations: buys and sells on Kuru, contributions, claims, refunds, liquidity, harvest redemptions and test USDC. The `/api/activity` route looks up the user's ERC-20 `Transfer` events for USDC and shards in Envio's HyperSync, groups them by transaction and classifies them by amounts and counterparty. It is read from the chain: there is no database and it works from any device.

The RPC is not used directly because `eth_getLogs` is limited to 100 blocks on the public RPC (5 on free QuickNode) and Kuru's `Trade` event has no indexed fields.

## Environment variables

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy App ID (only outside dev mode). |
| `NEXT_PUBLIC_NETWORK` | `local` for anvil. If unset, uses Monad testnet. |
| `NEXT_PUBLIC_DEV_MODE` | `true` to skip Privy and use anvil accounts. |
| `NEXT_PUBLIC_RPC_URL` | RPC to use (defaults to the selected chain's). |
| `NEXT_PUBLIC_FACTORY`, `NEXT_PUBLIC_KYC`, `NEXT_PUBLIC_USDC` | Contract addresses. |
| `ENVIO_API_TOKEN` | Server only (no `NEXT_PUBLIC_`). Free HyperSync token ([app.envio.dev/api-tokens](https://envio.dev/app/api-tokens)) for the "My activity" page. Without it, `/api/activity` replies that it is not configured. |
| `ACTIVITY_FROM_BLOCK` | Optional. Block from which activity is searched (defaults to 68,700,000, before the contracts were deployed). |
| `NEXT_PUBLIC_REDEMPTION` | `HarvestRedemption` address. If unset, the "Harvest settlement" panel is hidden. |
| `NEXT_PUBLIC_USDC_MINTABLE` | `false` if the configured USDC has no open `mint`. By default the "Load 1,000 test USDC" button is shown to anyone with a 0 balance. |
