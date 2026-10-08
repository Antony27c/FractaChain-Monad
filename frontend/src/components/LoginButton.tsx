"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { AccountMenu } from "@/components/AccountMenu";

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

  if (!address) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-xs text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {t("auth.preparing")}
      </span>
    );
  }

  return <AccountMenu address={address} onLogout={logout} />;
}
