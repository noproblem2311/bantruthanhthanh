import { CreditCard, ReceiptText, Save, UsersRound } from "lucide-react";
import { saveMonthlyTuitionRecordsAction } from "@/lib/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { SubmitButton } from "@/components/ui/submit-button";
import { TuitionStudentRow } from "@/components/tuition/tuition-student-row";
import { createClient } from "@/lib/supabase/server";
import { getMonthBounds, getMonthLabel, getPreviousYearMonth, getYearMonth } from "@/lib/date";
import { getFeeSetting } from "@/lib/fees";
import { buildStudentTuitionDebtSummaries } from "@/lib/tuition-debt";
import { isStudentEligibleBeforeDate } from "@/lib/student-attendance";
import { getMessageParam } from "@/lib/utils";
import type { MonthlyTuitionRecord, Parent, Student } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type TuitionBasePath = "/admin/tuition" | "/manager/tuition";
type StudentWithParent = Student & {
  parents: Pick<Parent, "id" | "full_name" | "username" | "phone"> | null;
};

type TuitionPageRow = {
  key: string;
  studentId: string;
  fullName: string;
  className: string | null;
  parentName: string | null;
  parentUsername: string | null;
  parentPhone: string | null;
  isPaid: boolean;
  receiptSent: boolean;
  note: string;
  updatedAt: string | null;
};

function getMonthParam(value: string | string[] | undefined) {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value) ? value : getYearMonth();
}

function buildActiveRows(students: StudentWithParent[], recordsByStudent: Map<string, MonthlyTuitionRecord>) {
  return students.map((student): TuitionPageRow => {
    const record = recordsByStudent.get(student.id);
    return {
      key: student.id,
      studentId: student.id,
      fullName: student.full_name,
      className: student.class_name,
      parentName: student.parents?.full_name || null,
      parentUsername: student.parents?.username || null,
      parentPhone: student.parents?.phone || null,
      isPaid: record?.is_paid || false,
      receiptSent: record?.receipt_sent || false,
      note: record?.note || "",
      updatedAt: record?.updated_at || null,
    };
  });
}

function TuitionGroupSection({
  label,
  rows,
  previousMonthLabel,
  currency,
  debtSummaries,
}: {
  label: string;
  rows: TuitionPageRow[];
  previousMonthLabel: string;
  currency: string;
  debtSummaries: Awaited<ReturnType<typeof buildStudentTuitionDebtSummaries>>;
}) {
  if (rows.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="sticky top-0 z-10 -mx-1 rounded-lg bg-muted/90 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
        {label} ({rows.length})
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {rows.map((row) => (
          <TuitionStudentRow
            key={row.key}
            studentId={row.studentId}
            fullName={row.fullName}
            studentClassName={row.className}
            parentName={row.parentName}
            parentUsername={row.parentUsername}
            parentPhone={row.parentPhone}
            isPaid={row.isPaid}
            receiptSent={row.receiptSent}
            note={row.note}
            updatedAt={row.updatedAt}
            previousMonthLabel={previousMonthLabel}
            currency={currency}
            debt={debtSummaries.get(row.studentId)}
          />
        ))}
      </div>
    </section>
  );
}

export async function MonthlyTuitionPage({ searchParams, basePath }: { searchParams: SearchParams; basePath: TuitionBasePath }) {
  const params = await searchParams;
  const billingYearMonth = getMonthParam(params.month);
  const previousYearMonth = getPreviousYearMonth(billingYearMonth);
  const previousMonthLabel = getMonthLabel(previousYearMonth);
  const { start, end } = getMonthBounds(billingYearMonth);
  const supabase = await createClient();

  const [{ data: students }, { data: tuitionRecords }, { data: attendanceRecords }, feeSetting] = await Promise.all([
    supabase
      .from("students")
      .select("*, parents(id,full_name,username,phone)")
      .eq("status", "active")
      .order("full_name"),
    supabase.from("monthly_tuition_records").select("*").eq("billing_year_month", billingYearMonth).order("updated_at", { ascending: false }),
    supabase.from("attendance_records").select("student_id").gte("attendance_date", start).lt("attendance_date", end),
    getFeeSetting(supabase, billingYearMonth),
  ]);

  const records = (tuitionRecords || []) as MonthlyTuitionRecord[];
  const recordsByStudent = new Map(records.map((record) => [record.student_id, record]));
  const attendanceStudentIds = new Set((attendanceRecords || []).map((record: { student_id: string }) => record.student_id));
  const eligibleStudents = ((students || []) as StudentWithParent[]).filter(
    (student) => isStudentEligibleBeforeDate(student, end) || attendanceStudentIds.has(student.id),
  );
  const debtSummaries = await buildStudentTuitionDebtSummaries(supabase, eligibleStudents, billingYearMonth);
  const rows = buildActiveRows(eligibleStudents, recordsByStudent);
  const currency = feeSetting?.currency || "VND";
  const unpaidRows = rows.filter((row) => !row.isPaid);
  const paidRows = rows.filter((row) => row.isPaid);

  const paidCount = rows.filter((row) => row.isPaid).length;
  const receiptSentCount = rows.filter((row) => row.receiptSent).length;
  const unpaidCount = rows.length - paidCount;
  const editableCount = rows.filter((row) => row.studentId).length;

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Nộp học phí</h2>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi đã nộp/chưa nộp và ghi chú riêng cho từng học sinh theo tháng.</p>
        </div>
        <form className="grid w-full gap-3 sm:max-w-sm sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid gap-2">
            <Label htmlFor="month">Tháng</Label>
            <Input id="month" name="month" type="month" defaultValue={billingYearMonth} />
          </div>
          <SubmitButton pendingText="Đang xem...">Xem tháng</SubmitButton>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard title="Tổng học sinh" value={rows.length} icon={UsersRound} />
        <StatCard title="Đã nộp" value={paidCount} icon={CreditCard} />
        <StatCard title="Đã gửi phiếu" value={receiptSentCount} icon={ReceiptText} />
        <StatCard title="Chưa nộp" value={unpaidCount} icon={CreditCard} />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Danh sách học phí tháng {billingYearMonth}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <form action={saveMonthlyTuitionRecordsAction} className="space-y-6">
            <input type="hidden" name="billing_year_month" value={billingYearMonth} />
            <input type="hidden" name="redirect_to" value={`${basePath}?month=${billingYearMonth}`} />

            {rows.length === 0 ? (
              <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                Chưa có học sinh trong tháng này.
              </div>
            ) : (
              <>
                <TuitionGroupSection
                  label="Chưa nộp"
                  rows={unpaidRows}
                  previousMonthLabel={previousMonthLabel}
                  currency={currency}
                  debtSummaries={debtSummaries}
                />
                <TuitionGroupSection
                  label="Đã nộp"
                  rows={paidRows}
                  previousMonthLabel={previousMonthLabel}
                  currency={currency}
                  debtSummaries={debtSummaries}
                />
              </>
            )}

            <div className="sticky bottom-0 -mx-4 border-t bg-white/95 px-4 py-3 backdrop-blur-sm sm:-mx-5 sm:px-5">
              <div className="flex justify-stretch sm:justify-end">
                <SubmitButton disabled={editableCount === 0} pendingText="Đang lưu..." className="w-full sm:w-auto">
                  <Save className="h-4 w-4" />
                  Lưu thay đổi
                </SubmitButton>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
