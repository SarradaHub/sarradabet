import React, { useState, useMemo, useCallback } from "react";
import { useBets, useCategories } from "../hooks";
import { Bet } from "../types/bet";
import { Category } from "../types/category";
import Navigation from "../components/Navigation";
import BetCard from "../components/BetCard";
import CreateBetModal from "../components/CreateBetModal";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorMessage } from "../components/ui/ErrorMessage";

const HomePage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Data fetching
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
  } = useCategories({ limit: 100 });

  const bets = useMemo(() => {
    if (!betsResponse) return [];
    if (Array.isArray(betsResponse)) {
      return betsResponse;
    }
    if (betsResponse && typeof betsResponse === 'object' && 'data' in betsResponse) {
      const nestedData = (betsResponse as { data?: unknown[] }).data;
      return Array.isArray(nestedData) ? nestedData : [];
    }
    return [];
  }, [betsResponse]);
  
  const categories = useMemo(() => {
    if (!categoriesResponse) return [];
    if (Array.isArray(categoriesResponse)) {
      return categoriesResponse;
    }
    if (categoriesResponse && typeof categoriesResponse === 'object' && 'data' in categoriesResponse) {
      const nestedData = (categoriesResponse as { data?: unknown[] }).data;
      return Array.isArray(nestedData) ? nestedData : [];
    }
    return [];
  }, [categoriesResponse]);

  const handleBetCreated = useCallback(() => {
    refetchBets();
    setShowCreateModal(false);
  }, [refetchBets]);

  const handleVoteCreated = useCallback(() => {
    refetchBets();
  }, [refetchBets]);

  const handleCategoryCreated = useCallback(() => {
    refetchCategories();
  }, [refetchCategories]);

  const groupedBets = useMemo(() => {
    if (!Array.isArray(bets) || !Array.isArray(categories) || !bets.length || !categories.length) {
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

    categories.forEach((category: Category) => {
      groups.set(category.id, { category, bets: [] });
    });

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

  const isLoading = betsLoading || categoriesLoading;
  const hasError = betsError || categoriesError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <Navigation
        onOpenCreateModal={() => setShowCreateModal(true)}
        onCategoryCreated={handleCategoryCreated}
      />

      <CreateBetModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onBetCreated={handleBetCreated}
      />

      <HeroSection onOpenCreateModal={() => setShowCreateModal(true)} />

      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        loading={categoriesLoading}
        error={categoriesError}
      />

      {isLoading ? (
        <div className="bg-gray-900 min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" text="Carregando apostas..." />
        </div>
      ) : hasError ? (
        <div className="bg-gray-900 min-h-screen flex items-center justify-center">
          <ErrorMessage
            error={betsError || categoriesError || "Falha ao carregar dados"}
            apiError={betsApiError || categoriesApiError}
            onRetry={() => {
              refetchBets();
              refetchCategories();
            }}
          />
        </div>
      ) : (
        <BetsList
          groupedBets={filteredBets}
          onVoteCreated={handleVoteCreated}
        />
      )}
    </div>
  );
};

interface HeroProps {
  onOpenCreateModal: () => void;
}

const HeroSection: React.FC<HeroProps> = ({ onOpenCreateModal }) => (
  <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-20 lg:py-32 overflow-hidden">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
    </div>

    <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 shadow-2xl">
            <svg
              className="w-10 h-10 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
              SarradaBet
            </span>
            <br />
            <span className="text-white text-3xl sm:text-4xl lg:text-5xl">
              Sua Plataforma de Apostas
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Crie mercados de apostas personalizados, vote nas suas previsões
            favoritas e acompanhe odds em tempo real. A plataforma definitiva
            para entusiastas de apostas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onOpenCreateModal}
            className="group bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-4 rounded-xl text-lg font-bold hover:from-yellow-300 hover:to-orange-400 transition-all duration-300 shadow-2xl hover:shadow-yellow-500/25 transform hover:-translate-y-1 hover:scale-105"
          >
            <span className="flex items-center space-x-3">
              <svg
                className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Criar Nova Aposta</span>
            </span>
          </button>

          <button className="group border-2 border-gray-600 text-gray-300 px-8 py-4 rounded-xl text-lg font-semibold hover:border-gray-500 hover:text-white transition-all duration-300 hover:bg-gray-800/50">
            <span className="flex items-center space-x-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Como Funciona</span>
            </span>
          </button>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">1000+</div>
            <div className="text-gray-400">Apostas Ativas</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500 mb-2">500+</div>
            <div className="text-gray-400">Usuários Ativos</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500 mb-2">99.9%</div>
            <div className="text-gray-400">Uptime</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
  loading: boolean;
  error: string | null;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className="bg-gray-800 py-4">
        <div className="container mx-auto px-4">
          <LoadingSpinner size="sm" text="Carregando categorias..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 py-4">
        <div className="container mx-auto px-4">
          <ErrorMessage error={error} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">
            Filtrar por Categoria
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onSelectCategory(null)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:-translate-y-0.5 ${
                selectedCategory === null
                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-lg shadow-yellow-500/25"
                  : "bg-gray-700 text-white hover:bg-gray-600 shadow-md hover:shadow-lg"
              }`}
            >
              <span className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span>Todas</span>
              </span>
            </button>
            {Array.isArray(categories) && categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:-translate-y-0.5 ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black shadow-lg shadow-yellow-500/25"
                    : "bg-gray-700 text-white hover:bg-gray-600 shadow-md hover:shadow-lg"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-current opacity-60"></div>
                  <span>{category.title}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface BetsListProps {
  groupedBets: Array<{
    id: number | "uncategorized";
    name: string;
    bets: Bet[];
  }>;
  onVoteCreated: () => void;
}

const BetsList: React.FC<BetsListProps> = ({ groupedBets, onVoteCreated }) => (
  <div className="bg-gray-900 min-h-screen">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {groupedBets.length === 0 ? (
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Nenhuma aposta encontrada
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Crie sua primeira aposta para começar a apostar!
            </p>
            <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-3 rounded-xl font-semibold hover:from-yellow-300 hover:to-orange-400 transition-all duration-200 shadow-lg hover:shadow-yellow-500/25 transform hover:-translate-y-1">
              Criar Primeira Aposta
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {groupedBets.map((group) => (
            <div
              key={group.id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 lg:p-8 shadow-2xl border border-gray-700"
            >
              <div className="flex items-center space-x-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-7 h-7 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    {group.name}
                  </h2>
                  <p className="text-gray-400 mt-1">
                    {group.bets.length} apostas ativas
                  </p>
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.bets.map((bet) => (
                  <BetCard
                    key={bet.id}
                    bet={bet}
                    onVoteCreated={onVoteCreated}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default HomePage;
