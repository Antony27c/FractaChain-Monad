"use client";

import type { LotStatus } from "@/hooks/useLots";
import { useT } from "@/lib/i18n";

const STYLES: Record<LotStatus, { label: [string, string]; className: string }> = {
  active: { label: ["Abierta", "Open"], className: "bg-ok/10 text-ok" },
  ready: { label: ["Lista para finalizar", "Ready to finalize"], className: "bg-warn/10 text-warn" },
  succeeded: { label: ["Exitosa", "Succeeded"], className: "bg-accent/10 text-accent" },
  failed: { label: ["No alcanzó el mínimo", "Minimum not reached"], className: "bg-bad/10 text-bad" },
};

export function StatusBadge({ status }: { status: LotStatus }) {
  const t = useT();
  const { label, className } = STYLES[status];
  return (
    <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {t(...label)}
    </span>
  );
}
