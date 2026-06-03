import { Pencil, RotateCcw, Save, UserCheck, UserMinus, UserX } from "lucide-react";
import { Fragment } from "react";
import { saveAttendanceBatchAction, updateAttendanceStudentInfoAction } from "@/lib/actions/attendance";
import { formatVietnamDate } from "@/lib/date";
import { attendanceBadgeVariant, attendanceLabels, boardingPackageOptions } from "@/lib/labels";
import type { AttendanceRecord, AttendanceStatus, Student } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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

const statusOptions: Array<{ value: AttendanceStatus; label: string; icon: typeof UserCheck; className: string }> = [
  { value: "present", label: "Có mặt", icon: UserCheck, className: "has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-50" },
  { value: "excused_absent", label: "Có phép", icon: UserMinus, className: "has-[:checked]:border-sky-400 has-[:checked]:bg-sky-50" },
  { value: "unexcused_absent", label: "Không phép", icon: UserX, className: "has-[:checked]:border-red-400 has-[:checked]:bg-red-50" },
  { value: "not_marked", label: "Chưa", icon: RotateCcw, className: "has-[:checked]:border-slate-400 has-[:checked]:bg-slate-50" },
];

function AttendanceHiddenFields({ date, redirectTo }: { date: string; redirectTo: string }) {
  return (
    <>
      <input type="hidden" name="attendance_date" value={date} />
      <input type="hidden" name="redirect_to" value={redirectTo} />
    </>
  );
}

function AttendanceActions({ formId }: { formId: string }) {
  return (
    <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
      <SelectAllPresentButton formId={formId} />
      <SubmitButton name="intent" value="save_attendance" pendingText="Đang lưu..." className="w-full sm:w-auto">
        <Save className="h-4 w-4" />
        Lưu điểm danh
      </SubmitButton>
    </div>
  );
}

