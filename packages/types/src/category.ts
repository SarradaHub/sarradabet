export type Category = {
  id: number;
  title: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  _count?: {
    bet: number;
  };
};

export type CreateCategoryDto = {
  title: string;
};

export type UpdateCategoryDto = Partial<CreateCategoryDto>;
