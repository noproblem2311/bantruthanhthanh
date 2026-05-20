"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { formatVietnamDate } from "@/lib/date";
import { requireRole } from "@/lib/permissions";
import { attendanceStatusSchema, bulkAttendanceSchema, markAttendanceSchema } from "@/lib/validators/attendance";
import { redirectWithMessage } from "@/lib/auth/messages";

function attendancePath(formData: FormData) {
  const value = formData.get("redirect_to");
  return typeof value === "string" && value.startsWith("/") ? value : "/manager/attendance";
}

export async function markAttendanceAction(formData: FormData) {
  const profile = await requireRole(["admin", "manager"]);
  const parsed = markAttendanceSchema.safeParse({
    student_id: formData.get("student_id"),
    attendance_date: formData.get("attendance_date"),
    status: formData.get("status"),
    note: formData.get("note"),
  });
  const path = attendancePath(formData);

  if (!parsed.success) {
    redirectWithMessage(path, "error", parsed.error.issues[0]?.message || "Dữ liệu điểm danh chưa hợp lệ");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("attendance_records").upsert(
    {
      student_id: parsed.data.student_id,
      attendance_date: parsed.data.attendance_date,
      status: parsed.data.status,
      note: parsed.data.note || null,
      marked_by: profile.id,
      marked_at: new Date().toISOString(),
    },
    { onConflict: "student_id,attendance_date" },
  );

  if (error) redirectWithMessage(path, "error", "Không lưu được điểm danh");

  revalidatePath(path.split("?")[0] || path);
  redirectWithMessage(path, "success", "Đã cập nhật điểm danh");
}

export async function saveAttendanceBatchAction(formData: FormData) {
  const profile = await requireRole(["admin", "manager"]);
  const path = attendancePath(formData);
  const attendanceDate = formData.get("attendance_date");

  if (typeof attendanceDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    redirectWithMessage(path, "error", "Ngày điểm danh không hợp lệ");
  }

  const studentIds = Array.from(new Set(formData.getAll("student_id").filter((value): value is string => typeof value === "string")));
  const rows = [];

  for (const studentId of studentIds) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(studentId)) {
      redirectWithMessage(path, "error", "Danh sách học sinh không hợp lệ");
    }

    const status = formData.get(`status_${studentId}`);
    const note = formData.get(`note_${studentId}`);
    const parsedStatus = attendanceStatusSchema.safeParse(status);

    if (!parsedStatus.success) {
      redirectWithMessage(path, "error", "Vui lòng chọn trạng thái cho tất cả học sinh hiển thị");
    }

    rows.push({
      student_id: studentId,
      attendance_date: attendanceDate,
      status: parsedStatus.data,
      note: typeof note === "string" && note.trim() ? note.trim() : null,
      marked_by: profile.id,
      marked_at: new Date().toISOString(),
    });
  }

  if (rows.length === 0) {
    redirectWithMessage(path, "error", "Không có học sinh nào để lưu điểm danh");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("attendance_records").upsert(rows, { onConflict: "student_id,attendance_date" });

  if (error) redirectWithMessage(path, "error", "Không lưu được điểm danh");

  revalidatePath(path.split("?")[0] || path);
  redirectWithMessage(path, "success", `Đã lưu điểm danh ngày ${formatVietnamDate(attendanceDate)} cho ${rows.length} học sinh`);
}

export async function bulkMarkPresentAction(formData: FormData) {
  const profile = await requireRole(["admin", "manager"]);
  const path = attendancePath(formData);
  const parsed = bulkAttendanceSchema.safeParse({
    attendance_date: formData.get("attendance_date"),
  });

  if (!parsed.success) {
    redirectWithMessage(path, "error", "Ngày điểm danh không hợp lệ");
  }

  const supabase = await createClient();
  const { data: students } = await supabase.from("students").select("id").eq("status", "active");
  const studentIds = (students || []).map((student: { id: string }) => student.id);

  if (studentIds.length === 0) {
    redirectWithMessage(path, "error", "Chưa có học sinh active");
  }

  const { data: existing } = await supabase
    .from("attendance_records")
    .select("student_id,status")
    .eq("attendance_date", parsed.data.attendance_date)
    .in("student_id", studentIds);

  const processed = new Set(
    (existing || [])
      .filter((record: { status: string }) => record.status !== "not_marked")
      .map((record: { student_id: string }) => record.student_id),
  );

  const { data: offRequests } = await supabase
    .from("off_requests")
    .select("student_id")
    .eq("off_date", parsed.data.attendance_date)
    .in("status", ["auto_approved", "approved"]);

  (offRequests || []).forEach((request: { student_id: string }) => processed.add(request.student_id));

  const rows = studentIds
    .filter((studentId) => !processed.has(studentId))
    .map((studentId) => ({
      student_id: studentId,
      attendance_date: parsed.data.attendance_date,
      status: "present",
      note: null,
      marked_by: profile.id,
      marked_at: new Date().toISOString(),
    }));

  if (rows.length === 0) {
    redirectWithMessage(path, "success", "Không còn học sinh chưa xử lý để đánh dấu");
  }

  const { error } = await supabase.from("attendance_records").upsert(rows, { onConflict: "student_id,attendance_date" });
  if (error) redirectWithMessage(path, "error", "Không bulk điểm danh được");

  revalidatePath(path.split("?")[0] || path);
  redirectWithMessage(path, "success", `Đã đánh dấu có mặt cho ${rows.length} học sinh`);
}
