import { useEffect, useState } from "react";
import type { ValidateTicketResponse } from "@sarradabet/types";
import { Button } from "../ui/Button";
import SportsbookModal from "../ui/SportsbookModal";
import { useAuth } from "../../hooks/useAuth";
import {
  downloadAuthenticatedFile,
  fetchAuthenticatedBlob,
} from "../../utils/downloadAuthenticatedFile";
import { getValidateImagePath } from "../../services/ticketService";

interface TicketValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ValidateTicketResponse;
}

export function TicketValidationModal({
  isOpen,
  onClose,
  result,
}: TicketValidationModalProps) {
  const { accessToken } = useAuth();
  const ticketCode = result.redemption?.ticketCode;
  const imagePath =
    result.validateImageUrl ??
    (ticketCode ? getValidateImagePath(ticketCode) : null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isOpen || !imagePath) {
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
    if (!imagePath || !ticketCode) {
      return;
    }

    try {
      setDownloading(true);
      await downloadAuthenticatedFile(
        imagePath,
        `ticket_validated_${ticketCode}.png`,
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
      title="Ticket validado"
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-emerald-300 font-medium">{result.message}</p>
        <p className="text-sm text-sportsbook-muted">
          Entrega registrada. Baixe o comprovante de validação abaixo.
        </p>

        {loadingPreview ? (
          <p className="text-sm text-sportsbook-muted">Gerando preview...</p>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt="Comprovante de validação"
            className="mx-auto w-full max-w-xs rounded-xl border border-emerald-500/40 object-contain"
          />
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button
            className="sb-brand-gradient text-black font-display font-semibold"
            onClick={() => void handleDownload()}
            disabled={downloading || !imagePath}
          >
            {downloading ? "Baixando..." : "Baixar comprovante de validação"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </SportsbookModal>
  );
}
