# FractaChain contracts

Solidity + Foundry, for Monad testnet (chain ID 10143). Function reference: [`CONTRACTS.md`](CONTRACTS.md).

## Requirements
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

## Usage
```bash
git submodule update --init --recursive
forge build
forge test
```

To also run the test against Kuru on Monad testnet (fork):
```bash
forge test --fork-url https://testnet-rpc.monad.xyz
```

## Local deploy (anvil)

`DeployLocal.s.sol` deploys a mock USDC `TestToken` (6 decimals, open mint) with 1,000,000 USDC for the deployer and for the three anvil accounts offered by the frontend's dev picker, plus `KycRegistry`, `IssuanceFactory` and the sample soy lot. It leaves the issuer and investor A verified. It uses anvil's default key; `PRIVATE_KEY` can override it.

```bash
anvil --port 8545
forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

It also works on a fork (`anvil --fork-url https://testnet-rpc.monad.xyz --fork-chain-id 10143 --fork-block-number <block>`), which is what lets you test `scripts/kuru/open-market.ts` against the real code of Kuru's Router.

The script writes `frontend/.env.development.local` on its own (ignored by git) with `NEXT_PUBLIC_NETWORK`, `NEXT_PUBLIC_DEV_MODE`, `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_KYC`, `NEXT_PUBLIC_FACTORY` and `NEXT_PUBLIC_USDC`, so there is no need to copy addresses by hand. To skip writing it, set `WRITE_FRONTEND_ENV=false`.

## Deploy to Monad testnet
Deploys `KycRegistry`, `IssuanceFactory` and a sample soy lot (1,000,000 shards at 0.10 USDC, soft cap 40,000 USDC, hard cap 100,000 USDC, 7 days).

1. Use a **test** wallet with MON from https://faucet.monad.xyz (the deploy costs about 0.75 MON).
2. Set `PRIVATE_KEY` in `contracts/.env` (never committed to git).
3. Simulation, without spending anything:
```bash
forge script script/Deploy.s.sol --fork-url https://testnet-rpc.monad.xyz
```
4. Real deploy:
```bash
forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast
```

Optional variables: `PAYMENT_TOKEN` (Kuru's USDC by default), `OPEN_VERIFICATION` (`true` by default, lets anyone verify themselves with `verifyMyself()`) and `CREATE_SAMPLE` (`true` by default).

Copy `.env.example` to `.env` and set `MONAD_TESTNET_RPC_URL` to deploy.

## Deploying the harvest settlement

`HarvestRedemption` is deployed separately and serves every lot (including those already issued). It uses the demo's mUSDC by default; `PAYMENT_TOKEN` changes it.

```bash
forge script script/DeployRedemption.s.sol --fork-url https://testnet-rpc.monad.xyz            # simulation
forge script script/DeployRedemption.s.sol --rpc-url https://testnet-rpc.monad.xyz --broadcast # real deploy
```

Then set the address in the frontend's `NEXT_PUBLIC_REDEMPTION`.
