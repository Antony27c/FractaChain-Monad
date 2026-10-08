"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useExportWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { formatUnits } from "viem";
import { useBalance, useReadContracts } from "wagmi";
import { erc20Abi } from "@/lib/abi";
import { addresses } from "@/lib/env";
import { explorerUrl } from "@/lib/kuru";
import { formatShards, formatUsdc, shortAddress } from "@/lib/format";
import { button } from "@/lib/ui";
import { useLots } from "@/hooks/useLots";

const row = "flex justify-between gap-4";

export function AccountMenu({ address }: { address: `0x${string}` }) {
  const { user, linkEmail, linkGoogle } = usePrivy();
  const { exportWallet } = useExportWallet();
  const { wallets } = useWallets();
  const { lots } = useLots();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const embedded = wallets.some((w) => w.walletClientType === "privy" && w.address.toLowerCase() === address.toLowerCase());
  const { data: mon } = useBalance({ address, query: { enabled: open, refetchInterval: 12000 } });
  const { data } = useReadContracts({
    contracts: [
      { address: addresses.usdc, abi: erc20Abi, functionName: "balanceOf", args: [address] },
      ...lots.map((lot) => ({ address: lot.token, abi: erc20Abi, functionName: "balanceOf", args: [address] }) as const),
    ],
    query: { enabled: open, refetchInterval: 12000 },
  });
  const usdc = data?.[0]?.status === "success" ? (data[0].result as bigint) : undefined;
  const shards = lots
    .map((lot, i) => ({ lot, balance: data?.[i + 1]?.status === "success" ? (data[i + 1].result as bigint) : 0n }))
    .filter((s) => s.balance > 0n);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="rounded-lg px-2 py-1 font-mono text-sm text-muted transition-colors hover:bg-ink/5 hover:text-ink"
      >
        {shortAddress(address)}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-line bg-bg p-5 text-sm text-ink shadow-xl">
          <p className="font-semibold">Tu cuenta</p>
          {(user?.email?.address || user?.google?.email) && (
            <p className="mt-1 text-xs text-muted">{user?.email?.address ?? user?.google?.email}</p>
          )}

          <div className="mt-4">
            <p className="text-xs text-muted">Dirección</p>
            <p className="mt-1 break-all font-mono text-xs">{address}</p>
            <div className="mt-2 flex gap-2">
              <button onClick={copy} className={button.chip}>
                {copied ? "Copiada" : "Copiar"}
              </button>
              <a href={explorerUrl(address)} target="_blank" rel="noreferrer" className={button.chip}>
                Ver en el explorer
              </a>
            </div>
          </div>

          <dl className="mt-4 space-y-2 border-t border-line pt-4">
            <div className={row}>
              <dt className="text-muted">MON</dt>
              <dd className="font-mono tabular-nums">
                {mon ? Number(formatUnits(mon.value, mon.decimals)).toLocaleString("es-AR", { maximumFractionDigits: 4 }) : "..."}
              </dd>
            </div>
            <div className={row}>
              <dt className="text-muted">USDC</dt>
              <dd className="font-mono tabular-nums">{usdc !== undefined ? formatUsdc(usdc) : "..."}</dd>
            </div>
            {shards.map(({ lot, balance }) => (
              <div key={lot.token} className={row}>
                <dt className="text-muted">{lot.symbol}</dt>
                <dd className="font-mono tabular-nums">{formatShards(balance)}</dd>
              </div>
            ))}
          </dl>

          {embedded && (
            <p className="mt-3 text-xs text-muted">Wallet embebida de Privy. El gas lo paga la app: no necesitás MON.</p>
          )}

          <div className="mt-4 space-y-2 border-t border-line pt-4">
            <Link href="/actividad" onClick={() => setOpen(false)} className={`${button.primary} w-full`}>
              Mi actividad
            </Link>
            {embedded && (
              <button onClick={() => exportWallet({ address })} className={`${button.secondary} w-full`}>
                Exportar wallet
              </button>
            )}
            {!user?.email && (
              <button onClick={linkEmail} className={`${button.secondary} w-full`}>
                Vincular email
              </button>
            )}
            {!user?.google && (
              <button onClick={linkGoogle} className={`${button.secondary} w-full`}>
                Vincular Google
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
