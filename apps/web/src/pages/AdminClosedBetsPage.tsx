import React, { useMemo, useState } from "react";
import { Link } from "react-router";
import { CheckCircle } from "lucide-react";
import { Alert, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@sarradahub/design-system";
import ResolveBetModal from "../components/admin/ResolveBetModal";
import BetStatusBadge from "../components/admin/BetStatusBadge";
import { Button } from "../components/ui/Button";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import {
  RESOLUTION_QUEUE_PARAMS,
  useAdminBets,
  useCategories,
  CATEGORIES_LIST_PARAMS,
} from "../hooks";
import { useBetResolutionQueue } from "../hooks/useBetResolutionQueue";
import { Bet } from "../types/bet";
import { Category } from "../types/category";
import { unwrapList } from "../utils/apiData";
import { formatScheduleDate } from "../utils/formatSchedule";

const AdminClosedBetsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const {
    data: betsResponse,
    loading,
    error,
    refetch,
  } = useAdminBets({ ...RESOLUTION_QUEUE_PARAMS, page });
  const { data: categoriesResponse } = useCategories(CATEGORIES_LIST_PARAMS);

  const bets = useMemo(() => unwrapList<Bet>(betsResponse), [betsResponse]);
  const categories = useMemo(
    () => unwrapList<Category>(categoriesResponse),
    [categoriesResponse],
  );

  const queue = useBetResolutionQueue(bets);

  if (loading) {
    return <LoadingSpinner size="lg" text="Carregando apostas fechadas..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        error={error}
        title="Erro ao carregar apostas fechadas"
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ResolveBetModal
        isOpen={queue.isQueueActive}
        onClose={() => {
          queue.cancelQueue();
        }}
        bet={queue.currentBet}
        progressLabel={
          queue.queueTotal > 1
            ? `Resolvendo ${queue.queuePosition} de ${queue.queueTotal} — ${queue.currentBet?.title ?? ""}`
            : undefined
        }
        onBetResolved={() => {
          queue.advanceQueue();
          void refetch();
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-sportsbook-fg tracking-wide">
            Apostas Fechadas
          </h2>
          <p className="text-sportsbook-muted text-sm mt-1">
            Fila de resolução — {bets.length} apostas aguardando resultado
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/bets"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg sb-btn-secondary font-display text-sm"
          >
            Ver todas as apostas
          </Link>
          <Button
            type="button"
            onClick={() => queue.startSelectedQueue()}
            disabled={queue.selectedCount === 0}
            className="sb-brand-gradient text-black font-display font-semibold"
          >
            Resolver selecionadas ({queue.selectedCount})
          </Button>
        </div>
      </div>

      {queue.selectionError && (
        <Alert variant="warning" title="Seleção inválida">
          {queue.selectionError}
        </Alert>
      )}

      {queue.successMessage && (
        <Alert variant="success" title="Sucesso">
          {queue.successMessage}
        </Alert>
      )}

      <div className="sb-surface-raised border sb-border rounded-lg overflow-hidden">
        <Table className="divide-sportsbook-border">
          <TableHeader className="bg-sportsbook-raised">
            <TableRow hoverable={false}>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  aria-label="Selecionar todas as apostas fechadas"
                  checked={queue.allEligibleSelected}
                  disabled={queue.eligibleBets.length === 0}
                  onChange={() => queue.toggleSelectAll()}
                />
              </TableHead>
              <TableHead className="text-sportsbook-muted">Título</TableHead>
              <TableHead className="text-sportsbook-muted">Categoria</TableHead>
              <TableHead className="text-sportsbook-muted">Status</TableHead>
              <TableHead className="text-sportsbook-muted">Encerramento</TableHead>
              <TableHead className="text-sportsbook-muted">Odds</TableHead>
              <TableHead className="text-sportsbook-muted">Votos / Pote</TableHead>
              <TableHead className="text-sportsbook-muted text-right">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-sportsbook-surface divide-sportsbook-border">
            {bets.length === 0 ? (
              <TableRow hoverable={false}>
                <TableCell
                  colSpan={8}
                  className="text-center text-sportsbook-muted py-8"
                >
                  Nenhuma aposta fechada aguardando resolução.
                </TableCell>
              </TableRow>
            ) : (
              bets.map((bet) => {
                const canSelect = queue.canSelect(bet.id);

                return (
                <TableRow key={bet.id} hoverable>
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${bet.title}`}
                      checked={canSelect && queue.isSelected(bet.id)}
                      disabled={!canSelect}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => queue.toggleSelection(bet.id)}
                    />
                  </TableCell>
                  <TableCell className="text-sportsbook-fg max-w-[220px] truncate">
                    {bet.title}
                  </TableCell>
                  <TableCell className="text-sportsbook-muted">
                    {bet.category?.title ||
                      categories.find((cat) => cat.id === bet.categoryId)?.title ||
                      "—"}
                  </TableCell>
                  <TableCell>
                    <BetStatusBadge bet={bet} />
                  </TableCell>
                  <TableCell className="text-sportsbook-muted text-xs tabular-nums">
                    {formatScheduleDate(bet.closesAt)}
                  </TableCell>
                  <TableCell className="text-sportsbook-muted tabular-nums">
                    {bet.odds.length}
                  </TableCell>
                  <TableCell className="text-sportsbook-odds tabular-nums">
                    {bet.totalVotes} / {bet.totalStake ?? 0}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => queue.startQueue([bet.id])}
                        className="p-1.5 rounded text-sportsbook-muted hover:text-sportsbook-odds hover:bg-sportsbook-raised transition-colors"
                        aria-label={`Resolver ${bet.title}`}
                      >
                        <CheckCircle className="w-4 h-4" />
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

      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          disabled={page <= 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          Anterior
        </Button>
        <Button variant="secondary" onClick={() => setPage((current) => current + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  );
};

export default AdminClosedBetsPage;
