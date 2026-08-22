import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import type { CoinPackage, CoinTransactionSource, PixPaymentStatus } from "@sarradabet/types";
import { RealtimeEvents } from "@sarradabet/types";
import { PixQrCode } from "../components/PixQrCode";
import Navigation from "../components/Navigation";
import { AppFooter } from "../components/legal/AppFooter";
import { FinancialDisclaimer } from "../components/legal/FinancialDisclaimer";
import { Button } from "../components/ui/Button";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { sportsbookFieldClass } from "../components/ui/SportsbookModal";
import { useSocketEvent } from "../core/hooks/useSocket";
import { useCoinBalance } from "../hooks/useCoinBalance";
import { useCoinTransactions } from "../hooks/useCoinTransactions";
import { getApiErrorMessage } from "../utils/apiError";
import { usePixPurchase } from "../hooks/usePixPurchase";
import { coinService } from "../services/CoinPaymentService";
import { DISCLAIMERS } from "../constants/disclaimers";

const STATIC_PIX_QR_SRC = "/pix-static-qr.png";
const DEFAULT_COMPROVANTE_MESSAGE =
  "Envie o comprovante para o seguinte número (61) 999272342";

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SOURCE_LABELS: Record<CoinTransactionSource, string> = {
  PIX_PURCHASE: "Compra Pix",
  BET_COST: "Aposta",
  ADMIN_ADJUSTMENT: "Ajuste admin",
  REFUND: "Reembolso",
  WIN: "Prêmio",
  TAKEOUT: "Taxa da casa",
  REWARD_REDEMPTION: "Resgate de recompensa",
};

const STATUS_LABELS: Record<PixPaymentStatus, string> = {
  PENDING: "Aguardando confirmação do comprovante",
  APPROVED: "Pago",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
  FAILED: "Falhou",
};

