# FractaChain: business model

> How FractaChain makes money, who pays and why paying makes sense for them. Draft of October 9, 2026.
> Market data is sourced (section 11). FractaChain's fees are a **proposal to be validated** with a partner grain elevator.

## 1. Value proposition

| Customer | Problem today | What FractaChain offers | Why it is worth it |
|---|---|---|---|
| **Farmer or agri SME** (issuer) | Finances the season with commercial or bank credit, tied to a few suppliers. | Funds before harvest, from many investors, at a price set in a transparent auction. | A new funding source **without paying more** than today: FractaChain's cost comes out of the commission the grain elevator already charges (section 2). |
| **Investor** (local or foreign retail) | Has no access to yields backed by Argentina's real economy, and cannot exit before maturity. | Exposure to a harvest from small amounts, a 24/7 secondary market on Kuru and automatic redemption when the harvest is sold. | Dollar yield with real backing and the option to sell at any time. |
| **Grain elevator or cooperative** (partner) | Finances its farmers with its own balance sheet or with bank credit. | Investors who fund its customers, under its brand, without putting up its own capital. | Keeps its farmers, frees up its balance sheet and still earns the fee for marketing the grain. |

The differentiator is the **onchain secondary market with liquidity from day one**: the investor is not locked in until harvest, so they can accept a lower yield, which keeps the cost low for the farmer.

## 2. What we compete against: what the farmer already pays

Today the farmer pays two separate costs to the commercial and banking circuit:

**a) Grain marketing** (charged by the elevator when it sells the harvest). Gross margins from INTA Pergamino, 2025/26 season:

| Grain | Elevator commission | Harvest price (MAGyP, Sep. 2025) | Commission over price |
|---|---|---|---|
| Soy | US$ 5.9/t | US$ 316/t | ~1.9% |
| Wheat | US$ 3.8/t | US$ 190/t | ~2.0% |
| Corn | US$ 5.9/t | US$ 174.6/t | ~3.4% |

On top of that commission come drying, cleaning and other elevator charges (US$ 7–11/t) plus freight.

**b) Season financing.** Survey by the Rosario Board of Trade (Bolsa de Comercio de Rosario) for 2025/26: almost all agricultural credit is in dollars, between **8.5% and 12.5% a year** (input loans under supplier agreements 8.5–9%, assigned forward contracts 9–11%, bullet loans 9.5–11%). 66% of third-party financing comes from the commercial circuit: grain elevators, input suppliers and traders.

**The benchmark:** the farmer's total cost (investor yield plus FractaChain fees) has to stay **below ~9–11% a year in dollars**. That is why FractaChain **does not add a new layer of cost**: it is funded by sharing what the circuit already charges.

## 3. Revenue streams

| # | Revenue | Who pays | When | Status |
|---|---|---|---|---|
| 1 | **Share of the marketing commission** | Partner elevator, out of the commission it already charges the farmer (~2%) | When the lot's harvest is sold and settled | Proposal: commercial agreement with each elevator. |
| 2 | **Reduced success fee** (0.5% of the amount raised) | Issuer | Only if the auction reaches its minimum | Proposal: `protocolFeeBps` in the next version of `Offering`. |
| 3 | **Lot structuring** | Issuer or elevator | When the series is set up (due diligence, documents, trust) | Proposal: offchain service; gets cheaper with the global series program. |
| 4 | **White-label licence** | Elevators, cooperatives, fintechs | Monthly fee or per originated lot | Proposal. |
| 5 | **Peso to USDC on/off-ramps** | User, through a ramp partner | Spread shared with the provider | Roadmap. |

**Design principle:** FractaChain **only earns when the lot works**. If the auction does not reach its minimum, nobody pays; if the harvest is not sold, there is no marketing commission. FractaChain's incentives stay aligned with the farmer's and the investor's.

### What is not FractaChain revenue

- **Kuru fees** (0.30% taker and 0.10% maker in the demo markets): distributed according to Kuru's rules.
- **The deployed contracts charge no fees.** This is an MVP decision; the success fee comes in the next version of `Offering`.
- **Market making:** see section 4.

## 4. Liquidity: a strategy, not a revenue stream

For a secondary market to exist, someone has to deposit shards and USDC into the Kuru vault. Whoever does it earns the vault spread (1% in our markets) and, under Kuru's rules, part of the fees. FractaChain **does not present this as revenue** for three reasons:

1. **It requires own capital** in every vault, which a company at the pilot stage does not have.
2. **That capital is at risk:** on bad news (drought, a drop in grain prices), informed traders sell to the vault before the price adjusts.
3. **It yields little at low volume:** with US$ 100,000 of annual volume in one pair, capturing 0.5% leaves about US$ 500.

**So how liquidity is formed:**

- **Seeding by the issuer (implemented):** when the auction closes, the issuer seeds the vault with its unsold shards and part of the proceeds, at the auction price. It is the lot's capital, not FractaChain's.
- **Per-series liquidity reserve:** a percentage of each lot's supply is issued for the vault.
- **Open liquidity providers (implemented):** any holder can add to the vault and earn their share.
- **External market maker:** agreement with a professional market maker; Kuru offers liquidity introductions.
- **Own market making, later:** once there is volume and capital, as a secondary revenue stream.

