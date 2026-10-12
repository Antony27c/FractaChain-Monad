"use client";

import { usePathname } from "next/navigation";

const MESH = [
  "M500,80 L430,170 L340,240 L410,330 L330,410 L250,480 L180,560",
  "M560,140 L520,250 L470,330 L540,420 L610,480",
  "M430,170 L520,250 L610,200",
  "M500,80 L560,140 L610,200",
  "M340,240 L470,330 L390,470",
  "M410,330 L540,420 L480,540 L390,470",
  "M330,410 L390,470 L310,560 L250,480",
  "M540,420 L610,480 L560,570 L480,540",
  "M180,560 L310,560 L400,610 L480,540 L560,570 L630,540",
  "M250,480 L330,410 L340,240",
  "M610,480 L630,540",
  "M120,480 L180,560 L120,620",
  "M250,480 L120,480",
];

const PULSES = [MESH[0], MESH[1], MESH[8]];

const NODES: [number, number, number][] = [
  [500, 80, 5], [430, 170, 4], [340, 240, 5], [410, 330, 7], [330, 410, 5], [250, 480, 5],
  [180, 560, 6], [560, 140, 4], [520, 250, 6], [470, 330, 5], [540, 420, 6], [610, 480, 5],
  [610, 200, 4], [390, 470, 5], [310, 560, 5], [400, 610, 4], [480, 540, 6], [560, 570, 5],
  [630, 540, 4], [120, 480, 3.5], [120, 620, 3.5],
];

export function CrystalBackdrop() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <svg
        viewBox="0 0 640 640"
        preserveAspectRatio="xMidYMid slice"
        className="node-network absolute bottom-[-12%] right-[-10%] h-[130%] w-[85%]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
      >
        <g className="node-mesh" strokeWidth="1.6">
          {MESH.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g className="node-pulse" strokeWidth="4" strokeDasharray="8 220" opacity="0.9">
          {PULSES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <g fill="currentColor" stroke="none">
          {NODES.map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} className="node-dot" cx={cx} cy={cy} r={r} />
          ))}
        </g>
      </svg>
    </div>
  );
}
