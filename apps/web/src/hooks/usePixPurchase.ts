import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CreatePixPurchaseResponse,
  PixPaymentStatusResponse,
} from "@sarradabet/types";
import { paymentService } from "../services/CoinPaymentService";
import { getApiErrorMessage } from "../utils/apiError";

export function usePixPurchase(onApproved?: (payment: PixPaymentStatusResponse) => void) {
  const [purchase, setPurchase] = useState<CreatePixPurchaseResponse | null>(null);
  const [status, setStatus] = useState<PixPaymentStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(
    async (paymentId: number) => {
      try {
        const nextStatus = await paymentService.getPixPaymentStatus(paymentId);
        setStatus(nextStatus);

        if (nextStatus.status === "APPROVED") {
          stopPolling();
          onApproved?.(nextStatus);
        }

        if (
          nextStatus.status === "EXPIRED" ||
          nextStatus.status === "CANCELLED" ||
          nextStatus.status === "FAILED"
        ) {
          stopPolling();
        }
      } catch (err) {
        setError(getApiErrorMessage(err, "Erro ao verificar pagamento"));
      }
    },
    [onApproved, stopPolling],
  );

  const startPurchase = useCallback(
    async (coinPackageId: number) => {
      try {
        setLoading(true);
        setError(null);
        stopPolling();

        const result = await paymentService.createPixPurchase(coinPackageId);
        setPurchase(result);
        setStatus({
          id: result.paymentId,
          externalId: result.externalId,
          status: result.status,
          coinsAmount: result.coinsAmount,
          amountCents: result.amountCents,
          packageName: result.packageName,
          expiresAt: result.expiresAt,
          paidAt: null,
          qrCode: result.qrCode,
          qrCodeBase64: result.qrCodeBase64,
          copyPaste: result.copyPaste,
          isMock: result.isMock,
        });

        pollingRef.current = window.setInterval(() => {
          void pollStatus(result.paymentId);
        }, 5000);
      } catch (err) {
        setError(getApiErrorMessage(err, "Erro ao criar pagamento Pix"));
      } finally {
        setLoading(false);
      }
    },
    [pollStatus, stopPolling],
  );

  const resetPurchase = useCallback(() => {
    stopPolling();
    setPurchase(null);
    setStatus(null);
    setError(null);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  return {
    purchase,
    status,
    loading,
    error,
    startPurchase,
    stopPolling,
    resetPurchase,
    setStatus,
  };
}
