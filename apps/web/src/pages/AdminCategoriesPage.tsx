import React, { useMemo, useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@sarradahub/design-system";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "../components/ui/Button";
import CreateCategoryModal from "../components/CreateCategoryModal";
import EditCategoryModal from "../components/admin/EditCategoryModal";
import ConfirmDialog from "../components/admin/ConfirmDialog";
import { ErrorMessage } from "../components/ui/ErrorMessage";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import {
  useCategories,
  useDeleteCategory,
  CATEGORIES_LIST_PARAMS,
} from "../hooks";
import { Category } from "../types/category";
import { unwrapList } from "../utils/apiData";

const AdminCategoriesPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );

  const {
    data: categoriesResponse,
    loading,
    error,
    refetch,
  } = useCategories(CATEGORIES_LIST_PARAMS);

  const deleteCategoryMutation = useDeleteCategory();

  const categories = useMemo(
    () => unwrapList<Category>(categoriesResponse),
    [categoriesResponse],
  );

  const handleDelete = async () => {
    if (!deletingCategory) return;
    const result = await deleteCategoryMutation.mutateAsync(deletingCategory.id);
    if (result !== null) {
      setDeletingCategory(null);
      void refetch();
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Carregando categorias..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        error={error}
        title="Erro ao carregar categorias"
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <CreateCategoryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCategoryCreated={() => {
          setShowCreateModal(false);
          void refetch();
        }}
      />
      <EditCategoryModal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        category={editingCategory}
        onCategoryUpdated={() => {
          setEditingCategory(null);
          void refetch();
        }}
      />
      <ConfirmDialog
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
        title="Excluir categoria"
        description={`Tem certeza que deseja excluir "${deletingCategory?.title}"? Categorias com apostas não podem ser excluídas.`}
        confirmLabel="Excluir"
        loading={deleteCategoryMutation.loading}
        error={deleteCategoryMutation.error}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-white tracking-wide">
            Categorias
          </h2>
          <p className="text-sportsbook-muted text-sm mt-1">
            {categories.length} categorias cadastradas
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="sb-brand-gradient text-black font-display font-semibold"
        >
          <Plus className="w-4 h-4 mr-2 inline" />
          Nova Categoria
        </Button>
      </div>

      <div className="sb-surface-raised border sb-border rounded-lg overflow-hidden">
        <Table className="divide-sportsbook-border">
          <TableHeader className="bg-sportsbook-raised">
            <TableRow hoverable={false}>
              <TableHead className="text-sportsbook-muted">Título</TableHead>
              <TableHead className="text-sportsbook-muted">Apostas</TableHead>
              <TableHead className="text-sportsbook-muted">Criada</TableHead>
              <TableHead className="text-sportsbook-muted text-right">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-sportsbook-surface divide-sportsbook-border">
            {categories.length === 0 ? (
              <TableRow hoverable={false}>
                <TableCell
                  colSpan={4}
                  className="text-center text-sportsbook-muted py-8"
                >
                  Nenhuma categoria cadastrada
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow
                  key={category.id}
                  hoverable
                  className="hover:[&_td]:text-neutral-900 hover:[&_td.text-sportsbook-odds]:text-green-700"
                >
                  <TableCell className="text-white font-medium">
                    {category.title}
                  </TableCell>
                  <TableCell className="text-sportsbook-odds tabular-nums">
                    {category._count?.bet ?? 0}
                  </TableCell>
                  <TableCell className="text-sportsbook-muted text-xs">
                    {category.createdAt
                      ? format(new Date(category.createdAt), "dd/MM/yyyy", {
                          locale: ptBR,
                        })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingCategory(category)}
                        className="p-1.5 rounded text-sportsbook-muted hover:text-white hover:bg-sportsbook-raised transition-colors"
                        aria-label={`Editar ${category.title}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCategory(category)}
                        className="p-1.5 rounded text-sportsbook-muted hover:text-red-400 hover:bg-sportsbook-raised transition-colors"
                        aria-label={`Excluir ${category.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminCategoriesPage;
