"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePublicClient, useWriteContract } from "wagmi";
import type { Abi } from "viem";
import { errorMessage } from "@/lib/errors";

export type TxRequest = {
  address: `0x${string}`;
  abi: Abi | readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
};

export function useTx() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function run(label: string, requests: TxRequest | TxRequest[]) {
    setPending(label);
    setError(null);
    setSuccess(null);
    try {
      for (const request of Array.isArray(requests) ? requests : [requests]) {
        const hash = await writeContractAsync(request as never);
        await publicClient?.waitForTransactionReceipt({ hash });
      }
      await queryClient.invalidateQueries();
      setSuccess(label);
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      setPending(null);
    }
  }

  return { run, pending, error, success };
}
