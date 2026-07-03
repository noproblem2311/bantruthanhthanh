import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthBounds, getMonthLabel, getPreviousYearMonth } from "@/lib/date";
import { calculateMonthlyFeesForStudents, calculateMonthlyFeesForStudentsByMonths } from "@/lib/fees";
import type { MonthlyTuitionRecord, Student } from "@/lib/types";

type SupabaseLike = SupabaseClient;

/** Tháng 6/2026: nợ tháng 5 = số buổi có mặt tháng 5 × 36.000đ */
const JUNE_2026_BILLING_MONTH = "2026-06";
const MAY_2026_DEBT_MONTH = "2026-05";
const MAY_DEBT_PER_PRESENT_DAY = 36000;

export type UnpaidTuitionMonth = {
  billingYearMonth: string;
  label: string;
  amount: number | null;
};

export type StudentTuitionDebtSummary = {
  currentMonthFee: number | null;
  previousMonthDebt: number | null;
  unpaidMonths: UnpaidTuitionMonth[];
};

export function getOutstandingTuitionDebt(summary: StudentTuitionDebtSummary | undefined, billingYearMonth: string) {
  const outstandingMonths = (summary?.unpaidMonths || []).filter((month) => month.billingYearMonth < billingYearMonth);
  if (outstandingMonths.length === 0) return 0;
  if (outstandingMonths.some((month) => month.amount === null)) return null;
  return outstandingMonths.reduce((sum, month) => sum + (month.amount || 0), 0);
}

function amountKey(studentId: string, billingYearMonth: string) {
  return `${studentId}:${billingYearMonth}`;
}

async function getBillingAmountsByStudentMonth(
  supabase: SupabaseLike,
  students: Student[],
  yearMonths: string[],
) {
  const amounts = new Map<string, number | null>();
  if (students.length === 0 || yearMonths.length === 0) {
    return amounts;
  }

  const uniqueMonths = [...new Set(yearMonths)];
  const calculated = await calculateMonthlyFeesForStudentsByMonths(supabase, students, uniqueMonths);
  for (const student of students) {
    for (const billingYearMonth of uniqueMonths) {
      const key = amountKey(student.id, billingYearMonth);
      const fee = calculated.get(student.id)?.get(billingYearMonth);
      amounts.set(key, fee?.total_amount ?? null);
    }
  }

  return amounts;
}

async function getPresentDayCountsInMonth(supabase: SupabaseLike, students: Student[], yearMonth: string) {
  const counts = new Map<string, number>();
  for (const student of students) {
    counts.set(student.id, 0);
  }

  if (students.length === 0) {
    return counts;
  }

  const { start, end } = getMonthBounds(yearMonth);
  const { data: attendance } = await supabase
    .from("attendance_records")
    .select("student_id, attendance_date, status")
    .in(
      "student_id",
      students.map((student) => student.id),
    )
    .gte("attendance_date", start)
    .lt("attendance_date", end)
    .eq("status", "present");

  for (const record of attendance || []) {
    counts.set(record.student_id, (counts.get(record.student_id) || 0) + 1);
  }

  return counts;
}

function getMayDebtByPresentDays(presentDays: number) {
  return presentDays * MAY_DEBT_PER_PRESENT_DAY;
}

export async function buildStudentTuitionDebtSummaries(
  supabase: SupabaseLike,
  students: Student[],
  billingYearMonth: string,
) {
  const summaries = new Map<string, StudentTuitionDebtSummary>();
  if (students.length === 0) {
    return summaries;
  }

  const studentIds = students.map((student) => student.id);
  const previousMonth = getPreviousYearMonth(billingYearMonth);

  const { data: unpaidRecords } = await supabase
    .from("monthly_tuition_records")
    .select("*")
    .in("student_id", studentIds)
    .eq("is_paid", false);

  const unpaidMonths = [...new Set(((unpaidRecords || []) as MonthlyTuitionRecord[]).map((record) => record.billing_year_month))];
  const useMayPresentDayDebt = billingYearMonth === JUNE_2026_BILLING_MONTH;

  const [currentFees, amountsByStudentMonth, mayPresentDayCounts] = await Promise.all([
    calculateMonthlyFeesForStudents(supabase, students, billingYearMonth),
    getBillingAmountsByStudentMonth(supabase, students, unpaidMonths),
    useMayPresentDayDebt ? getPresentDayCountsInMonth(supabase, students, MAY_2026_DEBT_MONTH) : Promise.resolve(null),
  ]);

  for (const student of students) {
    const unpaidMonthsForStudent = ((unpaidRecords || []) as MonthlyTuitionRecord[])
      .filter((record) => record.student_id === student.id)
      .map((record) => record.billing_year_month)
      .sort((left, right) => right.localeCompare(left));

    const mayPresentDays = mayPresentDayCounts?.get(student.id) ?? 0;
    const mayDebtFromAttendance = getMayDebtByPresentDays(mayPresentDays);

    const unpaidMonths: UnpaidTuitionMonth[] = unpaidMonthsForStudent.map((month) => ({
      billingYearMonth: month,
      label: getMonthLabel(month),
      amount:
        useMayPresentDayDebt && month === MAY_2026_DEBT_MONTH
          ? mayDebtFromAttendance
          : (amountsByStudentMonth.get(amountKey(student.id, month)) ?? null),
    }));

    const previousMonthAmount = amountsByStudentMonth.get(amountKey(student.id, previousMonth)) ?? null;
    const previousMonthDebt = unpaidMonthsForStudent.includes(previousMonth)
      ? useMayPresentDayDebt && previousMonth === MAY_2026_DEBT_MONTH
        ? mayDebtFromAttendance
        : previousMonthAmount
      : 0;

    summaries.set(student.id, {
      currentMonthFee: currentFees.get(student.id)?.total_amount ?? null,
      previousMonthDebt,
      unpaidMonths,
    });
  }

  return summaries;
}
