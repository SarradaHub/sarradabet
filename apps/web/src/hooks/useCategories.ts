import { useQuery, useMutation } from "../core/hooks";
import { queryCache } from "../core/hooks/useQueryCache";
import { categoryService } from "../services/CategoryService";
import { CreateCategoryDto, UpdateCategoryDto } from "../types/category";

export const CATEGORIES_LIST_PARAMS = { limit: 100 } as const;

export function getCategoriesQueryKey(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}) {
  return `categories-${JSON.stringify(params || {})}`;
}

export function invalidateCategoriesQueries(): void {
  queryCache.clearByPrefix("categories-");
}

export function useCategories(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}) {
  return useQuery(
    getCategoriesQueryKey(params),
    () => categoryService.getCategoriesWithPagination(params),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes - longer cache for categories
      refetchOnMount: false, // Don't refetch on mount if data exists
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  );
}

export function useCategory(id: number) {
  return useQuery(`category-${id}`, () => categoryService.getById(id), {
    enabled: !!id,
  });
}

export function useSearchCategories(searchTerm: string) {
  return useQuery(
    `categories-search-${searchTerm}`,
    () => categoryService.searchCategories(searchTerm),
    {
      enabled: !!searchTerm && searchTerm.length >= 2,
      staleTime: 30000, // 30 seconds
    },
  );
}

export function useCreateCategory() {
  return useMutation((data: CreateCategoryDto) => categoryService.create(data), {
    onSuccess: () => {
      invalidateCategoriesQueries();
    },
  });
}

export function useUpdateCategory() {
  return useMutation(
    ({ id, data }: { id: number; data: UpdateCategoryDto }) =>
      categoryService.update(id, data),
    { onSuccess: () => invalidateCategoriesQueries() },
  );
}

export function useDeleteCategory() {
  return useMutation((id: number) => categoryService.delete(id), {
    onSuccess: () => invalidateCategoriesQueries(),
  });
}
