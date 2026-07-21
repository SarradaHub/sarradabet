import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Lock, CheckCircle } from "lucide-react";
import {
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
  useBets,
  useCategories,
  useDeleteBet,
  useCloseBet,
  BETS_LIST_PARAMS,
  CATEGORIES_LIST_PARAMS,
} from "../hooks";
import { Bet, BetStatus } from "../types/bet";
import { Category } from "../types/category";
import { unwrapList } from "../utils/apiData";
import { sportsbookFieldClass } from "../components/ui/SportsbookModal";

const AdminBetsPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBet, setEditingBet] = useState<Bet | null>(null);
  const [resolvingBet, setResolvingBet] = useState<Bet | null>(null);
  const [deletingBet, setDeletingBet] = useState<Bet | null>(null);
  const [closingBet, setClosingBet] = useState<Bet | null>(null);
  const [statusFilter, setStatusFilter] = useState<BetStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");

  const {
    data: betsResponse,
    loading,
    error,
    refetch,
  } = useBets(BETS_LIST_PARAMS);
  const { data: categoriesResponse } = useCategories(CATEGORIES_LIST_PARAMS);

  const deleteBetMutation = useDeleteBet();
  const closeBetMutation = useCloseBet();

  const bets = useMemo(() => unwrapList<Bet>(betsResponse), [betsResponse]);
  const categories = useMemo(
    () => unwrapList<Category>(categoriesResponse),
    [categoriesResponse],
  );

  const filteredBets = useMemo(() => {
    return bets.filter((bet) => {
      if (statusFilter !== "all" && bet.status !== statusFilter) return false;
      if (categoryFilter !== "all" && bet.categoryId !== categoryFilter)
        return false;
      return true;
    });
  }, [bets, statusFilter, categoryFilter]);

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
        isOpen={!!resolvingBet}
        onClose={() => setResolvingBet(null)}
        bet={resolvingBet}
        onBetResolved={() => {
          setResolvingBet(null);
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white tracking-wide">
            Apostas
          </h2>
          <p className="text-sportsbook-muted text-sm mt-1">
            {filteredBets.length} de {bets.length} apostas
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="sb-brand-gradient text-black font-display font-semibold"
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Nova Aposta
        </Button>
      </div>

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
              <TableHead className="text-sportsbook-muted">Título</TableHead>
              <TableHead className="text-sportsbook-muted">Categoria</TableHead>
              <TableHead className="text-sportsbook-muted">Status</TableHead>
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
                  colSpan={6}
                  className="text-center text-sportsbook-muted py-8"
                >
                  Nenhuma aposta encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredBets.map((bet) => (
                <TableRow
                  key={bet.id}
                  hoverable
                  className="hover:[&_td]:text-neutral-900 hover:[&_td.text-sportsbook-odds]:text-green-700"
                >
                  <TableCell className="text-white max-w-[200px] truncate">
                    {bet.title}
                  </TableCell>
                  <TableCell className="text-sportsbook-muted">
                    {bet.category?.title || "—"}
                  </TableCell>
                  <TableCell>
                    <BetStatusBadge status={bet.status} />
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
                        className="p-1.5 rounded text-sportsbook-muted hover:text-white hover:bg-sportsbook-raised transition-colors"
                        aria-label={`Editar ${bet.title}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {bet.status === "open" && (
                        <button
                          type="button"
                          onClick={() => setClosingBet(bet)}
                          className="p-1.5 rounded text-sportsbook-muted hover:text-warning-400 hover:bg-sportsbook-raised transition-colors"
                          aria-label={`Fechar ${bet.title}`}
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                      )}
                      {bet.status === "closed" && (
                        <button
                          type="button"
                          onClick={() => setResolvingBet(bet)}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminBetsPage;
