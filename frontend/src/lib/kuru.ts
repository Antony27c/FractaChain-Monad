import { parseAbi, parseAbiItem } from "viem";
import { chain } from "@/lib/env";

export const KURU_ROUTER = "0x7EFbE105Ca7415dE98F96622173458ac1c054630" as const;

// shard token (en minúsculas) -> mercado de Kuru. Los mercados abiertos desde la UI
// se guardan además en localStorage; para que los vean todos, agregarlos acá.
export const KURU_MARKETS: Record<string, `0x${string}`> = {
  "0x3aba80acdc4f35666012e3bdf1c1bca56996630d": "0x24B6dB71754086e87eF0d0C0F83C067b58Fb9B7f",
  "0x40a7e67e5b147264460980fb226e320e2434a074": "0x02633Ff7Dc67F934131804F289FfEb941ac2aaF6",
};

export const KURU_DEFAULTS = { takerFeeBps: 30, makerFeeBps: 10, ammSpread: 100, maxPrice: 10 } as const;

export const kuruMarketAbi = parseAbi([
  "function getMarketParams() view returns (uint32 pricePrecision, uint96 sizePrecision, address baseAsset, uint256 baseDecimals, address quoteAsset, uint256 quoteDecimals, uint32 tickSize, uint96 minSize, uint96 maxSize, uint256 takerFeeBps, uint256 makerFeeBps)",
  "function getVaultParams() view returns (address vault, uint256 a, uint96 b, uint256 c, uint96 d, uint96 e, uint96 f, uint96 g)",
  "function bestBidAsk() view returns (uint256 bid, uint256 ask)",
]);

export const kuruRouterAbi = parseAbi([
  "function deployProxy(uint8 _type, address _baseAssetAddress, address _quoteAssetAddress, uint96 _sizePrecision, uint32 _pricePrecision, uint32 _tickSize, uint96 _minSize, uint96 _maxSize, uint256 _takerFeeBps, uint256 _makerFeeBps, uint96 _kuruAmmSpread) returns (address proxy)",
]);

export const marketRegisteredEvent = parseAbiItem(
  "event MarketRegistered(address baseAsset, address quoteAsset, address market, address vaultAddress, uint32 pricePrecision, uint96 sizePrecision, uint32 tickSize, uint96 minSize, uint96 maxSize, uint256 takerFeeBps, uint256 makerFeeBps, uint96 kuruAmmSpread)",
);

export const kuruVaultAbi = parseAbi([
  "function deposit(uint256 baseDeposit, uint256 quoteDeposit, uint256 minQuoteConsumed, address receiver) payable returns (uint256)",
]);

export const explorerUrl = (address: string) =>
  `${chain.blockExplorers?.default.url ?? "https://testnet.monadexplorer.com"}/address/${address}`;

const storageKey = (token: string) => `fractachain.kuruMarket.${token.toLowerCase()}`;

export const savedMarket = (token: string): `0x${string}` | undefined =>
  (typeof window !== "undefined" && (window.localStorage.getItem(storageKey(token)) as `0x${string}` | null)) || undefined;

export const saveMarket = (token: string, market: string) => window.localStorage.setItem(storageKey(token), market);

export const candidateMarket = (token: string) => KURU_MARKETS[token.toLowerCase()] ?? savedMarket(token);

/** Precios de Kuru (bestBidAsk) vienen en base 1e18. */
export const formatKuruPrice = (value: bigint) => {
  const n = Number(value) / 1e18;
  return n === 0 ? "-" : `${n.toLocaleString("es-AR", { maximumFractionDigits: 6 })} USDC`;
};

/** minQuote = 99,7% del USDC a sembrar, igual que el SDK de Kuru (30 bps de tolerancia). */
export const minQuoteConsumed = (quote: bigint) => (quote * 9970n) / 10000n;

/** USDC (6 dec) necesarios para sembrar `shards` (18 dec) al precio `pricePerShard` (USDC por shard completo). */
export const quoteForShards = (shards: bigint, pricePerShard: bigint) => (shards * pricePerShard) / 10n ** 18n;
