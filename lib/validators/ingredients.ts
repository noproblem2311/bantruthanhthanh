import { z } from "zod";

export const ingredientExpenseSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày mua nguyên liệu không hợp lệ"),
  ingredient_name: z.string().trim().min(1, "Vui lòng nhập tên nguyên liệu"),
  description: z.string().optional(),
  price: z.coerce.number().int("Giá phải là số nguyên").min(0, "Giá không được âm"),
});

export const deleteIngredientExpenseSchema = z.object({
  id: z.string().uuid(),
});

export const ingredientDayNoteSchema = z.object({
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày mua nguyên liệu không hợp lệ"),
  note: z.string().optional(),
});
