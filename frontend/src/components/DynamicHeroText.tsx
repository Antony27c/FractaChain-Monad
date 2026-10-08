"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLanding } from "@/lib/landing";

export function DynamicHeroText() {
  const { hero } = useLanding();
  const sectors = hero.sectors;
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slotWidth, setSlotWidth] = useState<number | null>(null);
  const measureRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const active = index % sectors.length;
  const current = sectors[active];

  const measureActive = useCallback(() => {
    const el = measureRefs.current[active];
    if (!el) return;
    // Italic glyphs paint a little past the box; a few px avoids clipping the last letter.
    const next = Math.ceil(el.getBoundingClientRect().width) + 6;
    setSlotWidth((prev) => (prev === next ? prev : next));
  }, [active]);

  useLayoutEffect(() => {
    measureActive();
  }, [measureActive, sectors]);

  useEffect(() => {
    const onResize = () => measureActive();
    window.addEventListener("resize", onResize);
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measureActive();
    });
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [measureActive]);

  useEffect(() => {
    let swap: ReturnType<typeof setTimeout>;
    const timer = setInterval(() => {
      setIsAnimating(true);
      swap = setTimeout(() => {
        setIndex((prev) => (prev + 1) % sectors.length);
        setIsAnimating(false);
      }, 400);
    }, 4500);
    return () => {
      clearInterval(timer);
      clearTimeout(swap);
    };
  }, [sectors.length]);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 px-1">
      <h1 className="flex max-w-full flex-wrap items-baseline justify-center gap-x-[0.28em] gap-y-0 text-center text-[2.15rem] font-extrabold leading-[1.15] tracking-tight text-ink sm:text-[3.45rem] xl:text-[3.9rem]">
        <span>{hero.invert}</span>
        <span className="hero-lcd relative inline-block max-w-full align-baseline text-[1.02em] sm:text-[1.04em]">
          <span className="pointer-events-none absolute left-0 top-0 -z-10 h-0 overflow-hidden opacity-0" aria-hidden>
            {sectors.map((s, i) => (
              <span
                key={`measure-${s.text}`}
                ref={(node) => {
                  measureRefs.current[i] = node;
                }}
                className="inline-block whitespace-nowrap"
              >
                {s.text}
              </span>
            ))}
          </span>
          <span
            className="hero-slot inline-block min-w-0 whitespace-nowrap align-baseline leading-[1.15] transition-[width] duration-500 ease-out"
            style={{ width: slotWidth ?? undefined }}
          >
            <span
              className={`inline whitespace-nowrap transition-opacity duration-500 ease-out ${
                isAnimating ? "opacity-0" : "opacity-100"
              }`}
            >
              {current.text}
            </span>
          </span>
        </span>
      </h1>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-full border border-line bg-surface px-3.5 py-1 text-xs font-medium text-muted">
          {current.tag}
        </span>
        <span className="rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1 font-lcd text-xs text-accent-strong">
          {current.yieldEst}
        </span>
      </div>
    </div>
  );
}
