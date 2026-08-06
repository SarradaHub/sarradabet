import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AdminPixPaymentDetail,
  CreatePixPurchaseResponse,
} from "@sarradabet/types";
import { adminPaymentService } from "../services/CoinPaymentService";
import { getApiErrorMessage } from "../utils/apiError";

export function useAdminInstorePurchase(
  onApproved?: (payment: AdminPixPaymentDetail) => void,
) {
  const [purchase, setPurchase] = useState<CreatePixPurchaseResponse | null>(null);
  const [status, setStatus] = useState<AdminPixPaymentDetail | null>(null);
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
        const nextStatus = await adminPaymentService.getPaymentDetail(paymentId);
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
    async (userId: number, coinPackageId: number) => {
      try {
        setLoading(true);
        setError(null);
        stopPolling();

        const result = await adminPaymentService.createInstorePurchase({
          userId,
          coinPackageId,
        });
        setPurchase(result);

        const initialStatus = await adminPaymentService.getPaymentDetail(
          result.paymentId,
        );
        setStatus(initialStatus);

        pollingRef.current = window.setInterval(() => {
          void pollStatus(result.paymentId);
        }, 5000);
      } catch (err) {
        setError(getApiErrorMessage(err, "Erro ao gerar QR presencial"));
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
    resetPurchase,
    setStatus,
  };
}
