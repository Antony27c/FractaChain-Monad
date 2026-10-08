import { createConfig as createWagmiConfig, createStorage, fallback, http, noopStorage } from "wagmi";
import { mock } from "wagmi/connectors";
import { createConfig as createPrivyConfig } from "@privy-io/wagmi";
import { chain, rpcUrl } from "@/lib/env";

// Sin NEXT_PUBLIC_RPC_URL se usa el RPC público de la cadena. Con un RPC propio, el público
// queda de respaldo por si el propio falla o limita requests.
const publicRpc = http(undefined, { batch: true });
const transport = rpcUrl ? fallback([http(rpcUrl, { batch: true }), publicRpc]) : publicRpc;
const transports = { [chain.id]: transport } as Record<number, typeof transport>;

export const config = createPrivyConfig({
  chains: [chain],
  transports,
  ssr: true,
});

export function createDevConfig(account: `0x${string}`) {
  return createWagmiConfig({
    chains: [chain],
    transports,
    connectors: [mock({ accounts: [account] })],
    storage: createStorage({ storage: noopStorage }),
    ssr: true,
  }) as unknown as typeof config;
}

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
