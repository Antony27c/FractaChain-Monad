import type { LotStatus } from "@/hooks/useLots";

const STYLES: Record<LotStatus, { label: string; className: string }> = {
  active: { label: "Abierta", className: "bg-emerald-100 text-emerald-800" },
  ready: { label: "Lista para finalizar", className: "bg-amber-100 text-amber-800" },
  succeeded: { label: "Exitosa", className: "bg-violet-100 text-violet-800" },
  failed: { label: "No alcanzó el mínimo", className: "bg-red-100 text-red-800" },
};

export function StatusBadge({ status }: { status: LotStatus }) {
  const { label, className } = STYLES[status];
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>{label}</span>;
}
