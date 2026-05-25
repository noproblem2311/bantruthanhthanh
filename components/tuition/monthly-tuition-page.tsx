import { CreditCard, ReceiptText, Save, UsersRound } from "lucide-react";
import { saveMonthlyTuitionRecordsAction } from "@/lib/actions/admin";
import { Alert } from "@/components/ui/alert";
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
import { formatVietnamDateTime, getYearMonth } from "@/lib/date";
import { getMessageParam } from "@/lib/utils";
import type { MonthlyHistorySnapshot, MonthlyHistoryStudent, MonthlyTuitionRecord, Parent, Student } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type TuitionBasePath = "/admin/tuition" | "/manager/tuition";
type StudentWithParent = Student & {
  parents: Pick<Parent, "id" | "full_name" | "username" | "phone"> | null;
};

type TuitionPageRow = {
  key: string;
  studentId: string | null;
  fullName: string;
  className: string | null;
  parentName: string | null;
  parentUsername: string | null;
  parentPhone: string | null;
  isPaid: boolean;
  receiptSent: boolean;
  note: string;
  updatedAt: string | null;
  source: "history" | "active" | "saved";
};

function getMonthParam(value: string | string[] | undefined) {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value) ? value : getYearMonth();
}

function buildHistoryRows(historyStudents: MonthlyHistoryStudent[], recordsByStudent: Map<string, MonthlyTuitionRecord>) {
  return historyStudents.map((student): TuitionPageRow => {
    const record = student.student_id ? recordsByStudent.get(student.student_id) : undefined;
    return {
      key: student.student_id || student.id,
      studentId: student.student_id,
      fullName: student.student_full_name,
      className: student.class_name,
      parentName: student.parent_full_name,
      parentUsername: student.parent_username,
      parentPhone: student.parent_phone,
      isPaid: record?.is_paid || false,
      receiptSent: record?.receipt_sent || false,
      note: record?.note || "",
      updatedAt: record?.updated_at || null,
      source: "history",
    };
  });
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
      source: "active",
    };
  });
}

function buildSavedOnlyRows(records: MonthlyTuitionRecord[], rosterStudentIds: Set<string>, studentsById: Map<string, StudentWithParent>) {
  return records
    .filter((record) => !rosterStudentIds.has(record.student_id))
    .map((record): TuitionPageRow => {
      const student = studentsById.get(record.student_id);
      return {
        key: record.id,
        studentId: record.student_id,
        fullName: student?.full_name || "Không tìm thấy học sinh",
        className: student?.class_name || null,
        parentName: student?.parents?.full_name || null,
        parentUsername: student?.parents?.username || null,
        parentPhone: student?.parents?.phone || null,
        isPaid: record.is_paid,
        receiptSent: record.receipt_sent,
        note: record.note || "",
        updatedAt: record.updated_at,
        source: "saved",
      };
    });
}

export async function MonthlyTuitionPage({ searchParams, basePath }: { searchParams: SearchParams; basePath: TuitionBasePath }) {
  const params = await searchParams;
  const billingYearMonth = getMonthParam(params.month);
  const supabase = await createClient();

  const [{ data: latestSnapshot }, { data: tuitionRecords }] = await Promise.all([
    supabase
      .from("monthly_history_snapshots")
      .select("*")
      .eq("billing_year_month", billingYearMonth)
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("monthly_tuition_records").select("*").eq("billing_year_month", billingYearMonth).order("updated_at", { ascending: false }),
  ]);

  const snapshot = (latestSnapshot || null) as MonthlyHistorySnapshot | null;
  const records = (tuitionRecords || []) as MonthlyTuitionRecord[];
  const recordsByStudent = new Map(records.map((record) => [record.student_id, record]));

  let rows: TuitionPageRow[] = [];
  if (snapshot) {
    const { data: historyStudents } = await supabase
      .from("monthly_history_students")
      .select("*")
      .eq("snapshot_id", snapshot.id)
      .order("student_full_name");
    rows = buildHistoryRows((historyStudents || []) as MonthlyHistoryStudent[], recordsByStudent);
  } else {
    const { data: students } = await supabase
      .from("students")
      .select("*, parents(id,full_name,username,phone)")
      .eq("status", "active")
      .order("full_name");
    rows = buildActiveRows((students || []) as StudentWithParent[], recordsByStudent);
  }

  const rosterStudentIds = new Set(rows.map((row) => row.studentId).filter((studentId): studentId is string => Boolean(studentId)));
  const savedOnlyStudentIds = records.map((record) => record.student_id).filter((studentId) => !rosterStudentIds.has(studentId));
  let savedOnlyStudentsById = new Map<string, StudentWithParent>();
  if (savedOnlyStudentIds.length > 0) {
    const { data: savedOnlyStudents } = await supabase
      .from("students")
      .select("*, parents(id,full_name,username,phone)")
      .in("id", savedOnlyStudentIds);
    savedOnlyStudentsById = new Map(((savedOnlyStudents || []) as StudentWithParent[]).map((student) => [student.id, student]));
  }
  rows = [...rows, ...buildSavedOnlyRows(records, rosterStudentIds, savedOnlyStudentsById)];

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

      {snapshot ? (
        <Alert variant="info">Đang dùng danh sách học sinh từ history capture lúc {formatVietnamDateTime(snapshot.captured_at)}.</Alert>
      ) : (
        <Alert variant="warning">Tháng này chưa có history capture, hệ thống đang dùng danh sách học sinh active hiện tại.</Alert>
      )}

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
            <Table className="min-w-[1040px]">
              <THead>
                <tr>
                  <TH>Học sinh</TH>
                  <TH>Phụ huynh</TH>
                  <TH>Trạng thái</TH>
                  <TH>Gửi phiếu</TH>
                  <TH>Ghi chú</TH>
                  <TH>Cập nhật</TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <TD>
                      {row.studentId ? <input type="hidden" name="student_id" value={row.studentId} /> : null}
                      <p className="font-medium">{row.fullName}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Badge variant="muted">{row.className || "Chưa có lớp"}</Badge>
                        {row.source === "saved" ? <Badge variant="info">Đã lưu riêng</Badge> : null}
                      </div>
                    </TD>
                    <TD>
                      <p className="font-medium">{row.parentName || row.parentUsername || "Chưa cập nhật"}</p>
                      <p className="text-xs text-muted-foreground">{row.parentPhone || "Chưa có SĐT"}</p>
                    </TD>
                    <TD>
                      {row.studentId ? (
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
                      ) : (
                        <Badge variant={row.isPaid ? "success" : "warning"}>{row.isPaid ? "Đã nộp" : "Chưa nộp"}</Badge>
                      )}
                    </TD>
                    <TD>
                      {row.studentId ? (
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
                      ) : (
                        <Badge variant={row.receiptSent ? "success" : "warning"}>{row.receiptSent ? "Đã gửi" : "Chưa gửi"}</Badge>
                      )}
                    </TD>
                    <TD>
                      {row.studentId ? (
                        <Textarea
                          name={`note_${row.studentId}`}
                          defaultValue={row.note}
                          className="min-h-12 resize-y"
                          placeholder="Ghi chú"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">{row.note || "Không có"}</p>
                      )}
                    </TD>
                    <TD className="text-sm text-muted-foreground">{row.updatedAt ? formatVietnamDateTime(row.updatedAt) : "Chưa lưu"}</TD>
                  </tr>
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
