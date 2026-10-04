"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { useI18n } from "@/lib/i18n";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function LoginButton() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();
  const { t } = useI18n();

  if (!ready) {
    return (
      <button disabled className="rounded-full bg-line px-4 py-2 text-sm text-muted">
        {t("auth.loading")}
      </button>
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="btn-lcd btn-lcd-solid px-4 py-2 text-xs transition active:scale-[0.98]"
      >
        {t("auth.login")}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {address && <span className="font-mono text-sm text-muted">{shortAddress(address)}</span>}
      <button
        onClick={logout}
        className="btn-lcd btn-lcd-ghost px-4 py-2 text-xs transition active:scale-[0.98]"
      >
        {t("auth.logout")}
      </button>
    </div>
  );
}
