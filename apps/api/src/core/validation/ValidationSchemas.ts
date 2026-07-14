import { z } from "zod";
export const IdSchema = z
  .number()
  .int()
  .positive("ID must be a positive integer");

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const CreateOddSchema = z.object({
  title: z
    .string()
    .min(1, "Odd title is required")
    .max(100, "Odd title cannot exceed 100 characters")
    .trim(),
});

export const UpdateOddValueSchema = z.object({
  id: z.number().int().positive("Odd ID must be a positive integer"),
  title: z
    .string()
    .min(1, "Odd title is required")
    .max(100, "Odd title cannot exceed 100 characters")
    .trim()
    .optional(),
  value: z
    .number()
    .min(1.01, "Odd value must be greater than 1.00")
    .max(1000, "Odd value cannot exceed 1000"),
});

export const UpdateBetOddsSchema = z.object({
  odds: z
    .array(UpdateOddValueSchema)
    .min(2, "At least 2 odds are required")
    .max(10, "Cannot have more than 10 odds"),
});

export const CreateAdminSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    )
    .trim(),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email cannot exceed 255 characters")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters"),
});

export const LoginSchema = z.object({
  username: z.string().min(1, "Username or email is required").trim(),
  password: z.string().min(1, "Password is required"),
});

export const UpdateAdminSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    )
    .trim()
    .optional(),
  email: z
    .string()
    .email("Invalid email format")
    .max(255, "Email cannot exceed 255 characters")
    .toLowerCase()
    .trim()
    .optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password cannot exceed 100 characters")
    .optional(),
});

export const CreateBetSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(255, "Title cannot exceed 255 characters")
    .trim(),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .nullable(),
  categoryId: z
    .number()
    .int()
    .positive("Category ID must be a positive integer"),
  odds: z
    .array(CreateOddSchema)
    .min(2, "At least 2 odds are required")
    .max(10, "Cannot have more than 10 odds")
    .refine((odds) => {
      const titles = odds.map((odd) => odd.title.toLowerCase().trim());
      return new Set(titles).size === titles.length;
    }, "Odd titles must be unique"),
});

export const UpdateBetSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(255, "Title cannot exceed 255 characters")
    .optional(),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .nullable(),
  categoryId: IdSchema.optional(),
  status: z.enum(["open", "closed", "resolved"]).optional(),
  odds: z
    .array(UpdateOddValueSchema)
    .min(2, "At least 2 odds are required")
    .max(10, "Cannot have more than 10 odds")
    .refine((odds) => {
      const titles = odds
        .map((odd) => odd.title?.toLowerCase().trim())
        .filter((title): title is string => Boolean(title));
      return new Set(titles).size === titles.length;
    }, "Odd titles must be unique")
    .optional(),
});

export const CreateCategorySchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(50, "Title cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Title contains invalid characters"),
});

export const UpdateCategorySchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(50, "Title cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_]+$/, "Title contains invalid characters")
    .optional(),
});

export const CreateVoteSchema = z.object({
  oddId: IdSchema,
});

export const BetQuerySchema = PaginationSchema.extend({
  status: z.enum(["open", "closed", "resolved"]).optional(),
  categoryId: z.coerce
    .number()
    .int()
    .positive("Category ID must be a positive integer")
    .optional(),
  search: z.string().optional(),
});

export const CategoryQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
});

export const VoteQuerySchema = PaginationSchema.extend({
  betId: IdSchema.optional(),
  oddId: IdSchema.optional(),
});

export const AdminLoginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const RateLimitSchema = z.object({
  windowMs: z.number().int().min(1000).max(3600000).default(900000), // 15 minutes
  maxRequests: z.number().int().min(1).max(10000).default(100),
  skipSuccessfulRequests: z.boolean().default(false),
});

// Route param schemas
export const ParamIdSchema = z.object({
  id: z.coerce.number().int().positive("ID must be a positive integer"),
});

export const ParamCategoryIdSchema = z.object({
  categoryId: z.coerce
    .number()
    .int()
    .positive("Category ID must be a positive integer"),
});

export type CreateBetInput = z.infer<typeof CreateBetSchema>;
export type UpdateBetInput = z.infer<typeof UpdateBetSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CreateVoteInput = z.infer<typeof CreateVoteSchema>;
export type BetQueryInput = z.infer<typeof BetQuerySchema>;
export type CategoryQueryInput = z.infer<typeof CategoryQuerySchema>;
export type VoteQueryInput = z.infer<typeof VoteQuerySchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;
export type CreateAdminInput = z.infer<typeof CreateAdminSchema>;
