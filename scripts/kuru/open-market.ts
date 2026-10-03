import { ethers } from "ethers";
import { ParamCreator, ParamFetcher, Vault } from "@kuru-labs/kuru-sdk";

const env = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) throw new Error(`Missing env var ${key}`);
  return value;
};

const RPC_URL = env("RPC_URL", "https://testnet-rpc.monad.xyz");
const ROUTER = env("KURU_ROUTER", "0x7EFbE105Ca7415dE98F96622173458ac1c054630");
const BASE_TOKEN = env("BASE_TOKEN");
const QUOTE_TOKEN = env("QUOTE_TOKEN", "0x3bA3d39AFcf8bb994f7964B3e0171Ea2Ba361570");
const PRICE = Number(env("PRICE", "0.1"));
const SEED_BASE = env("SEED_BASE");
const MAX_PRICE = Number(env("MAX_PRICE", "10"));
const MIN_SIZE = Number(env("MIN_SIZE", "1"));
const TICK_BPS = Number(env("TICK_BPS", "100"));
const TAKER_FEE_BPS = Number(env("TAKER_FEE_BPS", "30"));
const MAKER_FEE_BPS = Number(env("MAKER_FEE_BPS", "10"));
const AMM_SPREAD = Number(env("AMM_SPREAD", "100"));
const DRY_RUN = env("DRY_RUN", "false") === "true";

const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
];

const ROUTER_ABI = [
  "event MarketRegistered(address baseAsset, address quoteAsset, address market, address vaultAddress, uint32 pricePrecision, uint96 sizePrecision, uint32 tickSize, uint96 minSize, uint96 maxSize, uint256 takerFeeBps, uint256 makerFeeBps, uint96 kuruAmmSpread)",
];

async function findVault(provider: ethers.providers.Provider, market: string): Promise<string> {
  const iface = new ethers.utils.Interface(ROUTER_ABI);
  const topic = iface.getEventTopic("MarketRegistered");
  const latest = await provider.getBlockNumber();
  const logs = await provider.getLogs({ address: ROUTER, topics: [topic], fromBlock: Math.max(latest - 100, 0), toBlock: latest });
  for (const log of logs) {
    const parsed = iface.parseLog(log);
    if (parsed.args.market.toLowerCase() === market.toLowerCase()) return parsed.args.vaultAddress;
  }
  throw new Error(`MarketRegistered event not found for ${market}`);
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(env("PRIVATE_KEY"), provider);
  const me = await signer.getAddress();

  const base = new ethers.Contract(BASE_TOKEN, ERC20_ABI, provider);
  const quote = new ethers.Contract(QUOTE_TOKEN, ERC20_ABI, provider);
  const [baseSymbol, quoteSymbol, baseDecimals, quoteDecimals] = await Promise.all([
    base.symbol(), quote.symbol(), base.decimals(), quote.decimals(),
  ]);

  const baseAmount = ethers.utils.parseUnits(SEED_BASE, baseDecimals);
  const quoteAmount = ethers.utils.parseUnits((Number(SEED_BASE) * PRICE).toFixed(quoteDecimals), quoteDecimals);

  const creator = new ParamCreator();
  const precisions = creator.calculatePrecisions(PRICE, 1, MAX_PRICE, MIN_SIZE, TICK_BPS);

  console.log(`Market ${baseSymbol}/${quoteSymbol} at ${PRICE} ${quoteSymbol} per ${baseSymbol}`);
  console.log("Precisions:", Object.fromEntries(Object.entries(precisions).map(([k, v]) => [k, v.toString()])));
  console.log(`Seed: ${SEED_BASE} ${baseSymbol} + ${ethers.utils.formatUnits(quoteAmount, quoteDecimals)} ${quoteSymbol}`);

  const [baseBalance, quoteBalance] = await Promise.all([base.balanceOf(me), quote.balanceOf(me)]);
  console.log(`Wallet ${me}: ${ethers.utils.formatUnits(baseBalance, baseDecimals)} ${baseSymbol}, ${ethers.utils.formatUnits(quoteBalance, quoteDecimals)} ${quoteSymbol}`);
  if (baseBalance.lt(baseAmount)) throw new Error(`Not enough ${baseSymbol} to seed the vault`);
  if (quoteBalance.lt(quoteAmount)) throw new Error(`Not enough ${quoteSymbol} to seed the vault`);

  if (DRY_RUN) {
    console.log("DRY_RUN=true, nothing was sent.");
    return;
  }

  const market = await creator.deployMarket(
    signer, ROUTER, 0, BASE_TOKEN, QUOTE_TOKEN,
    precisions.sizePrecision, precisions.pricePrecision, precisions.tickSize, precisions.minSize, precisions.maxSize,
    TAKER_FEE_BPS, MAKER_FEE_BPS, ethers.BigNumber.from(AMM_SPREAD),
  );
  console.log("Market deployed:", market);

  const vault = await findVault(provider, market);
  console.log("Vault:", vault);

  const marketParams = await ParamFetcher.getMarketParams(provider, market);
  console.log("Market params read back:", { baseDecimals: marketParams.baseAssetDecimals, quoteDecimals: marketParams.quoteAssetDecimals });

  const receipt = await Vault.depositWithAmounts(baseAmount, quoteAmount, BASE_TOKEN, QUOTE_TOKEN, vault, signer, true);
  console.log("Vault seeded. Tx:", receipt.transactionHash);
  console.log(JSON.stringify({ market, vault, base: BASE_TOKEN, quote: QUOTE_TOKEN, price: PRICE }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
