import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc.monad.xyz"] } },
  blockExplorers: { default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" } },
  testnet: true,
});

export const localChain = defineChain({
  id: 31337,
  name: "Local (anvil)",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
  testnet: true,
});

export const isLocal = process.env.NEXT_PUBLIC_NETWORK === "local";
export const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

export const chain = isLocal ? localChain : monadTestnet;
export const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

const address = (value: string | undefined) => value as `0x${string}` | undefined;

export const addresses = {
  kyc: address(process.env.NEXT_PUBLIC_KYC),
  factory: address(process.env.NEXT_PUBLIC_FACTORY),
  usdc: address(process.env.NEXT_PUBLIC_USDC ?? "0x3bA3d39AFcf8bb994f7964B3e0171Ea2Ba361570"),
};

export const contractsConfigured = Boolean(addresses.kyc && addresses.factory && addresses.usdc);

export const USDC_DECIMALS = 6;
export const SHARD_DECIMALS = 18;
