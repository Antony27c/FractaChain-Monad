"use client";

import { useAccount } from "wagmi";
import { DEV_ACCOUNTS } from "@/lib/dev";
import { useDevAccount } from "@/lib/dev-context";
import { shortAddress } from "@/lib/format";

export function DevAccountPicker() {
  const { index, setIndex } = useDevAccount();
  const { address } = useAccount();

  return (
    <div className="flex items-center gap-3">
      <span className="rounded-full bg-warn/10 px-3 py-1 text-xs font-medium text-warn">Modo dev</span>
      <select
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
        className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink"
      >
        {DEV_ACCOUNTS.map((account, i) => (
          <option key={account.address} value={i}>
            {account.label}
          </option>
        ))}
      </select>
      {address && <span className="hidden font-mono text-sm text-muted sm:inline">{shortAddress(address)}</span>}
    </div>
  );
}
