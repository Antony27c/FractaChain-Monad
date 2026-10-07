"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePublicClient, useWriteContract } from "wagmi";
import type { Abi, TransactionReceipt } from "viem";
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

  async function runWithReceipts(
    label: string,
    requests: TxRequest | TxRequest[],
    onStep?: (index: number, total: number) => void,
  ): Promise<TransactionReceipt[] | null> {
    setPending(label);
    setError(null);
    setSuccess(null);
    try {
      const list = Array.isArray(requests) ? requests : [requests];
      const receipts: TransactionReceipt[] = [];
      for (const [i, request] of list.entries()) {
        onStep?.(i, list.length);
        const hash = await writeContractAsync(request as never);
        const receipt = await publicClient?.waitForTransactionReceipt({ hash });
        if (receipt) receipts.push(receipt);
      }
      await queryClient.invalidateQueries();
      setSuccess(label);
      return receipts;
    } catch (e) {
      setError(errorMessage(e));
      return null;
    } finally {
      setPending(null);
    }
  }

  async function run(label: string, requests: TxRequest | TxRequest[]) {
    return (await runWithReceipts(label, requests)) !== null;
  }

  return { run, runWithReceipts, pending, error, success };
}
