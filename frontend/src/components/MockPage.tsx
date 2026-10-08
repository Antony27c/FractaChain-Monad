import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { MockDisclaimer } from "./MockDisclaimer";

export const mock = {
  chip: "inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-strong",
  pill: "rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-xs font-bold text-accent-strong",
  well: "rounded-xl border border-line bg-ink/5",
  card: "crystal-card rounded-3xl",
  label: "block text-[10px] text-muted",
  input: "w-full rounded-xl border border-line bg-bg/70 px-4 py-3 font-mono text-base font-bold text-ink focus:border-accent focus:outline-none",
  ok: "flex items-center gap-2 rounded-xl border border-ok/30 bg-ok/10 p-3 text-xs text-ok",
  action: "flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-3.5 text-xs font-bold text-bg transition-all disabled:opacity-50",
  danger: "flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3.5 text-xs font-bold text-white transition-all hover:bg-red-400 disabled:opacity-50",
};

export function selectable(selected: boolean) {
  return `${mock.card} cursor-pointer transition-all ${selected ? "ring-1 ring-accent" : "hover:ring-1 hover:ring-line"}`;
}

export function MockPageHeader({
  icon: Icon,
  chip,
  title,
  lead,
  product,
}: {
  icon: LucideIcon;
  chip: string;
  title: string;
  lead: ReactNode;
  product: string;
}) {
  return (
    <div className="space-y-2">
      <div className={mock.chip}>
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {chip}
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
      <p className="max-w-2xl text-xs text-muted sm:text-sm">{lead}</p>
      <MockDisclaimer product={product} />
    </div>
  );
}
