import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { createPublicClient, http, isAddress, parseAbi } from "viem";
import { OrderBook, type MarketParams } from "@kuru-labs/kuru-sdk";
import { monadTestnet } from "@/lib/env";
import { kuruMarketAbi } from "@/lib/kuru";

export const runtime = "nodejs";

const LEVELS = 12;
const l2BookAbi = parseAbi(["function getL2Book() view returns (bytes)"]);
// RPC público: el de NEXT_PUBLIC_RPC_URL puede estar restringido por dominio y rechazar llamadas del servidor.
const client = createPublicClient({ chain: monadTestnet, transport: http(monadTestnet.rpcUrls.default.http[0]) });
// El SDK solo decodifica: las lecturas se hacen con viem porque el cliente HTTP de ethers falla dentro del bundle de Next.
const unusedProvider = new ethers.providers.JsonRpcProvider();
const bn = (v: bigint | number) => ethers.BigNumber.from(v.toString());

export async function GET(request: Request) {
  const market = new URL(request.url).searchParams.get("market");
  if (!market || !isAddress(market)) return NextResponse.json({ error: "Invalid market address." }, { status: 400 });
  try {
    const [p, vault, l2] = await Promise.all([
      client.readContract({ address: market, abi: kuruMarketAbi, functionName: "getMarketParams" }),
      client.readContract({ address: market, abi: kuruMarketAbi, functionName: "getVaultParams" }),
      client.readContract({ address: market, abi: l2BookAbi, functionName: "getL2Book" }),
    ]);
    const params: MarketParams = {
      pricePrecision: bn(p[0]),
      sizePrecision: bn(p[1]),
      baseAssetAddress: p[2],
      baseAssetDecimals: bn(p[3]),
      quoteAssetAddress: p[4],
      quoteAssetDecimals: bn(p[5]),
      tickSize: bn(p[6]),
      minSize: bn(p[7]),
      maxSize: bn(p[8]),
      takerFeeBps: bn(p[9]),
      makerFeeBps: bn(p[10]),
    };
    const book = await OrderBook.getL2OrderBook(unusedProvider, market, params, l2, vault.map((v) => (typeof v === "string" ? v : v.toString())));
    const asks = [...book.asks].sort((a, b) => a[0] - b[0]).slice(0, LEVELS);
    const bids = [...book.bids].sort((a, b) => b[0] - a[0]).slice(0, LEVELS);
    return NextResponse.json({ asks, bids, block: book.blockNumber });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message.slice(0, 300) : "Could not read the order book." }, { status: 500 });
  }
}
