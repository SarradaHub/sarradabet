import { CreateCategoryDTO, UpdateCategoryDTO } from "../types/category.types";
import { prisma } from "../config/db";

export const getAllCategoriesFromRepository = async (
  page: number = 1,
  limit: number = 10,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
) => {
  const skip = (page - 1) * limit;

  return prisma.category.findMany({
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });
};

export const createCategoryFromRepository = async (data: CreateCategoryDTO) => {
  return prisma.$transaction(async (tx: any) => {
    return tx.category.create({
      data: {
        title: data.title,
      },
    });
  });
};

export const getCategoryByIdFromRepository = async (categoryId: number) => {
  return prisma.category.findUnique({
    where: { id: categoryId },
  });
};

export const updateCategoryFromRepository = async (
  categoryId: number,
  data: UpdateCategoryDTO,
) => {
  return prisma.category.update({
    where: { id: categoryId },
    data,
  });
};
