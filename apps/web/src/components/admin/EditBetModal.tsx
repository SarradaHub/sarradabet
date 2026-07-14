import React, { useState, useEffect, useMemo } from "react";
import {
  useUpdateBet,
  useCategories,
  CATEGORIES_LIST_PARAMS,
  getCategoriesQueryKey,
  invalidateBetsQueries,
} from "../../hooks";
import { queryCache } from "../../core/hooks/useQueryCache";
import { Bet } from "../../types/bet";
import { Category } from "../../types/category";
import SportsbookModal, { sportsbookFieldClass } from "../ui/SportsbookModal";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { LoadingSpinner } from "../ui/LoadingSpinner";
import { Input, Textarea, Select } from "@sarradahub/design-system";
import { unwrapBet } from "../../utils/apiData";
import {
  estimateSiblingOddValues,
  formatOddValue,
  impliedProbabilityTotal,
} from "../../utils/odds";

interface EditableOdd {
  id: number;
  title: string;
  value: number;
}

interface EditBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  bet: Bet | null;
  onBetUpdated: (bet: Bet) => void;
}

const EditBetModal: React.FC<EditBetModalProps> = ({
  isOpen,
  onClose,
  bet,
  onBetUpdated,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [odds, setOdds] = useState<EditableOdd[]>([]);
  const [lastEditedOddIndex, setLastEditedOddIndex] = useState<number | null>(
    null,
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const {
    data: categoriesResponse,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories(CATEGORIES_LIST_PARAMS);
  const categories = Array.isArray(categoriesResponse)
    ? categoriesResponse
    : [];
  const updateBetMutation = useUpdateBet();

  useEffect(() => {
    if (isOpen && bet) {
      setTitle(bet.title);
      setDescription(bet.description || "");
      setCategoryId(bet.categoryId);
      setOdds(
        bet.odds.map((odd) => ({
          id: odd.id,
          title: odd.title,
          value: odd.value,
        })),
      );
      setValidationErrors([]);
      setLastEditedOddIndex(null);
      queryCache.clear(getCategoriesQueryKey(CATEGORIES_LIST_PARAMS));
      void refetchCategories();
    }
  }, [isOpen, bet, refetchCategories]);

  const updateOddTitle = (index: number, value: string) => {
    setOdds((current) =>
      current.map((odd, i) => (i === index ? { ...odd, title: value } : odd)),
    );
  };

  const updateOddValue = (index: number, value: string) => {
    const parsed = Number(value);
    setLastEditedOddIndex(index);
    setOdds((current) =>
      current.map((odd, i) =>
        i === index ? { ...odd, value: Number.isNaN(parsed) ? 0 : parsed } : odd,
      ),
    );
  };

  const estimatedOddValues = useMemo(() => {
    if (lastEditedOddIndex == null) {
      return odds.map(() => null);
    }
    return estimateSiblingOddValues(odds, lastEditedOddIndex);
  }, [odds, lastEditedOddIndex]);

  const impliedTotal = useMemo(
    () => impliedProbabilityTotal(odds.map((odd) => odd.value)),
    [odds],
  );

  const applyEstimatedValue = (index: number) => {
    const estimate = estimatedOddValues[index];
    if (estimate == null) return;

    setOdds((current) =>
      current.map((odd, i) =>
        i === index ? { ...odd, value: estimate } : odd,
      ),
    );
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!title.trim()) {
      errors.push("Título é obrigatório");
    }
    if (title.length < 2) {
      errors.push("Título deve ter pelo menos 2 caracteres");
    }
    if (!categoryId) {
      errors.push("Categoria é obrigatória");
    }

    if (odds.length < 2) {
      errors.push("Pelo menos duas odds são obrigatórias");
    }

    odds.forEach((odd, index) => {
      if (!odd.title.trim()) {
        errors.push(`Título da odd ${index + 1} é obrigatório`);
      }
      if (odd.value < 1.01 || odd.value > 1000) {
        errors.push(
          `Valor da odd ${index + 1} deve estar entre 1.01 e 1000`,
        );
      }
    });

    const titles = odds.map((odd) => odd.title.toLowerCase().trim());
    if (new Set(titles).size !== titles.length) {
      errors.push("Títulos das odds devem ser únicos");
    }

    const totalProbability = odds.reduce(
      (sum, odd) => sum + (odd.value > 0 ? 1 / odd.value : 0),
      0,
    );
    if (totalProbability < 0.8 || totalProbability > 1.2) {
      errors.push(
        "Valores das odds devem representar probabilidades realistas (soma de 1/odd entre 0.8 e 1.2)",
      );
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bet || !validateForm()) return;

    try {
      const result = await updateBetMutation.mutateAsync({
        id: bet.id,
        data: {
          title,
          description,
          categoryId: Number(categoryId),
          odds: odds.map((odd) => ({
            id: odd.id,
            title: odd.title.trim(),
            value: odd.value,
          })),
        },
      });

      const updated = unwrapBet(result);
      if (updated) {
        invalidateBetsQueries();
        onBetUpdated(updated);
        onClose();
      }
    } catch (error) {
      console.error("Failed to update bet:", error);
    }
  };

  if (!bet) return null;

  return (
    <SportsbookModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar aposta"
      description={`Status atual: ${bet.status}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="edit-title"
          type="text"
          label="Título"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTitle(e.target.value)
          }
          maxLength={255}
          required
          className={sportsbookFieldClass}
        />

        <Textarea
          id="edit-description"
          label="Descrição"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(e.target.value)
          }
          rows={3}
          maxLength={1000}
          className={sportsbookFieldClass}
        />

        {categoriesLoading ? (
          <LoadingSpinner size="sm" />
        ) : categoriesError ? (
          <div className="text-red-400 text-sm">
            Erro ao carregar categorias: {categoriesError}
          </div>
        ) : (
          <Select
            id="edit-category"
            label="Categoria"
            value={String(categoryId || "")}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setCategoryId(
                e.target.value ? Number(e.target.value) : undefined,
              )
            }
            required
            options={[
              { value: "", label: "Selecione uma categoria" },
              ...categories.map((category: Category) => ({
                value: String(category.id),
                label: category.title,
              })),
            ]}
            className={sportsbookFieldClass}
          />
        )}

        <section className="sb-surface border sb-border rounded-lg p-4 space-y-3">
          <div>
            <h3 className="text-sm font-display font-semibold tracking-wide text-white uppercase">
              Opções e odds
            </h3>
            <p className="text-xs text-sportsbook-muted mt-1">
              Edite título e valor de cada opção. Ao alterar uma odd, mostramos
              estimativas para equilibrar as demais.
            </p>
            {lastEditedOddIndex != null && (
              <p className="text-[11px] text-sportsbook-muted mt-2 tabular-nums">
                Soma 1/odd: {impliedTotal.toFixed(2)} · meta: 0.80–1.20
              </p>
            )}
          </div>

          <div className="space-y-3">
            {odds.map((odd, index) => {
              const estimate = estimatedOddValues[index];
              const showEstimate =
                estimate != null &&
                lastEditedOddIndex !== index &&
                Math.abs(estimate - odd.value) >= 0.01;

              return (
                <div key={odd.id} className="space-y-1">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-2 items-center">
                    <Input
                      type="text"
                      value={odd.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateOddTitle(index, e.target.value)
                      }
                      placeholder={`Opção ${index + 1}`}
                      className={sportsbookFieldClass}
                    />
                    <Input
                      type="number"
                      value={odd.value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateOddValue(index, e.target.value)
                      }
                      min={1.01}
                      max={1000}
                      step={0.01}
                      className={sportsbookFieldClass}
                      aria-label={`Valor da odd ${index + 1}`}
                    />
                  </div>
                  {showEstimate && (
                    <div className="sm:pl-0 sm:grid sm:grid-cols-[1fr_120px]">
                      <p className="sm:col-start-2 text-[10px] text-warning-400/90 flex items-center gap-2">
                        <span>
                          Estimado: {formatOddValue(estimate)}x
                        </span>
                        <button
                          type="button"
                          onClick={() => applyEstimatedValue(index)}
                          className="underline hover:text-warning-300 transition-colors"
                        >
                          aplicar
                        </button>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {validationErrors.length > 0 && (
          <ErrorMessage error={validationErrors} title="Erros de Validação" />
        )}

        {updateBetMutation.error && (
          <ErrorMessage
            error={updateBetMutation.error}
            title="Falha ao atualizar aposta"
          />
        )}

        <div className="flex justify-end gap-3 pt-2 border-t sb-border">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={updateBetMutation.loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={updateBetMutation.loading}
            disabled={updateBetMutation.loading}
            className="sb-brand-gradient text-black font-display font-semibold"
          >
            Salvar
          </Button>
        </div>
      </form>
    </SportsbookModal>
  );
};

export default EditBetModal;
