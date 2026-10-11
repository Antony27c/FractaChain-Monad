// Red de conexiones tipo constelación, saliendo de la esquina inferior derecha
export function CrystalBackdrop() {
  return (
    <div className="crystal-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -left-24 -top-28 h-[28rem] w-[28rem] rounded-full bg-[#8b5cf6] opacity-30 blur-[90px]" />
      <div className="absolute right-[-8rem] top-24 h-[32rem] w-[32rem] rounded-full bg-[#a78bfa] opacity-25 blur-[110px]" />
      <div className="absolute bottom-[-10rem] left-1/4 h-[26rem] w-[26rem] rounded-full bg-[#6d3fd1] opacity-30 blur-[100px]" />
      <div className="absolute right-1/3 top-1/2 h-64 w-64 rounded-full bg-[#a3ff2e] opacity-[0.12] blur-[80px]" />
      <div className="absolute bottom-10 right-[-4rem] h-72 w-72 rounded-full bg-[#7ee000] opacity-[0.09] blur-[90px]" />
      <svg
        viewBox="0 0 640 640"
        preserveAspectRatio="xMidYMid slice"
        className="logo-watermark absolute bottom-[-12%] right-[-10%] h-[130%] w-[85%]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
      >
        {/* malla fina de conexiones */}
        <g className="conn-mesh" strokeWidth="1.6">
          <path d="M500,80 L430,170 L340,240 L410,330 L330,410 L250,480 L180,560" />
          <path d="M560,140 L520,250 L470,330 L540,420 L610,480" />
          <path d="M430,170 L520,250 L610,200" />
          <path d="M500,80 L560,140 L610,200" />
          <path d="M340,240 L470,330 L390,470" />
          <path d="M410,330 L540,420 L480,540 L390,470" />
          <path d="M330,410 L390,470 L310,560 L250,480" />
          <path d="M540,420 L610,480 L560,570 L480,540" />
          <path d="M180,560 L310,560 L400,610 L480,540 L560,570 L630,540" />
          <path d="M250,480 L330,410 L340,240" />
          <path d="M610,480 L630,540" />
          <path d="M410,330 L330,410" />
          <path d="M470,330 L470,330" />
          <path d="M120,480 L180,560 L120,620" />
          <path d="M250,480 L120,480" />
        </g>
        {/* paquetes de luz viajando por la malla */}
        <g className="conn-line" strokeWidth="4" strokeDasharray="8 220" opacity="0.9">
          <path d="M500,80 L430,170 L340,240 L410,330 L330,410 L250,480 L180,560" />
          <path d="M560,140 L520,250 L470,330 L540,420 L610,480" />
          <path d="M180,560 L310,560 L400,610 L480,540 L560,570 L630,540" />
        </g>
        {/* nodos que brillan y pulsan */}
        <g fill="currentColor" stroke="none">
          <circle className="conn-node" cx="500" cy="80" r="5" />
          <circle className="conn-node" cx="430" cy="170" r="4" />
          <circle className="conn-node" cx="340" cy="240" r="5" />
          <circle className="conn-node" cx="410" cy="330" r="7" />
          <circle className="conn-node" cx="330" cy="410" r="5" />
          <circle className="conn-node" cx="250" cy="480" r="5" />
          <circle className="conn-node" cx="180" cy="560" r="6" />
          <circle className="conn-node" cx="560" cy="140" r="4" />
          <circle className="conn-node" cx="520" cy="250" r="6" />
          <circle className="conn-node" cx="470" cy="330" r="5" />
          <circle className="conn-node" cx="540" cy="420" r="6" />
          <circle className="conn-node" cx="610" cy="480" r="5" />
          <circle className="conn-node" cx="610" cy="200" r="4" />
          <circle className="conn-node" cx="390" cy="470" r="5" />
          <circle className="conn-node" cx="310" cy="560" r="5" />
          <circle className="conn-node" cx="400" cy="610" r="4" />
          <circle className="conn-node" cx="480" cy="540" r="6" />
          <circle className="conn-node" cx="560" cy="570" r="5" />
          <circle className="conn-node" cx="630" cy="540" r="4" />
          <circle className="conn-node" cx="120" cy="480" r="3.5" />
          <circle className="conn-node" cx="120" cy="620" r="3.5" />
          <circle className="conn-node" cx="340" cy="240" r="4" opacity="0.6" />
          <circle className="conn-node" cx="500" cy="80" r="3" opacity="0.5" />
        </g>
      </svg>
      <div className="liquid-sheen absolute inset-0 opacity-40" />
    </div>
  );
}
