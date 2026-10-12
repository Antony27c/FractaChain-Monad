import { BaseError, ContractFunctionRevertedError } from "viem";
import { currentLocale } from "@/lib/i18n";

const MESSAGES: Record<string, [string, string]> = {
  NotVerified: ["Tu dirección no está verificada (KYC).", "Your address is not verified (KYC)."],
  IssuerNotVerified: ["Solo los emisores verificados pueden crear lotes.", "Only verified issuers can create lots."],
  HardCapExceeded: ["El aporte supera el máximo (hard cap) de la licitación.", "The contribution exceeds the auction's maximum (hard cap)."],
  OfferingEnded: ["La licitación ya terminó.", "The auction has already ended."],
  NotActive: ["La licitación ya no está activa.", "The auction is no longer active."],
  CannotFinalizeYet: ["Todavía no se puede finalizar: falta el plazo o llegar al máximo.", "It can't be finalized yet: wait for the deadline or the maximum."],
  NotSucceeded: ["La licitación no fue exitosa, no hay shards para reclamar.", "The auction did not succeed, there are no shards to claim."],
  NotFailed: ["La licitación no falló, no hay reembolso.", "The auction did not fail, there is no refund."],
  NothingToClaim: ["No tenés shards para reclamar.", "You have no shards to claim."],
  NothingToRefund: ["No tenés nada para reembolsar.", "You have nothing to refund."],
  ZeroAmount: ["Ingresá un monto mayor a cero.", "Enter an amount greater than zero."],
  NotFunded: ["La licitación no tiene shards suficientes.", "The auction does not hold enough shards."],
  InvalidParams: ["Parámetros inválidos.", "Invalid parameters."],
  InvalidSupply: ["El supply debe ser mayor a cero.", "Supply must be greater than zero."],
  InvalidDuration: ["La duración debe ser mayor a cero.", "Duration must be greater than zero."],
  OpenVerificationDisabled: ["La verificación abierta está deshabilitada.", "Open verification is disabled."],
  SupplyBelowHardCap: ["El supply del lote no alcanza para vender el máximo (hard cap).", "The lot's supply is not enough to sell the maximum (hard cap)."],
  TransferFailed: ["Falló la transferencia del token. Revisá tu saldo y la autorización.", "The token transfer failed. Check your balance and approval."],
  ReentrantCall: ["Llamada reentrante bloqueada.", "Reentrant call blocked."],
  InsufficientBalance: ["Saldo insuficiente.", "Insufficient balance."],
  InsufficientAllowance: ["Falta autorizar el gasto del token (allowance).", "The token spend is not approved (allowance)."],
  NotOwner: ["Solo el dueño del contrato puede hacer esto.", "Only the contract owner can do this."],
  ZeroAddress: ["La dirección no puede ser cero.", "The address cannot be zero."],
  NotIssuer: ["Solo el emisor del lote puede liquidar la cosecha.", "Only the lot's issuer can settle the harvest."],
  AlreadySettled: ["La cosecha de este lote ya se liquidó.", "This lot's harvest has already been settled."],
  NotSettled: ["La cosecha todavía no se liquidó.", "The harvest has not been settled yet."],
  ExceedsSettlement: ["El canje supera lo liquidado para este lote.", "The redemption exceeds what was settled for this lot."],
  SlippageExceeded: ["El precio se movió más de lo permitido. Probá de nuevo o subí la tolerancia.", "The price moved more than allowed. Try again or raise the tolerance."],
  InsufficientLiquidity: ["No hay liquidez suficiente en el mercado para esa orden.", "There is not enough market liquidity for that order."],
  SizeError: ["El monto está fuera del tamaño mínimo o máximo que acepta el mercado.", "The amount is outside the market's minimum or maximum size."],
  PriceError: ["El precio de la orden no es válido para este mercado.", "The order price is not valid for this market."],
  MarketStateError: ["El mercado no está disponible en este momento.", "The market is not available right now."],
  TransferFromFailed: ["Falló la transferencia del token. Revisá tu saldo y la aprobación.", "The token transfer failed. Check your balance and approval."],
};

const pick = ([es, en]: [string, string]) => (currentLocale() === "en" ? en : es);
const REJECTED: [string, string] = ["Rechazaste la transacción.", "You rejected the transaction."];

export function errorMessage(error: unknown): string {
  if (error instanceof BaseError) {
    const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName;
      if (name && MESSAGES[name]) return pick(MESSAGES[name]);
      if (name) return pick([`El contrato rechazó la operación (${name}).`, `The contract rejected the operation (${name}).`]);
    }
    if (/User rejected|denied/i.test(error.message)) return pick(REJECTED);
    return error.shortMessage;
  }
  if (error instanceof Error && /User rejected|denied|rejected the request/i.test(error.message)) return pick(REJECTED);
  return error instanceof Error ? error.message : pick(["Error desconocido.", "Unknown error."]);
}
