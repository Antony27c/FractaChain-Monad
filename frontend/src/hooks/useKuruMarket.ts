"use client";

import { useEffect, useState } from "react";
import { useReadContracts } from "wagmi";
import { candidateMarket, kuruMarketAbi, saveMarket } from "@/lib/kuru";

export function useKuruMarket(token: `0x${string}`) {
  const [candidate, setCandidate] = useState<`0x${string}` | undefined>(undefined);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setCandidate(candidateMarket(token));
    setChecked(true);
  }, [token]);

  const { data, isLoading } = useReadContracts({
    contracts: [
      { address: candidate, abi: kuruMarketAbi, functionName: "getMarketParams" },
      { address: candidate, abi: kuruMarketAbi, functionName: "getVaultParams" },
      { address: candidate, abi: kuruMarketAbi, functionName: "bestBidAsk" },
    ],
    query: { enabled: Boolean(candidate), refetchInterval: 12000 },
  });

  const params = data?.[0]?.status === "success" ? data[0].result : undefined;
  const vaultParams = data?.[1]?.status === "success" ? data[1].result : undefined;
  const book = data?.[2]?.status === "success" ? data[2].result : undefined;
  const valid = Boolean(candidate && params && params[2].toLowerCase() === token.toLowerCase());

  return {
    loading: !checked || (Boolean(candidate) && isLoading),
    market: valid ? candidate : undefined,
    vault: valid ? vaultParams?.[0] : undefined,
    bid: valid ? book?.[0] : undefined,
    ask: valid ? book?.[1] : undefined,
    info:
      valid && candidate && params
        ? {
            address: candidate,
            pricePrecision: BigInt(params[0]),
            sizePrecision: params[1],
            baseDecimals: Number(params[3]),
            quote: params[4],
            quoteDecimals: Number(params[5]),
          }
        : undefined,
    takerFeeBps: valid ? params?.[9] : undefined,
    makerFeeBps: valid ? params?.[10] : undefined,
    register: (market: `0x${string}`) => {
      saveMarket(token, market);
      setCandidate(market);
    },
  };
}
