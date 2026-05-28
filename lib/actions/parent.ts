"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { canSubmitOffRequest, isWeekend } from "@/lib/date";
import { requireRole } from "@/lib/permissions";
import { isStudentEligibleForAttendanceDate } from "@/lib/student-attendance";
import { cancelOffRequestSchema, offRequestSchema, parentProfileSchema } from "@/lib/validators/parent";
import { redirectWithMessage } from "@/lib/auth/messages";

export async function updateParentProfileAction(formData: FormData) {
  const profile = await requireRole("parent");
  const parsed = parentProfileSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    redirectWithMessage("/parent/profile", "error", parsed.error.issues[0]?.message || "Thông tin chưa hợp lệ");
  }

  const supabase = await createClient();
  const payload = {
    full_name: parsed.data.full_name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
  };

  await supabase.from("profiles").update(payload).eq("id", profile.id);
  await supabase
    .from("parents")
    .update({ ...payload, profile_completed: true })
    .eq("auth_user_id", profile.auth_user_id);

  revalidatePath("/parent", "layout");
  redirectWithMessage("/parent/profile", "success", "Đã cập nhật thông tin phụ huynh");
}

export async function createOffRequestAction(formData: FormData) {
  const profile = await requireRole("parent");
  const parsed = offRequestSchema.safeParse({
    student_id: formData.get("student_id"),
    off_date: formData.get("off_date"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    redirectWithMessage("/parent/off-requests", "error", parsed.error.issues[0]?.message || "Đơn xin nghỉ chưa hợp lệ");
  }

  if (!canSubmitOffRequest(parsed.data.off_date)) {
    redirectWithMessage("/parent/off-requests", "error", "Đã quá hạn 06:00 sáng để xin nghỉ ngày này");
  }

  const supabase = await createClient();
  const { data: parent } = await supabase.from("parents").select("id").eq("auth_user_id", profile.auth_user_id).single();
  if (!parent) redirectWithMessage("/parent/off-requests", "error", "Không tìm thấy hồ sơ phụ huynh");

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", parsed.data.student_id)
    .eq("parent_id", parent.id)
    .eq("status", "active")
    .single();
  if (!student) redirectWithMessage("/parent/off-requests", "error", "Bạn không có quyền xin nghỉ cho học sinh này");
  if (!isStudentEligibleForAttendanceDate(student, parsed.data.off_date)) {
    redirectWithMessage("/parent/off-requests", "error", "Không thể xin nghỉ trước ngày vào của học sinh");
  }

  const { error } = await supabase.from("off_requests").insert({
    student_id: parsed.data.student_id,
    parent_id: parent.id,
    off_date: parsed.data.off_date,
    reason: parsed.data.reason,
    status: "auto_approved",
  });

  if (error) {
    const message = error.code === "23505" ? "Đã có đơn xin nghỉ cho học sinh trong ngày này" : "Không tạo được đơn xin nghỉ";
    redirectWithMessage("/parent/off-requests", "error", message);
  }

  const admin = createAdminClient();
  await admin.from("attendance_records").upsert(
    {
      student_id: parsed.data.student_id,
      attendance_date: parsed.data.off_date,
      status: "excused_absent",
      note: "Tự động từ đơn xin nghỉ đã duyệt",
      marked_by: null,
      marked_at: new Date().toISOString(),
    },
    { onConflict: "student_id,attendance_date" },
  );

  revalidatePath("/parent/off-requests");
  revalidatePath("/manager/attendance");
  const weekendNote = isWeekend(parsed.data.off_date) ? " Lưu ý: ngày này là cuối tuần." : "";
  redirectWithMessage("/parent/off-requests", "success", `Đã gửi đơn xin nghỉ và tự động duyệt.${weekendNote}`);
}

export async function cancelOffRequestAction(formData: FormData) {
  await requireRole("parent");
  const parsed = cancelOffRequestSchema.safeParse({
    request_id: formData.get("request_id"),
  });

  if (!parsed.success) {
    redirectWithMessage("/parent/off-requests", "error", "Không tìm thấy đơn xin nghỉ");
  }

  const supabase = await createClient();
  const { data: request } = await supabase
    .from("off_requests")
    .select("id,off_date,student_id,parent_id")
    .eq("id", parsed.data.request_id)
    .single();

  if (!request) {
    redirectWithMessage("/parent/off-requests", "error", "Bạn không có quyền hủy đơn này");
  }

  if (!canSubmitOffRequest(request.off_date)) {
    redirectWithMessage("/parent/off-requests", "error", "Đã quá hạn 06:00 sáng, vui lòng liên hệ admin để xử lý");
  }

  const { error } = await supabase.from("off_requests").update({ status: "cancelled" }).eq("id", parsed.data.request_id);
  if (error) redirectWithMessage("/parent/off-requests", "error", "Không hủy được đơn xin nghỉ");

  const admin = createAdminClient();
  await admin
    .from("attendance_records")
    .update({ status: "not_marked", note: "Phụ huynh đã hủy đơn xin nghỉ", marked_at: new Date().toISOString() })
    .eq("student_id", request.student_id)
    .eq("attendance_date", request.off_date)
    .eq("status", "excused_absent");

  revalidatePath("/parent/off-requests");
  redirectWithMessage("/parent/off-requests", "success", "Đã hủy đơn xin nghỉ");
}
