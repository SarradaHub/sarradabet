import React, { useState, useEffect } from "react";
import { useCreateCategory } from "../hooks/useCategories";
import { CreateCategoryDto, Category } from "../types/category";
import SportsbookModal, {
  sportsbookFieldClass,
} from "./ui/SportsbookModal";
import { Button } from "./ui/Button";
import { ErrorMessage } from "./ui/ErrorMessage";
import { Input } from "@sarradahub/design-system";

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated?: (category: Category) => void;
}

const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
}) => {
  const [formData, setFormData] = useState<CreateCategoryDto>({
    title: "",
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const createCategoryMutation = useCreateCategory();

  useEffect(() => {
    if (isOpen) {
      setFormData({ title: "" });
      setValidationErrors([]);
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push("Título é obrigatório");
    }

    if (formData.title.length < 2) {
      errors.push("Título deve ter pelo menos 2 caracteres");
    }

    if (formData.title.length > 50) {
      errors.push("Título deve ter menos de 50 caracteres");
    }

    const invalidCharRegex = /[^a-zA-Z0-9\s\-_]/;
    if (invalidCharRegex.test(formData.title)) {
      errors.push(
        "Título contém caracteres inválidos. Use apenas letras, números, espaços, hífens e underscores",
      );
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
      const result = await createCategoryMutation.mutateAsync(formData);

      if (result) {
        onCategoryCreated?.(result);
        onClose();
      }
    } catch (error) {
      console.error("Falha ao criar categoria:", error);
    }
  };

  return (
    <SportsbookModal
      isOpen={isOpen}
      onClose={onClose}
      title="Nova categoria"
      description="Organize mercados por esporte ou tema"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Input
            id="title"
            type="text"
            label="Título"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Ex: Futebol, MMA, Basquete"
            maxLength={50}
            required
            className={sportsbookFieldClass}
          />
          <p className="text-xs text-sportsbook-muted mt-2">
            Letras, números, espaços, hífens e underscores
          </p>
        </div>

        {validationErrors.length > 0 && (
          <ErrorMessage error={validationErrors} title="Erros de Validação" />
        )}

        {createCategoryMutation.error && (
          <ErrorMessage
            error={createCategoryMutation.error}
            title="Falha ao criar categoria"
          />
        )}

        <div className="flex justify-end gap-3 pt-2 border-t sb-border">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createCategoryMutation.loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={createCategoryMutation.loading}
            disabled={createCategoryMutation.loading}
            className="sb-brand-gradient text-black font-display font-semibold tracking-wide hover:from-warning-300 hover:to-orange-400"
          >
            Criar categoria
          </Button>
        </div>
      </form>
    </SportsbookModal>
  );
};

export default CreateCategoryModal;
