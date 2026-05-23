"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirectWithMessage } from "@/lib/auth/messages";
import { getMonthBounds, getPreviousYearMonth, isSunday } from "@/lib/date";
import { requireRole } from "@/lib/permissions";
import {
  appSettingsSchema,
  createParentSchema,
  feeSettingSchema,
  managerSchema,
  monthlyHistoryCaptureSchema,
  resetPasswordSchema,
  studentSchema,
  updateManagerStatusSchema,
  updateParentSchema,
} from "@/lib/validators/admin";
import { normalizeUsername, slugify } from "@/lib/utils";
import type { AttendanceRecord, FeeSetting, Parent, Student } from "@/lib/types";

export type CredentialActionState = {
  ok?: boolean;
  message?: string;
  credentials?: {
    username: string;
    password: string;
  };
  parentId?: string;
};

export async function createParentWithCredentialsAction(
  _prevState: CredentialActionState,
  formData: FormData,
): Promise<CredentialActionState> {
  await requireRole("admin");
  const parsed = createParentSchema.safeParse({
    username: formData.get("username"),
    temporary_password: formData.get("temporary_password"),
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    status: formData.get("status") || "active",
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Dữ liệu phụ huynh chưa hợp lệ" };
  }

  const usernameNormalized = normalizeUsername(parsed.data.username);
  if (!usernameNormalized) return { ok: false, message: "Username không hợp lệ" };

  const admin = createAdminClient();
  const { data: existing } = await admin.from("parents").select("id").eq("username_normalized", usernameNormalized).maybeSingle();
  if (existing) return { ok: false, message: "Username đã tồn tại" };

  const fullName = parsed.data.full_name?.trim() || `Phụ huynh ${parsed.data.username.trim()}`;
  const internalAuthEmail = `parent_${slugify(parsed.data.username)}_${randomUUID().slice(0, 8)}@internal.bantru.local`;

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: internalAuthEmail,
    password: parsed.data.temporary_password,
    email_confirm: true,
    user_metadata: {
      role: "parent",
      username: parsed.data.username.trim(),
    },
  });

  if (authError || !authData.user) {
    return { ok: false, message: authError?.message || "Không tạo được tài khoản Auth" };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .insert({
      auth_user_id: authData.user.id,
      role: "parent",
      full_name: fullName,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (profileError || !profile) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { ok: false, message: profileError?.message || "Không tạo được hồ sơ phụ huynh" };
  }

  const { data: parent, error: parentError } = await admin
    .from("parents")
    .insert({
      profile_id: profile.id,
      auth_user_id: authData.user.id,
      full_name: fullName,
      username: parsed.data.username.trim(),
      username_normalized: usernameNormalized,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      internal_auth_email: internalAuthEmail,
      status: parsed.data.status,
      profile_completed: false,
    })
    .select("id")
    .single();

  if (parentError || !parent) {
    await admin.auth.admin.deleteUser(authData.user.id);
    return { ok: false, message: parentError?.message || "Không tạo được bản ghi phụ huynh" };
  }

  await admin.from("audit_logs").insert({
    action: "create_parent",
    entity_type: "parents",
    entity_id: parent.id,
    metadata: { username: parsed.data.username.trim() },
  });

  revalidatePath("/admin/parents");
  return {
    ok: true,
    message: "Đã tạo phụ huynh. Gửi thông tin đăng nhập dưới đây cho phụ huynh.",
    parentId: parent.id,
    credentials: {
      username: parsed.data.username.trim(),
      password: parsed.data.temporary_password,
    },
  };
}

export async function updateParentAction(formData: FormData) {
  await requireRole("admin");
  const parsed = updateParentSchema.safeParse({
    id: formData.get("id"),
    username: formData.get("username"),
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    status: formData.get("status"),
  });

  const id = String(formData.get("id") || "");
  const path = id ? `/admin/parents/${id}` : "/admin/parents";
  if (!parsed.success) redirectWithMessage(path, "error", parsed.error.issues[0]?.message || "Dữ liệu chưa hợp lệ");

  const supabase = await createClient();
  const normalized = normalizeUsername(parsed.data.username);
  const { data: duplicate } = await supabase
    .from("parents")
    .select("id")
    .eq("username_normalized", normalized)
    .neq("id", parsed.data.id)
    .maybeSingle();
  if (duplicate) redirectWithMessage(path, "error", "Username đã tồn tại");

  const payload = {
    username: parsed.data.username.trim(),
    username_normalized: normalized,
    full_name: parsed.data.full_name.trim(),
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    status: parsed.data.status,
  };

  const { data: parent } = await supabase.from("parents").select("profile_id").eq("id", parsed.data.id).single();
  const { error } = await supabase.from("parents").update(payload).eq("id", parsed.data.id);
  if (error) redirectWithMessage(path, "error", "Không cập nhật được phụ huynh");

  if (parent?.profile_id) {
    await supabase
      .from("profiles")
      .update({
        full_name: payload.full_name,
        phone: payload.phone,
        email: payload.email,
        status: payload.status,
      })
      .eq("id", parent.profile_id);
  }

  revalidatePath("/admin/parents");
  redirectWithMessage(path, "success", "Đã cập nhật phụ huynh");
}

export async function resetParentPasswordWithCredentialAction(
  _prevState: CredentialActionState,
  formData: FormData,
): Promise<CredentialActionState> {
  const profile = await requireRole("admin");
  const parsed = resetPasswordSchema.safeParse({
    parent_id: formData.get("parent_id"),
    password_reset_request_id: formData.get("password_reset_request_id") || "",
    new_password: formData.get("new_password"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || "Mật khẩu chưa hợp lệ" };
  }

  const admin = createAdminClient();
  const { data: parent } = await admin
    .from("parents")
    .select("id,auth_user_id,username")
    .eq("id", parsed.data.parent_id)
    .single();
  if (!parent?.auth_user_id) return { ok: false, message: "Không tìm thấy tài khoản Auth của phụ huynh" };

  const { error } = await admin.auth.admin.updateUserById(parent.auth_user_id, {
    password: parsed.data.new_password,
  });
  if (error) return { ok: false, message: error.message };

  if (parsed.data.password_reset_request_id) {
    await admin
      .from("password_reset_requests")
      .update({
        status: "resolved",
        resolved_by: profile.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.password_reset_request_id);
  }

  await admin.from("audit_logs").insert({
    actor_profile_id: profile.id,
    action: "reset_parent_password",
    entity_type: "parents",
    entity_id: parent.id,
  });

  revalidatePath("/admin/password-reset-requests");
  revalidatePath(`/admin/parents/${parent.id}`);
  return {
    ok: true,
    message: "Đã đặt mật khẩu mới. Gửi thông tin dưới đây cho phụ huynh.",
    parentId: parent.id,
    credentials: {
      username: parent.username,
      password: parsed.data.new_password,
    },
  };
}

export async function createStudentAction(formData: FormData) {
  await requireRole("admin");
  const parsed = studentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirectWithMessage("/admin/students/new", "error", parsed.error.issues[0]?.message || "Dữ liệu học sinh chưa hợp lệ");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .insert({
      parent_id: parsed.data.parent_id,
      full_name: parsed.data.full_name,
      nickname: parsed.data.nickname || null,
      date_of_birth: parsed.data.date_of_birth || null,
      gender: parsed.data.gender || null,
      school_name: parsed.data.school_name || null,
      class_name: parsed.data.class_name || null,
      health_notes: parsed.data.health_notes || null,
      allergy_notes: parsed.data.allergy_notes || null,
      pickup_notes: parsed.data.pickup_notes || null,
      boarding_package_type: parsed.data.boarding_package_type,
      status: parsed.data.status,
    })
    .select("id")
    .single();

  if (error || !data) redirectWithMessage("/admin/students/new", "error", "Không tạo được học sinh");
  revalidatePath("/admin/students");
  redirect(`/admin/students/${data.id}?success=${encodeURIComponent("Đã tạo học sinh")}`);
}

export async function updateStudentAction(formData: FormData) {
  await requireRole("admin");
  const parsed = studentSchema.safeParse(Object.fromEntries(formData));
  const id = String(formData.get("id") || "");
  const path = id ? `/admin/students/${id}` : "/admin/students";
  if (!parsed.success || !parsed.data.id) redirectWithMessage(path, "error", parsed.error?.issues[0]?.message || "Dữ liệu học sinh chưa hợp lệ");

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({
      parent_id: parsed.data.parent_id,
      full_name: parsed.data.full_name,
      nickname: parsed.data.nickname || null,
      date_of_birth: parsed.data.date_of_birth || null,
      gender: parsed.data.gender || null,
      school_name: parsed.data.school_name || null,
      class_name: parsed.data.class_name || null,
      health_notes: parsed.data.health_notes || null,
      allergy_notes: parsed.data.allergy_notes || null,
      pickup_notes: parsed.data.pickup_notes || null,
      boarding_package_type: parsed.data.boarding_package_type,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.id);

  if (error) redirectWithMessage(path, "error", "Không cập nhật được học sinh");
  revalidatePath("/admin/students");
  redirectWithMessage(path, "success", "Đã cập nhật học sinh");
}

export async function createManagerAction(formData: FormData) {
  await requireRole("admin");
  const parsed = managerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) redirectWithMessage("/admin/managers", "error", parsed.error.issues[0]?.message || "Dữ liệu quản lý chưa hợp lệ");

  const admin = createAdminClient();
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { role: "manager" },
  });
  if (authError || !authData.user) redirectWithMessage("/admin/managers", "error", authError?.message || "Không tạo được Auth user");

  const { error } = await admin.from("profiles").insert({
    auth_user_id: authData.user.id,
    role: "manager",
    full_name: parsed.data.full_name,
    phone: parsed.data.phone || null,
    email: parsed.data.email,
    status: "active",
  });

  if (error) {
    await admin.auth.admin.deleteUser(authData.user.id);
    redirectWithMessage("/admin/managers", "error", "Không tạo được hồ sơ quản lý");
  }

  revalidatePath("/admin/managers");
  redirectWithMessage("/admin/managers", "success", "Đã tạo tài khoản quản lý");
}

export async function updateManagerStatusAction(formData: FormData) {
  await requireRole("admin");
  const parsed = updateManagerStatusSchema.safeParse({
    profile_id: formData.get("profile_id"),
    status: formData.get("status"),
  });

  if (!parsed.success) redirectWithMessage("/admin/managers", "error", "Dữ liệu chưa hợp lệ");
  const supabase = await createClient();
  await supabase.from("profiles").update({ status: parsed.data.status }).eq("id", parsed.data.profile_id).eq("role", "manager");
  revalidatePath("/admin/managers");
  redirectWithMessage("/admin/managers", "success", "Đã cập nhật trạng thái quản lý");
}

export async function upsertFeeSettingAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = feeSettingSchema.safeParse({
    year_month: formData.get("year_month"),
    saturday_package_amount: formData.get("saturday_package_amount"),
    weekday_package_amount: formData.get("weekday_package_amount"),
    absence_deduction_amount: formData.get("absence_deduction_amount"),
    currency: formData.get("currency") || "VND",
    note: formData.get("note"),
  });

  if (!parsed.success) redirectWithMessage("/admin/fee-settings", "error", parsed.error.issues[0]?.message || "Cấu hình phí chưa hợp lệ");

  const supabase = await createClient();
  const { error } = await supabase.from("fee_settings").upsert(
    {
      year_month: parsed.data.year_month,
      fee_per_attendance_day: parsed.data.absence_deduction_amount,
      saturday_package_amount: parsed.data.saturday_package_amount,
      weekday_package_amount: parsed.data.weekday_package_amount,
      absence_deduction_amount: parsed.data.absence_deduction_amount,
      currency: parsed.data.currency,
      note: parsed.data.note || null,
      created_by: profile.id,
    },
    { onConflict: "year_month" },
  );
  if (error) redirectWithMessage("/admin/fee-settings", "error", "Không lưu được cấu hình phí");
  revalidatePath("/admin/fee-settings");
  redirectWithMessage("/admin/fee-settings", "success", "Đã lưu cấu hình phí");
}

