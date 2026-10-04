"use client";

import { useState } from "react";
import { createTestClient, http, parseUnits } from "viem";
import { useAccount, useBlock } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { erc20Abi } from "@/lib/abi";
import { addresses, chain, isDevMode, isLocal, rpcUrl } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { useTx } from "@/hooks/useTx";

export function DevTools() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { data: block } = useBlock({ query: { refetchInterval: 3000 } });
  const tx = useTx();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isDevMode || !isLocal) return null;

  const advance = async (days: number) => {
    setMessage(null);
    try {
      const client = createTestClient({ chain, mode: "anvil", transport: http(rpcUrl) });
      await client.increaseTime({ seconds: days * 86400 });
      await client.mine({ blocks: 1 });
      await queryClient.invalidateQueries();
      setMessage(`Se avanzaron ${days} día(s).`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No se pudo avanzar el tiempo.");
    }
  };

  const mint = () =>
    address &&
    tx.run("USDC cargado", {
      address: addresses.usdc!,
      abi: erc20Abi,
      functionName: "mint",
      args: [address, parseUnits("10000", 6)],
    });

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 text-sm">
      {open ? (
        <div className="rounded-2xl border border-warn/50 bg-surface p-4 text-ink shadow-lg">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Herramientas dev</span>
            <button onClick={() => setOpen(false)} className="text-muted hover:text-ink">
              Cerrar
            </button>
          </div>
          {block && <p className="mt-2 text-xs text-muted">Hora de la cadena: {formatDate(block.timestamp)}</p>}
          <div className="mt-3 space-y-2">
            <button
              onClick={mint}
              disabled={!address || tx.pending !== null}
              className="w-full rounded-lg border border-line px-3 py-2 hover:bg-bg disabled:opacity-50"
            >
              Cargar 10.000 USDC de prueba
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => advance(1)}
                className="flex-1 rounded-lg border border-line px-3 py-2 hover:bg-bg"
              >
                +1 día
              </button>
              <button
                onClick={() => advance(7)}
                className="flex-1 rounded-lg border border-line px-3 py-2 hover:bg-bg"
              >
                +7 días
              </button>
            </div>
          </div>
          {(message || tx.error || tx.success) && (
            <p className="mt-3 text-xs text-muted">{tx.error ?? message ?? tx.success}</p>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="ml-auto block rounded-full bg-warn px-4 py-2 font-medium text-bg shadow-lg transition active:scale-[0.98]"
        >
          Dev
        </button>
      )}
    </div>
  );
}
