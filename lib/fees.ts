import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthBounds, isSaturday, isSunday } from "@/lib/date";
import type { AttendanceRecord, FeeSetting, Student } from "@/lib/types";

type SupabaseLike = SupabaseClient;

export const DEFAULT_SATURDAY_PACKAGE_AMOUNT = 850000;
export const DEFAULT_WEEKDAY_PACKAGE_AMOUNT = 720000;
export const DEFAULT_ABSENCE_DEDUCTION_AMOUNT = 33000;

export type FeePackageType = "saturday" | "weekday";

export type StudentMonthlyFee = {
  student: Student;
  present_days: number;
  absent_days: number;
  package_type: FeePackageType;
  package_name: string;
  package_amount: number | null;
  absence_deduction_amount: number | null;
  absence_deduction_total: number | null;
  fee_per_attendance_day: number | null;
  total_amount: number | null;
  attendance_dates: string[];
  saturday_attendance_dates: string[];
  charged_absent_dates: string[];
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
  const saturdayAttendanceDates = attendanceDates.filter(isSaturday);
  const chargedAbsentDates = [...excusedAbsentDates, ...unexcusedAbsentDates].filter((date) => !isSunday(date)).sort();
  const packageType: FeePackageType = saturdayAttendanceDates.length > 0 ? "saturday" : "weekday";
  const packageAmount =
    feeSetting === null
      ? null
      : packageType === "saturday"
        ? (feeSetting.saturday_package_amount ?? DEFAULT_SATURDAY_PACKAGE_AMOUNT)
        : (feeSetting.weekday_package_amount ?? DEFAULT_WEEKDAY_PACKAGE_AMOUNT);
  const absenceDeductionAmount = feeSetting === null ? null : (feeSetting.absence_deduction_amount ?? DEFAULT_ABSENCE_DEDUCTION_AMOUNT);
  const absenceDeductionTotal = absenceDeductionAmount === null ? null : chargedAbsentDates.length * absenceDeductionAmount;

  return {
    student,
    present_days: attendanceDates.length,
    absent_days: chargedAbsentDates.length,
    package_type: packageType,
    package_name: packageType === "saturday" ? "Có thứ 7" : "Không thứ 7",
    package_amount: packageAmount,
    absence_deduction_amount: absenceDeductionAmount,
    absence_deduction_total: absenceDeductionTotal,
    fee_per_attendance_day: absenceDeductionAmount,
    total_amount: packageAmount === null || absenceDeductionTotal === null ? null : Math.max(packageAmount - absenceDeductionTotal, 0),
    attendance_dates: attendanceDates,
    saturday_attendance_dates: saturdayAttendanceDates,
    charged_absent_dates: chargedAbsentDates,
    excused_absent_dates: excusedAbsentDates,
    unexcused_absent_dates: unexcusedAbsentDates,
    not_marked_dates: notMarkedDates,
  };
}
