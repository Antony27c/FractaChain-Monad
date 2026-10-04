# ShardChain

Onchain market for Argentine real-world assets (RWA) on **Monad**. Producers fractionate an asset (a harvest, certified stock) into tradable tokens called **shards**, raise funds in a primary offering, and the shards then trade on **Kuru**'s fully onchain order book. There is no offchain matching engine.

Built for the [Monad Metropolis](https://monad.xyz/developers/hackathons/metropolis) hackathon, track **Onchain Finance & Trading**.

> Status: work in progress. Contracts and the Kuru integration script are written and tested locally. The frontend is in progress. Nothing is deployed to Monad testnet yet.

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
| `contracts/` | Solidity + Foundry: `KycRegistry`, `ShardToken`, `Offering`, `IssuanceFactory`, deploy script and tests |
| `contracts/CONTRATOS.md` | Contract guide for the frontend (functions, states, errors) |
| `contracts/abi/` | ABIs for the frontend |
| `scripts/kuru/` | TypeScript script that opens the Kuru market and seeds its vault |
| `PROYECTO.md` | Project documentation (in Spanish): decisions, plan, open questions |

## Quick start

Requirements: [Foundry](https://book.getfoundry.sh/getting-started/installation), Node.js.

```bash
git clone --recurse-submodules https://github.com/Antony27c/ShardChain.git
cd ShardChain/contracts
forge test
```

Run the test that opens a market on Kuru against a fork of Monad testnet:

```bash
forge test --fork-url https://testnet-rpc.monad.xyz
```

Deploy to Monad testnet (use a throwaway wallet funded from the faucet), see [`contracts/README.md`](contracts/README.md). Open the Kuru market, see [`scripts/kuru/README.md`](scripts/kuru/README.md).

## What has been tested

- 57 Foundry tests pass: KYC registry, token, offering (contribute, finalize, claim, refund, caps, deadline, revoked KYC), factory and full flows end to end.
- Kuru: a fork test shows that any account can deploy a market for a custom token against Kuru's testnet USDC.
- The market script was run on a local fork of Monad testnet with test tokens: the market was created, the vault was seeded and the book quoted around the target price.

Not done yet: a real deployment on Monad testnet, a run with Kuru's official testnet USDC, and an external security review. The contracts have only been reviewed by the team.

## Roadmap

- Harvest settlement and share redemption.
- Harvest forwards with escrow.
- Tokenized stocks with proof of reserve.
- Credit against shards, priced on onchain history.
- A permissioned wrapper to extend KYC to the secondary market.

## Credits

Inspired by [Fractachain](https://github.com/Erosmart/fractachain) (Stellar). ShardChain is a new repository with all of its code written during the hackathon.
