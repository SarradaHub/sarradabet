import { useEffect, useState } from "react";
import type { Reward } from "@sarradabet/types";
import { Button } from "../ui/Button";
import SportsbookModal from "../ui/SportsbookModal";
import { useAuth } from "../../hooks/useAuth";
import {
  downloadAuthenticatedFile,
  fetchAuthenticatedBlob,
} from "../../utils/downloadAuthenticatedFile";
import { getTicketImagePath } from "../../services/ticketService";

interface TicketRedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketCode: string;
  reward: Reward;
  ticketImageUrl?: string;
}

export function TicketRedemptionModal({
  isOpen,
  onClose,
  ticketCode,
  reward,
  ticketImageUrl,
}: TicketRedemptionModalProps) {
  const { accessToken } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const imagePath = ticketImageUrl ?? getTicketImagePath(ticketCode);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    const loadPreview = async () => {
      try {
        setLoadingPreview(true);
        objectUrl = await fetchAuthenticatedBlob(imagePath, accessToken);
        if (active) {
          setPreviewUrl(objectUrl);
        }
      } catch {
        if (active) {
          setPreviewUrl(null);
        }
      } finally {
        if (active) {
          setLoadingPreview(false);
        }
      }
    };

    void loadPreview();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setPreviewUrl(null);
    };
  }, [isOpen, imagePath, accessToken]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadAuthenticatedFile(
        imagePath,
        `ticket_${ticketCode}.png`,
        accessToken,
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SportsbookModal
      isOpen={isOpen}
      onClose={onClose}
      title="Resgate confirmado"
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-sportsbook-muted">
          {reward.title} — apresente este ticket para retirar seu prêmio.
        </p>

        {loadingPreview ? (
          <p className="text-sm text-sportsbook-muted">Gerando preview...</p>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt={`Ticket ${reward.title}`}
            className="mx-auto w-full max-w-xs rounded-xl border sb-border object-contain"
          />
        ) : (
          <code className="block rounded-lg bg-black/40 px-4 py-3 text-sm break-all">
            {ticketCode}
          </code>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            className="sb-brand-gradient text-black font-display font-semibold"
            onClick={() => void handleDownload()}
            disabled={downloading}
          >
            {downloading ? "Baixando..." : "Baixar ticket"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </SportsbookModal>
  );
}