function StatusChoices({ studentId, status, compact = false }: { studentId: string; status: AttendanceStatus; compact?: boolean }) {
  return (
    <div className={compact ? "grid grid-cols-2 gap-2" : "grid gap-2 lg:grid-cols-4"}>
      {statusOptions.map((option) => {
        const Icon = option.icon;
        return (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 ${option.className}`}
          >
            <input
              type="radio"
              name={`status_${studentId}`}
              value={option.value}
              defaultChecked={status === option.value}
              data-status-value={option.value}
              data-current-status={status}
              className="h-4 w-4 shrink-0 accent-primary"
            />
            <Icon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function PackageSelect({ student }: { student: AttendanceStudent }) {
  return (
    <Select name={`package_${student.id}`} defaultValue={student.boarding_package_type || "weekday"} className="bg-white">
      {boardingPackageOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

function StudentEditForms({ students, redirectTo }: { students: AttendanceStudent[]; redirectTo: string }) {
  const uniqueStudents = Array.from(new Map(students.map((student) => [student.id, student])).values());

  return (
    <>
      {uniqueStudents.map((student) => (
        <form key={student.id} id={`attendance-student-edit-${student.id}`} action={updateAttendanceStudentInfoAction}>
          <input type="hidden" name="student_id" value={student.id} />
          <input type="hidden" name="redirect_to" value={redirectTo} />
        </form>
      ))}
    </>
  );
}

function StudentEditDialog({ student }: { student: AttendanceStudent }) {
  const formId = `attendance-student-edit-${student.id}`;

  return (
    <Dialog
      title={`Sửa ${student.full_name}`}
      trigger={
        <Button type="button" variant="outline" size="sm" className="shrink-0">
          <Pencil className="h-4 w-4" />
          Sửa
        </Button>
      }
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`full_name_${student.id}`}>Tên học sinh</Label>
          <Input id={`full_name_${student.id}`} form={formId} name="full_name" defaultValue={student.full_name} required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`class_name_${student.id}`}>Lớp</Label>
            <Input id={`class_name_${student.id}`} form={formId} name="class_name" defaultValue={student.class_name || ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`school_name_${student.id}`}>Trường</Label>
            <Input id={`school_name_${student.id}`} form={formId} name="school_name" defaultValue={student.school_name || ""} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`enrollment_date_${student.id}`}>Ngày vào</Label>
            <Input id={`enrollment_date_${student.id}`} form={formId} name="enrollment_date" type="date" defaultValue={student.enrollment_date || ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`boarding_package_type_${student.id}`}>Gói bán trú</Label>
            <Select id={`boarding_package_type_${student.id}`} form={formId} name="boarding_package_type" defaultValue={student.boarding_package_type || "weekday"}>
              {boardingPackageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <SubmitButton form={formId} pendingText="Đang lưu..." className="w-full sm:w-auto">
            <Save className="h-4 w-4" />
            Lưu
          </SubmitButton>
        </div>
      </div>
    </Dialog>
  );
}

export function AttendanceTable({
  date,
  students,
  records,
  approvedOffStudentIds,
  redirectTo,
  searchTargetId,
  groupMarkedStudents = false,
  title = "Điểm danh",
}: {
  date: string;
  students: AttendanceStudent[];
  records: AttendanceRecord[];
  approvedOffStudentIds: Set<string>;
  redirectTo: string;
  searchTargetId: string;
  groupMarkedStudents?: boolean;
  title?: string;
}) {
  const recordMap = new Map(records.map((record) => [record.student_id, record]));
  const formId = `attendance-batch-${date}`;
  const mobileFormId = `${formId}-mobile`;
  const desktopFormId = `${formId}-desktop`;
  const savedRecordCount = records.length;

  function getStudentRecordKey(studentId: string, record: AttendanceRecord | undefined) {
    return `${date}-${studentId}-${record?.updated_at || record?.marked_at || "empty"}`;
  }

  function getStatus(studentId: string) {
    return (recordMap.get(studentId)?.status || "not_marked") as AttendanceStatus;
  }

  const studentGroups = groupMarkedStudents
    ? [
        { label: "Chưa điểm danh", students: students.filter((student) => getStatus(student.id) === "not_marked") },
        { label: "Đã điểm danh", students: students.filter((student) => getStatus(student.id) !== "not_marked") },
      ]
    : [{ label: "", students }];

  return (
    <div id={searchTargetId}>
      <StudentEditForms students={students} redirectTo={redirectTo} />
      <Card className="md:hidden">
        <form id={mobileFormId} action={saveAttendanceBatchAction}>
          <AttendanceHiddenFields date={date} redirectTo={redirectTo} />
          <CardHeader className="space-y-3">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                Ngày {formatVietnamDate(date)}. Đã tải {savedRecordCount} bản ghi đã lưu.
              </CardDescription>
            </div>
            <AttendanceActions formId={mobileFormId} />
          </CardHeader>
          <CardContent className="space-y-3">
            {studentGroups.map((group) => (
              <Fragment key={group.label || "all"}>
                {groupMarkedStudents ? <div className="rounded-md bg-muted/70 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">{group.label} ({group.students.length})</div> : null}
                {group.students.map((student) => {
                  const record = recordMap.get(student.id);
                  const status = getStatus(student.id);
                  const hasApprovedOff = approvedOffStudentIds.has(student.id);

                  return (
                    <div
                      key={getStudentRecordKey(student.id, record)}
                      className="rounded-lg border bg-white p-3"
                      data-search-key={student.id}
                      data-search-text={`${student.full_name} ${student.class_name || ""} ${student.parents?.full_name || ""} ${student.parents?.username || ""} ${student.parents?.phone || ""}`}
                      data-filter-status={status}
                    >
                      <input type="hidden" name="student_id" value={student.id} />
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium">{student.full_name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {student.class_name || "Chưa có lớp"} · {student.parents?.full_name || student.parents?.username || "Chưa có PH"}
                            </p>
                            {student.parents?.phone ? <p className="text-xs text-muted-foreground">{student.parents.phone}</p> : null}
                          </div>
                          <div className="grid shrink-0 justify-items-end gap-2">
                            <Badge variant={attendanceBadgeVariant(status)}>{attendanceLabels[status]}</Badge>
                            <StudentEditDialog student={student} />
                          </div>
                        </div>
                        {hasApprovedOff ? <Badge variant="info">Đã xin nghỉ</Badge> : null}
                        <PackageSelect student={student} />
                        <StatusChoices studentId={student.id} status={status} compact />
                        <Textarea name={`note_${student.id}`} defaultValue={record?.note || ""} className="min-h-16" placeholder="Ghi chú ngắn" />
                      </div>
                    </div>
                  );
                })}
              </Fragment>
            ))}
            {students.length === 0 ? <div className="p-4 text-center text-sm text-muted-foreground">Không có học sinh phù hợp.</div> : null}
            {students.length > 0 ? (
              <div className="border-t pt-4">
                <AttendanceActions formId={mobileFormId} />
              </div>
            ) : null}
          </CardContent>
        </form>
      </Card>

      <Card className="hidden md:block">
        <form id={desktopFormId} action={saveAttendanceBatchAction}>
          <AttendanceHiddenFields date={date} redirectTo={redirectTo} />
        <CardHeader className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Ngày {formatVietnamDate(date)}. Đã tải {savedRecordCount} bản ghi đã lưu. Chỉ “Có mặt” mới được tính phí.
            </CardDescription>
          </div>
          <AttendanceActions formId={desktopFormId} />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <tr>
                <TH>Học sinh</TH>
                <TH>Hiện tại</TH>
                <TH>Gói bán trú</TH>
                <TH>Chọn trạng thái</TH>
                <TH>Ghi chú</TH>
              </tr>
            </THead>
            <TBody>
              {studentGroups.map((group) => (
                <Fragment key={group.label || "all"}>
                  {groupMarkedStudents ? (
                    <tr className="bg-muted/70">
                      <TD colSpan={5} className="py-2 text-xs font-semibold uppercase text-muted-foreground">
                        {group.label} ({group.students.length})
                      </TD>
                    </tr>
                  ) : null}
                  {group.students.map((student) => {
                    const record = recordMap.get(student.id);
                    const status = getStatus(student.id);
                    const hasApprovedOff = approvedOffStudentIds.has(student.id);

                    return (
                      <tr
                        key={getStudentRecordKey(student.id, record)}
                        className="bg-white"
                        data-search-key={student.id}
                        data-search-text={`${student.full_name} ${student.class_name || ""} ${student.parents?.full_name || ""} ${student.parents?.username || ""} ${student.parents?.phone || ""}`}
                        data-filter-status={status}
                      >
                        <TD>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium">{student.full_name}</p>
                              <StudentEditDialog student={student} />
                            </div>
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
                        <TD className="min-w-[180px]">
                          <PackageSelect student={student} />
                        </TD>
                        <TD className="min-w-[440px]">
                          <input type="hidden" name="student_id" value={student.id} />
                          <StatusChoices studentId={student.id} status={status} />
                        </TD>
                        <TD className="min-w-[220px]">
                          <Textarea name={`note_${student.id}`} defaultValue={record?.note || ""} className="min-h-16" placeholder="Ghi chú ngắn" />
                        </TD>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
            </TBody>
          </Table>
          {students.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Không có học sinh phù hợp.</div> : null}
          {students.length > 0 ? (
            <div className="border-t bg-white p-4">
              <AttendanceActions formId={desktopFormId} />
            </div>
          ) : null}
        </CardContent>
      </form>
    </Card>
    </div>
  );
}
