# FractaChain: project log

> The team's internal log: decisions, status and open questions, in chronological order. The project overview is in the [`README.md`](README.md).
> Status: **in build**, contract tests passing, full flow tested on **the real Monad testnet** (with a mock USDC) and app deployed at https://fractachain-monad.up.railway.app.
> Last updated: October 10, 2026.

## 1. What FractaChain is

An onchain market for Argentine real-world assets (RWA) on **Monad**. A farmer or SME splits an asset (for example, a soy harvest) into tradable tokens called **shards**. Shards are issued in a **primary auction** and then trade on the order book of **Kuru**, an exchange that already exists on Monad.

**Pitch:** an onchain market for Argentine real-world assets, with a primary auction and a secondary market with no offchain matching, on top of Monad's fast settlement.

## 2. Problem and solution

**Problem.** Farmers and SMEs need liquidity against their season, but the traditional circuit (banks, warrants, Caja de Valores) is slow, expensive and has almost no secondary market. Investors have no access to yield with real backing.

**Solution.** Tokenization, a primary auction and an onchain secondary market, 24/7, at low cost.

## 3. Hackathon

Monad Metropolis, track **Onchain Finance & Trading**.

| Item | Value |
|---|---|
| Build window | September 1 to October 13, 2026 |
| Judging | October 14 to 27 |
| Winners | November 3 |
| Track prize | US$30,000 across 3 teams |

Among other examples, the track asks for "fully onchain order books that do not need an offchain matching engine". It also says it is ideal for teams that have already launched a trading product, so the demo has to be very solid.

**Sponsor prizes we are targeting**
- **Kuru**, "Bring New Assets and Markets to Kuru": US$5,000. The full rules are not on the Metropolis page, which only links to kuru.io. **They need to be read.**
- **Privy**, US$5,000. Chosen as the embedded wallet (see decision 10). Dynamic is ruled out. The bounty rules are on the registration platform and need to be read.
- **Envio**, "Best Use of Envio": US$1,000. Only if there is time left (history indexer).

## 4. What Kuru is and why we use it

**Monad** is the blockchain. **Kuru** is an application that already exists on Monad: a decentralized exchange with a fully onchain order book (CLOB), combined with AMM-style liquidity. FractaChain **does not build its own order book**: it lists the shards on Kuru.

Why:
- Two prizes are at stake (the track prize and the Kuru bounty).
- It saves the riskiest work of the original plan (matching, escrow, order book tests).
- Kuru is the sponsor and its bounty rewards precisely bringing new assets.

What Kuru's documentation says (docs.kuru.io):
- The `Router` deploys markets with `deployProxy(...)`. It accepts any ERC-20 pair (type `NO_NATIVE`). It is listed as a `public` function with no access restriction. **It is not confirmed to be permissionless**: this is checked when testing the deploy.
- A market is created with precisions computed by the SDK's `ParamCreator.calculatePrecisions` (`@kuru-labs/kuru-sdk`). The docs warn that badly chosen parameters prevent placing limit orders.
- Order balances live in a central `MarginAccount`.
- Each market has an AMM vault that is seeded with initial liquidity.

## 5. Decisions made

| # | Decision | Detail |
|---|---|---|
| 1 | Secondary market on Kuru | No `OrderBook.sol` of our own. |
| 2 | KYC only in the primary auction | A `KycRegistry` defines who can take part in the `Offering`. The shard is a normal ERC-20 that circulates freely on Kuru. |
| 3 | A shard is a fraction of the harvest's sale value | The initial plan had no onchain settlement. It was added on October 8 with `HarvestRedemption` (see section 9, item 7). |
| 4 | Fixed-price, first-come auction | With soft cap, hard cap and deadline. A contribution above the hard cap reverts. |
| 5 | Payment token: Kuru's official testnet USDC | See section 7: it has restrictions. |
| 6 | Demo: a single soy lot | If we do not make it, part stays mocked. |
| 7 | No Express backend | The frontend reads from the chain. |
| 8 | The Kuru market is created with an offchain script | When the auction ends, a script uses the Kuru SDK to compute the precisions, call `deployProxy` and seed the vault. In the UI, the issuer sees it as an "Open market" button. Since October 7 the button creates the market and seeds the vault from the browser, with precisions computed in a server route (`/api/kuru/precisions`); the script remains as a command-line alternative. |
| 9 | `CreditVault` and the Stellar stack | Out of the MVP. Everything Stellar (Soroban, stellar-sdk, Freighter, XLM) is removed. |
| 10 | Wallet: Privy | Embedded wallet with email or social login. Matches Kuru's wallet and counts toward the Privy bounty. Dynamic was ruled out. |

