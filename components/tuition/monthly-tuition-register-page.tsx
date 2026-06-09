import Link from "next/link";
import { CalendarDays, ChevronLeft, Download, ExternalLink, Save } from "lucide-react";
import { saveMonthlyTuitionRecordsAction } from "@/lib/actions/admin";
import { Card, CardContent } from "@/components/ui/card";
import { ClientSearch } from "@/components/ui/client-search";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getMonthBounds, getYearMonth } from "@/lib/date";
import { getFeeSetting } from "@/lib/fees";
import { isStudentEligibleBeforeDate } from "@/lib/student-attendance";
import { buildStudentTuitionDebtSummaries, getOutstandingTuitionDebt } from "@/lib/tuition-debt";
import { formatCurrency, getMessageParam } from "@/lib/utils";
import type { MonthlyTuitionRecord, Parent, Student } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type RegisterBasePath = "/admin/tuition/register" | "/manager/tuition/register";
type TuitionBasePath = "/admin/tuition" | "/manager/tuition";
type StudentWithParent = Student & {
  parents: Pick<Parent, "full_name" | "username" | "phone"> | null;
};

function getMonthParam(value: string | string[] | undefined) {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value) ? value : getYearMonth();
}

export async function MonthlyTuitionRegisterPage({
  searchParams,
  basePath,
  tuitionPath,
}: {
  searchParams: SearchParams;
  basePath: RegisterBasePath;
  tuitionPath: TuitionBasePath;
}) {
  const params = await searchParams;
  const billingYearMonth = getMonthParam(params.month);
  const { start, end } = getMonthBounds(billingYearMonth);
  const searchTargetId = `${basePath.replace(/\//g, "-")}-grid`;
  const supabase = await createClient();

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

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href={`${tuitionPath}?month=${billingYearMonth}`} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <ChevronLeft className="h-4 w-4" />
            Quay lại nộp học phí
          </Link>
          <h2 className="text-2xl font-semibold">Sổ học phí tháng</h2>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi và cập nhật học phí cả tháng trong một bảng gọn.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/so-hoc-phi?month=${billingYearMonth}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted/60"
          >
            <ExternalLink className="h-4 w-4" />
            Trang xem công khai
          </a>
          <a
            href={`/api/tuition/export?month=${billingYearMonth}`}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted/60"
          >
            <Download className="h-4 w-4" />
            Xuất Excel
          </a>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-[180px_1fr_auto] sm:items-end">
          <form className="contents" method="get">
            <div className="grid gap-2">
              <Label htmlFor="month">Tháng</Label>
              <Input id="month" name="month" type="month" defaultValue={billingYearMonth} />
            </div>
            <ClientSearch
              targetId={searchTargetId}
              placeholder="Tên học sinh, lớp, phụ huynh"
              countLabel="học sinh"
              className="sm:col-start-2"
            />
            <SubmitButton pendingText="Đang tải..." className="sm:col-start-3">
              <CalendarDays className="h-4 w-4" />
              Xem tháng
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <form action={saveMonthlyTuitionRecordsAction} className="space-y-4">
        <input type="hidden" name="billing_year_month" value={billingYearMonth} />
        <input type="hidden" name="redirect_to" value={`${basePath}?month=${billingYearMonth}`} />

        <Card>
          <CardContent className="p-0">
            <Table className="min-w-[1100px]">
              <THead>
                <tr>
                  <TH className="w-14 text-center">STT</TH>
                  <TH>Học sinh</TH>
                  <TH>Phụ huynh</TH>
                  <TH className="text-right">Học phí</TH>
                  <TH className="text-right">Nợ tồn</TH>
                  <TH className="w-28 text-center">Đã nộp</TH>
                  <TH className="w-32 text-center">Đã gửi phiếu</TH>
                  <TH className="min-w-56">Ghi chú</TH>
                </tr>
              </THead>
              <TBody id={searchTargetId}>
                {eligibleStudents.map((student, index) => {
                  const record = recordsByStudent.get(student.id);
                  const debtSummary = debtSummaries.get(student.id);
                  const outstandingDebt = getOutstandingTuitionDebt(debtSummary, billingYearMonth);
                  const parentLabel = student.parents?.full_name || student.parents?.username || "Chưa cập nhật";

                  return (
                    <tr
                      key={student.id}
                      data-search-key={student.id}
                      data-search-text={`${student.full_name} ${student.class_name || ""} ${parentLabel} ${student.parents?.phone || ""}`}
                    >
                      <TD className="text-center text-muted-foreground">{index + 1}</TD>
                      <TD>
                        <input type="hidden" name="student_id" value={student.id} />
                        <p className="font-medium">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">{student.class_name || "Chưa có lớp"}</p>
                      </TD>
                      <TD>
                        <p>{parentLabel}</p>
                        <p className="text-xs text-muted-foreground">{student.parents?.phone || "Chưa có SĐT"}</p>
                      </TD>
                      <TD className="text-right font-medium">
                        {debtSummary?.currentMonthFee === null || debtSummary?.currentMonthFee === undefined
                          ? "Chưa tính"
                          : formatCurrency(debtSummary.currentMonthFee, currency)}
                      </TD>
                      <TD className={`text-right font-medium ${outstandingDebt ? "text-amber-700" : ""}`}>
                        {outstandingDebt === null ? "Chưa tính" : formatCurrency(outstandingDebt, currency)}
                      </TD>
                      <TD className="text-center align-middle">
                        <input
                          type="checkbox"
                          name={`is_paid_${student.id}`}
                          value="paid"
                          defaultChecked={record?.is_paid || false}
                          aria-label={`Đã nộp học phí - ${student.full_name}`}
                          className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                      </TD>
                      <TD className="text-center align-middle">
                        <input
                          type="checkbox"
                          name={`receipt_sent_${student.id}`}
                          value="sent"
                          defaultChecked={record?.receipt_sent || false}
                          aria-label={`Đã gửi phiếu - ${student.full_name}`}
                          className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                      </TD>
                      <TD>
                        <Input
                          name={`note_${student.id}`}
                          defaultValue={record?.note || ""}
                          placeholder="Ghi chú"
                          aria-label={`Ghi chú - ${student.full_name}`}
                        />
                      </TD>
                    </tr>
                  );
                })}
              </TBody>
            </Table>

            {eligibleStudents.length === 0 ? (
              <div className="border-t py-12 text-center text-sm text-muted-foreground">Chưa có học sinh trong tháng này.</div>
            ) : null}
          </CardContent>
        </Card>

        <div className="sticky bottom-0 flex justify-end border-t bg-white/95 py-3 backdrop-blur-sm">
          <SubmitButton disabled={eligibleStudents.length === 0} pendingText="Đang lưu...">
            <Save className="h-4 w-4" />
            Lưu sổ học phí
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
