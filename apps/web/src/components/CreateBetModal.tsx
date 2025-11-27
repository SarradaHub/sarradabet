import React, { useState, useEffect } from "react";
import { useCreateBet, useCategories } from "../hooks";
import { Bet, CreateBetDto } from "../types/bet";
import { Category } from "../types/category";
import Modal from "./ui/Modal";
import { Button } from "./ui/Button";
import { ErrorMessage } from "./ui/ErrorMessage";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Input, Textarea, Select } from "@sarradahub/design-system";

interface CreateBetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBetCreated: (newBet: Bet) => void;
}

const CreateBetModal: React.FC<CreateBetModalProps> = ({
  isOpen,
  onClose,
  onBetCreated,
}) => {
  const [formData, setFormData] = useState<Partial<CreateBetDto>>({
    title: "",
    description: "",
    categoryId: undefined,
    odds: [{ title: "", value: 1 }],
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { data: categoriesResponse, loading: categoriesLoading, error: categoriesError } =
    useCategories();
  const categories = categoriesResponse ?? [];
  const createBetMutation = useCreateBet();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        description: "",
        categoryId: undefined,
        odds: [{ title: "", value: 1 }],
      });
      setValidationErrors([]);
    }
  }, [isOpen]);

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

    if (!formData.odds || formData.odds.length === 0) {
      errors.push("Pelo menos uma odd é obrigatória");
    }

    formData.odds?.forEach((odd, index) => {
      if (!odd.title.trim()) {
        errors.push(`Título da odd ${index + 1} é obrigatório`);
      }
      if (odd.value <= 1) {
        errors.push(`Valor da odd ${index + 1} deve ser maior que 1`);
      }
      if (odd.value > 1000) {
        errors.push(`Valor da odd ${index + 1} deve ser menor que 1000`);
      }
    });

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
    setFormData((prev) => ({
      ...prev,
      odds: [...(prev.odds || []), { title: "", value: 1 }],
    }));
  };

  const removeOdd = (index: number) => {
    if (formData.odds && formData.odds.length > 1) {
      setFormData((prev) => ({
        ...prev,
        odds: (prev.odds || []).filter((_, i) => i !== index),
      }));
    }
  };

  const updateOdd = (
    index: number,
    field: "title" | "value",
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      odds: (prev.odds || []).map((odd, i) =>
        i === index ? { ...odd, [field]: value } : odd,
      ),
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criar Nova Aposta"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input
            id="title"
            type="text"
            label="Título"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Digite o título da aposta"
            maxLength={255}
            required
            aria-invalid={validationErrors.some((e) => e.includes("Título"))}
            aria-describedby={
              validationErrors.some((e) => e.includes("Título"))
                ? "title-error"
                : undefined
            }
            className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:focus:ring-warning-400"
          />
        </div>

        <div>
          <Textarea
            id="description"
            label="Descrição"
            value={formData.description || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Digite a descrição da aposta (opcional)"
            rows={3}
            maxLength={1000}
            className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:focus:ring-warning-400"
          />
        </div>

        <div>
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
              aria-invalid={validationErrors.some((e) => e.includes("Categoria"))}
              aria-describedby={
                validationErrors.some((e) => e.includes("Categoria"))
                  ? "category-error"
                  : undefined
              }
              options={[
                { value: "", label: "Selecione uma categoria" },
                ...(Array.isArray(categories)
                  ? categories.map((category: Category) => ({
                      value: String(category.id),
                      label: category.title,
                    }))
                  : []),
              ]}
              className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:focus:ring-warning-400"
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Odds *
            </label>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addOdd}
            >
              Adicionar Odd
            </Button>
          </div>

          <div className="space-y-3">
            {formData.odds?.map((odd, index) => (
              <div key={index} className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={odd.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateOdd(index, "title", e.target.value)}
                    placeholder="Título da odd"
                    className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:focus:ring-warning-400"
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    value={odd.value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateOdd(index, "value", Number(e.target.value))
                    }
                    placeholder="Valor"
                    min="1.01"
                    max="1000"
                    step="0.01"
                    className="dark:bg-neutral-700 dark:border-neutral-600 dark:text-white dark:focus:ring-warning-400"
                  />
                </div>
                {formData.odds && formData.odds.length > 1 && (
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
        </div>

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

        <div className="flex justify-end gap-3">
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
          >
            Criar Aposta
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBetModal;
