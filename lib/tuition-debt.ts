import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthLabel, getPreviousYearMonth } from "@/lib/date";
import { calculateMonthlyFeesForStudents, calculateMonthlyFeesForStudentsByMonths } from "@/lib/fees";
import type { MonthlyTuitionRecord, Student } from "@/lib/types";

type SupabaseLike = SupabaseClient;

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

  const studentIds = students.map((student) => student.id);
  const uniqueMonths = [...new Set(yearMonths)];
  const { data: snapshots } = await supabase
    .from("monthly_history_snapshots")
    .select("id, billing_year_month")
    .in("billing_year_month", uniqueMonths);

  const snapshotIdByMonth = new Map((snapshots || []).map((snapshot) => [snapshot.billing_year_month, snapshot.id]));

  if (snapshotIdByMonth.size > 0) {
    const { data: historyRows } = await supabase
      .from("monthly_history_students")
      .select("snapshot_id, student_id, billing_amount")
      .in("snapshot_id", [...snapshotIdByMonth.values()])
      .in("student_id", studentIds);

    for (const row of historyRows || []) {
      const billingYearMonth = [...snapshotIdByMonth.entries()].find(([, id]) => id === row.snapshot_id)?.[0];
      if (!billingYearMonth) continue;
      amounts.set(amountKey(row.student_id, billingYearMonth), row.billing_amount);
    }
  }

  const calculated = await calculateMonthlyFeesForStudentsByMonths(supabase, students, uniqueMonths);
  for (const student of students) {
    for (const billingYearMonth of uniqueMonths) {
      const key = amountKey(student.id, billingYearMonth);
      if (amounts.has(key)) continue;
      const fee = calculated.get(student.id)?.get(billingYearMonth);
      amounts.set(key, fee?.total_amount ?? null);
    }
  }

  return amounts;
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
  const [currentFees, amountsByStudentMonth] = await Promise.all([
    calculateMonthlyFeesForStudents(supabase, students, billingYearMonth),
    getBillingAmountsByStudentMonth(supabase, students, unpaidMonths),
  ]);

  for (const student of students) {
    const unpaidMonthsForStudent = ((unpaidRecords || []) as MonthlyTuitionRecord[])
      .filter((record) => record.student_id === student.id)
      .map((record) => record.billing_year_month)
      .sort((left, right) => right.localeCompare(left));

    const unpaidMonths: UnpaidTuitionMonth[] = unpaidMonthsForStudent.map((month) => ({
      billingYearMonth: month,
      label: getMonthLabel(month),
      amount: amountsByStudentMonth.get(amountKey(student.id, month)) ?? null,
    }));

    const previousMonthAmount = amountsByStudentMonth.get(amountKey(student.id, previousMonth)) ?? null;
    const previousMonthDebt = unpaidMonthsForStudent.includes(previousMonth) ? previousMonthAmount : 0;

    summaries.set(student.id, {
      currentMonthFee: currentFees.get(student.id)?.total_amount ?? null,
      previousMonthDebt,
      unpaidMonths,
    });
  }

  return summaries;
}
