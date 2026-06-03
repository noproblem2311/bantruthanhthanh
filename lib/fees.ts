import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthBounds, getPreviousYearMonth, isSaturday, isSunday } from "@/lib/date";
import { boardingPackageLabels } from "@/lib/labels";
import { getStudentAttendanceStartDate } from "@/lib/student-attendance";
import type { AttendanceRecord, BoardingPackageType, FeeSetting, Student } from "@/lib/types";

type SupabaseLike = SupabaseClient;

export const DEFAULT_SATURDAY_PACKAGE_AMOUNT = 850000;
export const DEFAULT_WEEKDAY_PACKAGE_AMOUNT = 720000;
export const DEFAULT_TWO_DAYS_PACKAGE_AMOUNT = 300000;
export const DEFAULT_THREE_DAYS_PACKAGE_AMOUNT = 400000;
export const DEFAULT_FOUR_DAYS_PACKAGE_AMOUNT = 590000;
export const DEFAULT_ABSENCE_DEDUCTION_AMOUNT = 18000;

export function getPackageAmount(packageType: BoardingPackageType, feeSetting: FeeSetting) {
  if (packageType === "saturday") return feeSetting.saturday_package_amount ?? DEFAULT_SATURDAY_PACKAGE_AMOUNT;
  if (packageType === "weekday") return feeSetting.weekday_package_amount ?? DEFAULT_WEEKDAY_PACKAGE_AMOUNT;
  if (packageType === "two_days") return DEFAULT_TWO_DAYS_PACKAGE_AMOUNT;
  if (packageType === "three_days") return DEFAULT_THREE_DAYS_PACKAGE_AMOUNT;
  return DEFAULT_FOUR_DAYS_PACKAGE_AMOUNT;
}

export type StudentMonthlyFee = {
  student: Student;
  present_days: number;
  absent_days: number;
  package_type: BoardingPackageType;
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
  const feesByMonth = await calculateMonthlyFeesForStudentsByMonths(supabase, [student], [yearMonth]);
  return feesByMonth.get(student.id)?.get(yearMonth) ?? buildStudentMonthlyFee(student, [], null);
}

export async function calculateMonthlyFeesForStudents(supabase: SupabaseLike, students: Student[], yearMonth: string) {
  const feesByMonth = await calculateMonthlyFeesForStudentsByMonths(supabase, students, [yearMonth]);
  const result = new Map<string, StudentMonthlyFee>();
  for (const student of students) {
    result.set(student.id, feesByMonth.get(student.id)?.get(yearMonth) ?? buildStudentMonthlyFee(student, [], null));
  }
  return result;
}

export async function calculateMonthlyFeesForStudentsByMonths(
  supabase: SupabaseLike,
  students: Student[],
  yearMonths: string[],
) {
  const uniqueMonths = [...new Set(yearMonths)];
  const result = new Map<string, Map<string, StudentMonthlyFee>>();
  for (const student of students) {
    result.set(student.id, new Map());
  }

  if (students.length === 0 || uniqueMonths.length === 0) {
    return result;
  }

  const studentIds = students.map((student) => student.id);
  let rangeStart = getMonthBounds(getPreviousYearMonth(uniqueMonths[0])).start;
  let rangeEnd = getMonthBounds(getPreviousYearMonth(uniqueMonths[0])).end;

  for (const yearMonth of uniqueMonths) {
    const { start, end } = getMonthBounds(getPreviousYearMonth(yearMonth));
    if (start < rangeStart) rangeStart = start;
    if (end > rangeEnd) rangeEnd = end;
  }

  const [{ data: attendance }, ...feeSettings] = await Promise.all([
    supabase
      .from("attendance_records")
      .select("*")
      .gte("attendance_date", rangeStart)
      .lt("attendance_date", rangeEnd)
      .in("student_id", studentIds)
      .order("attendance_date", { ascending: true }),
    ...uniqueMonths.map((yearMonth) => getFeeSetting(supabase, yearMonth)),
  ]);

  const feeSettingByMonth = new Map(uniqueMonths.map((yearMonth, index) => [yearMonth, feeSettings[index]]));
  const attendanceByStudent = new Map<string, AttendanceRecord[]>();

  for (const record of (attendance || []) as AttendanceRecord[]) {
    const list = attendanceByStudent.get(record.student_id) || [];
    list.push(record);
    attendanceByStudent.set(record.student_id, list);
  }

  for (const yearMonth of uniqueMonths) {
    const { start, end } = getMonthBounds(getPreviousYearMonth(yearMonth));
    const feeSetting = feeSettingByMonth.get(yearMonth) ?? null;

    for (const student of students) {
      const studentRecords = (attendanceByStudent.get(student.id) || []).filter(
        (record) => record.attendance_date >= start && record.attendance_date < end,
      );
      result.get(student.id)!.set(yearMonth, buildStudentMonthlyFee(student, studentRecords, feeSetting));
    }
  }

  return result;
}

export function buildStudentMonthlyFee(student: Student, records: AttendanceRecord[], feeSetting: FeeSetting | null): StudentMonthlyFee {
  const attendanceStartDate = getStudentAttendanceStartDate(student);
  const billableRecords = records.filter((record) => record.attendance_date >= attendanceStartDate);
  const attendanceDates = billableRecords.filter((record) => record.status === "present").map((record) => record.attendance_date);
  const excusedAbsentDates = billableRecords.filter((record) => record.status === "excused_absent").map((record) => record.attendance_date);
  const unexcusedAbsentDates = billableRecords.filter((record) => record.status === "unexcused_absent").map((record) => record.attendance_date);
  const notMarkedDates = billableRecords.filter((record) => record.status === "not_marked").map((record) => record.attendance_date);
  const saturdayAttendanceDates = attendanceDates.filter(isSaturday);
  const chargedAbsentDates = excusedAbsentDates.filter((date) => !isSunday(date)).sort();
  const packageType = student.boarding_package_type ?? "weekday";
  const packageAmount = feeSetting === null ? null : getPackageAmount(packageType, feeSetting);
  const absenceDeductionAmount = feeSetting === null ? null : (feeSetting.absence_deduction_amount ?? DEFAULT_ABSENCE_DEDUCTION_AMOUNT);
  const absenceDeductionTotal = absenceDeductionAmount === null ? null : chargedAbsentDates.length * absenceDeductionAmount;

  return {
    student,
    present_days: attendanceDates.length,
    absent_days: chargedAbsentDates.length,
    package_type: packageType,
    package_name: boardingPackageLabels[packageType],
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
