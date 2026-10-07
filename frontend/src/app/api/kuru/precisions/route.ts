import { NextResponse } from "next/server";
import { ParamCreator } from "@kuru-labs/kuru-sdk";
import { KURU_DEFAULTS } from "@/lib/kuru";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const price = Number(new URL(request.url).searchParams.get("price"));
  if (!Number.isFinite(price) || price <= 0 || price > KURU_DEFAULTS.maxPrice) {
    return NextResponse.json({ error: `Precio inválido (debe estar entre 0 y ${KURU_DEFAULTS.maxPrice}).` }, { status: 400 });
  }
  try {
    const p = new ParamCreator().calculatePrecisions(price, 1, KURU_DEFAULTS.maxPrice, 1, 100);
    return NextResponse.json({
      sizePrecision: p.sizePrecision.toString(),
      pricePrecision: p.pricePrecision.toString(),
      tickSize: p.tickSize.toString(),
      minSize: p.minSize.toString(),
      maxSize: p.maxSize.toString(),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "No se pudieron calcular las precisiones." }, { status: 500 });
  }
}
