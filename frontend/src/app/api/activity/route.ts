import { NextResponse } from "next/server";
import { createPublicClient, getAddress, http, isAddress, pad, zeroAddress } from "viem";
import { issuanceFactoryAbi, shardTokenAbi } from "@/lib/abi";
import { addresses, chain, isLocal, rpcUrl } from "@/lib/env";
import type { Activity, ActivityKind } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const HYPERSYNC_URL = process.env.HYPERSYNC_URL ?? `https://${chain.id}.hypersync.xyz/query`;
// Primer bloque relevante: deploy del mUSDC y de los contratos en Monad testnet.
const FROM_BLOCK = Number(process.env.ACTIVITY_FROM_BLOCK ?? 68_700_000);
const MAX_PAGES = 20;
const MAX_ITEMS = 200;

type HsLog = {
  block_number: number | string;
  log_index: number | string;
  transaction_hash: string;
  address: string;
  data: string;
  topic1?: string;
  topic2?: string;
};
type HsBlock = { number: number | string; timestamp: number | string };
type HsBatch = { logs?: HsLog[]; blocks?: HsBlock[] };

const num = (v: number | string) => (typeof v === "number" ? v : Number(BigInt(v)));
const topicAddress = (topic?: string) => (topic ? getAddress(`0x${topic.slice(-40)}`) : zeroAddress);

async function fetchTransfers(token: string, user: `0x${string}`, contracts: string[]) {
  const padded = pad(user);
  const logs: HsLog[] = [];
  const timestamps = new Map<number, number>();
  let from = FROM_BLOCK;

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetch(HYPERSYNC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        from_block: from,
        logs: [
          { address: contracts, topics: [[TRANSFER], [padded], []] },
          { address: contracts, topics: [[TRANSFER], [], [padded]] },
        ],
        field_selection: {
          block: ["number", "timestamp"],
          log: ["block_number", "log_index", "transaction_hash", "address", "data", "topic1", "topic2"],
        },
      }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HyperSync respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const body = (await res.json()) as { data?: HsBatch[] | HsBatch; next_block?: number; archive_height?: number };
    const batches = Array.isArray(body.data) ? body.data : body.data ? [body.data] : [];
    for (const batch of batches) {
      logs.push(...(batch.logs ?? []));
      for (const b of batch.blocks ?? []) timestamps.set(num(b.number), num(b.timestamp));
    }
    if (!body.next_block || !body.archive_height || body.next_block >= body.archive_height || body.next_block <= from) break;
    from = body.next_block;
  }
  return { logs, timestamps };
}

export async function GET(request: Request) {
  const param = new URL(request.url).searchParams.get("address") ?? "";
  if (!isAddress(param)) return NextResponse.json({ error: "Dirección inválida." }, { status: 400 });
  if (isLocal) return NextResponse.json({ error: "El registro no está disponible en la red local." }, { status: 501 });
  const token = process.env.ENVIO_API_TOKEN;
  if (!token) return NextResponse.json({ error: "Falta configurar ENVIO_API_TOKEN en el servidor." }, { status: 503 });
  if (!addresses.factory || !addresses.usdc) return NextResponse.json({ error: "Faltan las direcciones de los contratos." }, { status: 503 });

  const user = getAddress(param);
  const usdc = getAddress(addresses.usdc);
  const redemption = addresses.redemption ? getAddress(addresses.redemption) : undefined;

  try {
    const client = createPublicClient({ chain, transport: http(rpcUrl) });
    const issuances = await client.readContract({ address: addresses.factory, abi: issuanceFactoryAbi, functionName: "getIssuances" });
    const symbols = await client.multicall({
      contracts: issuances.map((i) => ({ address: i.token, abi: shardTokenAbi, functionName: "symbol" }) as const),
    });
    const lotByToken = new Map(
      issuances.map((i, n) => [
        getAddress(i.token),
        { offering: getAddress(i.offering), symbol: symbols[n].status === "success" ? (symbols[n].result as string) : "SHARD" },
      ]),
    );
    const offeringInfo = new Map(issuances.map((i) => [getAddress(i.offering), { issuer: getAddress(i.issuer), token: getAddress(i.token) }]));

    const { logs, timestamps } = await fetchTransfers(token, user, [usdc, ...lotByToken.keys()]);

    type Tx = { block: number; usdc: bigint; shard?: `0x${string}`; shards: bigint; counterparties: Set<string> };
    const txs = new Map<string, Tx>();
    const seen = new Set<string>();
    for (const log of logs) {
      const key = `${log.transaction_hash}:${num(log.log_index)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const from = topicAddress(log.topic1);
      const to = topicAddress(log.topic2);
      const amount = BigInt(log.data === "0x" ? 0 : log.data);
      const sign = to === user ? 1n : -1n;
      if (from === user && to === user) continue;
      const tx = txs.get(log.transaction_hash) ?? { block: num(log.block_number), usdc: 0n, shards: 0n, counterparties: new Set() };
      const contract = getAddress(log.address);
      if (contract === usdc) tx.usdc += sign * amount;
      else {
        tx.shard = contract;
        tx.shards += sign * amount;
      }
      tx.counterparties.add(to === user ? from : to);
      txs.set(log.transaction_hash, tx);
    }

    const items: Activity[] = [];
    for (const [hash, tx] of txs) {
      const cps = [...tx.counterparties];
      const offering = cps.map((c) => offeringInfo.get(c as `0x${string}`)).find(Boolean);
      const withOffering = Boolean(offering);
      const withRedemption = Boolean(redemption && cps.includes(redemption));
      const fromZero = cps.includes(zeroAddress);
      let kind: ActivityKind = "transfer";
      if (tx.shards > 0n && tx.usdc < 0n) kind = "buy";
      else if (tx.shards < 0n && tx.usdc > 0n) kind = withRedemption ? "redeem" : "sell";
      else if (tx.shards < 0n && tx.usdc < 0n) kind = "liquidity";
      else if (withOffering && tx.usdc < 0n && tx.shards === 0n) kind = "contribute";
      else if (withOffering && tx.shards > 0n && tx.usdc === 0n) kind = "claim";
      else if (withOffering && tx.usdc > 0n) kind = offering?.issuer === user ? "proceeds" : "refund";
      else if (withRedemption && tx.usdc < 0n) kind = "settle";
      else if (fromZero && tx.usdc > 0n) kind = "mint";

      const lotToken = tx.shard ?? offering?.token;
      const lot = lotToken ? lotByToken.get(lotToken) : undefined;
      items.push({
        hash,
        block: tx.block,
        timestamp: timestamps.get(tx.block) ?? null,
        kind,
        symbol: lot?.symbol ?? null,
        offering: lot?.offering ?? null,
        usdcDelta: tx.usdc.toString(),
        shardDelta: tx.shards.toString(),
      });
    }
    items.sort((a, b) => b.block - a.block);
    return NextResponse.json({ items: items.slice(0, MAX_ITEMS) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "No se pudo leer el registro." }, { status: 502 });
  }
}
