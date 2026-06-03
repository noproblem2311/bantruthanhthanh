import { CreditCard, ReceiptText, Save, UsersRound } from "lucide-react";
import { Fragment } from "react";
import { saveMonthlyTuitionRecordsAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { TuitionFeeDebt } from "@/components/tuition/tuition-fee-debt";
import { formatVietnamDateTime, getMonthBounds, getMonthLabel, getPreviousYearMonth, getYearMonth } from "@/lib/date";
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
        <form className="grid gap-3 sm:grid-cols-[180px_auto] sm:items-end">
          <div className="grid gap-2">
            <Label htmlFor="month">Tháng</Label>
            <Input id="month" name="month" type="month" defaultValue={billingYearMonth} />
          </div>
          <SubmitButton pendingText="Đang xem...">Xem tháng</SubmitButton>
        </form>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard title="Tổng học sinh" value={rows.length} icon={UsersRound} />
        <StatCard title="Đã nộp" value={paidCount} icon={CreditCard} />
        <StatCard title="Đã gửi phiếu" value={receiptSentCount} icon={ReceiptText} />
        <StatCard title="Chưa nộp" value={unpaidCount} icon={CreditCard} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách học phí tháng {billingYearMonth}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <form action={saveMonthlyTuitionRecordsAction}>
            <input type="hidden" name="billing_year_month" value={billingYearMonth} />
            <input type="hidden" name="redirect_to" value={`${basePath}?month=${billingYearMonth}`} />
            <Table className="min-w-[1280px]">
              <THead>
                <tr>
                  <TH>Học sinh</TH>
                  <TH>Phụ huynh</TH>
                  <TH>Học phí & nợ</TH>
                  <TH>Trạng thái</TH>
                  <TH>Gửi phiếu</TH>
                  <TH>Ghi chú</TH>
                  <TH>Cập nhật</TH>
                </tr>
              </THead>
              <TBody>
                {[
                  { label: "Chưa nộp", rows: unpaidRows },
                  { label: "Đã nộp", rows: paidRows },
                ].map((group) => (
                  <Fragment key={group.label}>
                    <tr key={`${group.label}-header`} className="bg-muted/70">
                      <TD colSpan={7} className="py-2 text-xs font-semibold uppercase text-muted-foreground">
                        {group.label} ({group.rows.length})
                      </TD>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.key}>
                        <TD>
                          <input type="hidden" name="student_id" value={row.studentId} />
                          <p className="font-medium">{row.fullName}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <Badge variant="muted">{row.className || "Chưa có lớp"}</Badge>
                          </div>
                        </TD>
                        <TD>
                          <p className="font-medium">{row.parentName || row.parentUsername || "Chưa cập nhật"}</p>
                          <p className="text-xs text-muted-foreground">{row.parentPhone || "Chưa có SĐT"}</p>
                        </TD>
                        <TD>
                          {(() => {
                            const debt = debtSummaries.get(row.studentId);
                            return (
                              <TuitionFeeDebt
                                studentName={row.fullName}
                                currentMonthFee={debt?.currentMonthFee ?? null}
                                previousMonthDebt={debt?.previousMonthDebt ?? null}
                                previousMonthLabel={previousMonthLabel}
                                unpaidMonths={debt?.unpaidMonths ?? []}
                                currency={currency}
                              />
                            );
                          })()}
                        </TD>
                        <TD>
                          <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              name={`is_paid_${row.studentId}`}
                              value="paid"
                              defaultChecked={row.isPaid}
                              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            Đã nộp
                          </label>
                        </TD>
                        <TD>
                          <label className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              name={`receipt_sent_${row.studentId}`}
                              value="sent"
                              defaultChecked={row.receiptSent}
                              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                            />
                            Đã gửi
                          </label>
                        </TD>
                        <TD>
                          <Textarea name={`note_${row.studentId}`} defaultValue={row.note} className="min-h-12 resize-y" placeholder="Ghi chú" />
                        </TD>
                        <TD className="text-sm text-muted-foreground">{row.updatedAt ? formatVietnamDateTime(row.updatedAt) : "Chưa lưu"}</TD>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </TBody>
            </Table>
            {rows.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Chưa có học sinh trong tháng này.</div> : null}
            <div className="flex justify-end border-t p-4">
              <SubmitButton disabled={editableCount === 0} pendingText="Đang lưu...">
                <Save className="h-4 w-4" />
                Lưu thay đổi
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
