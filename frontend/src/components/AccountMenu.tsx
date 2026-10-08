"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useExportWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { formatUnits } from "viem";
import { useBalance, useReadContracts } from "wagmi";
import { Check, ChevronDown, Copy, ExternalLink, History, KeyRound, LogOut, Mail, Wallet, Zap } from "lucide-react";
import { erc20Abi } from "@/lib/abi";
import { addresses } from "@/lib/env";
import { explorerUrl } from "@/lib/kuru";
import { formatShards, formatUsdc, shortAddress } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useLots } from "@/hooks/useLots";

const row = "flex items-center justify-between gap-4 py-1.5";
const iconBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-ink/5 hover:text-ink";
const menuItem =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-ink/5";

export function AccountMenu({ address, onLogout }: { address: `0x${string}`; onLogout: () => void }) {
  const { user, linkEmail, linkGoogle } = usePrivy();
  const { exportWallet } = useExportWallet();
  const { wallets } = useWallets();
  const { lots } = useLots();
  const { t } = useI18n();
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
  const email = user?.email?.address ?? user?.google?.email;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
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
        aria-haspopup="menu"
        className={`inline-flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-3 text-left transition-colors ${
          open ? "border-accent bg-accent/10" : "border-line bg-surface hover:border-accent/60"
        }`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-accent-strong">
          <Wallet className="h-4 w-4" />
        </span>
        <span className="leading-tight">
          <span className="block text-xs font-bold text-ink">{t("auth.wallet")}</span>
          <span className="hidden font-mono text-[10px] text-muted sm:block">{shortAddress(address)}</span>
        </span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-bg text-sm text-ink shadow-xl"
        >
          <div className="border-b border-line bg-accent/10 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/25 text-accent-strong">
                <Wallet className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">{t("auth.wallet")}</p>
                {email && <p className="truncate text-xs text-muted">{email}</p>}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-line bg-bg px-3 py-2">
              <span className="font-mono text-xs">{shortAddress(address)}</span>
              <div className="flex gap-1.5">
                <button onClick={copy} className={iconBtn} aria-label="Copiar dirección">
                  {copied ? <Check className="h-3.5 w-3.5 text-ok" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiada" : "Copiar"}
                </button>
                <a href={explorerUrl(address)} target="_blank" rel="noreferrer" className={iconBtn} aria-label="Ver en el explorer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Explorer
                </a>
              </div>
            </div>
          </div>

          <div className="p-5">
            <p className="text-xs text-muted">Saldo disponible</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{usdc !== undefined ? formatUsdc(usdc) : "..."}</p>

            <dl className="mt-4 divide-y divide-line rounded-xl border border-line px-3">
              {shards.map(({ lot, balance }) => (
                <div key={lot.token} className={row}>
                  <dt className="font-medium">{lot.symbol}</dt>
                  <dd className="font-mono tabular-nums">{formatShards(balance)}</dd>
                </div>
              ))}
              <div className={row}>
                <dt className="text-muted">MON</dt>
                <dd className="font-mono tabular-nums text-muted">
                  {mon ? Number(formatUnits(mon.value, mon.decimals)).toLocaleString("es-AR", { maximumFractionDigits: 4 }) : "..."}
                </dd>
              </div>
            </dl>

            {embedded && (
              <p className="mt-3 flex items-start gap-2 text-xs text-muted">
                <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-strong" />
                El gas lo paga la app: no necesitás MON para operar.
              </p>
            )}
          </div>

          <div className="border-t border-line p-2">
            <Link href="/actividad" onClick={() => setOpen(false)} className={menuItem}>
              <History className="h-4 w-4 text-muted" />
              Mi actividad
            </Link>
            {embedded && (
              <button onClick={() => exportWallet({ address })} className={menuItem}>
                <KeyRound className="h-4 w-4 text-muted" />
                Exportar wallet
              </button>
            )}
            {!user?.email && (
              <button onClick={linkEmail} className={menuItem}>
                <Mail className="h-4 w-4 text-muted" />
                Vincular email
              </button>
            )}
            {!user?.google && (
              <button onClick={linkGoogle} className={menuItem}>
                <Mail className="h-4 w-4 text-muted" />
                Vincular Google
              </button>
            )}
            <button onClick={onLogout} className={`${menuItem} text-bad`}>
              <LogOut className="h-4 w-4" />
              {t("auth.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
