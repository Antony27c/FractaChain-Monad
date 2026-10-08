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

export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  buy: "Compra",
  sell: "Venta",
  liquidity: "Liquidez agregada",
  liquidityOut: "Liquidez retirada",
  contribute: "Aporte a licitación",
  claim: "Reclamo de shards",
  refund: "Reembolso",
  proceeds: "Fondos recaudados",
  redeem: "Canje de cosecha",
  settle: "Liquidación de cosecha",
  mint: "USDC de prueba",
  transfer: "Transferencia",
};
