/**
 * Payer email sent to Mercado Pago when creating Pix (Payments API).
 *
 * With TEST- credentials the collector is the real integrator account. MP rejects
 * mixing that with sandbox payer emails (test_user_br@...) — error 145
 * "Invalid users involved". Keep the app user's email unless explicitly overridden.
 */
import { config } from "../../config/env";

export function resolvePixPayerEmail(userEmail: string): string {
  return config.MERCADOPAGO_TEST_PAYER_EMAIL ?? userEmail;
}
