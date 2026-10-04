import { http } from "wagmi";
import { monadTestnet } from "viem/chains";
import { createConfig } from "@privy-io/wagmi";

export const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