## 5. Main costs

| Cost | Type | Comment |
|---|---|---|
| Sponsored gas (Privy) | Variable per transaction | Low on Monad. Lets users operate without MON. |
| KYC/AML | Variable per user | Identity verification and monitoring provider. |
| Legal structure | Fixed per program and variable per series | Trustee, CNV (Argentina's securities regulator), law firm, accounting audit. A global program with one series per lot makes each issuance cheaper. |
| Grain custody and verification | Variable per lot | Warehouse or elevator, insurance, stock audit. Mostly covered by the partner elevator, which already stores the grain. |
| Technology | Fixed | RPC, indexing (Envio HyperSync), hosting, security audits. |

## 6. Channels and acquisition

- **Issuers, through elevators and cooperatives (B2B2C).** They already finance their farmers, know their track record and store the grain. With the marketing-commission split, they earn without putting up capital.
- **Investors, through the app.** Email login, no prior crypto and no gas. Later, distribution through registered virtual asset service providers (PSAV) and brokers, as the CNV tokenization regime requires for public offerings.
- **Liquidity, through Kuru.** Every successful lot opens a pair visible to any trader on Monad.

## 7. Unit economics of one lot (illustrative)

Assumptions: a lot of **1,000 t of soy** at US$ 316/t, financed with a **US$ 250,000** auction; FractaChain receives **half of the elevator's marketing commission** (~1.9% of the grain's value) and charges a **0.5% success fee**.

| Item | Amount |
|---|---|
| Grain value (1,000 t × US$ 316) | US$ 316,000 |
| Elevator marketing commission (~1.9%) | US$ 5,900 |
| FractaChain's share (50%) | US$ 2,950 |
| Success fee (0.5% of US$ 250,000) | US$ 1,250 |
| **FractaChain revenue per lot** | **US$ 4,200** |

**Cost for the farmer:** only the 0.5% success fee is new, because the farmer was already paying the marketing commission. Over a ~6-month season that is ~1 point annualized, so if investors accept 6% to 8% a year in dollars, the total cost stays within the 8.5–12.5% benchmark from section 2.

With 10 lots per season, revenue would be around US$ 42,000, plus structuring and licences. **[to be validated]** The split with the elevator and the yield investors require are validated in the pilot.

## 8. Why it scales

- **Low marginal cost per lot:** the factory creates the token, the auction and the market in minutes; the trust program is set up once and issues series.
- **Network effect:** more lots attract more investors, and more investors lower the required yield and the cost for the farmer.
- **Every elevator is a channel:** adding one elevator brings all of its farmers.
- **New assets on the same rails:** other kinds of production, electronic warrants as collateral and loans against shards use the same contracts, the same KYC and the same market.

## 9. Metrics we track

| Metric | Measures |
|---|---|
| Farmer's total cost versus 8.5–12.5% in dollars | Whether we are competitive. |
| Amount raised and auction success rate | Investor demand and origination quality. |
| Volume, spread and depth on Kuru | Secondary-market liquidity. |
| Lots settled on time and amount redeemed | Performance of the underlying asset. |
| Active elevators and lots per elevator | Strength of the channel. |

## 10. Next steps

1. Agree with a pilot elevator on the marketing-commission split and the target investor yield.
2. Add `protocolFeeBps` (success fee) in the next version of `Offering`, with a configurable cap and recipient.
3. Define the per-series liquidity reserve and find an external market maker.
4. Settle the cost of the legal structure per series with the trustee and the law firm (see [`LEGAL_AND_OPERATIONS_PLAN.md`](LEGAL_AND_OPERATIONS_PLAN.md)).

## 11. Sources

Sources are in Spanish.

- INTA EEA Pergamino, *Márgenes brutos de las principales actividades agrícolas, campaña 2025/2026* (September 2025): marketing costs and elevator commission. [repositorio.inta.gob.ar](https://repositorio.inta.gob.ar/xmlui/bitstream/handle/20.500.12123/24661/INTA_CRBsAsNorte_EEAPergamino_Fillat_Francisco_Margenes_brutos_de_las_principales_actividades_agricolas_campa%C3%B1a_2025-2026_septiembre2025.pdf?isAllowed=y&sequence=1)
- Ministry of Economy, *Márgenes y resultados agrícolas* (September 2025): harvest prices. [magyp.gob.ar](https://www.magyp.gob.ar/sitio/areas/analisis_economico/margenes/_archivos/000001_Informes%20de%20M%C3%A1rgenes%20y%20Resultados/202500_2025/250900_Margenes%20Resultados%20(Septiembre%202025).pdf)
- Rosario Board of Trade, *¿Qué condiciones se avizoran para el financiamiento de la campaña 2025/26?*: dollar interest rates. [bcr.com.ar](https://www.bcr.com.ar/es/print/pdf/node/112753)
- Rosario Board of Trade, *Panorama del financiamiento agrícola: cómo cerró la campaña 2024/25*: financing mix. [bcr.com.ar](http://www.bcr.com.ar/es/mercados/investigacion-y-desarrollo/informativo-semanal/noticias-informativo-semanal/panorama-del-5)
