export type ActivityKind =
  | "buy"
  | "sell"
  | "liquidity"
  | "liquidityOut"
  | "contribute"
  | "claim"
  | "refund"
  | "proceeds"
  | "redeem"
  | "settle"
  | "mint"
  | "transfer";

export type Activity = {
  hash: string;
  block: number;
  timestamp: number | null;
  kind: ActivityKind;
  symbol: string | null;
  offering: string | null;
  usdcDelta: string;
  shardDelta: string;
};

export const ACTIVITY_LABELS: Record<ActivityKind, [string, string]> = {
  buy: ["Compra", "Buy"],
  sell: ["Venta", "Sell"],
  liquidity: ["Liquidez agregada", "Liquidity added"],
  liquidityOut: ["Liquidez retirada", "Liquidity withdrawn"],
  contribute: ["Aporte a licitación", "Auction contribution"],
  claim: ["Reclamo de shards", "Shard claim"],
  refund: ["Reembolso", "Refund"],
  proceeds: ["Fondos recaudados", "Proceeds raised"],
  redeem: ["Canje de cosecha", "Harvest redemption"],
  settle: ["Liquidación de cosecha", "Harvest settlement"],
  mint: ["USDC de prueba", "Test USDC"],
  transfer: ["Transferencia", "Transfer"],
};
