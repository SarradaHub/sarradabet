import React, { useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, Pencil, Trash2, Lock, CheckCircle } from "lucide-react";
import {
  Alert,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Select,
} from "@sarradahub/design-system";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "../components/ui/Button";
import CreateBetModal from "../components/CreateBetModal";
import EditBetModal from "../components/admin/EditBetModal";
import ResolveBetModal from "../components/admin/ResolveBetModal";
import ConfirmDialog from "../components/admin/ConfirmDialog";
import BetStatusBadge from "../components/admin/BetStatusBadge";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import {
  useAdminBets,
  useCategories,
  useDeleteBet,
  useCloseBet,
  useCloseBetsBatch,
  BETS_LIST_PARAMS,
  CATEGORIES_LIST_PARAMS,
} from "../hooks";
import { useBetAdminBatch } from "../hooks/useBetAdminBatch";
import { Bet, BetStatus } from "../types/bet";
import { Category } from "../types/category";
import { unwrapList } from "../utils/apiData";
import { formatScheduleDate } from "../utils/formatSchedule";
import { sportsbookFieldClass } from "../components/ui/SportsbookModal";
import {
  getDisplayBetStatus,
  isBetClosable,
  isBetInResolutionQueue,
} from "../utils/betSchedule";

const AdminBetsPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [deletingBet, setDeletingBet] = useState<Bet | null>(null);
  const [closingBet, setClosingBet] = useState<Bet | null>(null);
  const [showBatchCloseConfirm, setShowBatchCloseConfirm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BetStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");

  const {
    data: betsResponse,
    loading,
    error,
    refetch,
  } = useAdminBets(BETS_LIST_PARAMS);
  const { data: categoriesResponse } = useCategories(CATEGORIES_LIST_PARAMS);

  const deleteBetMutation = useDeleteBet();
  const closeBetMutation = useCloseBet();
  const closeBetsBatchMutation = useCloseBetsBatch();

  const bets = useMemo(() => unwrapList<Bet>(betsResponse), [betsResponse]);
  const categories = useMemo(
    () => unwrapList<Category>(categoriesResponse),
    [categoriesResponse],
  );

  const filteredBets = useMemo(() => {
    return bets.filter((bet) => {
      const displayStatus = getDisplayBetStatus(bet);
      if (statusFilter !== "all" && displayStatus !== statusFilter) {
        return false;
      }
      if (categoryFilter !== "all" && bet.categoryId !== categoryFilter) {
        return false;
      }
      return true;
    });
  }, [bets, statusFilter, categoryFilter]);

  const batch = useBetAdminBatch(bets, filteredBets);

  const handleDelete = async () => {
    if (!deletingBet) return;
    const result = await deleteBetMutation.mutateAsync(deletingBet.id);
    if (result !== null) {
      setDeletingBet(null);
      void refetch();
    }
  };

  const handleClose = async () => {
    if (!closingBet) return;
    const result = await closeBetMutation.mutateAsync(closingBet.id);
    if (result !== null) {
      setClosingBet(null);
      void refetch();
    }
  };

  const handleBatchClose = async () => {
    const ids = batch.selectedClosableIds;
    if (ids.length === 0) {
      return;
    }

    const result = await closeBetsBatchMutation.mutateAsync(ids);
    if (result === null) {
      return;
    }

    const closedCount = result.closed?.length ?? 0;
    const skippedCount = result.skipped?.length ?? 0;

    setShowBatchCloseConfirm(false);
    batch.clearSelection();

    if (closedCount > 0) {
      batch.setSuccessMessage(
        skippedCount > 0
          ? `${closedCount} aposta(s) fechada(s). ${skippedCount} não pôde(m) ser fechada(s).`
          : `${closedCount} aposta(s) fechada(s) com sucesso.`,
      );
    } else if (skippedCount > 0) {
      batch.clearSelectionError();
      batch.setSuccessMessage(null);
    }

    void refetch();
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Carregando apostas..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        error={error}
        title="Erro ao carregar apostas"
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <CreateBetModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onBetCreated={() => {
          setShowCreateModal(false);
          void refetch();
        }}
      />
      <EditBetModal
        isOpen={!!editingBet}
        onClose={() => setEditingBet(null)}
        bet={editingBet}
        onBetUpdated={() => {
          setEditingBet(null);
          void refetch();
        }}
      />
      <ResolveBetModal
        isOpen={batch.isQueueActive}
        onClose={() => batch.cancelQueue()}
        bet={batch.currentBet}
        progressLabel={
          batch.queueTotal > 1
            ? `Resolvendo ${batch.queuePosition} de ${batch.queueTotal} — ${batch.currentBet?.title ?? ""}`
            : undefined
        }
        onBetResolved={() => {
          batch.advanceQueue();
          void refetch();
        }}
      />
      <ConfirmDialog
        isOpen={!!deletingBet}
        onClose={() => setDeletingBet(null)}
        onConfirm={handleDelete}
        title="Excluir aposta"
        description={`Tem certeza que deseja excluir "${deletingBet?.title}"? Apostas com votos não podem ser excluídas.`}
        confirmLabel="Excluir"
        loading={deleteBetMutation.loading}
        error={deleteBetMutation.error}
      />
      <ConfirmDialog
        isOpen={!!closingBet}
        onClose={() => setClosingBet(null)}
        onConfirm={handleClose}
        title="Fechar aposta"
        description={`Fechar "${closingBet?.title}"? Não aceitará mais votos.`}
        confirmLabel="Fechar"
        variant="primary"
        loading={closeBetMutation.loading}
        error={closeBetMutation.error}
      />
      <ConfirmDialog
        isOpen={showBatchCloseConfirm}
        onClose={() => setShowBatchCloseConfirm(false)}
        onConfirm={handleBatchClose}
        title="Fechar apostas selecionadas"
        description={`Fechar ${batch.selectedCloseCount} aposta(s) aberta(s)? Elas deixarão de aceitar votos.`}
        confirmLabel="Fechar selecionadas"
        variant="primary"
        loading={closeBetsBatchMutation.loading}
        error={closeBetsBatchMutation.error}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-sportsbook-fg tracking-wide">
            Apostas
          </h2>
          <p className="text-sportsbook-muted text-sm mt-1">
            {filteredBets.length} de {bets.length} apostas
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/bets/closed"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg sb-btn-secondary font-display text-sm"
          >
            Fila de resolução
          </Link>
          <Button
            type="button"
            onClick={() => setShowBatchCloseConfirm(true)}
            disabled={batch.selectedCloseCount === 0}
            variant="secondary"
          >
            <Lock className="w-4 h-4 mr-2 inline" />
            Fechar selecionadas ({batch.selectedCloseCount})
          </Button>
          <Button
            type="button"
            onClick={() => batch.startSelectedResolveQueue()}
            disabled={batch.selectedResolveCount === 0}
            variant="secondary"
          >
            Resolver selecionadas ({batch.selectedResolveCount})
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="sb-brand-gradient text-black font-display font-semibold"
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Nova Aposta
          </Button>
        </div>
      </div>

      <p className="text-sm text-sportsbook-muted">
        Apostas abertas passam para Fechada automaticamente quando o
        encerramento vence (job em background a cada 60s). Use Fechar
        selecionadas para encerrar manualmente antes do prazo.
      </p>

      {batch.selectionError && (
        <Alert variant="warning" title="Seleção inválida">
          {batch.selectionError}
        </Alert>
      )}

      {batch.successMessage && (
        <Alert variant="success" title="Sucesso">
          {batch.successMessage}
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Select
          id="status-filter"
          label="Status"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as BetStatus | "all")
          }
          options={[
            { value: "all", label: "Todos" },
            { value: "scheduled", label: "Agendadas" },
            { value: "open", label: "Abertas" },
            { value: "closed", label: "Fechadas" },
            { value: "resolved", label: "Resolvidas" },
          ]}
          className={`${sportsbookFieldClass} max-w-xs`}
        />
        <Select
          id="category-filter"
          label="Categoria"
          value={String(categoryFilter)}
          onChange={(e) =>
            setCategoryFilter(
              e.target.value === "all" ? "all" : Number(e.target.value),
            )
          }
          options={[
            { value: "all", label: "Todas" },
            ...categories.map((cat) => ({
              value: String(cat.id),
              label: cat.title,
            })),
          ]}
          className={`${sportsbookFieldClass} max-w-xs`}
        />
      </div>

      <div className="sb-surface-raised border sb-border rounded-lg overflow-hidden">
        <Table className="divide-sportsbook-border">
          <TableHeader className="bg-sportsbook-raised">
            <TableRow hoverable={false}>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  aria-label="Selecionar apostas visíveis"
                  checked={batch.allSelectableSelected}
                  disabled={batch.selectableBets.length === 0}
                  onChange={() => batch.toggleSelectAll()}
                />
              </TableHead>
              <TableHead className="text-sportsbook-muted">Título</TableHead>
              <TableHead className="text-sportsbook-muted">Categoria</TableHead>
              <TableHead className="text-sportsbook-muted">Status</TableHead>
              <TableHead className="text-sportsbook-muted">Início</TableHead>
              <TableHead className="text-sportsbook-muted">Encerramento</TableHead>
              <TableHead className="text-sportsbook-muted">Votos</TableHead>
              <TableHead className="text-sportsbook-muted">Criada</TableHead>
              <TableHead className="text-sportsbook-muted text-right">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-sportsbook-surface divide-sportsbook-border">
            {filteredBets.length === 0 ? (
              <TableRow hoverable={false}>
                <TableCell
                  colSpan={9}
                  className="text-center text-sportsbook-muted py-8"
                >
                  Nenhuma aposta encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredBets.map((bet) => {
                const canResolve = isBetInResolutionQueue(bet);
                const canClose = isBetClosable(bet);
                const canSelect = batch.canSelect(bet.id);

                return (
                  <TableRow
                    key={bet.id}
                    hoverable
                    className="hover:[&_td]:text-neutral-900 hover:[&_td.text-sportsbook-odds]:text-green-700"
                  >
                    <TableCell>
                      {canSelect ? (
                        <input
                          type="checkbox"
                          aria-label={`Selecionar ${bet.title}`}
                          checked={batch.isSelected(bet.id)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => batch.toggleSelection(bet.id)}
                        />
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sportsbook-fg max-w-[200px] truncate">
                      {bet.title}
                    </TableCell>
                    <TableCell className="text-sportsbook-muted">
                      {bet.category?.title || "—"}
                    </TableCell>
                    <TableCell>
                      <BetStatusBadge bet={bet} />
                    </TableCell>
                    <TableCell className="text-sportsbook-muted text-xs tabular-nums">
                      {formatScheduleDate(bet.startTime)}
                    </TableCell>
                    <TableCell className="text-sportsbook-muted text-xs tabular-nums">
                      {formatScheduleDate(bet.closesAt)}
                    </TableCell>
                    <TableCell className="text-sportsbook-odds tabular-nums">
                      {bet.totalVotes}
                    </TableCell>
                    <TableCell className="text-sportsbook-muted text-xs">
                      {format(new Date(bet.createdAt), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingBet(bet)}
                          className="p-1.5 rounded text-sportsbook-muted hover:text-sportsbook-fg hover:bg-sportsbook-raised transition-colors"
                          aria-label={`Editar ${bet.title}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {canClose && (
                          <button
                            type="button"
                            onClick={() => setClosingBet(bet)}
                            className="p-1.5 rounded text-sportsbook-muted hover:text-warning-400 hover:bg-sportsbook-raised transition-colors"
                            aria-label={`Fechar ${bet.title}`}
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                        {canResolve && (
                          <button
                            type="button"
                            onClick={() => batch.startResolveQueue([bet.id])}
                            className="p-1.5 rounded text-sportsbook-muted hover:text-sportsbook-odds hover:bg-sportsbook-raised transition-colors"
                            aria-label={`Resolver ${bet.title}`}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeletingBet(bet)}
                          className="p-1.5 rounded text-sportsbook-muted hover:text-red-400 hover:bg-sportsbook-raised transition-colors"
                          aria-label={`Excluir ${bet.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminBetsPage;
