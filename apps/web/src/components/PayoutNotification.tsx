import { useEffect, useState } from "react";
import type { BetResolvedPayload } from "@sarradabet/types";

interface PayoutToastState {
  amount: number;
  newBalance: number;
  betId: number;
}

export function PayoutNotification() {
  const [toast, setToast] = useState<PayoutToastState | null>(null);

  useEffect(() => {
    let timer: number | undefined;

    const handlePayout = (event: Event) => {
      const detail = (event as CustomEvent<BetResolvedPayload>).detail;
      if (!detail || detail.amount <= 0) {
        return;
      }

      setToast({
        amount: detail.amount,
        newBalance: detail.newBalance,
        betId: detail.betId,
      });

      if (timer) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => setToast(null), 6000);
    };

    window.addEventListener("bet:resolved", handlePayout);
    return () => {
      window.removeEventListener("bet:resolved", handlePayout);
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  if (!toast) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[100] max-w-sm rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 shadow-lg backdrop-blur-sm"
    >
      <p className="text-sm font-semibold text-green-300">
        Você ganhou {toast.amount} moedas!
      </p>
      <p className="text-xs text-sportsbook-muted mt-1">
        Aposta #{toast.betId} · saldo atual: {toast.newBalance} moedas
      </p>
    </div>
  );
}

export default PayoutNotification;
