# Contract guide for the frontend

The ABIs are in `contracts/abi/*.json` (they can be imported as-is with wagmi/viem). Network: **Monad testnet, chain ID 10143**. Deployed addresses are listed in the root [`README.md`](../README.md).

Conventions:
- USDC has **6 decimals**. Shards have **18 decimals**.
- Price: `pricePerShard` is in USDC units (6 decimals) per whole shard. Example: `100000` = 0.10 USDC per shard.

## Investor flow
1. Get verified: `KycRegistry.verifyMyself()` (only works if `openVerification()` is `true`).
2. Approve USDC: `usdc.approve(offering, amount)`.
3. Contribute: `Offering.contribute(amount)`.
4. When the auction ends, anyone calls `Offering.finalize()`.
5. If it succeeded: `Offering.claim()` delivers the shards. If it failed: `Offering.refund()` returns the USDC.
6. After that, the shards trade on the Kuru market.

## KycRegistry
| Function | Purpose |
|---|---|
| `isVerified(address) view` | Is this address verified? |
| `openVerification() view` | Can anyone verify themselves? |
| `verifyMyself()` | Verifies the caller (only with open verification). |

## IssuanceFactory
| Function | Purpose |
|---|---|
| `getIssuances() view` | List of lots: `{issuer, token, offering}`. One card per lot. |
| `issuancesCount() view`, `issuanceAt(id) view` | The same, one at a time. |
| `createIssuance(params)` | Creates a new lot. Verified issuers only. |
| Event `IssuanceCreated(id, issuer, token, offering, symbol, supply)` | To detect new lots. |

## ShardToken (ERC-20)
| Function | Purpose |
|---|---|
| `name()`, `symbol()`, `decimals()`, `totalSupply()`, `balanceOf(a)` | Standard ERC-20. |
| `asset() view` | Asset metadata: `{assetType, unit, quantity, campaign}`. |
| `issuer() view` | Who issued the lot. |

## Offering
Reads:
| Function | Returns |
|---|---|
| `status()` | `0` Active, `1` Succeeded, `2` Failed. |
| `totalRaised()` | USDC raised (6 decimals). |
| `softCap()`, `hardCap()` | Minimum and maximum to raise. |
| `deadline()` | Deadline (timestamp in seconds). |
| `pricePerShard()` | Price per shard (see conventions). |
| `contributions(address)` | USDC contributed by that address. |
| `shardsFor(amount)` | Shards that a USDC amount would get. |

Writes: `contribute(amount)`, `finalize()`, `claim()`, `refund()`.

When each one is allowed:
| Action | Condition |
|---|---|
| `contribute` | Active status, before the deadline, verified address, without exceeding the hard cap. |
| `finalize` | The deadline has passed, or the hard cap was reached. Anyone can call it. |
| `claim` | Succeeded status and having contributed. |
| `refund` | Failed status and having contributed. |

## Errors it can return
If a transaction fails, the error name says why. To show messages to the user:

| Error | Meaning |
|---|---|
| `NotVerified` | The address is not verified. |
| `HardCapExceeded` | The contribution would exceed the hard cap. |
| `OfferingEnded` | The deadline has passed. |
| `NotActive` | The auction is no longer active. |
| `CannotFinalizeYet` | The deadline has not passed and the hard cap was not reached. |
| `NotSucceeded` / `NotFailed` | `claim` or `refund` in the wrong status. |
| `NothingToClaim` / `NothingToRefund` | Nothing for that address. |
| `ZeroAmount` | Amount is zero. |
| `IssuerNotVerified` | The issuer is not verified (when creating a lot). |
| `SupplyBelowHardCap` | The lot's supply is not enough to sell the hard cap (when creating a lot). |
| `TransferFailed` | The payment token transfer failed. |
| `ReentrantCall` | Should not appear in normal use: reentrancy protection. |
| `NotFunded` | The auction does not hold enough shards for that contribution. |
| `InvalidParams` | Invalid parameters when creating the auction (price, caps or term). |
| `InvalidSupply` / `InvalidDuration` | Zero supply or duration (when creating a lot). |
| `ZeroAddress` | A required address is zero. |
| `NotOwner` / `OpenVerificationDisabled` | `KycRegistry`: owner only, or open verification is turned off. |
| `InsufficientBalance` / `InsufficientAllowance` | `ShardToken`: insufficient balance or allowance. |
| `NotIssuer` / `AlreadySettled` | `HarvestRedemption`: only the issuer settles, and only once. |
| `NotSettled` / `ExceedsSettlement` | `HarvestRedemption`: redemption before settlement, or above what was settled. |

## HarvestRedemption (harvest settlement)

A single contract serves every lot, including those already issued. It uses the same payment token as the auction.

| Function | Purpose |
|---|---|
| `settle(token, amount, evidenceURI, evidenceHash)` | The lot's issuer (`token.issuer()`) deposits the USDC from the harvest sale, once, with a link and a hash of the evidence (for example, the elevator's settlement statement). Requires a USDC `approve`. |
| `redeem(token, shards)` | Any holder redeems shards for `shards × amount / totalSupply`. The shards stay locked in the contract. Requires a shard `approve`. |
| `quote(token, shards) view` | USDC that redemption would pay (0 if not settled). |
| `isSettled(token) view`, `settlementOf(token) view` | Status: amount, supply, shards redeemed, USDC paid, date and evidence. |

Each lot has its own accounting: what is paid out for a token never exceeds what its issuer deposited, even if the token lies about its transfers.

## Local development (anvil)

With `DeployLocal.s.sol` running on anvil (`http://127.0.0.1:8545`, chain 31337) there is a mock USDC with an open mint and a sample SOJA26 lot. The script writes `frontend/.env.development.local` on its own (`NEXT_PUBLIC_NETWORK`, `NEXT_PUBLIC_DEV_MODE`, `NEXT_PUBLIC_RPC_URL`, `NEXT_PUBLIC_KYC`, `NEXT_PUBLIC_FACTORY`, `NEXT_PUBLIC_USDC`), which is where the frontend takes the addresses from.

To open the Kuru market when the auction ends: `scripts/kuru/open-market.ts` with `--offering <addr>` (reads everything from the contract and requires `status = Succeeded`).

## Regenerating the ABIs
If the contracts change:
```bash
cd contracts
for c in KycRegistry ShardToken Offering IssuanceFactory HarvestRedemption; do forge inspect $c abi --json > abi/$c.json; done
```
