import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthBounds } from "@/lib/date";
import type { AttendanceRecord, FeeSetting, Student } from "@/lib/types";

type SupabaseLike = SupabaseClient;

export type StudentMonthlyFee = {
  student: Student;
  present_days: number;
  fee_per_attendance_day: number | null;
  total_amount: number | null;
  attendance_dates: string[];
  excused_absent_dates: string[];
  unexcused_absent_dates: string[];
  not_marked_dates: string[];
};

export async function getFeeSetting(supabase: SupabaseLike, yearMonth: string) {
  const { data } = await supabase.from("fee_settings").select("*").eq("year_month", yearMonth).maybeSingle();
  return (data || null) as FeeSetting | null;
}

export async function calculateMonthlyFee(supabase: SupabaseLike, student: Student, yearMonth: string) {
  const { start, end } = getMonthBounds(yearMonth);
  const feeSetting = await getFeeSetting(supabase, yearMonth);
  const { data } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("student_id", student.id)
    .gte("attendance_date", start)
    .lt("attendance_date", end)
    .order("attendance_date", { ascending: true });

  return buildStudentMonthlyFee(student, (data || []) as AttendanceRecord[], feeSetting);
}

export function buildStudentMonthlyFee(student: Student, records: AttendanceRecord[], feeSetting: FeeSetting | null): StudentMonthlyFee {
  const attendanceDates = records.filter((record) => record.status === "present").map((record) => record.attendance_date);
  const excusedAbsentDates = records.filter((record) => record.status === "excused_absent").map((record) => record.attendance_date);
  const unexcusedAbsentDates = records.filter((record) => record.status === "unexcused_absent").map((record) => record.attendance_date);
  const notMarkedDates = records.filter((record) => record.status === "not_marked").map((record) => record.attendance_date);
  const unit = feeSetting?.fee_per_attendance_day ?? null;

  return {
    student,
    present_days: attendanceDates.length,
    fee_per_attendance_day: unit,
    total_amount: unit === null ? null : attendanceDates.length * unit,
    attendance_dates: attendanceDates,
    excused_absent_dates: excusedAbsentDates,
    unexcused_absent_dates: unexcusedAbsentDates,
    not_marked_dates: notMarkedDates,
  };
}
