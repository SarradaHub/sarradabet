import { MercadoPagoConfig, Payment } from "mercadopago";
import { config } from "../../../config/env";
import { ExternalServiceError } from "../../../core/errors/AppError";
import type {
  CreatePixPaymentInput,
  PixGateway,
  PixGatewayPaymentResult,
} from "./PixGateway";

interface MercadoPagoApiError {
  message?: string;
  cause?: Array<{ description?: string; code?: number }>;
}

export type MercadoPagoPaymentResult = PixGatewayPaymentResult;

export class MercadoPagoClient implements PixGateway {
  private paymentApi: Payment | null = null;

  private getPaymentApi(): Payment {
    if (!config.MERCADOPAGO_ACCESS_TOKEN) {
      throw new ExternalServiceError(
        "MercadoPago",
        "MERCADOPAGO_ACCESS_TOKEN is not configured",
      );
    }

    if (!this.paymentApi) {
      const client = new MercadoPagoConfig({
        accessToken: config.MERCADOPAGO_ACCESS_TOKEN,
      });
      this.paymentApi = new Payment(client);
    }

    return this.paymentApi;
  }

  async createPixPayment(
    input: CreatePixPaymentInput,
  ): Promise<MercadoPagoPaymentResult> {
    const paymentApi = this.getPaymentApi();

    try {
      const response = await paymentApi.create({
        body: {
          transaction_amount: input.amountCents / 100,
          description: input.description,
          payment_method_id: "pix",
          external_reference: input.externalReference,
          date_of_expiration: input.expirationDate.toISOString(),
          notification_url: config.MERCADOPAGO_NOTIFICATION_URL,
          payer: {
            email: input.payerEmail,
          },
        },
        requestOptions: {
          idempotencyKey: input.idempotencyKey,
        },
      });

      const pointOfInteraction = response.point_of_interaction;
      const transactionData = pointOfInteraction?.transaction_data;

      return {
        id: String(response.id),
        status: response.status ?? "pending",
        qrCode: transactionData?.qr_code ?? null,
        qrCodeBase64: transactionData?.qr_code_base64 ?? null,
        ticketUrl: transactionData?.ticket_url ?? null,
      };
    } catch (error) {
      throw this.toExternalServiceError(error, "create Pix payment");
    }
  }

  async getPayment(paymentId: string): Promise<MercadoPagoPaymentResult> {
    const paymentApi = this.getPaymentApi();

    try {
      const response = await paymentApi.get({ id: paymentId });

      const pointOfInteraction = response.point_of_interaction;
      const transactionData = pointOfInteraction?.transaction_data;

      return {
        id: String(response.id),
        status: response.status ?? "pending",
        qrCode: transactionData?.qr_code ?? null,
        qrCodeBase64: transactionData?.qr_code_base64 ?? null,
        ticketUrl: transactionData?.ticket_url ?? null,
      };
    } catch (error) {
      throw this.toExternalServiceError(error, "get payment");
    }
  }

  private toExternalServiceError(error: unknown, action: string): ExternalServiceError {
    const mpError = error as MercadoPagoApiError;
    const description =
      mpError.cause?.[0]?.description ??
      mpError.message ??
      (error instanceof Error ? error.message : "Unknown error");

    return new ExternalServiceError("MercadoPago", `${action} failed: ${description}`, {
      mpCause: mpError.cause,
    });
  }
}
