"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useLanding } from "@/lib/landing";

export function MockDisclaimer({ product }: { product: string }) {
  const { mock } = useLanding();
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <p className="font-bold">{mock.title}</p>
        <p className="mt-1">
          {mock.body.replace("{product}", product)}{" "}
          <Link href="/market" className="font-bold underline underline-offset-2">
            {mock.listing}
          </Link>
          {mock.tail}
        </p>
      </div>
    </div>
  );
}
