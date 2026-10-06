"use client";

import { useRef } from "react";
import { useBlock, useReadContract, useReadContracts } from "wagmi";
import { issuanceFactoryAbi, offeringAbi, shardTokenAbi } from "@/lib/abi";
import { addresses } from "@/lib/env";

export type LotStatus = "active" | "ready" | "succeeded" | "failed";

export type Lot = {
  id: number;
  issuer: `0x${string}`;
  token: `0x${string}`;
  offering: `0x${string}`;
  name: string;
  symbol: string;
  asset: { assetType: string; unit: string; quantity: bigint; campaign: string };
  rawStatus: number;
  status: LotStatus;
  totalRaised: bigint;
  softCap: bigint;
  hardCap: bigint;
  deadline: bigint;
  pricePerShard: bigint;
};

const POLL = { refetchInterval: 12000 };

export function useNow() {
  const { data } = useBlock({ query: POLL });
  return data?.timestamp ?? BigInt(Math.floor(Date.now() / 1000));
}

export function useLots() {
  const now = useNow();
  const factory = addresses.factory;
  const lastGood = useRef(new Map<string, Lot>());

  const issuances = useReadContract({
    address: factory,
    abi: issuanceFactoryAbi,
    functionName: "getIssuances",
    query: { ...POLL, enabled: Boolean(factory) },
  });

  const list = issuances.data ?? [];
  const contracts = list.flatMap((i) => [
    { address: i.token, abi: shardTokenAbi, functionName: "name" },
    { address: i.token, abi: shardTokenAbi, functionName: "symbol" },
    { address: i.token, abi: shardTokenAbi, functionName: "asset" },
    { address: i.offering, abi: offeringAbi, functionName: "status" },
    { address: i.offering, abi: offeringAbi, functionName: "totalRaised" },
    { address: i.offering, abi: offeringAbi, functionName: "softCap" },
    { address: i.offering, abi: offeringAbi, functionName: "hardCap" },
    { address: i.offering, abi: offeringAbi, functionName: "deadline" },
    { address: i.offering, abi: offeringAbi, functionName: "pricePerShard" },
  ]);

  const details = useReadContracts({
    contracts,
    query: { ...POLL, enabled: list.length > 0 },
  });

  const FIELDS = 9;
  const lots: Lot[] = [];
  let incomplete = false;
  list.forEach((issuance, id) => {
    const r = details.data?.slice(id * FIELDS, (id + 1) * FIELDS).map((x) => x.result);
    if (!r || r.some((x) => x === undefined)) {
      const last = lastGood.current.get(issuance.offering);
      if (last) lots.push(last);
      else incomplete = true;
      return;
    }
    const rawStatus = Number(r[3]);
    const totalRaised = r[4] as bigint;
    const hardCap = r[6] as bigint;
    const deadline = r[7] as bigint;
    const status: LotStatus =
      rawStatus === 1 ? "succeeded" : rawStatus === 2 ? "failed" : now >= deadline || totalRaised >= hardCap ? "ready" : "active";
    const lot: Lot = {
      id,
      issuer: issuance.issuer,
      token: issuance.token,
      offering: issuance.offering,
      name: r[0] as string,
      symbol: r[1] as string,
      asset: r[2] as Lot["asset"],
      rawStatus,
      status,
      totalRaised,
      softCap: r[5] as bigint,
      hardCap,
      deadline,
      pricePerShard: r[8] as bigint,
    };
    lastGood.current.set(issuance.offering, lot);
    lots.push(lot);
  });

  return {
    lots: lots.reverse(),
    isLoading:
      Boolean(factory) &&
      !issuances.error &&
      !details.error &&
      (issuances.data === undefined || incomplete || (list.length > 0 && details.data === undefined)),
    error: issuances.error ?? details.error,
  };
}
