import { formatUnits } from "viem";
import { SHARD_DECIMALS, USDC_DECIMALS } from "@/lib/env";

export const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const withThousands = (value: string) => {
  const [int, dec] = value.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return dec ? `${grouped},${dec}` : grouped;
};

export function formatUsdc(value: bigint, maxDecimals = 2) {
  const [int, dec = ""] = formatUnits(value, USDC_DECIMALS).split(".");
  const trimmed = dec.slice(0, maxDecimals).replace(/0+$/, "");
  return `${withThousands(trimmed ? `${int}.${trimmed}` : int)} USDC`;
}

export function formatShards(value: bigint, maxDecimals = 2) {
  const [int, dec = ""] = formatUnits(value, SHARD_DECIMALS).split(".");
  const trimmed = dec.slice(0, maxDecimals).replace(/0+$/, "");
  return withThousands(trimmed ? `${int}.${trimmed}` : int);
}

export function formatPricePerShard(pricePerShard: bigint) {
  const [int, dec = ""] = formatUnits(pricePerShard, USDC_DECIMALS).split(".");
  const trimmed = dec.replace(/0+$/, "").padEnd(2, "0");
  return `${int},${trimmed} USDC`;
}

export function formatDate(timestamp: bigint) {
  return new Date(Number(timestamp) * 1000).toLocaleString("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function timeLeft(deadline: bigint, now: bigint) {
  const seconds = Number(deadline - now);
  if (seconds <= 0) return "Finalizada";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days} d ${hours} h`;
  if (hours > 0) return `${hours} h ${minutes} min`;
  return `${Math.max(minutes, 1)} min`;
}
