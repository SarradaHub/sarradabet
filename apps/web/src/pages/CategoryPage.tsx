import React, { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router";
import {
  HOME_BETS_PARAMS,
  useBets,
  useCategories,
  CATEGORIES_LIST_PARAMS,
} from "../hooks";
import { BetStatus } from "../types/bet";
import { Category } from "../types/category";
import Navigation from "../components/Navigation";
import { AppFooter } from "../components/legal/AppFooter";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import SportsbookLayout from "../components/sportsbook/SportsbookLayout";
import CategorySidebar from "../components/sportsbook/CategorySidebar";
import OddsBoard from "../components/sportsbook/OddsBoard";
import VoteSlip from "../components/sportsbook/VoteSlip";
import PromoStrip from "../components/sportsbook/PromoStrip";
import {
  MobileCategoryDrawer,
  MobileVoteSlipChip,
} from "../components/sportsbook/MobileDrawers";
import { VoteSlipProvider } from "../context/VoteSlipContext";
import {
  buildCategoryCounts,
  filterBetsByDisplayStatus,
  groupBetsByCategory,
  unwrapBetsResponse,
} from "../utils/betGrouping";
import { unwrapList } from "../utils/apiData";
import { cn } from "../utils/cn";

type StatusTab = "all" | BetStatus;

const STATUS_TABS: Array<{ id: StatusTab; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "open", label: "Abertas" },
  { id: "scheduled", label: "Agendadas" },
  { id: "closed", label: "Fechadas" },
  { id: "resolved", label: "Resolvidas" },
];

const CategoryPage: React.FC = () => {
  const { id } = useParams();
  const categoryId = Number.parseInt(id ?? "", 10);
  const isValidCategoryId = Number.isFinite(categoryId) && categoryId > 0;
  const [statusTab, setStatusTab] = useState<StatusTab>("all");

  const {
    data: betsResponse,
    loading: betsLoading,
    error: betsError,
    apiError: betsApiError,
    refetch: refetchBets,
  } = useBets(
    {
      categoryId,
      limit: 100,
      sortBy: "closesAt",
      sortOrder: "asc",
    },
    { enabled: isValidCategoryId },
  );

  const {
    data: categoriesResponse,
    loading: categoriesLoading,
    error: categoriesError,
    apiError: categoriesApiError,
    refetch: refetchCategories,
  } = useCategories(CATEGORIES_LIST_PARAMS);

  const categories = useMemo(
    () => unwrapList<Category>(categoriesResponse),
    [categoriesResponse],
  );

  const currentCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId],
  );

  const allCategoryBets = useMemo(
    () => unwrapBetsResponse(betsResponse),
    [betsResponse],
  );

  const filteredBets = useMemo(
    () => filterBetsByDisplayStatus(allCategoryBets, statusTab),
    [allCategoryBets, statusTab],
  );

  const groupedBets = useMemo(() => {
    if (!currentCategory || filteredBets.length === 0) {
      return [];
    }

    return [
      {
        id: currentCategory.id,
        name: currentCategory.title,
        bets: filteredBets,
      },
    ];
  }, [currentCategory, filteredBets]);

  const {
    data: homeBetsResponse,
  } = useBets(HOME_BETS_PARAMS);

  const homeBets = useMemo(
    () => unwrapBetsResponse(homeBetsResponse),
    [homeBetsResponse],
  );

  const categoryCounts = useMemo(
    () =>
      buildCategoryCounts(
        homeBets,
        categories,
        groupBetsByCategory(homeBets, categories),
      ),
    [homeBets, categories],
  );

  const isLoading = betsLoading || categoriesLoading;
  const hasError = betsError || categoriesError;

  if (!isValidCategoryId) {
    return <Navigate to="/404" replace />;
  }

  if (!isLoading && !hasError && categories.length > 0 && !currentCategory) {
    return <Navigate to="/404" replace />;
  }

  if (hasError && !isLoading) {
    return (
      <div className="min-h-screen bg-sportsbook-bg flex items-center justify-center p-4">
        <ErrorMessage
          error={betsError || categoriesError || "Falha ao carregar dados"}
          apiError={betsApiError || categoriesApiError}
          onRetry={() => {
            refetchBets();
            refetchCategories();
          }}
        />
      </div>
    );
  }

  return (
    <VoteSlipProvider>
      <SportsbookLayout
        header={
          <Navigation
            mobileCategoryTrigger={
              <MobileCategoryDrawer
                categories={categories}
                categoryCounts={categoryCounts}
                categoriesLoading={categoriesLoading}
              />
            }
          />
        }
        promo={<PromoStrip />}
        sidebar={
          <CategorySidebar
            categories={categories}
            categoryCounts={categoryCounts}
            loading={categoriesLoading}
          />
        }
        board={
          <div className="space-y-0">
            <div className="px-4 py-3 border-b sb-border sb-surface sticky top-0 z-10">
              <h1 className="font-display text-lg font-bold text-sportsbook-fg">
                {currentCategory?.title ?? "Categoria"}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusTab(tab.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-display font-semibold transition-colors",
                      statusTab === tab.id
                        ? "sb-brand-gradient text-black"
                        : "sb-surface-raised text-sportsbook-muted hover:text-sportsbook-fg",
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <OddsBoard groupedBets={groupedBets} loading={isLoading} />
          </div>
        }
        slip={<VoteSlip />}
        mobileSlipChip={<MobileVoteSlipChip />}
        footer={<AppFooter />}
      />
    </VoteSlipProvider>
  );
};

export default CategoryPage;
