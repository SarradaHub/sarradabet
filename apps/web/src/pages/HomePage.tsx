import React, { useMemo } from "react";
import { HOME_BETS_PARAMS, useBets, useCategories, CATEGORIES_LIST_PARAMS } from "../hooks";
import { Bet } from "../types/bet";
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
  groupBetsByCategory,
  unwrapBetsResponse,
} from "../utils/betGrouping";

const HomePage: React.FC = () => {
  const {
    data: betsResponse,
    loading: betsLoading,
    error: betsError,
    apiError: betsApiError,
    refetch: refetchBets,
  } = useBets(HOME_BETS_PARAMS);

  const {
    data: categoriesResponse,
    loading: categoriesLoading,
    error: categoriesError,
    apiError: categoriesApiError,
    refetch: refetchCategories,
  } = useCategories(CATEGORIES_LIST_PARAMS);

  const bets = useMemo(() => unwrapBetsResponse(betsResponse), [betsResponse]);

  const categories = useMemo((): Category[] => {
    if (!categoriesResponse) return [];
    if (Array.isArray(categoriesResponse)) {
      return categoriesResponse as Category[];
    }
    if (
      categoriesResponse &&
      typeof categoriesResponse === "object" &&
      "data" in categoriesResponse
    ) {
      const nestedData = (categoriesResponse as { data?: Category[] }).data;
      return Array.isArray(nestedData) ? nestedData : [];
    }
    return [];
  }, [categoriesResponse]);

  const groupedBets = useMemo(
    () => groupBetsByCategory(bets, categories),
    [bets, categories],
  );

  const categoryCounts = useMemo(
    () => buildCategoryCounts(bets, categories, groupedBets),
    [bets, categories, groupedBets],
  );

  const isLoading = betsLoading || categoriesLoading;
  const hasError = betsError || categoriesError;

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
          <OddsBoard
            groupedBets={groupedBets}
            loading={isLoading}
            emptyMessage="Nenhuma aposta aberta no momento. Volte em breve!"
          />
        }
        slip={<VoteSlip />}
        mobileSlipChip={<MobileVoteSlipChip />}
        footer={<AppFooter />}
      />
    </VoteSlipProvider>
  );
};

export default HomePage;
