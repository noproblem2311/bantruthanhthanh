import { RotateCcw, Save, UserCheck, UserMinus, UserX } from "lucide-react";
import { saveAttendanceBatchAction } from "@/lib/actions/attendance";
import { formatVietnamDate } from "@/lib/date";
import { attendanceBadgeVariant, attendanceLabels } from "@/lib/labels";
import type { AttendanceRecord, AttendanceStatus, Student } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { SelectAllPresentButton } from "./select-all-present-button";

export type AttendanceStudent = Student & {
  parents?: {
    full_name: string | null;
    username: string;
    phone: string | null;
  } | null;
};

export function AttendanceTable({
  date,
  students,
  records,
  approvedOffStudentIds,
  redirectTo,
  title = "Điểm danh",
}: {
  date: string;
  students: AttendanceStudent[];
  records: AttendanceRecord[];
  approvedOffStudentIds: Set<string>;
  redirectTo: string;
  title?: string;
}) {
  const recordMap = new Map(records.map((record) => [record.student_id, record]));
  const formId = `attendance-batch-${date}`;
  const statusOptions: Array<{ value: AttendanceStatus; label: string; icon: typeof UserCheck; className: string }> = [
    { value: "present", label: "Có mặt", icon: UserCheck, className: "has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-50" },
    { value: "excused_absent", label: "Có phép", icon: UserMinus, className: "has-[:checked]:border-sky-400 has-[:checked]:bg-sky-50" },
    { value: "unexcused_absent", label: "Không phép", icon: UserX, className: "has-[:checked]:border-red-400 has-[:checked]:bg-red-50" },
    { value: "not_marked", label: "Chưa", icon: RotateCcw, className: "has-[:checked]:border-slate-400 has-[:checked]:bg-slate-50" },
  ];

  return (
    <Card>
      <form id={formId} action={saveAttendanceBatchAction}>
        <input type="hidden" name="attendance_date" value={date} />
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <CardHeader className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Ngày {formatVietnamDate(date)}. Chọn trạng thái cho từng học sinh, sau đó lưu một lần. Chỉ “Có mặt” mới được tính phí.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <SelectAllPresentButton formId={formId} />
            <SubmitButton pendingText="Đang lưu...">
              <Save className="h-4 w-4" />
              Lưu điểm danh
            </SubmitButton>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <tr>
                <TH>Học sinh</TH>
                <TH>Hiện tại</TH>
                <TH>Chọn trạng thái</TH>
                <TH>Ghi chú</TH>
              </tr>
            </THead>
            <TBody>
              {students.map((student) => {
                const record = recordMap.get(student.id);
                const status = (record?.status || "not_marked") as AttendanceStatus;
                const hasApprovedOff = approvedOffStudentIds.has(student.id);

                return (
                  <tr key={student.id} className="bg-white">
                    <TD>
                      <div className="space-y-1">
                        <p className="font-medium">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.class_name || "Chưa có lớp"} · {student.parents?.full_name || student.parents?.username || "Chưa có PH"}
                          {student.parents?.phone ? ` · ${student.parents.phone}` : ""}
                        </p>
                        {hasApprovedOff ? <Badge variant="info">Đã xin nghỉ</Badge> : null}
                      </div>
                    </TD>
                    <TD>
                      <Badge variant={attendanceBadgeVariant(status)}>{attendanceLabels[status]}</Badge>
                    </TD>
                    <TD className="min-w-[440px]">
                      <input type="hidden" name="student_id" value={student.id} />
                      <div className="grid gap-2 sm:grid-cols-4">
                        {statusOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <label
                              key={option.value}
                              className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 ${option.className}`}
                            >
                              <input
                                type="radio"
                                name={`status_${student.id}`}
                                value={option.value}
                                defaultChecked={status === option.value}
                                data-status-value={option.value}
                                data-current-status={status}
                                className="h-4 w-4 accent-primary"
                              />
                              <Icon className="h-4 w-4" />
                              {option.label}
                            </label>
                          );
                        })}
                      </div>
                    </TD>
                    <TD className="min-w-[220px]">
                      <Textarea name={`note_${student.id}`} defaultValue={record?.note || ""} className="min-h-16" placeholder="Ghi chú ngắn" />
                    </TD>
                  </tr>
                );
              })}
            </TBody>
          </Table>
          {students.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Không có học sinh phù hợp.</div> : null}
          {students.length > 0 ? (
            <div className="flex justify-end border-t bg-white p-4">
              <SubmitButton pendingText="Đang lưu...">
                <Save className="h-4 w-4" />
                Lưu điểm danh
              </SubmitButton>
            </div>
          ) : null}
        </CardContent>
      </form>
    </Card>
  );
}
