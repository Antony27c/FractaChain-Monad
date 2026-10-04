const buttonBase =
  "btn-lcd px-5 py-2.5 text-xs transition active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 whitespace-nowrap";

export const button = {
  primary: `${buttonBase} btn-lcd-solid`,
  secondary: `${buttonBase} btn-lcd-ghost`,
  chip: "rounded-xl border border-line bg-surface px-3 py-1 text-xs font-bold tabular-nums transition hover:bg-ink/5 active:scale-[0.98]",
};

export const field =
  "mt-2 w-full rounded-xl border border-line bg-bg/70 px-3 py-2 text-ink transition-colors placeholder:text-muted focus:border-accent";

export const panel = "crystal-card rounded-2xl";

export const notice = {
  ok: "rounded-2xl border border-ok/30 bg-ok/10 p-4 text-sm text-ok",
  warn: "rounded-2xl border border-warn/30 bg-warn/10 p-4 text-sm text-warn",
  bad: "rounded-2xl border border-bad/30 bg-bad/10 p-4 text-sm text-bad",
  accent: "rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm text-ink",
};
