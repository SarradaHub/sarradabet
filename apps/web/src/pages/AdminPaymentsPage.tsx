import React, { useEffect, useMemo, useState } from "react";
import type {
  AdminPixPaymentListItem,
  CoinPackage,
  PixPaymentChannel,
  PixPaymentStatus,
  UserPublic,
} from "@sarradabet/types";
import { PixQrCode } from "../components/PixQrCode";
import { Button } from "../components/ui/Button";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { sportsbookFieldClass } from "../components/ui/SportsbookModal";
import { useAdminInstorePurchase } from "../hooks/useAdminInstorePurchase";
import {
  adminCoinPackageService,
  adminPaymentService,
} from "../services/CoinPaymentService";
import { userService } from "../services/UserService";
import { getApiErrorMessage } from "../utils/apiError";

type Tab = "caixa" | "monitor";

const STATUS_LABELS: Record<PixPaymentStatus, string> = {
  PENDING: "Aguardando",
  APPROVED: "Pago",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
  FAILED: "Falhou",
};

const CHANNEL_LABELS: Record<PixPaymentChannel, string> = {
  online: "Pix online",
  instore: "QR presencial",
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

const AdminPaymentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("caixa");
  const [users, setUsers] = useState<UserPublic[]>([]);
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [selectedPackageId, setSelectedPackageId] = useState<number | "">("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulateError, setSimulateError] = useState<string | null>(null);

  const [payments, setPayments] = useState<AdminPixPaymentListItem[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PixPaymentStatus | "">("");
  const [channelFilter, setChannelFilter] = useState<PixPaymentChannel | "">("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [paymentDetail, setPaymentDetail] = useState<
    Awaited<ReturnType<typeof adminPaymentService.getPaymentDetail>> | null
  >(null);

  const {
    purchase,
    status,
    loading: purchaseLoading,
    error: purchaseError,
    startPurchase,
    resetPurchase,
    setStatus,
  } = useAdminInstorePurchase((approved) => {
    setSuccessMessage(
      `Pagamento confirmado! ${approved.coinsAmount} moedas creditadas para ${approved.username}.`,
    );
    void loadPayments();
  });

  const activePackages = useMemo(
    () => packages.filter((pkg) => pkg.isActive),
    [packages],
  );

  const selectedUser = users.find((user) => user.id === selectedUserId);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      setDataError(null);
      const [usersResult, packagesResult] = await Promise.all([
        userService.listUsers(),
        adminCoinPackageService.listAll(),
      ]);
      setUsers(usersResult);
      setPackages(packagesResult);
    } catch (err) {
      setDataError(getApiErrorMessage(err, "Erro ao carregar dados"));
    } finally {
      setLoadingData(false);
    }
  };

  const loadPayments = async () => {
    try {
      setPaymentsLoading(true);
      setPaymentsError(null);
      const result = await adminPaymentService.listPayments({
        page: 1,
        limit: 50,
        status: statusFilter || undefined,
        channel: channelFilter || undefined,
      });
      setPayments(result.items);
    } catch (err) {
      setPaymentsError(getApiErrorMessage(err, "Erro ao carregar pagamentos"));
    } finally {
      setPaymentsLoading(false);
    }
  };

  const loadPaymentDetail = async (paymentId: number) => {
    try {
      setSelectedPaymentId(paymentId);
      const detail = await adminPaymentService.getPaymentDetail(paymentId);
      setPaymentDetail(detail);
    } catch (err) {
      setPaymentsError(getApiErrorMessage(err, "Erro ao carregar detalhe"));
    }
  };

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab !== "monitor") {
      return;
    }

    void (async () => {
      try {
        setPaymentsLoading(true);
        setPaymentsError(null);
        const result = await adminPaymentService.listPayments({
          page: 1,
          limit: 50,
          status: statusFilter || undefined,
          channel: channelFilter || undefined,
        });
        setPayments(result.items);
      } catch (err) {
        setPaymentsError(getApiErrorMessage(err, "Erro ao carregar pagamentos"));
      } finally {
        setPaymentsLoading(false);
      }
    })();
  }, [activeTab, statusFilter, channelFilter]);

  const handleGenerateQr = async () => {
    if (!selectedUserId || !selectedPackageId) {
      return;
    }

    setSuccessMessage(null);
    setSimulateError(null);
    resetPurchase();
    await startPurchase(selectedUserId, selectedPackageId);
  };

  const handleCopyPaste = async () => {
    if (!status?.copyPaste) {
      return;
    }

    await navigator.clipboard.writeText(status.copyPaste);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulate = async () => {
    if (!purchase) {
      return;
    }

    try {
      setSimulating(true);
      setSimulateError(null);
      await adminPaymentService.simulateMockInstoreApproval(purchase.paymentId);
      const detail = await adminPaymentService.getPaymentDetail(purchase.paymentId);
      setStatus(detail);
      setSuccessMessage("Pagamento simulado e moedas creditadas.");
      void loadPayments();
    } catch (err) {
      setSimulateError(getApiErrorMessage(err, "Erro ao simular pagamento"));
    } finally {
      setSimulating(false);
    }
  };

  const isPending = status?.status === "PENDING";

  if (loadingData) {
    return <LoadingSpinner text="Carregando pagamentos..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Pagamentos</h1>
        <p className="text-sportsbook-muted text-sm">
          Caixa QR presencial e monitoramento de pagamentos Pix.
        </p>
      </div>

      {dataError && <ErrorMessage error={dataError} />}

      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === "caixa" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("caixa")}
        >
          Caixa QR
        </Button>
        <Button
          variant={activeTab === "monitor" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setActiveTab("monitor")}
        >
          Monitoramento
        </Button>
      </div>

      {activeTab === "caixa" && (
        <div className="space-y-6">
          <div className="sb-surface border sb-border rounded-2xl p-6 space-y-4">
            <h2 className="font-display text-xl font-bold">Gerar QR para cliente</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 block">
                <span className="text-sm text-sportsbook-muted">Usuário</span>
                <select
                  className={sportsbookFieldClass}
                  value={selectedUserId}
                  onChange={(event) =>
                    setSelectedUserId(
                      event.target.value ? Number(event.target.value) : "",
                    )
                  }
                >
                  <option value="">Selecione um usuário</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 block">
                <span className="text-sm text-sportsbook-muted">Pacote</span>
                <select
                  className={sportsbookFieldClass}
                  value={selectedPackageId}
                  onChange={(event) =>
                    setSelectedPackageId(
                      event.target.value ? Number(event.target.value) : "",
                    )
                  }
                >
                  <option value="">Selecione um pacote</option>
                  {activePackages.map((coinPackage) => (
                    <option key={coinPackage.id} value={coinPackage.id}>
                      {coinPackage.name} — {formatCurrency(coinPackage.amountCents)} →{" "}
                      {coinPackage.coinsAmount} moedas
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedUser && (
              <p className="text-sm text-sportsbook-muted">
                Cliente: <span className="text-white">{selectedUser.username}</span>
              </p>
            )}

            <Button
              disabled={
                !selectedUserId || !selectedPackageId || purchaseLoading
              }
              onClick={() => void handleGenerateQr()}
            >
              {purchaseLoading ? "Gerando QR..." : "Gerar QR presencial"}
            </Button>

            {purchaseError && <ErrorMessage error={purchaseError} />}
          </div>

          {purchase && status && (
            <div className="sb-surface border sb-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-xl font-bold">
                    Pagamento QR presencial
                  </h2>
                  <p className="text-sm text-sportsbook-muted">
                    Status: {STATUS_LABELS[status.status]}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={resetPurchase}>
                  Novo QR
                </Button>
              </div>

              {isPending && (status.qrCodeBase64 || status.copyPaste) && (
                <PixQrCode
                  qrCodeBase64={status.qrCodeBase64}
                  copyPaste={status.copyPaste}
                  isMock={status.isMock}
                  size={320}
                />
              )}

              {status.copyPaste && isPending && (
                <div className="space-y-2">
                  <p className="text-sm text-sportsbook-muted">Copia e cola</p>
                  <textarea
                    readOnly
                    value={status.copyPaste}
                    className={`${sportsbookFieldClass} min-h-24 font-mono text-xs`}
                  />
                  <Button variant="secondary" size="sm" onClick={() => void handleCopyPaste()}>
                    {copied ? "Copiado!" : "Copiar código"}
                  </Button>
                </div>
              )}

              {status.isMock && isPending && (
                <div className="space-y-2">
                  <Button
                    variant="secondary"
                    disabled={simulating}
                    onClick={() => void handleSimulate()}
                  >
                    {simulating ? "Simulando..." : "Simular pagamento aprovado"}
                  </Button>
                  {simulateError && <ErrorMessage error={simulateError} />}
                </div>
              )}

              {successMessage && (
                <p className="text-green-400 text-sm">{successMessage}</p>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "monitor" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select
              className={sportsbookFieldClass}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as PixPaymentStatus | "")
              }
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <select
              className={sportsbookFieldClass}
              value={channelFilter}
              onChange={(event) =>
                setChannelFilter(event.target.value as PixPaymentChannel | "")
              }
            >
              <option value="">Todos os canais</option>
              {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <Button variant="secondary" size="sm" onClick={() => void loadPayments()}>
              Atualizar
            </Button>
          </div>

          {paymentsError && <ErrorMessage error={paymentsError} />}

          {paymentsLoading ? (
            <LoadingSpinner text="Carregando pagamentos..." />
          ) : payments.length === 0 ? (
            <div className="sb-surface border sb-border rounded-2xl p-6 text-center text-sportsbook-muted">
              Nenhum pagamento encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto sb-surface border sb-border rounded-2xl">
              <table className="min-w-full text-sm">
                <thead className="text-sportsbook-muted border-b sb-border">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Usuário</th>
                    <th className="px-4 py-3 text-left">Pacote</th>
                    <th className="px-4 py-3 text-left">Valor</th>
                    <th className="px-4 py-3 text-left">Canal</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Criado</th>
                    <th className="px-4 py-3 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b sb-border/60">
                      <td className="px-4 py-3">{payment.id}</td>
                      <td className="px-4 py-3">
                        <div>{payment.username}</div>
                        <div className="text-xs text-sportsbook-muted">
                          {payment.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">{payment.packageName}</td>
                      <td className="px-4 py-3">
                        {formatCurrency(payment.amountCents)}
                        <div className="text-xs text-sportsbook-muted">
                          {payment.coinsAmount} moedas
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {CHANNEL_LABELS[payment.channel]}
                      </td>
                      <td className="px-4 py-3">
                        {STATUS_LABELS[payment.status]}
                      </td>
                      <td className="px-4 py-3">{formatDate(payment.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => void loadPaymentDetail(payment.id)}
                        >
                          Detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedPaymentId && paymentDetail && (
            <div className="sb-surface border sb-border rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">
                  Pagamento #{paymentDetail.id}
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedPaymentId(null);
                    setPaymentDetail(null);
                  }}
                >
                  Fechar
                </Button>
              </div>
              <p className="text-sm">
                <span className="text-sportsbook-muted">Usuário:</span>{" "}
                {paymentDetail.username} ({paymentDetail.email})
              </p>
              <p className="text-sm">
                <span className="text-sportsbook-muted">Canal:</span>{" "}
                {CHANNEL_LABELS[paymentDetail.channel]}
              </p>
              <p className="text-sm">
                <span className="text-sportsbook-muted">Status:</span>{" "}
                {STATUS_LABELS[paymentDetail.status]}
              </p>
              <p className="text-sm">
                <span className="text-sportsbook-muted">External ID:</span>{" "}
                {paymentDetail.externalId}
              </p>
              {paymentDetail.status === "PENDING" &&
                (paymentDetail.qrCodeBase64 || paymentDetail.copyPaste) && (
                  <PixQrCode
                    qrCodeBase64={paymentDetail.qrCodeBase64}
                    copyPaste={paymentDetail.copyPaste}
                    isMock={paymentDetail.isMock}
                    size={256}
                  />
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPaymentsPage;
