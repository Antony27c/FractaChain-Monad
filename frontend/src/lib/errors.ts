import { BaseError, ContractFunctionRevertedError } from "viem";

const MESSAGES: Record<string, string> = {
  NotVerified: "Tu dirección no está verificada (KYC).",
  IssuerNotVerified: "Solo los emisores verificados pueden crear lotes.",
  HardCapExceeded: "El aporte supera el máximo (hard cap) de la licitación.",
  OfferingEnded: "La licitación ya terminó.",
  NotActive: "La licitación ya no está activa.",
  CannotFinalizeYet: "Todavía no se puede finalizar: falta el plazo o llegar al máximo.",
  NotSucceeded: "La licitación no fue exitosa, no hay shards para reclamar.",
  NotFailed: "La licitación no falló, no hay reembolso.",
  NothingToClaim: "No tenés shards para reclamar.",
  NothingToRefund: "No tenés nada para reembolsar.",
  ZeroAmount: "Ingresá un monto mayor a cero.",
  NotFunded: "La licitación no tiene shards suficientes.",
  InvalidParams: "Parámetros inválidos.",
  InvalidSupply: "El supply debe ser mayor a cero.",
  InvalidDuration: "La duración debe ser mayor a cero.",
  OpenVerificationDisabled: "La verificación abierta está deshabilitada.",
  SupplyBelowHardCap: "El supply del lote no alcanza para vender el máximo (hard cap).",
  TransferFailed: "Falló la transferencia del token. Revisá tu saldo y la autorización.",
  ReentrantCall: "Llamada reentrante bloqueada.",
  InsufficientBalance: "Saldo insuficiente.",
  InsufficientAllowance: "Falta autorizar el gasto del token (allowance).",
  NotOwner: "Solo el dueño del contrato puede hacer esto.",
  ZeroAddress: "La dirección no puede ser cero.",
  SlippageExceeded: "El precio se movió más de lo permitido. Probá de nuevo o subí la tolerancia.",
  InsufficientLiquidity: "No hay liquidez suficiente en el mercado para esa orden.",
  SizeError: "El monto está fuera del tamaño mínimo o máximo que acepta el mercado.",
  PriceError: "El precio de la orden no es válido para este mercado.",
  MarketStateError: "El mercado no está disponible en este momento.",
  TransferFromFailed: "Falló la transferencia del token. Revisá tu saldo y la aprobación.",
};

export function errorMessage(error: unknown): string {
  if (error instanceof BaseError) {
    const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName;
      if (name && MESSAGES[name]) return MESSAGES[name];
      if (name) return `El contrato rechazó la operación (${name}).`;
    }
    if (/User rejected|denied/i.test(error.message)) return "Rechazaste la transacción.";
    return error.shortMessage;
  }
  return error instanceof Error ? error.message : "Error desconocido.";
}
