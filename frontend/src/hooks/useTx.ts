"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { useSendTransaction, useWallets } from "@privy-io/react-auth";
import { encodeFunctionData, type Abi, type TransactionReceipt } from "viem";
import { chain, isDevMode } from "@/lib/env";
import { errorMessage } from "@/lib/errors";

export type TxRequest = {
  address: `0x${string}`;
  abi: Abi | readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
};

type SendRequest = (request: TxRequest) => Promise<`0x${string}`>;

function useTxRunner(sendRequest: SendRequest) {
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
        const hash = await sendRequest(request);
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

function useDevTx() {
  const { writeContractAsync } = useWriteContract();
  return { ...useTxRunner((request) => writeContractAsync(request as never)), sponsored: false };
}

const isSponsorshipFailure = (e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  return !/reject|denied|cancel/i.test(message) && /sponsor|paymaster|credit/i.test(message);
};

// Con la wallet embebida de Privy el gas lo paga la app (gas sponsorship), así que el
// usuario puede operar sin tener MON. Con una wallet externa se firma como siempre.
function usePrivyTx() {
  const { writeContractAsync } = useWriteContract();
  const { sendTransaction } = useSendTransaction();
  const { wallets } = useWallets();
  const { address } = useAccount();

  const embedded = wallets.find(
    (w) => w.walletClientType === "privy" && w.address.toLowerCase() === address?.toLowerCase(),
  );

  const send: SendRequest = async (request) => {
    if (!embedded) return writeContractAsync(request as never);
    const transaction = {
      to: request.address,
      data: encodeFunctionData({
        abi: request.abi as Abi,
        functionName: request.functionName,
        args: request.args as never,
      }),
      chainId: chain.id,
    };
    try {
      return (await sendTransaction(transaction, { sponsor: true, address: embedded.address })).hash;
    } catch (e) {
      if (!isSponsorshipFailure(e)) throw e;
      return (await sendTransaction(transaction, { address: embedded.address })).hash;
    }
  };

  return { ...useTxRunner(send), sponsored: Boolean(embedded) };
}

export const useTx = isDevMode ? useDevTx : usePrivyTx;
