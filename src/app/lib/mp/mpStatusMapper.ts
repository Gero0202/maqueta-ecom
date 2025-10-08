/**
 * Posibles estados principales de pago de Mercado Pago.
 */
export type MpStatus = "approved" | "in_process" | "pending" | "in_mediation" | "rejected" | "cancelled" | "refunded" | "charged_back" | string;

/**
 * Posibles estados internos del sistema.
 */
export type OrderState = "paid" | "reserved" | "cancelled";

/**
 * Traduce el estado de pago de Mercado Pago a un estado interno de tu sistema.
 * * @param mpStatus - El estado principal (status) de Mercado Pago.
 * @param mpStatusDetail - El detalle del estado (status_detail), opcional.
 * @returns Estado interno como: "paid", "reserved", "cancelled"
 */
export function mapMpStatusToOrderState(mpStatus: MpStatus, mpStatusDetail: string = ""): OrderState {
  switch (mpStatus) {
    case "approved":
      return "paid";

    case "in_process":
    case "pending":
    case "in_mediation":
      return "reserved";

    case "rejected":
    case "cancelled":
    case "refunded":
    case "charged_back":
      return "cancelled";

    default:
      console.warn(`Estado MP desconocido: ${mpStatus} - ${mpStatusDetail}`);
      // Asumimos un estado 'reserved' para estados desconocidos o nuevos que podrían necesitar revisión.
      return "reserved"; 
  }
}