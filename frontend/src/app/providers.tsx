"use client";

import { useEffect, useMemo, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { WagmiProvider as PlainWagmiProvider, useConnect } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config, createDevConfig } from "@/lib/wagmi";
import { chain, isDevMode } from "@/lib/env";
import { DEV_ACCOUNTS, DEV_ACCOUNT_KEY } from "@/lib/dev";
import { DevAccountContext } from "@/lib/dev-context";

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

function DevAutoConnect() {
  const { connect, connectors } = useConnect();
  useEffect(() => {
    if (connectors[0]) connect({ connector: connectors[0] });
  }, [connect, connectors]);
  return null;
}

function DevProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [index, setIndexState] = useState(0);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(DEV_ACCOUNT_KEY));
    if (Number.isInteger(saved) && saved >= 0 && saved < DEV_ACCOUNTS.length) setIndexState(saved);
  }, []);

  const setIndex = (next: number) => {
    window.localStorage.setItem(DEV_ACCOUNT_KEY, String(next));
    setIndexState(next);
  };

  const devConfig = useMemo(() => createDevConfig(DEV_ACCOUNTS[index].address), [index]);

  return (
    <DevAccountContext.Provider value={{ index, setIndex }}>
      <QueryClientProvider client={queryClient}>
        <PlainWagmiProvider key={index} config={devConfig}>
          <DevAutoConnect />
          {children}
        </PlainWagmiProvider>
      </QueryClientProvider>
    </DevAccountContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  if (isDevMode) return <DevProviders>{children}</DevProviders>;

  if (!privyAppId) {
    return (
      <p className="p-8 text-center text-red-600">
        Falta <code>NEXT_PUBLIC_PRIVY_APP_ID</code>. Copiá{" "}
        <code>.env.example</code> a <code>.env.local</code> y poné el App ID de
        Privy.
      </p>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ["email", "google", "wallet"],
        defaultChain: chain,
        supportedChains: [chain],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