const CoinsPage: React.FC = () => {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const { balance, loading: balanceLoading, refetch, setBalance } =
    useCoinBalance();

  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useCoinTransactions();

  const onPaymentApproved = () => {
    setSuccessMessage("Pagamento confirmado! Suas moedas foram creditadas.");
    void refetch();
    void refetchTransactions();
  };

  const {
    purchase,
    status,
    loading,
    error,
    startPurchase,
    resetPurchase,
  } = usePixPurchase(onPaymentApproved);

  useSocketEvent<{ newBalance: number }>(
    RealtimeEvents.PAYMENT_CONFIRMED,
    (payload) => {
      setBalance(payload.newBalance);
      setSuccessMessage("Pagamento confirmado! Suas moedas foram creditadas.");
      void refetchTransactions();
    },
  );

  useEffect(() => {
    const loadPackages = async () => {
      try {
        setPackagesLoading(true);
        const result = await coinService.getPackages();
        setPackages(result);
      } catch (err) {
        setPackagesError(
          getApiErrorMessage(err, "Erro ao carregar pacotes"),
        );
      } finally {
        setPackagesLoading(false);
      }
    };

    void loadPackages();
  }, []);

  const expiresInSeconds = useMemo(() => {
    if (!status?.expiresAt) return 0;
    return Math.max(
      0,
      Math.floor((new Date(status.expiresAt).getTime() - Date.now()) / 1000),
    );
  }, [status?.expiresAt]);

  const instructionMessage =
    status?.instructionMessage ??
    purchase?.instructionMessage ??
    DEFAULT_COMPROVANTE_MESSAGE;

  const pixKey = status?.copyPaste ?? purchase?.copyPaste ?? null;

  const handleCopyPix = async () => {
    if (!pixKey) return;

    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleResetPurchase = () => {
    resetPurchase();
    setSuccessMessage(null);
    setCopied(false);
  };

  const isPending = status?.status === "PENDING";
  const isTerminalFailure =
    status?.status === "EXPIRED" ||
    status?.status === "FAILED" ||
    status?.status === "CANCELLED";

  return (
    <div className="min-h-screen bg-sportsbook-bg text-sportsbook-fg flex flex-col">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 flex-1 w-full">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Minhas moedas</h1>
            <p className="text-sportsbook-muted">
              Saldo atual:{" "}
              {balanceLoading ? "..." : `${balance ?? 0} moedas`}
            </p>
          </div>
          <Link to="/">
            <Button variant="secondary">Voltar ao site</Button>
          </Link>
        </div>

        {successMessage && (
          <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-green-300">
            {successMessage}
          </div>
        )}

        {(error || packagesError) && (
          <ErrorMessage error={error || packagesError || "Erro"} />
        )}

        <FinancialDisclaimer />

        <label className="flex items-start gap-3 text-sm leading-relaxed cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 shrink-0"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          />
          <span>{DISCLAIMERS.pt.acknowledge}</span>
        </label>

        {packagesLoading ? (
          <LoadingSpinner text="Carregando pacotes..." />
        ) : packages.length === 0 ? (
          <div className="sb-surface border sb-border rounded-2xl p-6 text-center text-sportsbook-muted">
            Nenhum pacote disponível no momento.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {packages.map((coinPackage) => (
              <div
                key={coinPackage.id}
                className="sb-surface border sb-border rounded-2xl p-5 space-y-3"
              >
                <h2 className="font-display text-xl font-bold">
                  {coinPackage.name}
                </h2>
                <p className="text-sportsbook-muted">
                  {formatCurrency(coinPackage.amountCents)} →{" "}
                  {coinPackage.coinsAmount} moedas
                </p>
                <Button
                  className="w-full"
                  disabled={loading || !acknowledged}
                  onClick={() => void startPurchase(coinPackage.id)}
                >
                  Comprar com Pix
                </Button>
              </div>
            ))}
          </div>
        )}

        {purchase && status && (
          <div className="sb-surface border sb-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold">Pagamento Pix</h2>
                <p
                  className={`text-sm ${
                    status.status === "APPROVED"
                      ? "text-green-400"
                      : isTerminalFailure
                        ? "text-yellow-400"
                        : "text-sportsbook-muted"
                  }`}
                >
                  Status: {STATUS_LABELS[status.status]}
                </p>
              </div>
              {expiresInSeconds > 0 && isPending && (
                <span className="text-yellow-400 text-sm">
                  Expira em {Math.floor(expiresInSeconds / 60)}:
                  {String(expiresInSeconds % 60).padStart(2, "0")}
                </span>
              )}
            </div>

            {isPending && (
              <p className="text-sm text-sportsbook-fg leading-relaxed">
                {instructionMessage}
              </p>
            )}

            {isPending && (
              <PixQrCode imageSrc={STATIC_PIX_QR_SRC} />
            )}

            {isPending && pixKey && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-sportsbook-muted">Chave Pix</p>
                  <Button variant="secondary" onClick={() => void handleCopyPix()}>
                    {copied ? "Copiado!" : "Copiar chave"}
                  </Button>
                </div>
                <textarea
                  readOnly
                  value={pixKey}
                  className={`w-full min-h-24 rounded-lg px-3 py-2 text-sm ${sportsbookFieldClass}`}
                />
              </div>
            )}

            {isPending && (
              <p className="text-sm text-sportsbook-muted">
                Após pagar, envie o comprovante pelo WhatsApp. Suas moedas serão
                creditadas após a confirmação manual.
              </p>
            )}

            {isTerminalFailure && (
              <div className="space-y-3">
                <p className="text-sm text-sportsbook-muted">
                  {status.status === "EXPIRED"
                    ? "Este pedido expirou. Gere um novo pagamento para continuar."
                    : "Não foi possível concluir o pagamento. Tente novamente."}
                </p>
                <Button variant="secondary" onClick={handleResetPurchase}>
                  Gerar novo Pix
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="sb-surface border sb-border rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-xl font-bold">Histórico</h2>

          {transactionsError && (
            <ErrorMessage error={transactionsError} />
          )}

          {transactionsLoading ? (
            <LoadingSpinner text="Carregando histórico..." />
          ) : transactions.length === 0 ? (
            <p className="text-sportsbook-muted text-sm">
              Nenhuma transação ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-sportsbook-muted border-b sb-border">
                    <th className="pb-2 pr-4 font-medium">Data</th>
                    <th className="pb-2 pr-4 font-medium">Origem</th>
                    <th className="pb-2 pr-4 font-medium">Valor</th>
                    <th className="pb-2 font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b sb-border/50">
                      <td className="py-3 pr-4 text-sportsbook-muted">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="py-3 pr-4">
                        {SOURCE_LABELS[tx.source] ?? tx.source}
                      </td>
                      <td
                        className={`py-3 pr-4 font-medium ${
                          tx.type === "CREDIT" ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {tx.type === "CREDIT" ? "+" : "-"}
                        {tx.amount}
                      </td>
                      <td className="py-3">{tx.balanceAfter}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <AppFooter />
    </div>
  );
};

export default CoinsPage;
