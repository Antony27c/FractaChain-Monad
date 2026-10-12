# Script to open the Kuru market

`open-market.ts` runs when the auction ends. With Kuru's SDK (`@kuru-labs/kuru-sdk`) it:
1. Computes the market precisions from the price.
2. Creates the shard/USDC market with Kuru's Router.
3. Seeds the vault with shards and USDC at the given price.

> The first deposit sets the vault price and is not corrected later. Check the values with `--dry-run` before sending.

## Usage
```bash
cd scripts/kuru
npm install
```

### Offering mode (recommended)

Reads the token, payment token and price directly from the `Offering` contract, and requires the auction to have ended successfully (`status = Succeeded`). This is the mode used by the frontend's "Open market" button:

```bash
PRIVATE_KEY=0x... npm run open-market -- --offering <Offering address> --seed 500000
```

### Manual mode

```bash
PRIVATE_KEY=0x... BASE_TOKEN=<ShardToken address> SEED_BASE=500000 npm run open-market
```

### Simulation

`--dry-run` shows precisions, amounts and balances, and sends nothing (it still returns the JSON):

```bash
PRIVATE_KEY=0x... npm run open-market -- --offering <addr> --seed 500000 --dry-run
```

### JSON output

The last block of stdout is always a JSON with the result (`market`, `vault`, `seedTx`, `base`, `quote`, `price`, `seedBase`, `seedQuote`, `dryRun`). With `--json` the logs go to stderr and stdout holds only the JSON, ready for another process to parse:

```bash
PRIVATE_KEY=0x... npm run open-market -- --offering <addr> --seed 500000 --json | jq .market
```

## Arguments and variables

| Flag | Equivalent variable | What it is |
|---|---|---|
| `--offering <addr>` | `OFFERING` | `Offering` address. Resolves `BASE_TOKEN`, `QUOTE_TOKEN` and `PRICE` onchain. |
| `--seed <n>` | `SEED_BASE` | (required) Number of shards to put in the vault. The USDC is that amount times the price. |
| `--dry-run` | `DRY_RUN=true` | Simulates without sending transactions. |
| `--json` | — | Logs to stderr; stdout only the final JSON. |
| — | `PRIVATE_KEY` | (required) Wallet that opens the market. Use a test one. |
| — | `BASE_TOKEN` | `ShardToken` address (manual mode only). |
| — | `PRICE` | `0.1`. Price in USDC per shard (manual mode only). |
| — | `QUOTE_TOKEN` | Kuru's testnet USDC. Quote currency (manual mode only). |
| — | `RPC_URL` | `https://testnet-rpc.monad.xyz`. |
| — | `KURU_ROUTER` | Kuru's Router on testnet. |
| — | `MAX_PRICE` / `MIN_SIZE` / `TICK_BPS` | `10` / `1` / `100`. `calculatePrecisions` parameters. |
| — | `TAKER_FEE_BPS` / `MAKER_FEE_BPS` / `AMM_SPREAD` | `30` / `10` / `100`. Fees and vault spread. |

## How it was tested
On a local fork of Monad testnet (`anvil --fork-url https://testnet-rpc.monad.xyz --fork-chain-id 10143 --fork-block-number <block>`) with test tokens: the market was created, the vault held 500,000 shards and 50,000 USDC, and the book showed bid ≈ 0.099 and ask 0.100. The `--offering` mode was tested with the full flow: contribute → finalize → claim → open-market. It was later run on the real testnet with our mUSDC (see [`PROJECT_LOG.md`](../../PROJECT_LOG.md), section 6); it has not been tested with Kuru's USDC.

`--dry-run` also runs on a plain local anvil with no fork (deployed with `DeployLocal.s.sol`): it resolves the token, payment token and price from the `Offering` and checks balances, but the real market deploy needs the fork because Kuru's Router does not exist on plain anvil. In manual mode on anvil, pass `QUOTE_TOKEN` with the mock USDC address.
