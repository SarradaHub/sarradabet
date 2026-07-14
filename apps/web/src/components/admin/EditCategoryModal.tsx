import React, { useState, useEffect } from "react";
import { useUpdateCategory, invalidateCategoriesQueries } from "../../hooks";
import { Category, UpdateCategoryDto } from "../../types/category";
import SportsbookModal, { sportsbookFieldClass } from "../ui/SportsbookModal";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { Input } from "@sarradahub/design-system";
import { unwrapCategory } from "../../utils/apiData";

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onCategoryUpdated: (category: Category) => void;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onCategoryUpdated,
}) => {
  const [formData, setFormData] = useState<UpdateCategoryDto>({ title: "" });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const updateCategoryMutation = useUpdateCategory();

  useEffect(() => {
    if (isOpen && category) {
      setFormData({ title: category.title });
      setValidationErrors([]);
    }
  }, [isOpen, category]);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const title = formData.title?.trim() || "";

    if (!title) errors.push("Título é obrigatório");
    if (title.length < 2) errors.push("Título deve ter pelo menos 2 caracteres");
    if (title.length > 50) errors.push("Título deve ter menos de 50 caracteres");

    const invalidCharRegex = /[^a-zA-Z0-9\s\-_]/;
    if (invalidCharRegex.test(title)) {
      errors.push(
        "Título contém caracteres inválidos. Use apenas letras, números, espaços, hífens e underscores",
      );
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !validateForm()) return;

    try {
      const result = await updateCategoryMutation.mutateAsync({
        id: category.id,
        data: formData,
      });

      const updated = unwrapCategory(result);
      if (updated) {
        invalidateCategoriesQueries();
        onCategoryUpdated(updated);
        onClose();
      }
    } catch (error) {
      console.error("Failed to update category:", error);
    }
  };

  if (!category) return null;

  return (
    <SportsbookModal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar categoria"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="edit-cat-title"
          type="text"
          label="Título"
          value={formData.title || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          maxLength={50}
          required
          className={sportsbookFieldClass}
        />

        {validationErrors.length > 0 && (
          <ErrorMessage error={validationErrors} title="Erros de Validação" />
        )}

        {updateCategoryMutation.error && (
          <ErrorMessage
            error={updateCategoryMutation.error}
            title="Falha ao atualizar categoria"
          />
        )}

        <div className="flex justify-end gap-3 pt-2 border-t sb-border">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={updateCategoryMutation.loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={updateCategoryMutation.loading}
            disabled={updateCategoryMutation.loading}
            className="sb-brand-gradient text-black font-display font-semibold"
          >
            Salvar
          </Button>
        </div>
      </form>
    </SportsbookModal>
  );
};

export default EditCategoryModal;
