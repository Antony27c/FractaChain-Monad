"use client";

import { parseUnits } from "viem";
import { erc20Abi } from "@/lib/abi";
import { addresses, USDC_DECIMALS, usdcMintable } from "@/lib/env";
import { button, notice } from "@/lib/ui";
import { useTx } from "@/hooks/useTx";

const TEST_AMOUNT = parseUnits("1000", USDC_DECIMALS);
const LABEL = "Se cargaron 1.000 USDC de prueba";

export function TestFundsButton({ account, balance }: { account?: `0x${string}`; balance?: bigint }) {
  const tx = useTx();

  if (!usdcMintable || !account || !addresses.usdc) return null;
  if (tx.success === LABEL) return <p className={notice.ok}>{LABEL}.</p>;
  if (balance === undefined || balance > 0n) return null;

  const load = () =>
    tx.run(LABEL, { address: addresses.usdc!, abi: erc20Abi, functionName: "mint", args: [account, TEST_AMOUNT] });

  return (
    <div className={notice.accent}>
      <p>No tenés USDC. Es una red de prueba: cargá USDC de prueba para operar.</p>
      <button onClick={load} disabled={tx.pending !== null} className={`${button.primary} mt-3 w-full`}>
        {tx.pending ? "Cargando..." : "Cargar 1.000 USDC de prueba"}
      </button>
      {tx.error && <p className="mt-2 text-xs text-bad">{tx.error}</p>}
    </div>
  );
}
