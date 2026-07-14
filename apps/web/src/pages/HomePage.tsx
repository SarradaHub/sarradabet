import React, { useState, useMemo } from "react";
import { useBets, useCategories, CATEGORIES_LIST_PARAMS } from "../hooks";
import { Bet } from "../types/bet";
import { Category } from "../types/category";
import Navigation from "../components/Navigation";
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

const HomePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const {
    data: betsResponse,
    loading: betsLoading,
    error: betsError,
    apiError: betsApiError,
    refetch: refetchBets,
  } = useBets({ limit: 50 });

  const {
    data: categoriesResponse,
    loading: categoriesLoading,
    error: categoriesError,
    apiError: categoriesApiError,
    refetch: refetchCategories,
  } = useCategories(CATEGORIES_LIST_PARAMS);

  const bets = useMemo((): Bet[] => {
    if (!betsResponse) return [];
    if (Array.isArray(betsResponse)) {
      return betsResponse as Bet[];
    }
    if (
      betsResponse &&
      typeof betsResponse === "object" &&
      "data" in betsResponse
    ) {
      const nestedData = (betsResponse as { data?: Bet[] }).data;
      return Array.isArray(nestedData) ? nestedData : [];
    }
    return [];
  }, [betsResponse]);

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

  const groupedBets = useMemo(() => {
    if (!Array.isArray(bets) || !bets.length) {
      return [];
    }

    const groups = new Map<
      number | "uncategorized",
      {
        category?: Category;
        bets: Bet[];
      }
    >();

    groups.set("uncategorized", { bets: [] });

    if (Array.isArray(categories)) {
      categories.forEach((category: Category) => {
        groups.set(category.id, { category, bets: [] });
      });
    }

    bets.forEach((bet: Bet) => {
      if (bet.categoryId && groups.has(bet.categoryId)) {
        groups.get(bet.categoryId)!.bets.push(bet);
      } else {
        groups.get("uncategorized")!.bets.push(bet);
      }
    });

    return Array.from(groups.entries())
      .filter(([, group]) => group.bets.length > 0)
      .map(([id, group]) => ({
        id,
        name: group.category?.title || "Sem Categoria",
        bets: group.bets,
      }));
  }, [bets, categories]);

  const filteredBets = useMemo(() => {
    if (!selectedCategory) return groupedBets;
    return groupedBets.filter((group) => group.id === selectedCategory);
  }, [groupedBets, selectedCategory]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<number | "all" | "uncategorized", number>();
    counts.set("all", bets.length);
    groupedBets.forEach((group) => {
      if (group.id === "uncategorized") {
        counts.set("uncategorized", group.bets.length);
      } else {
        counts.set(group.id as number, group.bets.length);
      }
    });
    categories.forEach((category) => {
      if (!counts.has(category.id)) {
        counts.set(category.id, 0);
      }
    });
    return counts;
  }, [bets.length, groupedBets, categories]);

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
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
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
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
            loading={categoriesLoading}
          />
        }
        board={
          <OddsBoard groupedBets={filteredBets} loading={isLoading} />
        }
        slip={<VoteSlip />}
        mobileSlipChip={<MobileVoteSlipChip />}
      />
    </VoteSlipProvider>
  );
};

export default HomePage;
