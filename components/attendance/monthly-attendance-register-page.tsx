import Link from "next/link";
import { CalendarDays, ChevronLeft } from "lucide-react";
import { AttendanceMonthlyGrid, type AttendanceMonthlyGridRow } from "@/components/attendance/attendance-monthly-grid";
import { Card, CardContent } from "@/components/ui/card";
import { ClientSearch } from "@/components/ui/client-search";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { SubmitButton } from "@/components/ui/submit-button";
import { createClient } from "@/lib/supabase/server";
import { buildAttendanceStatusMap, getMonthDateRange, getMonthDayDates } from "@/lib/attendance-grid";
import { getYearMonth } from "@/lib/date";
import { isStudentEligibleForAttendanceDate } from "@/lib/student-attendance";
import { getMessageParam } from "@/lib/utils";
import type { AttendanceRecord, Student } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type RegisterBasePath = "/admin/attendance/register" | "/manager/attendance/register";
type AttendanceBasePath = "/admin/attendance" | "/manager/attendance";

function getMonthParam(value: string | string[] | undefined) {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value) ? value : getYearMonth();
}

export async function MonthlyAttendanceRegisterPage({
  searchParams,
  basePath,
  attendancePath,
}: {
  searchParams: SearchParams;
  basePath: RegisterBasePath;
  attendancePath: AttendanceBasePath;
}) {
  const params = await searchParams;
  const yearMonth = getMonthParam(params.month);
  const dayDates = getMonthDayDates(yearMonth);
  const { start, end } = getMonthDateRange(yearMonth);
  const searchTargetId = `${basePath.replace(/\//g, "-")}-grid`;
  const supabase = await createClient();

  const [{ data: students }, { data: records }] = await Promise.all([
    supabase.from("students").select("id, full_name, class_name, enrollment_date, created_at, status").eq("status", "active").order("full_name"),
    supabase
      .from("attendance_records")
      .select("student_id, attendance_date, status")
      .gte("attendance_date", start)
      .lt("attendance_date", end),
  ]);

  const statusMap = buildAttendanceStatusMap((records || []) as Pick<AttendanceRecord, "student_id" | "attendance_date" | "status">[]);
  const activeStudents = (students || []) as Pick<Student, "id" | "full_name" | "class_name" | "enrollment_date" | "created_at">[];

  const rows: AttendanceMonthlyGridRow[] = activeStudents.map((student, index) => {
    const studentStatuses = statusMap.get(student.id);
    const statusesByDate: Record<string, AttendanceRecord["status"] | undefined> = {};

    for (const date of dayDates) {
      if (!isStudentEligibleForAttendanceDate(student, date)) {
        statusesByDate[date] = undefined;
        continue;
      }
      statusesByDate[date] = studentStatuses?.get(date) || "not_marked";
    }

    return {
      rowKey: student.id,
      index: index + 1,
      fullName: student.full_name,
      className: student.class_name,
      searchText: `${student.full_name} ${student.class_name || ""}`,
      statusesByDate,
    };
  });

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href={attendancePath}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <ChevronLeft className="h-4 w-4" />
            Quay lại điểm danh ngày
          </Link>
          <h2 className="text-2xl font-semibold">Sổ điểm danh tháng</h2>
          <p className="mt-1 text-sm text-muted-foreground">Xem và chỉnh điểm danh cả tháng dạng bảng giống sổ giấy.</p>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-[180px_1fr_auto] sm:items-end">
          <form className="contents" method="get">
            <div className="grid gap-2">
              <Label htmlFor="month">Tháng</Label>
              <Input id="month" name="month" type="month" defaultValue={yearMonth} />
            </div>
            <ClientSearch
              targetId={searchTargetId}
              placeholder="Tên học sinh, lớp"
              countLabel="dòng"
              className="sm:col-start-2"
            />
            <SubmitButton pendingText="Đang tải..." className="sm:col-start-3">
              <CalendarDays className="h-4 w-4" />
              Xem tháng
            </SubmitButton>
          </form>
        </CardContent>
      </Card>

      <AttendanceMonthlyGrid
        yearMonth={yearMonth}
        dayDates={dayDates}
        rows={rows}
        searchTargetId={searchTargetId}
        redirectTo={`${basePath}?month=${yearMonth}`}
      />
    </div>
  );
}
