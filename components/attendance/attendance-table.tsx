import { RotateCcw, UserCheck, UserMinus, UserX, Users } from "lucide-react";
import { bulkMarkPresentAction, markAttendanceAction } from "@/lib/actions/attendance";
import { attendanceBadgeVariant, attendanceLabels } from "@/lib/labels";
import type { AttendanceRecord, AttendanceStatus, Student } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

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

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Chỉ trạng thái có mặt mới được tính phí bán trú.</CardDescription>
        </div>
        <form action={bulkMarkPresentAction}>
          <input type="hidden" name="attendance_date" value={date} />
          <input type="hidden" name="redirect_to" value={redirectTo} />
          <SubmitButton variant="secondary" pendingText="Đang bulk...">
            <Users className="h-4 w-4" />
            Tất cả chưa xử lý có mặt
          </SubmitButton>
        </form>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <THead>
            <tr>
              <TH>Học sinh</TH>
              <TH>Trạng thái</TH>
              <TH>Ghi chú</TH>
              <TH>Thao tác</TH>
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
                  <TD className="min-w-[220px]">
                    <form id={`attendance-${student.id}`} action={markAttendanceAction} className="grid gap-2">
                      <input type="hidden" name="student_id" value={student.id} />
                      <input type="hidden" name="attendance_date" value={date} />
                      <input type="hidden" name="redirect_to" value={redirectTo} />
                      <Textarea name="note" defaultValue={record?.note || ""} className="min-h-16" placeholder="Ghi chú ngắn" />
                    </form>
                  </TD>
                  <TD>
                    <div className="flex min-w-[360px] flex-wrap gap-2">
                      <SubmitButton form={`attendance-${student.id}`} name="status" value="present" size="sm" pendingText="Lưu...">
                        <UserCheck className="h-4 w-4" />
                        Có mặt
                      </SubmitButton>
                      <SubmitButton
                        form={`attendance-${student.id}`}
                        name="status"
                        value="excused_absent"
                        size="sm"
                        variant="secondary"
                        pendingText="Lưu..."
                      >
                        <UserMinus className="h-4 w-4" />
                        Có phép
                      </SubmitButton>
                      <SubmitButton
                        form={`attendance-${student.id}`}
                        name="status"
                        value="unexcused_absent"
                        size="sm"
                        variant="destructive"
                        pendingText="Lưu..."
                      >
                        <UserX className="h-4 w-4" />
                        Không phép
                      </SubmitButton>
                      <SubmitButton
                        form={`attendance-${student.id}`}
                        name="status"
                        value="not_marked"
                        size="sm"
                        variant="outline"
                        pendingText="Lưu..."
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </SubmitButton>
                    </div>
                  </TD>
                </tr>
              );
            })}
          </TBody>
        </Table>
        {students.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Không có học sinh phù hợp.</div> : null}
      </CardContent>
    </Card>
  );
}
