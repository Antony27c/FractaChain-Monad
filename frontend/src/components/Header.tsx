import Link from "next/link";
import { LoginButton } from "./LoginButton";
import { DevAccountPicker } from "./DevAccountPicker";
import { isDevMode } from "@/lib/env";

export function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            ShardChain
          </Link>
          <nav className="flex items-center gap-5 text-sm text-neutral-600">
            <Link href="/" className="hover:text-neutral-900">
              Lotes
            </Link>
            <Link href="/create" className="hover:text-neutral-900">
              Emitir lote
            </Link>
          </nav>
        </div>
        {isDevMode ? <DevAccountPicker /> : <LoginButton />}
      </div>
    </header>
  );
}
