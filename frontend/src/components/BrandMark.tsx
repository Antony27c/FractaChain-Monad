import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5" aria-label="FractaChain">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt=""
        className="logo-lockup h-8 w-auto max-w-[6.5rem] shrink-0 object-contain object-left sm:h-9 sm:max-w-[8rem]"
      />
      {!compact && (
        <span className="whitespace-nowrap text-base font-extrabold leading-none tracking-[-0.04em] text-ink max-[379px]:hidden sm:text-[1.45rem]">
          FractaChain
        </span>
      )}
    </Link>
  );
}
