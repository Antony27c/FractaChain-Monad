"use client";

import { parseUnits } from "viem";
import { erc20Abi } from "@/lib/abi";
import { addresses, USDC_DECIMALS, usdcMintable } from "@/lib/env";
import { button, notice } from "@/lib/ui";
import { useTx } from "@/hooks/useTx";
import { useT } from "@/lib/i18n";

const TEST_AMOUNT = parseUnits("1000", USDC_DECIMALS);

export function TestFundsButton({ account, balance }: { account?: `0x${string}`; balance?: bigint }) {
  const tx = useTx();
  const t = useT();
  const LABEL = t("Se cargaron 1.000 USDC de prueba", "1,000 test USDC loaded");

  if (!usdcMintable || !account || !addresses.usdc) return null;
  if (tx.success === LABEL) return <p className={notice.ok}>{LABEL}.</p>;
  if (balance === undefined || balance > 0n) return null;

  const load = () =>
    tx.run(LABEL, { address: addresses.usdc!, abi: erc20Abi, functionName: "mint", args: [account, TEST_AMOUNT] });

  return (
    <div className={notice.accent}>
      <p>{t("No tenés USDC. Es una red de prueba: cargá USDC de prueba para operar.", "You have no USDC. This is a test network: load test USDC to start.")}</p>
      <button onClick={load} disabled={tx.pending !== null} className={`${button.primary} mt-3 w-full`}>
        {tx.pending ? t("Cargando...", "Loading...") : t("Cargar 1.000 USDC de prueba", "Load 1,000 test USDC")}
      </button>
      {tx.error && <p className="mt-2 text-xs text-bad">{tx.error}</p>}
    </div>
  );
}
