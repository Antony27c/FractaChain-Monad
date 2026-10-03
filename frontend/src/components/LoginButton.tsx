"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function LoginButton() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();

  if (!ready) {
    return (
      <button
        disabled
        className="rounded-full bg-neutral-200 px-4 py-2 text-sm text-neutral-500"
      >
        Cargando...
      </button>
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
      >
        Iniciar sesión
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {address && (
        <span className="font-mono text-sm text-neutral-600">
          {shortAddress(address)}
        </span>
      )}
      <button
        onClick={logout}
        className="rounded-full border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
