import type { LotStatus } from "@/hooks/useLots";

const STYLES: Record<LotStatus, { label: string; className: string }> = {
  active: { label: "Abierta", className: "bg-ok/10 text-ok" },
  ready: { label: "Lista para finalizar", className: "bg-warn/10 text-warn" },
  succeeded: { label: "Exitosa", className: "bg-accent/10 text-accent" },
  failed: { label: "No alcanzó el mínimo", className: "bg-bad/10 text-bad" },
};

export function StatusBadge({ status }: { status: LotStatus }) {
  const { label, className } = STYLES[status];
  return (
    <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
