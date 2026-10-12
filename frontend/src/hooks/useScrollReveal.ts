import { useEffect, useRef } from "react";

export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets: HTMLElement[] = [];
    Array.from(root.querySelectorAll<HTMLElement>("section"))
      .slice(1)
      .forEach((section) => {
        targets.push(section);
        const items = section.classList.contains("grid") ? section.children : section.querySelectorAll(".grid > *");
        Array.from(items as Iterable<HTMLElement>).forEach((el, i) => {
          el.style.setProperty("--reveal-i", String(i % 6));
          targets.push(el);
        });
      });

    const timers: ReturnType<typeof setTimeout>[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.dataset.reveal = "shown";
          timers.push(setTimeout(() => (el.dataset.reveal = "done"), 1400));
          observer.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );

    for (const el of targets) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
        el.dataset.reveal = "done";
      } else {
        el.dataset.reveal = "hidden";
        observer.observe(el);
      }
    }
    root.dataset.scrollReveal = "";

    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
    };
  }, []);

  return ref;
}
