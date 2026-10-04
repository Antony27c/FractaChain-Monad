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
      <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">Modo dev</span>
      <select
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
        className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
      >
        {DEV_ACCOUNTS.map((account, i) => (
          <option key={account.address} value={i}>
            {account.label}
          </option>
        ))}
      </select>
      {address && <span className="font-mono text-sm text-neutral-600">{shortAddress(address)}</span>}
    </div>
  );
}
