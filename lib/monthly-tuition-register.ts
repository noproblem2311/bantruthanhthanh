import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getMonthBounds } from "@/lib/date";
import { getFeeSetting } from "@/lib/fees";
import { isStudentEligibleBeforeDate } from "@/lib/student-attendance";
import { buildStudentTuitionDebtSummaries, getOutstandingTuitionDebt } from "@/lib/tuition-debt";
import type { MonthlyTuitionRecord, Parent, Student } from "@/lib/types";

type StudentWithParent = Student & {
  parents: Pick<Parent, "full_name" | "username" | "phone"> | null;
};

export type MonthlyTuitionRegisterRow = {
  student: StudentWithParent;
  tuitionAmount: number | null;
  outstandingDebt: number | null;
  isPaid: boolean;
  receiptSent: boolean;
  note: string | null;
};

export async function getMonthlyTuitionRegister(
  supabase: SupabaseClient,
  billingYearMonth: string,
) {
  const { start, end } = getMonthBounds(billingYearMonth);
  const [{ data: students }, { data: tuitionRecords }, { data: attendanceRecords }, feeSetting] = await Promise.all([
    supabase
      .from("students")
      .select("*, parents(full_name,username,phone)")
      .eq("status", "active")
      .order("full_name"),
    supabase.from("monthly_tuition_records").select("*").eq("billing_year_month", billingYearMonth),
    supabase.from("attendance_records").select("student_id").gte("attendance_date", start).lt("attendance_date", end),
    getFeeSetting(supabase, billingYearMonth),
  ]);

  const attendanceStudentIds = new Set((attendanceRecords || []).map((record: { student_id: string }) => record.student_id));
  const eligibleStudents = ((students || []) as StudentWithParent[]).filter(
    (student) => isStudentEligibleBeforeDate(student, end) || attendanceStudentIds.has(student.id),
  );
  const recordsByStudent = new Map(
    ((tuitionRecords || []) as MonthlyTuitionRecord[]).map((record) => [record.student_id, record]),
  );
  const debtSummaries = await buildStudentTuitionDebtSummaries(supabase, eligibleStudents, billingYearMonth);
  const currency = feeSetting?.currency || "VND";

  const rows: MonthlyTuitionRegisterRow[] = eligibleStudents.map((student) => {
    const record = recordsByStudent.get(student.id);
    const debtSummary = debtSummaries.get(student.id);

    return {
      student,
      tuitionAmount: debtSummary?.currentMonthFee ?? null,
      outstandingDebt: getOutstandingTuitionDebt(debtSummary, billingYearMonth),
      isPaid: record?.is_paid || false,
      receiptSent: record?.receipt_sent || false,
      note: record?.note || null,
    };
  });

  return {
    rows,
    currency,
    paidCount: rows.filter((row) => row.isPaid).length,
    receiptCount: rows.filter((row) => row.receiptSent).length,
    totalTuition: rows.reduce((sum, row) => sum + (row.tuitionAmount || 0), 0),
    totalDebt: rows.reduce((sum, row) => sum + (row.outstandingDebt || 0), 0),
  };
}
