"use client";

import { useRef } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { erc20Abi, kycRegistryAbi, offeringAbi } from "@/lib/abi";
import { addresses } from "@/lib/env";

type Result = { status: string; result?: unknown };

function useSticky(key: string, data: readonly Result[] | undefined) {
  const last = useRef<{ key: string; values: unknown[] }>({ key, values: [] });
  if (last.current.key !== key) last.current = { key, values: [] };
  data?.forEach((r, i) => {
    if (r.status === "success") last.current.values[i] = r.result;
  });
  return last.current.values;
}

export function useInvestor(offering?: `0x${string}`) {
  const { address } = useAccount();
  const enabled = Boolean(address && offering && addresses.kyc && addresses.usdc);

  const { data } = useReadContracts({
    contracts: [
      { address: addresses.kyc, abi: kycRegistryAbi, functionName: "isVerified", args: [address!] },
      { address: addresses.kyc, abi: kycRegistryAbi, functionName: "openVerification" },
      { address: addresses.usdc, abi: erc20Abi, functionName: "balanceOf", args: [address!] },
      { address: addresses.usdc, abi: erc20Abi, functionName: "allowance", args: [address!, offering!] },
      { address: offering, abi: offeringAbi, functionName: "contributions", args: [address!] },
    ],
    query: { enabled, refetchInterval: 12000 },
  });

  const v = useSticky(`${address}-${offering}`, data);

  return {
    address,
    ready: v[0] !== undefined && v[2] !== undefined,
    verified: (v[0] as boolean | undefined) ?? false,
    openVerification: (v[1] as boolean | undefined) ?? false,
    usdcBalance: (v[2] as bigint | undefined) ?? 0n,
    allowance: (v[3] as bigint | undefined) ?? 0n,
    contribution: (v[4] as bigint | undefined) ?? 0n,
  };
}

export function useVerification() {
  const { address } = useAccount();
  const { data } = useReadContracts({
    contracts: [
      { address: addresses.kyc, abi: kycRegistryAbi, functionName: "isVerified", args: [address!] },
      { address: addresses.kyc, abi: kycRegistryAbi, functionName: "openVerification" },
    ],
    query: { enabled: Boolean(address && addresses.kyc), refetchInterval: 12000 },
  });

  const v = useSticky(`${address}`, data);

  return {
    address,
    ready: v[0] !== undefined,
    verified: (v[0] as boolean | undefined) ?? false,
    openVerification: (v[1] as boolean | undefined) ?? false,
  };
}
