import { useEffect, useState } from "react";
import type { RewardValidatedPayload } from "@sarradabet/types";
import { useAuth } from "../hooks/useAuth";
import { getUserValidateImagePath } from "../services/ticketService";
import { downloadAuthenticatedFile } from "../utils/downloadAuthenticatedFile";
import { Button } from "./ui/Button";

interface RewardValidatedToastState extends RewardValidatedPayload {
  downloading?: boolean;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RewardValidatedNotification() {
  const { accessToken } = useAuth();
  const [toast, setToast] = useState<RewardValidatedToastState | null>(null);

  useEffect(() => {
    let timer: number | undefined;

    const handleValidated = (event: Event) => {
      const detail = (event as CustomEvent<RewardValidatedPayload>).detail;
      if (!detail?.rewardTitle || !detail.ticketCode) {
        return;
      }

      setToast({ ...detail, downloading: false });

      if (timer) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => setToast(null), 12000);
    };

    window.addEventListener("reward:validated", handleValidated);
    return () => {
      window.removeEventListener("reward:validated", handleValidated);
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const handleDownload = async () => {
    if (!toast) {
      return;
    }

    try {
      setToast({ ...toast, downloading: true });
      await downloadAuthenticatedFile(
        getUserValidateImagePath(toast.ticketCode),
        `ticket_validated_${toast.ticketCode}.png`,
        accessToken,
      );
    } finally {
      setToast((current) =>
        current ? { ...current, downloading: false } : null,
      );
    }
  };

  if (!toast) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[100] max-w-sm rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 shadow-lg backdrop-blur-sm space-y-3"
    >
      <div>
        <p className="text-sm font-semibold text-green-300">
          Recompensa registrada!
        </p>
        <p className="text-xs text-sportsbook-muted mt-1">
          {toast.rewardTitle} · entregue em {formatDate(toast.validatedAt)}
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => void handleDownload()}
        disabled={toast.downloading}
      >
        {toast.downloading ? "Baixando..." : "Baixar comprovante validado"}
      </Button>
    </div>
  );
}

export default RewardValidatedNotification;