**Consequence of decision 2.** We cannot present the secondary market as "regulated". The honest statement is: "KYC at issuance, open secondary market on Kuru". The reason is that the token only sees contracts (MarginAccount, market), not end users. An allowlist in the token that includes Kuru would be cosmetic KYC.

## 6. Architecture

```
Farmer ──> IssuanceFactory ──creates──> ShardToken (ERC-20)
                 │                           │
                 └──creates──> Offering <── investors (KycRegistry)
                                   │ finalize
                                   v
                      Kuru market (shard / USDC)
                                   │
                                   v
                  Investors buy and sell on the order book
```

**Our contracts (Solidity + Foundry, Monad testnet).** Written and tested (`contracts/`, 79 tests passing: unit, fuzz and invariant):
- `KycRegistry.sol`: list of verified addresses. An owner approves them, and with open verification anyone can call `verifyMyself()` (the demo's "verify me" button).
- `ShardToken.sol`: 18-decimal ERC-20 with asset metadata (type, unit, quantity, season) and a fixed supply minted once.
- `Offering.sol`: fixed-price primary auction with `contribute`, `finalize`, `claim` and `refund`. If the soft cap is reached, the USDC goes to the issuer and each investor withdraws their shards; if not, each investor gets their USDC back. Internal review done: reentrancy guard on all 4 functions and tests with a malicious token.
- `IssuanceFactory.sol`: creates the token and its `Offering` in one transaction and registers each lot. Only verified issuers, and it requires the lot's supply to be enough to sell the hard cap.
- `script/DeployLocal.s.sol`: deploys the whole stack on anvil with a mock USDC, for local development and for the frontend (`frontend/.env.development.local`).
- Frontend guide: [`contracts/CONTRACTS.md`](contracts/CONTRACTS.md). ABIs in `contracts/abi/` (regenerated after the review).

**Sample lot (deploy script):** 1,000,000 soy shards (100 t, 2025/26 season) at 0.10 USDC, soft cap 40,000 USDC, hard cap 100,000 USDC, 7 days.

**Kuru integration (offchain, with the SDK):** `scripts/kuru/open-market.ts` computes the precisions, creates the market and seeds the vault. The `--offering <addr>` mode reads the token, payment token and price from the contract and requires `status = Succeeded` (it is the one the "Open market" button invokes); `--json` keeps stdout clean for the frontend. Tested end to end on a local fork of the testnet: full auction (contribute → finalize → claim) and a market created with bid ≈ 0.099 and ask 0.100. See `scripts/kuru/README.md`.

**Tested on the real testnet (October 6):** contract deploy, full auction (`contribute` up to the hard cap, `finalize`, `claim`) and `open-market.ts --offering`, which created the market on Kuru's Router with `deployProxy` and seeded the vault. Done with our own `mUSDC` (see section 7).

| Contract | Address on Monad testnet |
|---|---|
| `KycRegistry` | `0xe42FF6D4d9ED6603873144D3B1C46B6317d45FC9` |
| `IssuanceFactory` | `0xdbb769E14687DFD90f319A225b5fF8eA423Bb68F` |
| `ShardToken` (SOJA26) | `0x3AbA80ACDc4F35666012e3bdF1c1bca56996630D` |
| `Offering` | `0x1929ada51d21911cA3545C18a08693a483f2C308` |
| `mUSDC` (mock, 6 decimals) | `0xBf11e27C5C26E11E4B213fBCc5d5EDBb29453d36` |
| SOJA26/mUSDC market on Kuru | `0x24B6dB71754086e87eF0d0C0F83C067b58Fb9B7f` |
| Market vault | `0xB6BDa4B1Abe3D8d0D82691BC0f3a6f9aa7536010` |

There is an earlier deploy (with Kuru's USDC as the payment token) that was left unused: the sample lot asks for a 40,000 USDC soft cap and we had no way to get it.

All five contracts are verified on Sourcify (`exact_match`).

**Still to test:** repeat the flow with Kuru's official testnet USDC. The frontend has already been tested against these addresses (see section 9).

**Frontend:** Next.js + wagmi + viem. Privy embedded wallet with sponsored gas. Deployed on Railway. Pages: landing, auctions (`/market`), lot detail with an onchain asset sheet, Orderbook with Kuru's L2 book (`/orderbook`), lot issuance (`/create`), history (`/actividad`) and Merval, Forwards and Warrants simulators that send no transactions. The whole interface is available in Spanish and English and adapts to phone screens.

**Kuru addresses on testnet.** Kuru's documentation gives two sets of addresses. Checked on October 3 on Monad testnet:

| Contract | "Contract Addresses" page | SDK Quick Start |
|---|---|---|
| Router | `0x7EFbE105Ca7415dE98F96622173458ac1c054630` (has code) | `0x1f5A250c4A506DA4cE584173c6ed1890B1bf7187` (**no code**) |
| MarginAccount | `0xd029C2D98ff85D8F64799017fE00a59B1159CE02` (has code) | `0xdDDaBd30785bA8b45e434a1f134BDf304d6125d9` (**no code**) |

**We use the ones from the "Contract Addresses" page.** The Quick Start ones are outdated. Also, the current Router's `marginAccountAddress()` returns the MarginAccount from that same column.

**About `deployProxy`.** Verified with a test on a Monad testnet fork (`contracts/test/KuruFork.t.sol`): an arbitrary account deployed a market for a custom 18-decimal token against Kuru's USDC (6 decimals). The test uses sample precisions (`sizePrecision` 1e10, `pricePrecision` 1e9, `tickSize` 100, `minSize` 1e8, `maxSize` 1e16, fees 30/10 bps and spread 100). The `open-market.ts` script instead uses the ones `calculatePrecisions` from the SDK computes from the price. It is a simulation on a fork, not a real transaction. The token must expose `decimals()` and `symbol()`; Kuru reads them when creating the market.

## 7. Payment token: Kuru's testnet USDC

Verified by querying Monad testnet:
- Address: `0x3bA3d39AFcf8bb994f7964B3e0171Ea2Ba361570`, symbol `USDC`, **6 decimals**.
- **It does not seem to have an open mint.** A test call to `mint(address,uint256)` from an arbitrary account reverts, and the contract does not expose `owner()`. This is not conclusive: it could have another mint function.
- Community guides get it by **swapping MON for tUSDC in Kuru's UI**. I found no official USDC faucet.

**Update (October 6).** Kuru's web app (`kuru.io`) only shows mainnet: it uses the USDC `0x7547...b603` and does not recognize the testnet balance, even with the wallet on Monad Testnet. So we could not get testnet USDC by swapping. Plan B was applied: our own `mUSDC` (`script/DeployMockUsdc.s.sol`, with an open mint), with which the whole flow was tested on testnet. We still need to find out from Kuru how to get their official testnet USDC.

Implications:
- To get demo funds you have to swap MON (which does have a faucet at faucet.monad.xyz) for USDC on Kuru, and the available volume is limited.
- Paying for the auction and seeding the market takes a fair amount of USDC. If it is not enough, plan B is our own `mUSDC`, which cannot be used for the Kuru bounty as the "official" currency.

## 8. Work plan (10 days, until October 13)

| Days | Goal |
|---|---|
| 1-2 (Oct 3-4) | **Done:** Foundry setup, `KycRegistry`, `ShardToken`, `Offering`, `IssuanceFactory` with tests, deploy scripts (testnet and `DeployLocal` for anvil), ABIs and frontend guide, Kuru script (tested on a fork, `--offering` mode), `Offering` invariants (128k calls with no violations) and internal security review with fixes. |
| 3-4 | **Done (Oct 6):** testnet deploy with a test wallet, full auction and Kuru script with real shards (with `mUSDC`). Contracts verified on Sourcify. **Pending:** repeat with Kuru's official USDC and external review. |
| 5-7 | **Done (Oct 6-8):** auction frontend (contribute, finalize, claim, refund) and secondary market connected to Kuru (open market, buy, sell, add and withdraw liquidity). |
| 8 | **Done (Oct 8):** Privy embedded wallet with sponsored gas, account menu, harvest redemption (`HarvestRedemption`), history with Envio HyperSync and Railway deploy. Full flow tested end to end with a new account and no MON. |
| 9-10 | **Done (Oct 9-10):** README for the submission, MIT license, legal and operations plan, business model, Orderbook page, asset sheet, English interface and mobile layout. **Pending:** demo video, final reading of the Kuru and Privy rules, and submission. |

## 9. Open questions

1. **How do we get Kuru's official testnet USDC?** The `kuru.io` swap only works on mainnet (see section 7). Ask Kuru (Discord) and read the bounty rules to know whether they require their USDC.
2. ~~Confirm `deployProxy` with a real transaction~~ **Resolved:** any account can create a market on Kuru's Router on testnet (market `0x24B6...9B7f`).
3. **Kuru and Privy bounty rules:** what is required for them to count. Test on day one that Privy works on Monad testnet.
4. **Team roles.** Contracts and Kuru integration: Antony. Frontend: Juli.
5. **UX to-do: onboarding with the embedded wallet (Privy).** Testing the login showed that a new user cannot operate and the app does not explain it well:
   - ~~The wallet starts with no MON and the first transaction attempt fails with "Signer had insufficient balance".~~ **Resolved (October 8) with Privy sponsored gas:** with the embedded wallet, `useTx` sends transactions with `sponsor: true` and the app pays the gas (Privy Dashboard > Fee sponsorship, Monad Testnet, with "Allow transactions from the client" enabled). Tested with a new email account and 0 MON: KYC, USDC top-up, buy and sell all worked and the dashboard recorded no usage. With external wallets signing works as before. Note: in Brave, with Shields on, the embedded wallet is not created; in Edge it works.
   - ~~The wallet address is shown truncated (`0xC3Ab...7B76`) and could not be copied.~~ **Resolved (October 8):** the account menu shows the full address, a copy button and the MON, USDC and shard balances (see item 8).
   - ~~"Load test funds" button.~~ **Done:** anyone with 0 USDC sees "Load 1,000 test USDC" in the lot panel (mUSDC mint, sponsored gas). Flow tested from a new account with no MON: email, KYC, load USDC, buy 10 USDC (90.19 MAIZ27) and sell 5 MAIZ27.
   - ~~The "Secondary market" panel was not connected.~~ **Done (October 7):** the panel on the lot page reads the market onchain (bid, ask, fees, vault and explorer links) and the issuer has an "Open market" button that creates the market and seeds the vault from the browser with their wallet. Markets are registered in `frontend/src/lib/kuru.ts` (`KURU_MARKETS`, which already includes `0x24B6...9B7f`); markets opened from the UI are kept in `localStorage` until they are added to that registry. Kuru's web app only shows mainnet, so we do not link to kuru.io. Tested end to end on testnet with a new lot (MAIZ27, token `0x40A7...A074`): contributions up to the hard cap, `finalize` and "Open market" from the UI created market `0x0263...aaF6` and seeded the vault (bid 0.099 / ask 0.100). **Buying and selling from the app (October 7):** the market panel has Buy/Sell tabs with market orders against Kuru's order book (`placeAndExecuteMarketBuy/Sell`), a quote before signing, slippage tolerance (0.5 / 1 / 3%) and token approval only when needed. Units were validated on a testnet fork: a 1 USDC buy returned 9.92 MAIZ27 (same as the quote), a sale of 10 MAIZ27 returned USDC and an impossible `minAmountOut` reverted with `SlippageExceeded`. Also tested in the browser with the Privy wallet on the MAIZ27 market: a 1 USDC buy returned 9.92 MAIZ27 and a sale of 5 MAIZ27 returned about 0.5 USDC, with bid and ask moving on each trade.
   - ~~The "Issue a lot" form does not warn when the caps are out of reach for the tester.~~ **Resolved (October 9):** the form shows the USDC balance, warns when it does not reach the minimum (the auction would end in a refund) and offers a "Use demo caps (100 / 250 USDC)" button.
6. **Secondary-market liquidity.** The MAIZ27 vault was seeded with only 1,000 shards and 100 USDC, and a 10 USDC buy moved the price from 0.10 to ~0.12 (+20%), with an average price paid of ~0.111. It is not a bug: it is thin depth.
   - **For the demo:** seed a market with more liquidity (for example 50,000 shards and 5,000 USDC) so the price moves realistically in the video.
   - **For the Kuru bounty ("liquidity strategy and initial market formation"):** the issuer seeds the vault with part of the funds raised and the unsold shards, at the auction price. Giving the book depth also takes a market maker or an incentive for liquidity providers. This case serves as evidence of why that is needed.
   - **Done (October 8, local): "Add liquidity to the vault".** Anyone with shards and USDC deposits into the vault at the current price (`base × vaultBestAsk`, same as the SDK) and sees their share of the vault. Tested on a fork: 2,000 MAIZ27 + 241.6 USDC tripled the liquidity without moving the price, and the impact of a 10 USDC buy dropped from ~11% to ~3%. Note: MAIZ27 has a supply of only 5,000 shards; for a demo with much more liquidity, a new lot with a large supply is better (for example 1,000,000 shards and small caps, so the issuer gets almost everything back as unsold and can seed 50,000 shards).
7. **Harvest redemption (October 8, local).** `HarvestRedemption` contract: the issuer deposits the USDC from the lot's sale once, with a link and hash of the evidence (for example, the elevator's settlement statement), and each holder redeems their shards for `shards × amount / supply`. Redeemed shards stay locked. It serves lots already issued without redeploying the factory. 16 tests (including a solvency fuzz test and a malicious token that cannot drain other lots) and a fork test on MAIZ27: 600 USDC settled, 100 shards redeemed for 12 USDC. "Harvest settlement" panel on the lot page (settle as issuer, redeem as holder). **Deployed on testnet (October 8):** `0xeccA331e9b090463aBf9F2077AbFf2110d668d2c` (tx `0xd069…113f`, block 69,187,109), with mUSDC as the payment token; the address goes in `NEXT_PUBLIC_REDEMPTION`. Honest limit: the contract guarantees the distribution, not that the issuer settles; that depends on the legal backing (for example, a trust or a contract with the elevator).
8. **Account menu (October 8, local).** Tapping the address in the header shows: full address, copy, explorer link, MON, USDC and per-shard balances, a notice about the embedded wallet with sponsored gas, and Privy features: export the wallet, link email or Google and log out. While Privy creates the wallet, "Preparing your wallet..." is shown.

Resolved: the demo lot parameters (see section 6).

## 10. Glossary

- **Shard:** ERC-20 token that represents a fraction of the sale value of a real-asset lot.
- **Lot:** the specific asset being tokenized (for example, 100 t of soy from one season).
- **Issuer:** the farmer or SME that splits a lot.
- **Offering (primary auction):** initial sale of shards at a fixed price, with soft cap, hard cap and deadline.
- **Soft cap / hard cap:** minimum that must be raised for the issuance to be valid / maximum accepted.
- **Refund:** return of contributions if the soft cap is not reached. Each investor claims it with `refund()`.
- **KYC Registry:** list of verified addresses that can take part in the auction.
- **Secondary market:** trading of shards on Kuru's order book after the auction.
- **Kuru market:** shard/USDC pair deployed with Kuru's Router.

## 11. Roadmap (beyond the MVP)

- ~~Harvest settlement and shard redemption.~~ Done in the MVP with `HarvestRedemption`.
- Harvest forwards with escrow (today there is a simulator with no transactions at `/forwards`).
- Tokenized Merval stocks, with proof of reserve (Chainlink CRE) (today there is a simulator with no transactions at `/stocks`).
- Loans against shards (`CreditVault`), with a rate based on onchain history.
- Perpetuals with per-block funding.
- A permissioned wrapper that extends KYC to the secondary market.

## 12. Origin and rules

FractaChain was first prototyped on another ecosystem (Stellar/Soroban, github.com/Erosmart/fractachain), where it won 1st place in the Genesis Track of the Argentina Builder Challenge (BAF × Stellar). For Monad Metropolis it was rebuilt from scratch: all contracts, scripts and frontend in this repo were written during the hackathon. No Soroban code was reused, only the idea and the design.
