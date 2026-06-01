"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatVietnamDate } from "@/lib/date";
import { requireRole } from "@/lib/permissions";
import { isStudentEligibleForAttendanceDate } from "@/lib/student-attendance";
import { attendanceStatusSchema, bulkAttendanceSchema, markAttendanceSchema } from "@/lib/validators/attendance";
import { redirectWithMessage } from "@/lib/auth/messages";
import type { Student } from "@/lib/types";

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
  const { data: student } = await supabase
    .from("students")
    .select("id,created_at,enrollment_date,status")
    .eq("id", parsed.data.student_id)
    .eq("status", "active")
    .single();
  if (!student || !isStudentEligibleForAttendanceDate(student as Pick<Student, "created_at" | "enrollment_date">, parsed.data.attendance_date)) {
    redirectWithMessage(path, "error", "Không thể điểm danh trước ngày vào của học sinh");
  }

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

export async function updateAttendanceStudentInfoAction(formData: FormData) {
  await requireRole(["admin", "manager"]);
  const path = attendancePath(formData);
  const studentId = formData.get("student_id");
  const fullName = formData.get("full_name");
  const className = formData.get("class_name");
  const schoolName = formData.get("school_name");
  const enrollmentDate = formData.get("enrollment_date");
  const boardingPackageType = formData.get("boarding_package_type");

  if (typeof studentId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(studentId)) {
    redirectWithMessage(path, "error", "Học sinh không hợp lệ");
  }

  if (typeof fullName !== "string" || fullName.trim().length < 2) {
    redirectWithMessage(path, "error", "Vui lòng nhập tên học sinh tối thiểu 2 ký tự");
  }

  if (typeof enrollmentDate === "string" && enrollmentDate && !/^\d{4}-\d{2}-\d{2}$/.test(enrollmentDate)) {
    redirectWithMessage(path, "error", "Ngày vào không hợp lệ");
  }

  if (boardingPackageType !== "weekday" && boardingPackageType !== "saturday") {
    redirectWithMessage(path, "error", "Gói bán trú không hợp lệ");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("students")
    .update({
      full_name: fullName.trim(),
      class_name: typeof className === "string" && className.trim() ? className.trim() : null,
      school_name: typeof schoolName === "string" && schoolName.trim() ? schoolName.trim() : null,
      enrollment_date: typeof enrollmentDate === "string" && enrollmentDate ? enrollmentDate : null,
      boarding_package_type: boardingPackageType,
    })
    .eq("id", studentId);

  if (error) redirectWithMessage(path, "error", "Không cập nhật được thông tin học sinh");

  revalidatePath(path.split("?")[0] || path);
  redirectWithMessage(path, "success", "Đã cập nhật thông tin học sinh");
}

export async function saveAttendanceBatchAction(formData: FormData) {
  const profile = await requireRole(["admin", "manager"]);
  const path = attendancePath(formData);
  const intent = formData.get("intent");
  if (intent !== "save_attendance") {
    redirectWithMessage(path, "error", "Chỉ nút Lưu điểm danh mới được ghi dữ liệu");
  }

  const attendanceDate = formData.get("attendance_date");

  if (typeof attendanceDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    redirectWithMessage(path, "error", "Ngày điểm danh không hợp lệ");
  }

  const studentIds = Array.from(new Set(formData.getAll("student_id").filter((value): value is string => typeof value === "string")));
  const rows = [];
  const supabase = await createClient();
  const { data: students } = studentIds.length
    ? await supabase
        .from("students")
        .select("id,created_at,enrollment_date,status,boarding_package_type")
        .eq("status", "active")
        .in("id", studentIds)
    : { data: [] };
  const eligibleStudents = new Map(
    ((students || []) as Array<Pick<Student, "id" | "created_at" | "enrollment_date" | "boarding_package_type">>)
      .filter((student) => isStudentEligibleForAttendanceDate(student, attendanceDate))
      .map((student) => [student.id, student]),
  );
  const saturdayStudentIds: string[] = [];
  const weekdayStudentIds: string[] = [];

  for (const studentId of studentIds) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(studentId)) {
      redirectWithMessage(path, "error", "Danh sách học sinh không hợp lệ");
    }

    if (!eligibleStudents.has(studentId)) {
      redirectWithMessage(path, "error", "Danh sách có học sinh chưa hợp lệ cho ngày điểm danh");
    }

    const student = eligibleStudents.get(studentId);
    const attendsSaturday = formData.get(`saturday_${studentId}`) === "on";
    if (student?.boarding_package_type !== (attendsSaturday ? "saturday" : "weekday")) {
      if (attendsSaturday) {
        saturdayStudentIds.push(studentId);
      } else {
        weekdayStudentIds.push(studentId);
      }
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

  if (saturdayStudentIds.length > 0 || weekdayStudentIds.length > 0) {
    const admin = createAdminClient();
    if (saturdayStudentIds.length > 0) {
      const { error } = await admin.from("students").update({ boarding_package_type: "saturday" }).in("id", saturdayStudentIds);
      if (error) redirectWithMessage(path, "error", "Không cập nhật được thông tin ở thứ 7");
    }
    if (weekdayStudentIds.length > 0) {
      const { error } = await admin.from("students").update({ boarding_package_type: "weekday" }).in("id", weekdayStudentIds);
      if (error) redirectWithMessage(path, "error", "Không cập nhật được thông tin ở thứ 7");
    }
  }

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
  const { data: students } = await supabase.from("students").select("id,created_at,enrollment_date").eq("status", "active");
  const studentIds = ((students || []) as Array<Pick<Student, "id" | "created_at" | "enrollment_date">>)
    .filter((student) => isStudentEligibleForAttendanceDate(student, parsed.data.attendance_date))
    .map((student) => student.id);

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
