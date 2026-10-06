import { createConfig as createWagmiConfig, createStorage, http, noopStorage } from "wagmi";
import { mock } from "wagmi/connectors";
import { createConfig as createPrivyConfig } from "@privy-io/wagmi";
import { chain, rpcUrl } from "@/lib/env";

const transports = { [chain.id]: http(rpcUrl, { batch: true }) } as Record<number, ReturnType<typeof http>>;

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
