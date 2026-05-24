"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirectWithMessage } from "@/lib/auth/messages";
import { requireRole } from "@/lib/permissions";
import { deleteIngredientExpenseSchema, ingredientExpenseSchema } from "@/lib/validators/ingredients";
import { formatVietnamDate } from "@/lib/date";

function ingredientExpensePath(formData: FormData) {
  const value = formData.get("redirect_to");
  return typeof value === "string" && value.startsWith("/") ? value : "/admin/ingredients";
}

export async function saveIngredientExpenseAction(formData: FormData) {
  const profile = await requireRole(["admin", "manager"]);
  const path = ingredientExpensePath(formData);
  const parsed = ingredientExpenseSchema.safeParse({
    id: formData.get("id") || "",
    expense_date: formData.get("expense_date"),
    ingredient_name: formData.get("ingredient_name"),
    description: formData.get("description"),
    price: formData.get("price"),
  });

  if (!parsed.success) {
    redirectWithMessage(path, "error", parsed.error.issues[0]?.message || "Dữ liệu nguyên liệu chưa hợp lệ");
  }

  const payload = {
    expense_date: parsed.data.expense_date,
    ingredient_name: parsed.data.ingredient_name,
    description: parsed.data.description?.trim() || null,
    price: parsed.data.price,
    recorded_by: profile.id,
  };
  const supabase = await createClient();
  const query = parsed.data.id
    ? supabase.from("ingredient_expenses").update(payload).eq("id", parsed.data.id)
    : supabase.from("ingredient_expenses").insert(payload);
  const { error } = await query;

  if (error) {
    redirectWithMessage(path, "error", "Không lưu được nguyên liệu");
  }

  revalidatePath(path.split("?")[0] || path);
  redirectWithMessage(path, "success", `Đã lưu nguyên liệu ngày ${formatVietnamDate(parsed.data.expense_date)}`);
}

export async function deleteIngredientExpenseAction(formData: FormData) {
  await requireRole(["admin", "manager"]);
  const path = ingredientExpensePath(formData);
  const parsed = deleteIngredientExpenseSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    redirectWithMessage(path, "error", "Dòng nguyên liệu không hợp lệ");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ingredient_expenses").delete().eq("id", parsed.data.id);

  if (error) {
    redirectWithMessage(path, "error", "Không xoá được nguyên liệu");
  }

  revalidatePath(path.split("?")[0] || path);
  redirectWithMessage(path, "success", "Đã xoá dòng nguyên liệu");
}
