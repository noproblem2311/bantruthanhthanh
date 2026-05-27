"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirectWithMessage } from "@/lib/auth/messages";
import { getMonthBounds } from "@/lib/date";
import { requireRole } from "@/lib/permissions";

function timekeepingPath(formData: FormData, fallback = "/manager/timekeeping") {
  const value = formData.get("redirect_to");
  return typeof value === "string" && value.startsWith("/") ? value : fallback;
}

export async function saveManagerTimekeepingAction(formData: FormData) {
  const profile = await requireRole("manager");
  const path = timekeepingPath(formData);
  const yearMonth = formData.get("year_month");

  if (typeof yearMonth !== "string" || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    redirectWithMessage(path, "error", "Tháng chấm công không hợp lệ");
  }

  const dates = Array.from(
    new Set(formData.getAll("work_date").filter((value): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))),
  ).filter((date) => date.startsWith(`${yearMonth}-`));

  const rows = dates
    .map((date) => ({
      profile_id: profile.id,
      work_date: date,
      morning_worked: formData.get(`morning_${date}`) === "on",
      afternoon_worked: formData.get(`afternoon_${date}`) === "on",
    }))
    .filter((row) => row.morning_worked || row.afternoon_worked);

  const supabase = await createClient();
  const { start, end } = getMonthBounds(yearMonth);
  const { error: deleteError } = await supabase
    .from("manager_work_sessions")
    .delete()
    .eq("profile_id", profile.id)
    .gte("work_date", start)
    .lt("work_date", end);

  if (deleteError) {
    redirectWithMessage(path, "error", "Không xoá được dữ liệu chấm công cũ");
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("manager_work_sessions").insert(rows);
    if (insertError) {
      redirectWithMessage(path, "error", "Không lưu được chấm công");
    }
  }

  revalidatePath(path.split("?")[0] || path);
  redirectWithMessage(path, "success", `Đã lưu chấm công ${rows.length} ngày trong tháng ${yearMonth}`);
}

export async function saveAdminManagerTimekeepingAction(formData: FormData) {
  await requireRole("admin");
  const path = timekeepingPath(formData, "/admin/payroll?tab=work");
  const yearMonth = formData.get("year_month");
  const profileId = formData.get("profile_id");

  if (typeof yearMonth !== "string" || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    redirectWithMessage(path, "error", "Tháng chấm công không hợp lệ");
  }

  if (typeof profileId !== "string" || !profileId) {
    redirectWithMessage(path, "error", "Không tìm thấy quản lý cần sửa chấm công");
  }

  const dates = Array.from(
    new Set(formData.getAll("work_date").filter((value): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value))),
  ).filter((date) => date.startsWith(`${yearMonth}-`));

  const rows = dates
    .map((date) => ({
      profile_id: profileId,
      work_date: date,
      morning_worked: formData.get(`morning_${date}`) === "on",
      afternoon_worked: formData.get(`afternoon_${date}`) === "on",
    }))
    .filter((row) => row.morning_worked || row.afternoon_worked);

  const supabase = await createClient();
  const { data: manager } = await supabase.from("profiles").select("id,role").eq("id", profileId).eq("role", "manager").maybeSingle();

  if (!manager) {
    redirectWithMessage(path, "error", "Tài khoản quản lý không hợp lệ");
  }

  const { start, end } = getMonthBounds(yearMonth);
  const { error: deleteError } = await supabase
    .from("manager_work_sessions")
    .delete()
    .eq("profile_id", profileId)
    .gte("work_date", start)
    .lt("work_date", end);

  if (deleteError) {
    redirectWithMessage(path, "error", "Không xoá được dữ liệu chấm công cũ");
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("manager_work_sessions").insert(rows);
    if (insertError) {
      redirectWithMessage(path, "error", "Không lưu được chấm công");
    }
  }

  revalidatePath("/admin/payroll");
  redirectWithMessage(path, "success", `Đã cập nhật chấm công ${rows.length} ngày trong tháng ${yearMonth}`);
}
