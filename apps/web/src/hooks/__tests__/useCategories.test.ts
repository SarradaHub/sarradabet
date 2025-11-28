import { renderHook, waitFor, act } from "@testing-library/react";
import { vi } from "vitest";
import {
  useCategories,
  useCategory,
  useSearchCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../useCategories";
import { categoryService } from "../../services/CategoryService";
import { queryCache } from "../../core/hooks/useQueryCache";

// Mock the service
vi.mock("../../services/CategoryService", () => ({
  categoryService: {
    getCategoriesWithPagination: vi.fn(),
    getById: vi.fn(),
    searchCategories: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockCategoryService = categoryService as unknown as {
  getCategoriesWithPagination: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
  searchCategories: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("useCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCache.clear();
  });

  describe("useCategories", () => {
    it("should fetch categories with pagination", async () => {
      const mockCategories = [
        { id: 1, title: "Sports" },
        { id: 2, title: "Politics" },
      ];

      mockCategoryService.getCategoriesWithPagination.mockResolvedValue({
        success: true,
        data: mockCategories,
        meta: {
          page: 1,
          limit: 10,
          total: 20,
          totalPages: 2,
          hasNext: true,
          hasPrev: false,
        },
      });

      const { result } = renderHook(() =>
        useCategories({ page: 1, limit: 10 }),
      );

      await waitFor(() => {
        expect(result.current.data).toEqual(mockCategories);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });

      expect(
        mockCategoryService.getCategoriesWithPagination,
      ).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it("should handle fetch error", async () => {
      const errorMessage = "Failed to fetch categories";
      mockCategoryService.getCategoriesWithPagination.mockRejectedValue({
        message: errorMessage,
      });

      const { result } = renderHook(() => useCategories());

      await waitFor(() => {
        expect(result.current.data).toBe(null);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
      });
    });
  });

  describe("useCategory", () => {
    it("should fetch a single category", async () => {
      const mockCategory = { id: 1, title: "Sports" };
      mockCategoryService.getById.mockResolvedValue({
        success: true,
        data: { category: mockCategory },
      });

      const { result } = renderHook(() => useCategory(1));

      await waitFor(() => {
        expect(result.current.data).toEqual({ category: mockCategory });
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });

      expect(mockCategoryService.getById).toHaveBeenCalledWith(1);
    });

    it("should not fetch when id is 0", () => {
      const { result } = renderHook(() => useCategory(0));

      expect(mockCategoryService.getById).not.toHaveBeenCalled();
      expect(result.current.data).toBe(null);
    });
  });

  describe("useSearchCategories", () => {
    it("should search categories", async () => {
      const mockCategories = [{ id: 1, title: "Sports" }];
      mockCategoryService.searchCategories.mockResolvedValue({
        success: true,
        data: mockCategories,
      });

      const { result } = renderHook(() => useSearchCategories("sports"));

      await waitFor(() => {
        expect(result.current.data).toEqual(mockCategories);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
      });

      expect(mockCategoryService.searchCategories).toHaveBeenCalledWith(
        "sports",
      );
    });

    it("should not search when search term is too short", () => {
      const { result } = renderHook(() => useSearchCategories("s"));

      expect(mockCategoryService.searchCategories).not.toHaveBeenCalled();
      expect(result.current.data).toBe(null);
    });

    it("should not search when search term is empty", () => {
      const { result } = renderHook(() => useSearchCategories(""));

      expect(mockCategoryService.searchCategories).not.toHaveBeenCalled();
      expect(result.current.data).toBe(null);
    });
  });

  describe("useCreateCategory", () => {
    it("should create a category successfully", async () => {
      const mockCategoryData = {
        title: "New Category",
      };

      const mockCreatedCategory = { id: 1, ...mockCategoryData };
      mockCategoryService.create.mockResolvedValue({
        success: true,
        data: { category: mockCreatedCategory },
      });

      const { result } = renderHook(() => useCreateCategory());

      await act(async () => {
        const response = await result.current.mutateAsync(mockCategoryData);
        expect(response).toEqual({ category: mockCreatedCategory });
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({ category: mockCreatedCategory });
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCategoryService.create).toHaveBeenCalledWith(mockCategoryData);
    });

    it("should handle creation error", async () => {
      const errorMessage = "Failed to create category";
      const mockCategoryData = {
        title: "New Category",
      };

      mockCategoryService.create.mockRejectedValue({
        message: errorMessage,
      });

      const { result } = renderHook(() => useCreateCategory());

      await act(async () => {
        const response = await result.current.mutateAsync(mockCategoryData);
        expect(response).toBe(null);
      });

      await waitFor(() => {
        expect(result.current.data).toBe(null);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("useUpdateCategory", () => {
    it("should update a category successfully", async () => {
      const mockUpdateData = {
        title: "Updated Category",
      };
      const mockUpdatedCategory = { id: 1, ...mockUpdateData };

      mockCategoryService.update.mockResolvedValue({
        success: true,
        data: { category: mockUpdatedCategory },
      });

      const { result } = renderHook(() => useUpdateCategory());

      await act(async () => {
        const response = await result.current.mutateAsync({
          id: 1,
          data: mockUpdateData,
        });
        expect(response).toEqual({ category: mockUpdatedCategory });
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({ category: mockUpdatedCategory });
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCategoryService.update).toHaveBeenCalledWith(
        1,
        mockUpdateData,
      );
    });
  });

  describe("useDeleteCategory", () => {
    it("should delete a category successfully", async () => {
      mockCategoryService.delete.mockResolvedValue({
        success: true,
        data: { message: "Category deleted successfully" },
      });

      const { result } = renderHook(() => useDeleteCategory());

      await act(async () => {
        const response = await result.current.mutateAsync(1);
        expect(response).toEqual({ message: "Category deleted successfully" });
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({
          message: "Category deleted successfully",
        });
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe(null);
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCategoryService.delete).toHaveBeenCalledWith(1);
    });
  });
});
