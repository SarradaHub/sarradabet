import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "@sarradahub/design-system";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "../components/ui/Button";
import CreateBetModal from "../components/CreateBetModal";
import CreateCategoryModal from "../components/CreateCategoryModal";
import AdminStatCards, {
  type DashboardStats,
} from "../components/admin/AdminStatCards";
import AnalyticsOverviewCards from "../components/admin/AnalyticsOverviewCards";
import AnalyticsDateFilter from "../components/admin/AnalyticsDateFilter";
import BetsStatusChart from "../components/admin/BetsStatusChart";
import BetOddVotesChart from "../components/admin/BetOddVotesChart";
import PixRevenueChart from "../components/admin/PixRevenueChart";
import PeakHoursChart from "../components/admin/PeakHoursChart";
import CategoryBreakdownChart from "../components/admin/CategoryBreakdownChart";
import BetStatusBadge from "../components/admin/BetStatusBadge";
import {
  useBets,
  useCategories,
  BETS_LIST_PARAMS,
  CATEGORIES_LIST_PARAMS,
} from "../hooks";
import { useAnalytics } from "../hooks/useAnalytics";
import { Bet, BetStatus } from "../types/bet";
import { Category } from "../types/category";
import { unwrapList } from "../utils/apiData";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { adminHouseService } from "../services/CoinPaymentService";
import { analyticsService } from "../services/analyticsService";
import type { HouseTreasurySummary } from "@sarradabet/types";
import { useAuth } from "../hooks/useAuth";

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getDefaultAnalyticsStartDate(): string {
  const now = new Date();
  return formatDateInput(new Date(now.getFullYear(), 0, 1));
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [showCreateBetModal, setShowCreateBetModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [houseSummary, setHouseSummary] = useState<HouseTreasurySummary | null>(
    null,
  );
  const [houseError, setHouseError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(getDefaultAnalyticsStartDate);
  const [endDate, setEndDate] = useState(formatDateInput(new Date()));
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [exporting, setExporting] = useState(false);

  const analyticsFilters = useMemo(
    () => ({ startDate, endDate, categoryId }),
    [startDate, endDate, categoryId],
  );

  const {
    overview,
    betsByCategory,
    pixRevenue,
    peakHours,
    loading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useAnalytics(analyticsFilters);

  useEffect(() => {
    void adminHouseService
      .getSummary()
      .then(setHouseSummary)
      .catch((err: unknown) => {
        setHouseError(
          err instanceof Error ? err.message : "Erro ao carregar receita da casa",
        );
      });
  }, []);

  const {
    data: betsResponse,
    loading: betsLoading,
    error: betsError,
    refetch: refetchBets,
  } = useBets(BETS_LIST_PARAMS);

  const {
    data: categoriesResponse,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories(CATEGORIES_LIST_PARAMS);

  const bets = useMemo(() => unwrapList<Bet>(betsResponse), [betsResponse]);
  const categories = useMemo(
    () => unwrapList<Category>(categoriesResponse),
    [categoriesResponse],
  );

  const legacyStats = useMemo((): DashboardStats => {
    return {
      totalBets: bets.length,
      totalCategories: categories.length,
      totalVotes: bets.reduce((sum, bet) => sum + (bet.totalVotes || 0), 0),
      activeBets: bets.filter((bet) => bet.status === "open").length,
      houseTakeoutBalance: houseSummary?.balance ?? 0,
      takeoutPercent: houseSummary?.takeoutPercent ?? 25,
    };
  }, [bets, categories, houseSummary]);

  const statusChartData = useMemo(() => {
    const counts: Record<BetStatus, number> = {
      scheduled: 0,
      open: 0,
      closed: 0,
      resolved: 0,
    };
    bets.forEach((bet) => {
      counts[bet.status]++;
    });
    return (Object.keys(counts) as BetStatus[]).map((status) => ({
      status,
      count: counts[status],
    }));
  }, [bets]);

  const betOddChartData = useMemo(() => {
    return [...bets]
      .sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0))
      .map((bet) => ({
        betId: bet.id,
        betTitle: bet.title,
        odds: bet.odds.map((odd) => ({
          title: odd.title,
          votes: odd.totalVotes,
          value: odd.value,
        })),
      }));
  }, [bets]);

  const recentBets = useMemo(() => {
    return [...bets]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [bets]);

  const loading = betsLoading || categoriesLoading || analyticsLoading;
  const error = betsError || categoriesError || analyticsError;

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await fetch(
        analyticsService.getExportUrl(analyticsFilters),
        {
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
          credentials: "include",
        },
      );
      if (!response.ok) {
        throw new Error("Falha ao exportar CSV");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analytics_${startDate}_${endDate}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setHouseError(
        err instanceof Error ? err.message : "Erro ao exportar CSV",
      );
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Carregando dados..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        error={error}
        title="Erro ao carregar dashboard"
        onRetry={() => {
          void refetchBets();
          void refetchCategories();
          void refetchAnalytics();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <CreateBetModal
        isOpen={showCreateBetModal}
        onClose={() => setShowCreateBetModal(false)}
        onBetCreated={() => {
          setShowCreateBetModal(false);
          void refetchBets();
        }}
      />
      <CreateCategoryModal
        isOpen={showCreateCategoryModal}
        onClose={() => setShowCreateCategoryModal(false)}
        onCategoryCreated={() => {
          setShowCreateCategoryModal(false);
          void refetchCategories();
        }}
      />

      <AnalyticsDateFilter
        startDate={startDate}
        endDate={endDate}
        categoryId={categoryId}
        categories={categories}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onCategoryChange={setCategoryId}
        onExport={() => void handleExport()}
        exporting={exporting}
      />

      {overview && <AnalyticsOverviewCards overview={overview} />}
      <AdminStatCards stats={legacyStats} />
      {houseError && (
        <p className="text-xs text-warning-400" role="status">
          {houseError}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="sb-surface-raised border sb-border rounded-lg p-5">
          <h2 className="font-display text-lg font-bold text-white mb-1 tracking-wide">
            Receita Pix
          </h2>
          <p className="text-xs text-sportsbook-muted mb-4">
            Série temporal de pagamentos aprovados
          </p>
          <PixRevenueChart data={pixRevenue} />
        </div>

        <div className="sb-surface-raised border sb-border rounded-lg p-5">
          <h2 className="font-display text-lg font-bold text-white mb-1 tracking-wide">
            Apostas por categoria
          </h2>
          <p className="text-xs text-sportsbook-muted mb-4">
            Volume de moedas por categoria no período
          </p>
          <CategoryBreakdownChart data={betsByCategory} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="sb-surface-raised border sb-border rounded-lg p-5">
          <h2 className="font-display text-lg font-bold text-white mb-1 tracking-wide">
            Horários de pico
          </h2>
          <p className="text-xs text-sportsbook-muted mb-4">
            Apostas criadas por hora do dia
          </p>
          <PeakHoursChart data={peakHours} />
        </div>

        <div className="sb-surface-raised border sb-border rounded-lg p-5">
          <h2 className="font-display text-lg font-bold text-white mb-1 tracking-wide">
            Apostas por status
          </h2>
          <p className="text-xs text-sportsbook-muted mb-4">
            Distribuição das apostas ativas, fechadas e resolvidas
          </p>
          <BetsStatusChart data={statusChartData} />
        </div>
      </div>

      <div className="sb-surface-raised border sb-border rounded-lg p-5">
        <h2 className="font-display text-lg font-bold text-white mb-1 tracking-wide">
          Votos por aposta e odd
        </h2>
        <p className="text-xs text-sportsbook-muted mb-4">
          Cada aposta no eixo X · barras agrupadas por odd
        </p>
        <BetOddVotesChart data={betOddChartData} />
      </div>

      <div className="sb-surface-raised border sb-border rounded-lg p-5">
        <h2 className="font-display text-lg font-bold text-white mb-4 tracking-wide">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            onClick={() => navigate("/admin/bets")}
            className="sb-brand-gradient text-black font-display font-semibold hover:from-warning-300 hover:to-orange-400"
          >
            Gerenciar Apostas
          </Button>
          <Button
            onClick={() => setShowCreateBetModal(true)}
            variant="primary"
            leftIcon={Plus}
            className="sb-brand-gradient text-black font-display font-semibold hover:from-warning-300 hover:to-orange-400"
          >
            Nova Aposta
          </Button>
          <Button
            onClick={() => setShowCreateCategoryModal(true)}
            variant="secondary"
            leftIcon={Plus}
            className="font-display"
          >
            Nova Categoria
          </Button>
        </div>
      </div>

      <div className="sb-surface-raised border sb-border rounded-lg p-5">
        <h2 className="font-display text-lg font-bold text-white mb-4 tracking-wide">
          Atividade Recente
        </h2>
        {recentBets.length === 0 ? (
          <p className="text-sportsbook-muted text-sm">
            Nenhuma aposta cadastrada ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {recentBets.map((bet) => (
              <div
                key={bet.id}
                className="flex items-center gap-3 p-3 sb-surface rounded border sb-border"
              >
                <div className="w-2 h-2 rounded-full shrink-0 bg-sportsbook-odds" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-white font-medium">{bet.title}</p>
                    <BetStatusBadge status={bet.status} />
                  </div>
                  <p className="text-xs text-sportsbook-muted truncate">
                    {bet.category?.title || "Sem categoria"} ·{" "}
                    {bet.totalVotes} votos
                  </p>
                </div>
                <span className="text-xs text-sportsbook-muted shrink-0">
                  {formatDistanceToNow(new Date(bet.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
