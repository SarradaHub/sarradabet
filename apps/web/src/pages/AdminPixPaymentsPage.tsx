import React, { useEffect, useState } from "react";
import type { AdminPixPaymentListItem, PixPaymentStatus } from "@sarradabet/types";
import ConfirmDialog from "../components/admin/ConfirmDialog";
import { Button } from "../components/ui/Button";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { adminPixPaymentService } from "../services/AdminPixPaymentService";
import { getApiErrorMessage } from "../utils/apiError";

const STATUS_LABELS: Record<PixPaymentStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
  FAILED: "Falhou",
};

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR");
}

const AdminPixPaymentsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<PixPaymentStatus>("PENDING");
  const [items, setItems] = useState<AdminPixPaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [confirmPayment, setConfirmPayment] =
    useState<AdminPixPaymentListItem | null>(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminPixPaymentService.list({
        status: statusFilter,
        page: 1,
        limit: 50,
      });
      setItems(result.items);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao carregar pagamentos Pix"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments();
  }, [statusFilter]);

  const handleApprove = async () => {
    if (!confirmPayment) {
      return;
    }

    try {
      setApprovingId(confirmPayment.id);
      setError(null);
      await adminPixPaymentService.approve(confirmPayment.id);
      setConfirmPayment(null);
      await loadPayments();
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao aprovar pagamento"));
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={Boolean(confirmPayment)}
        title="Aprovar pagamento Pix"
        description={
          confirmPayment
            ? `Confirmar crédito de ${confirmPayment.coinsAmount} moedas para ${confirmPayment.user.username}?`
            : ""
        }
        confirmLabel="Aprovar"
        variant="primary"
        onConfirm={() => void handleApprove()}
        onClose={() => setConfirmPayment(null)}
        loading={approvingId !== null}
      />

      <div>
        <h1 className="font-display text-2xl font-bold text-sportsbook-fg">
          Pagamentos Pix
        </h1>
        <p className="text-sportsbook-muted text-sm">
          Aprove pagamentos após receber o comprovante no WhatsApp.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["PENDING", "APPROVED", "EXPIRED", "CANCELLED", "FAILED"] as const).map(
          (status) => (
            <Button
              key={status}
              size="sm"
              variant={statusFilter === status ? "primary" : "secondary"}
              onClick={() => setStatusFilter(status)}
            >
              {STATUS_LABELS[status]}
            </Button>
          ),
        )}
      </div>

      {error && <ErrorMessage error={error} />}

      {loading ? (
        <LoadingSpinner text="Carregando pagamentos..." />
      ) : items.length === 0 ? (
        <div className="sb-surface border sb-border rounded-2xl p-6 text-center text-sportsbook-muted">
          Nenhum pagamento encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto sb-surface border sb-border rounded-2xl">
          <table className="min-w-full text-sm">
            <thead className="border-b sb-border text-sportsbook-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Usuário</th>
                <th className="px-4 py-3 text-left font-medium">Pacote</th>
                <th className="px-4 py-3 text-left font-medium">Valor</th>
                <th className="px-4 py-3 text-left font-medium">Moedas</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Criado</th>
                <th className="px-4 py-3 text-left font-medium">Expira</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((payment) => (
                <tr key={payment.id} className="border-b sb-border/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{payment.user.username}</div>
                    <div className="text-xs text-sportsbook-muted">
                      {payment.user.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">{payment.packageName}</td>
                  <td className="px-4 py-3">{formatCurrency(payment.amountCents)}</td>
                  <td className="px-4 py-3">{payment.coinsAmount}</td>
                  <td className="px-4 py-3">{STATUS_LABELS[payment.status]}</td>
                  <td className="px-4 py-3 text-sportsbook-muted">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sportsbook-muted">
                    {formatDate(payment.expiresAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {payment.status === "PENDING" && (
                      <Button
                        size="sm"
                        disabled={approvingId === payment.id}
                        onClick={() => setConfirmPayment(payment)}
                      >
                        Aprovar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPixPaymentsPage;
