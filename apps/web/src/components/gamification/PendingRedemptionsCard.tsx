import type { UserRewardRedemption } from "@sarradabet/types";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { getTicketImagePath } from "../../services/ticketService";
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

interface PendingRedemptionsCardProps {
  redemptions: UserRewardRedemption[];
  loading: boolean;
}

export function PendingRedemptionsCard({
  redemptions,
  loading,
}: PendingRedemptionsCardProps) {
  const { accessToken } = useAuth();
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);

  const handleDownload = async (ticketCode: string) => {
    try {
      setDownloadingCode(ticketCode);
      await downloadAuthenticatedFile(
        getTicketImagePath(ticketCode),
        `ticket_${ticketCode}.png`,
        accessToken,
      );
    } finally {
      setDownloadingCode(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Carregando resgates..." />;
  }

  if (redemptions.length === 0) {
    return null;
  }

  return (
    <div className="sb-surface border sb-border rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold">Meus resgates pendentes</h2>
        <p className="text-sm text-sportsbook-muted mt-1">
          Apresente o ticket ao administrador para registrar a entrega do prêmio.
        </p>
      </div>

      <ul className="space-y-3">
        {redemptions.map((redemption) => (
          <li
            key={redemption.id}
            className="rounded-xl border sb-border bg-sportsbook-raised/40 p-4 space-y-3"
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
              <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-300">
                Aguardando validação
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
            </div>

            <div>
              <p className="text-xs text-sportsbook-muted mb-1">Ticket</p>
              <code className="block rounded-lg bg-black/40 px-3 py-2 text-sm break-all">
                {redemption.ticketCode}
              </code>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleDownload(redemption.ticketCode)}
              disabled={downloadingCode === redemption.ticketCode}
            >
              {downloadingCode === redemption.ticketCode
                ? "Baixando..."
                : "Baixar ticket"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
