"use client";

import { useAccount, useReadContracts } from "wagmi";
import { erc20Abi, kycRegistryAbi, offeringAbi } from "@/lib/abi";
import { addresses } from "@/lib/env";

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
    query: { enabled, refetchInterval: 4000 },
  });

  return {
    address,
    verified: (data?.[0].result as boolean | undefined) ?? false,
    openVerification: (data?.[1].result as boolean | undefined) ?? false,
    usdcBalance: (data?.[2].result as bigint | undefined) ?? 0n,
    allowance: (data?.[3].result as bigint | undefined) ?? 0n,
    contribution: (data?.[4].result as bigint | undefined) ?? 0n,
  };
}

export function useVerification() {
  const { address } = useAccount();
  const { data } = useReadContracts({
    contracts: [
      { address: addresses.kyc, abi: kycRegistryAbi, functionName: "isVerified", args: [address!] },
      { address: addresses.kyc, abi: kycRegistryAbi, functionName: "openVerification" },
    ],
    query: { enabled: Boolean(address && addresses.kyc), refetchInterval: 4000 },
  });
  return {
    address,
    verified: (data?.[0].result as boolean | undefined) ?? false,
    openVerification: (data?.[1].result as boolean | undefined) ?? false,
  };
}