type CaptureStudent = Student & {
  parents: Pick<Parent, "id" | "full_name" | "username" | "phone" | "email"> | null;
};

type AbsenceBucket = {
  excusedDates: string[];
  unexcusedDates: string[];
};

function emptyAbsenceBucket(): AbsenceBucket {
  return { excusedDates: [], unexcusedDates: [] };
}

export async function captureMonthlyHistoryAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = monthlyHistoryCaptureSchema.safeParse({
    billing_year_month: formData.get("billing_year_month"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    redirectWithMessage("/admin/monthly-history", "error", parsed.error.issues[0]?.message || "Dữ liệu capture chưa hợp lệ");
  }

  const billingYearMonth = parsed.data.billing_year_month;
  const previousYearMonth = getPreviousYearMonth(billingYearMonth);
  const { start, end } = getMonthBounds(previousYearMonth);
  const supabase = await createClient();

  const [{ data: students }, { data: feeSetting }] = await Promise.all([
    supabase.from("students").select("*, parents(id,full_name,username,phone,email)").eq("status", "active").order("full_name"),
    supabase.from("fee_settings").select("*").eq("year_month", billingYearMonth).maybeSingle(),
  ]);

  const studentRows = (students || []) as CaptureStudent[];
  if (studentRows.length === 0) {
    redirectWithMessage("/admin/monthly-history", "error", "Chưa có học sinh active để capture");
  }

  const studentIds = studentRows.map((student) => student.id);
  const { data: attendance } = await supabase
    .from("attendance_records")
    .select("*")
    .gte("attendance_date", start)
    .lt("attendance_date", end)
    .in("student_id", studentIds)
    .in("status", ["excused_absent", "unexcused_absent"])
    .order("attendance_date", { ascending: true });

  const absencesByStudent = new Map<string, AbsenceBucket>();
  for (const record of ((attendance || []) as AttendanceRecord[]).filter((item) => !isSunday(item.attendance_date))) {
    const bucket = absencesByStudent.get(record.student_id) || emptyAbsenceBucket();
    if (record.status === "excused_absent") bucket.excusedDates.push(record.attendance_date);
    if (record.status === "unexcused_absent") bucket.unexcusedDates.push(record.attendance_date);
    absencesByStudent.set(record.student_id, bucket);
  }

  const fee = (feeSetting || null) as FeeSetting | null;
  const absenceDeductionAmount = fee?.absence_deduction_amount ?? null;
  const rows = studentRows.map((student) => {
    const bucket = absencesByStudent.get(student.id) || emptyAbsenceBucket();
    const packageAmount = fee ? (student.boarding_package_type === "saturday" ? fee.saturday_package_amount : fee.weekday_package_amount) : null;
    const billingAmount =
      packageAmount === null || absenceDeductionAmount === null
        ? null
        : Math.max(packageAmount - bucket.excusedDates.length * absenceDeductionAmount, 0);

    return {
      student_id: student.id,
      parent_id: student.parent_id,
      student_full_name: student.full_name,
      student_nickname: student.nickname,
      date_of_birth: student.date_of_birth,
      gender: student.gender,
      school_name: student.school_name,
      class_name: student.class_name,
      health_notes: student.health_notes,
      allergy_notes: student.allergy_notes,
      pickup_notes: student.pickup_notes,
      boarding_package_type: student.boarding_package_type,
      student_status: student.status,
      parent_full_name: student.parents?.full_name || null,
      parent_username: student.parents?.username || null,
      parent_phone: student.parents?.phone || null,
      parent_email: student.parents?.email || null,
      excused_absent_count: bucket.excusedDates.length,
      unexcused_absent_count: bucket.unexcusedDates.length,
      excused_absent_dates: bucket.excusedDates,
      unexcused_absent_dates: bucket.unexcusedDates,
      package_amount: packageAmount,
      excused_deduction_amount: absenceDeductionAmount,
      billing_amount: billingAmount,
    };
  });

  const excusedAbsenceTotal = rows.reduce((sum, row) => sum + row.excused_absent_count, 0);
  const unexcusedAbsenceTotal = rows.reduce((sum, row) => sum + row.unexcused_absent_count, 0);
  const packageTotal = fee ? rows.reduce((sum, row) => sum + (row.package_amount || 0), 0) : null;
  const excusedDeductionTotal =
    fee && absenceDeductionAmount !== null ? rows.reduce((sum, row) => sum + row.excused_absent_count * absenceDeductionAmount, 0) : null;
  const billingTotal = fee ? rows.reduce((sum, row) => sum + (row.billing_amount || 0), 0) : null;

  const { data: snapshot, error: snapshotError } = await supabase
    .from("monthly_history_snapshots")
    .insert({
      billing_year_month: billingYearMonth,
      previous_year_month: previousYearMonth,
      captured_by: profile.id,
      note: parsed.data.note?.trim() || null,
      student_count: rows.length,
      excused_absence_total: excusedAbsenceTotal,
      unexcused_absence_total: unexcusedAbsenceTotal,
      package_total: packageTotal,
      excused_deduction_total: excusedDeductionTotal,
      billing_total: billingTotal,
      saturday_package_amount: fee?.saturday_package_amount ?? null,
      weekday_package_amount: fee?.weekday_package_amount ?? null,
      absence_deduction_amount: absenceDeductionAmount,
      currency: fee?.currency ?? "VND",
    })
    .select("id")
    .single();

  if (snapshotError || !snapshot) {
    redirectWithMessage("/admin/monthly-history", "error", "Không tạo được lịch sử capture");
  }

  const { error: rowsError } = await supabase.from("monthly_history_students").insert(rows.map((row) => ({ ...row, snapshot_id: snapshot.id })));
  if (rowsError) {
    await supabase.from("monthly_history_snapshots").delete().eq("id", snapshot.id);
    redirectWithMessage("/admin/monthly-history", "error", "Không lưu được chi tiết học sinh của lịch sử capture");
  }

  await supabase.from("audit_logs").insert({
    actor_profile_id: profile.id,
    action: "capture_monthly_history",
    entity_type: "monthly_history_snapshots",
    entity_id: snapshot.id,
    metadata: {
      billing_year_month: billingYearMonth,
      previous_year_month: previousYearMonth,
      student_count: rows.length,
    },
  });

  revalidatePath("/admin/monthly-history");
  redirect(`/admin/monthly-history/${snapshot.id}?success=${encodeURIComponent(`Đã capture ${rows.length} học sinh cho tháng ${billingYearMonth}`)}`);
}

export async function updateAppSettingsAction(formData: FormData) {
  await requireRole("admin");
  const parsed = appSettingsSchema.safeParse({
    center_name: formData.get("center_name"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    description: formData.get("description"),
    zalo_url: formData.get("zalo_url"),
    facebook_url: formData.get("facebook_url"),
  });

  if (!parsed.success) redirectWithMessage("/admin/settings", "error", parsed.error.issues[0]?.message || "Thông tin cấu hình chưa hợp lệ");

  const supabase = await createClient();
  const { data: current } = await supabase.from("app_settings").select("id").limit(1).maybeSingle();
  const payload = {
    center_name: parsed.data.center_name,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
    description: parsed.data.description || null,
    zalo_url: parsed.data.zalo_url || null,
    facebook_url: parsed.data.facebook_url || null,
  };

  const result = current
    ? await supabase.from("app_settings").update(payload).eq("id", current.id)
    : await supabase.from("app_settings").insert(payload);

  if (result.error) redirectWithMessage("/admin/settings", "error", "Không lưu được thông tin bán trú");
  revalidatePath("/", "layout");
  redirectWithMessage("/admin/settings", "success", "Đã cập nhật thông tin bán trú");
}

export async function updateOffRequestStatusAction(formData: FormData) {
  const profile = await requireRole("admin");
  const id = String(formData.get("request_id") || "");
  const status = String(formData.get("status") || "");
  const reviewNote = String(formData.get("review_note") || "");
  const path = String(formData.get("redirect_to") || "/admin/off-requests");

  if (!id || !["approved", "rejected", "cancelled", "auto_approved"].includes(status)) {
    redirectWithMessage(path, "error", "Trạng thái đơn không hợp lệ");
  }

  const supabase = await createClient();
  const { data: request } = await supabase.from("off_requests").select("student_id,off_date").eq("id", id).single();
  const { error } = await supabase
    .from("off_requests")
    .update({
      status,
      review_note: reviewNote || null,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error || !request) redirectWithMessage(path, "error", "Không cập nhật được đơn xin nghỉ");

  if (status === "approved" || status === "auto_approved") {
    await supabase.from("attendance_records").upsert(
      {
        student_id: request.student_id,
        attendance_date: request.off_date,
        status: "excused_absent",
        note: "Từ đơn xin nghỉ đã duyệt",
        marked_by: profile.id,
        marked_at: new Date().toISOString(),
      },
      { onConflict: "student_id,attendance_date" },
    );
  } else {
    await supabase
      .from("attendance_records")
      .update({
        status: "not_marked",
        note: "Đơn xin nghỉ đã bị hủy/từ chối",
        marked_by: profile.id,
        marked_at: new Date().toISOString(),
      })
      .eq("student_id", request.student_id)
      .eq("attendance_date", request.off_date)
      .eq("status", "excused_absent");
  }

  revalidatePath(path.split("?")[0] || path);
  redirectWithMessage(path, "success", "Đã cập nhật đơn xin nghỉ");
}

export async function rejectPasswordResetRequestAction(formData: FormData) {
  const profile = await requireRole("admin");
  const id = String(formData.get("request_id") || "");
  const adminNote = String(formData.get("admin_note") || "");
  if (!id) redirectWithMessage("/admin/password-reset-requests", "error", "Không tìm thấy yêu cầu");

  const supabase = await createClient();
  await supabase
    .from("password_reset_requests")
    .update({
      status: "rejected",
      admin_note: adminNote || null,
      resolved_by: profile.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/password-reset-requests");
  redirectWithMessage("/admin/password-reset-requests", "success", "Đã từ chối yêu cầu");
}
