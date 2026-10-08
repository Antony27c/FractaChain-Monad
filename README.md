# FractaChain

Onchain market for Argentine real-world assets (RWA) on **Monad**. Producers fractionate an asset (a harvest, certified stock) into tradable tokens called **shards**, raise funds in a primary offering, and the shards then trade on **Kuru**'s fully onchain order book. There is no offchain matching engine.

Built for the [Monad Metropolis](https://monad.xyz/developers/hackathons/metropolis) hackathon, track **Onchain Finance & Trading**.

> Status: work in progress. Contracts and the Kuru integration script are deployed and exercised end to end on Monad testnet (with a mock USDC, see below). The frontend is in progress.

## Deployed on Monad testnet (chain ID 10143)

Full flow run onchain: offering filled to the hard cap, finalized, shards claimed, then a Kuru market was created and its vault seeded.

| Contract | Address |
|---|---|
| `KycRegistry` | `0xe42FF6D4d9ED6603873144D3B1C46B6317d45FC9` |
| `IssuanceFactory` | `0xdbb769E14687DFD90f319A225b5fF8eA423Bb68F` |
| `ShardToken` (SOJA26) | `0x3AbA80ACDc4F35666012e3bdF1c1bca56996630D` |
| `Offering` | `0x1929ada51d21911cA3545C18a08693a483f2C308` |
| Mock USDC (`mUSDC`, 6 decimals) | `0xBf11e27C5C26E11E4B213fBCc5d5EDBb29453d36` |
| Kuru market SOJA26/mUSDC | `0x24B6dB71754086e87eF0d0C0F83C067b58Fb9B7f` |
| Kuru vault | `0xB6BDa4B1Abe3D8d0D82691BC0f3a6f9aa7536010` |
| `HarvestRedemption` (harvest settlement, all lots) | `0xeccA331e9b090463aBf9F2077AbFf2110d668d2c` |

The payment token is a mock USDC we deployed, not Kuru's official testnet USDC (`0x3bA3d39AFcf8bb994f7964B3e0171Ea2Ba361570`). Kuru's web app only exposes mainnet, so we could not get official testnet USDC. The same flow works with the official token by setting `PAYMENT_TOKEN`.

## The problem

Argentine producers and SMEs need liquidity against their harvest, but the traditional route (bank credit, warrants, central depositories) is slow, expensive and has almost no secondary market. Investors have no easy access to yield backed by real assets.

## How it works

1. **Issue.** A verified issuer creates a lot through `IssuanceFactory`. It deploys a `ShardToken` (fixed supply, asset metadata) and an `Offering` that holds the whole supply.
2. **Raise.** KYC-verified investors contribute USDC at a fixed price. The offering has a soft cap, a hard cap and a deadline.
3. **Settle.** After the deadline (or once the hard cap is hit), anyone calls `finalize()`.
   - Soft cap reached: the USDC goes to the issuer and each investor calls `claim()` to receive their shards.
   - Soft cap missed: each investor calls `refund()` to get their USDC back.
4. **Trade.** `scripts/kuru/open-market.ts` creates the shard/USDC market on Kuru and seeds its vault, so shards trade on an onchain order book.

KYC applies to the primary offering. The secondary market on Kuru is open: Kuru's contracts hold the tokens, so a token-level allowlist would not identify end users.

## Repository layout

| Path | What it is |
|---|---|
| `contracts/` | Solidity + Foundry: `KycRegistry`, `ShardToken`, `Offering`, `IssuanceFactory`, deploy scripts (`Deploy`, `DeployLocal`, `DeployMockUsdc`) and tests |
| `contracts/CONTRATOS.md` | Contract guide for the frontend (functions, states, errors) |
| `contracts/abi/` | ABIs for the frontend |
| `scripts/kuru/` | TypeScript script that opens the Kuru market and seeds its vault |
| `PROYECTO.md` | Project documentation (in Spanish): decisions, plan, open questions |

## Quick start

Requirements: [Foundry](https://book.getfoundry.sh/getting-started/installation), Node.js.

```bash
git clone --recurse-submodules <repo-url>
cd <repo>/contracts
forge test
```

Run the test that opens a market on Kuru against a fork of Monad testnet:

```bash
forge test --fork-url https://testnet-rpc.monad.xyz
```

Deploy to Monad testnet (use a throwaway wallet funded from the faucet), see [`contracts/README.md`](contracts/README.md). Open the Kuru market, see [`scripts/kuru/README.md`](scripts/kuru/README.md).

## What has been tested

- 95 Foundry tests pass (unit, fuzz and invariant): KYC registry, token, offering (contribute, finalize, claim, refund, caps, deadline, revoked KYC), factory, harvest redemption and full flows end to end.
- Kuru: a fork test shows that any account can deploy a market for a custom token against Kuru's testnet USDC.
- The market script was run on a local fork of Monad testnet with test tokens: the market was created, the vault was seeded and the book quoted around the target price.
- On Monad testnet, for real: deploy of all contracts, `contribute` to the hard cap, `finalize`, `claim`, then `scripts/kuru/open-market.ts --offering` created the SOJA26/mUSDC market through Kuru's Router (`deployProxy`) and seeded the vault with 500,000 SOJA26 and 50,000 mUSDC.

- All five deployed contracts are source-verified on Sourcify (`exact_match`, via BlockVision's Sourcify instance).

Not done yet: a run with Kuru's official testnet USDC and an external security review. The contracts have only been reviewed by the team.

## Roadmap

- Harvest settlement and share redemption.
- Harvest forwards with escrow.
- Tokenized stocks with proof of reserve.
- Credit against shards, priced on onchain history.
- A permissioned wrapper to extend KYC to the secondary market.

## Origin

FractaChain was first prototyped by our team on another ecosystem, where it won 1st place in the Genesis track of the Argentina Builder Challenge (BAF x Stellar). For Monad Metropolis we rebuilt it from scratch: all contracts, scripts and frontend in this repo were written during the hackathon. No Soroban code was reused, only the idea and the design. Original repo: [Erosmart/fractachain](https://github.com/Erosmart/fractachain).
