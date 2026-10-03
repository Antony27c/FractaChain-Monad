import Link from "next/link";
import { LoginButton } from "./LoginButton";

export function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          ShardChain
        </Link>
        <LoginButton />
      </div>
    </header>
  );
}
