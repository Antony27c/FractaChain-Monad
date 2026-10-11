// Lemniscata (infinito) — el símbolo del logo de FractaChain, como marca de agua de fondo
const INFINITY_PATH =
  "M580,160 L578.9,173.6 L575.8,186.7 L570.7,199.2 L563.8,210.7 L555.4,220.9 L545.7,229.8 L535.1,237.1 L523.8,242.9 L512.1,247.2 L500.1,250.1 L488.2,251.6 L476.3,251.9 L464.7,251.1 L453.5,249.3 L442.6,246.7 L432.1,243.3 L422,239.3 L412.4,234.7 L403.1,229.7 L394.3,224.3 L385.8,218.6 L377.6,212.7 L369.8,206.5 L362.2,200.1 L354.8,193.6 L347.6,187 L340.6,180.3 L333.7,173.6 L326.8,166.8 L320,160 L313.2,153.2 L306.3,146.4 L299.4,139.7 L292.4,133 L285.2,126.4 L277.8,119.9 L270.2,113.5 L262.4,107.3 L254.2,101.4 L245.7,95.7 L236.9,90.3 L227.6,85.3 L218,80.7 L207.9,76.7 L197.4,73.3 L186.5,70.7 L175.3,68.9 L163.7,68.1 L151.8,68.4 L139.9,69.9 L127.9,72.8 L116.2,77.1 L104.9,82.9 L94.3,90.2 L84.6,99.1 L76.2,109.3 L69.3,120.8 L64.2,133.3 L61.1,146.4 L60,160 L61.1,173.6 L64.2,186.7 L69.3,199.2 L76.2,210.7 L84.6,220.9 L94.3,229.8 L104.9,237.1 L116.2,242.9 L127.9,247.2 L139.9,250.1 L151.8,251.6 L163.7,251.9 L175.3,251.1 L186.5,249.3 L197.4,246.7 L207.9,243.3 L218,239.3 L227.6,234.7 L236.9,229.7 L245.7,224.3 L254.2,218.6 L262.4,212.7 L270.2,206.5 L277.8,200.1 L285.2,193.6 L292.4,187 L299.4,180.3 L306.3,173.6 L313.2,166.8 L320,160 L326.8,153.2 L333.7,146.4 L340.6,139.7 L347.6,133 L354.8,126.4 L362.2,119.9 L370.2,113.5 L377.6,107.3 L385.8,101.4 L394.3,95.7 L403.1,90.3 L412.4,85.3 L422,80.7 L432.1,76.7 L442.6,73.3 L453.5,70.7 L464.7,68.9 L476.3,68.1 L488.2,68.4 L500.1,69.9 L512.1,72.8 L523.8,77.1 L535.1,82.9 L545.7,90.2 L555.4,99.1 L563.8,109.3 L570.7,120.8 L575.8,133.3 L578.9,146.4 Z";

export function CrystalBackdrop() {
  return (
    <div className="crystal-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute -left-24 -top-28 h-[28rem] w-[28rem] rounded-full bg-[#8b5cf6] opacity-30 blur-[90px]" />
      <div className="absolute right-[-8rem] top-24 h-[32rem] w-[32rem] rounded-full bg-[#a78bfa] opacity-25 blur-[110px]" />
      <div className="absolute bottom-[-10rem] left-1/4 h-[26rem] w-[26rem] rounded-full bg-[#6d3fd1] opacity-30 blur-[100px]" />
      <div className="absolute right-1/3 top-1/2 h-64 w-64 rounded-full bg-[#a3ff2e] opacity-[0.12] blur-[80px]" />
      <div className="absolute bottom-10 right-[-4rem] h-72 w-72 rounded-full bg-[#7ee000] opacity-[0.09] blur-[90px]" />
      <svg
        viewBox="0 0 640 320"
        preserveAspectRatio="xMidYMid meet"
        className="logo-watermark absolute left-1/2 top-1/2 h-[105%] w-[105%] -translate-x-1/2 -translate-y-1/2"
        fill="none"
      >
        <path d={INFINITY_PATH} stroke="currentColor" strokeWidth="26" strokeLinecap="round" />
        <path d={INFINITY_PATH} stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.5" />
      </svg>
      <div className="liquid-sheen absolute inset-0 opacity-40" />
    </div>
  );
}
