import type { UserRewardRedemption } from "@sarradabet/types";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getUserValidateImagePath } from "../../services/ticketService";
import { downloadAuthenticatedFile } from "../../utils/downloadAuthenticatedFile";
import { Button } from "../ui/Button";
import { LoadingSpinner } from "../ui/LoadingSpinner";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface RegisteredRedemptionsCardProps {
  redemptions: UserRewardRedemption[];
  loading: boolean;
}

export function RegisteredRedemptionsCard({
  redemptions,
  loading,
}: RegisteredRedemptionsCardProps) {
  const { accessToken } = useAuth();
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);

  const handleDownload = async (ticketCode: string) => {
    try {
      setDownloadingCode(ticketCode);
      await downloadAuthenticatedFile(
        getUserValidateImagePath(ticketCode),
        `ticket_validated_${ticketCode}.png`,
        accessToken,
      );
    } finally {
      setDownloadingCode(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Carregando histórico..." />;
  }

  if (redemptions.length === 0) {
    return null;
  }

  return (
    <div className="sb-surface border sb-border rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold">Recompensas registradas</h2>
        <p className="text-sm text-sportsbook-muted mt-1">
          Prêmios entregues e confirmados pelo administrador.
        </p>
      </div>

      <ul className="space-y-3">
        {redemptions.map((redemption) => (
          <li
            key={redemption.id}
            className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{redemption.reward.title}</h3>
                {redemption.reward.description && (
                  <p className="text-sm text-sportsbook-muted mt-1">
                    {redemption.reward.description}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-full border border-green-500/40 bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-green-300">
                Registrado
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-sportsbook-muted">
              <span>
                Custo:{" "}
                <strong className="text-emerald-400">
                  {redemption.reward.coinCost.toLocaleString("pt-BR")} moedas
                </strong>
              </span>
              <span>Resgatado em {formatDate(redemption.redeemedAt)}</span>
              {redemption.validatedAt && (
                <span>
                  Registrado em {formatDate(redemption.validatedAt)}
                </span>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleDownload(redemption.ticketCode)}
              disabled={downloadingCode === redemption.ticketCode}
            >
              {downloadingCode === redemption.ticketCode
                ? "Baixando..."
                : "Baixar comprovante validado"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
