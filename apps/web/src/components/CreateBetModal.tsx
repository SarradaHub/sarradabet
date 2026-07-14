import React, { useState, useEffect } from "react";
import { Plus } from "@sarradahub/design-system";
import {
  useCreateBet,
  useCategories,
  CATEGORIES_LIST_PARAMS,
  getCategoriesQueryKey,
} from "../hooks";
import { queryCache } from "../core/hooks/useQueryCache";
import { Bet, CreateBetDto } from "../types/bet";
import { Category } from "../types/category";
import SportsbookModal, {
  sportsbookFieldClass,
} from "./ui/SportsbookModal";
import { Button } from "./ui/Button";
import { ErrorMessage } from "./ui/ErrorMessage";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Input, Textarea, Select } from "@sarradahub/design-system";

interface CreateBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBetCreated: (newBet: Bet) => void;
}

const defaultOdds = () => [{ title: "" }, { title: "" }];

const CreateBetModal: React.FC<CreateBetModalProps> = ({
  isOpen,
  onClose,
  onBetCreated,
}) => {
  const [formData, setFormData] = useState<Partial<CreateBetDto>>({
    title: "",
    description: "",
    categoryId: undefined,
    odds: defaultOdds(),
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const {
    data: categoriesResponse,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories(CATEGORIES_LIST_PARAMS);
  const categories = categoriesResponse ?? [];
  const createBetMutation = useCreateBet();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        description: "",
        categoryId: undefined,
        odds: defaultOdds(),
      });
      setValidationErrors([]);
      queryCache.clear(getCategoriesQueryKey(CATEGORIES_LIST_PARAMS));
      void refetchCategories();
    }
  }, [isOpen, refetchCategories]);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.title?.trim()) {
      errors.push("Título é obrigatório");
    }

    if (formData.title && formData.title.length < 2) {
      errors.push("Título deve ter pelo menos 2 caracteres");
    }

    if (formData.title && formData.title.length > 255) {
      errors.push("Título deve ter menos de 255 caracteres");
    }

    if (!formData.categoryId) {
      errors.push("Categoria é obrigatória");
    }

    if (!formData.odds || formData.odds.length < 2) {
      errors.push("Pelo menos duas odds são obrigatórias");
    }

    formData.odds?.forEach((odd, index) => {
      if (!odd.title.trim()) {
        errors.push(`Título da odd ${index + 1} é obrigatório`);
      }
    });

    const titles = formData.odds?.map((odd) => odd.title.toLowerCase().trim());
    if (titles && new Set(titles).size !== titles.length) {
      errors.push("Títulos das odds devem ser únicos");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const betData = {
        ...formData,
        categoryId: Number(formData.categoryId),
      } as CreateBetDto;

      const result = await createBetMutation.mutateAsync(betData);

      if (result) {
        onBetCreated(result);
        onClose();
      }
    } catch (error) {
      console.error("Failed to create bet:", error);
    }
  };

  const addOdd = () => {
    if ((formData.odds?.length ?? 0) >= 10) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      odds: [...(prev.odds || []), { title: "" }],
    }));
  };

  const removeOdd = (index: number) => {
    if (formData.odds && formData.odds.length > 2) {
      setFormData((prev) => ({
        ...prev,
        odds: (prev.odds || []).filter((_, i) => i !== index),
      }));
    }
  };

  const updateOddTitle = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      odds: (prev.odds || []).map((odd, i) =>
        i === index ? { ...odd, title: value } : odd,
      ),
    }));
  };

  return (
    <SportsbookModal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar mercado"
      description="Odds calculadas automaticamente a partir dos votos"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <Input
            id="title"
            type="text"
            label="Título"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Ex: Brasil vs Argentina — Quem ganha?"
            maxLength={255}
            required
            className={sportsbookFieldClass}
          />

          <Textarea
            id="description"
            label="Descrição"
            value={formData.description || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Contexto do mercado (opcional)"
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
              id="category"
              label="Categoria"
              value={String(formData.categoryId || "")}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFormData((prev) => ({
                  ...prev,
                  categoryId: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
              required
              options={[
                { value: "", label: "Selecione uma categoria" },
                ...(Array.isArray(categories)
                  ? categories.map((category: Category) => ({
                      value: String(category.id),
                      label: category.title,
                    }))
                  : []),
              ]}
              className={sportsbookFieldClass}
            />
          )}
        </div>

        <section className="sb-surface border sb-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-display font-semibold tracking-wide text-white uppercase">
                Opções
              </h3>
              <p className="text-xs text-sportsbook-muted mt-1">
                Mínimo 2 opções. Odds iguais até o primeiro voto.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={Plus}
              onClick={addOdd}
              disabled={(formData.odds?.length ?? 0) >= 10}
              className="font-display text-xs"
            >
              Adicionar
            </Button>
          </div>

          <div className="space-y-2">
            {formData.odds?.map((odd, index) => (
              <div key={index} className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={odd.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateOddTitle(index, e.target.value)
                    }
                    placeholder={`Opção ${index + 1}`}
                    className={sportsbookFieldClass}
                  />
                </div>
                {formData.odds && formData.odds.length > 2 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeOdd(index)}
                  >
                    Remover
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>

        {validationErrors.length > 0 && (
          <div role="alert" aria-live="polite">
            <ErrorMessage error={validationErrors} title="Erros de Validação" />
          </div>
        )}

        {createBetMutation.error && (
          <ErrorMessage
            error={createBetMutation.error}
            title="Falha ao criar aposta"
          />
        )}

        <div className="flex justify-end gap-3 pt-2 border-t sb-border">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createBetMutation.loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={createBetMutation.loading}
            disabled={createBetMutation.loading}
            className="sb-brand-gradient text-black font-display font-semibold tracking-wide hover:from-warning-300 hover:to-orange-400"
          >
            Criar mercado
          </Button>
        </div>
      </form>
    </SportsbookModal>
  );
};

export default CreateBetModal;
