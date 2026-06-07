import Link from "next/link";
import { connection } from "next/server";
import { BookOpen } from "lucide-react";
import { AttendanceCalendar, type AttendanceCalendarRecord, type AttendanceCalendarOffRequest } from "@/components/attendance/attendance-calendar";
import { AttendanceFilterCard } from "@/components/attendance/attendance-filter-card";
import { AttendanceTable, type AttendanceStudent } from "@/components/attendance/attendance-table";
import { PageMessage } from "@/components/ui/message";
import { fetchAllAttendanceRecordsInRange } from "@/lib/attendance-records";
import { createClient } from "@/lib/supabase/server";
import { getDateOrVietnamToday, getMonthBounds } from "@/lib/date";
import { isStudentEligibleForAttendanceDate } from "@/lib/student-attendance";
import { getMessageParam } from "@/lib/utils";
import type { AttendanceRecord } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function buildRedirectTo(date: string) {
  const params = new URLSearchParams();
  params.set("date", date);
  return `/manager/attendance?${params.toString()}`;
}

export default async function ManagerAttendancePage({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const params = await searchParams;
  const date = getDateOrVietnamToday(params.date);
  const errorMessage = getMessageParam(params, "error");
  const monthBounds = getMonthBounds(date.slice(0, 7));
  const supabase = await createClient();

  const [{ data: students }, { data: records }, { data: offRequests }, monthRecords, { data: monthOffRequests }] = await Promise.all([
    supabase.from("students").select("*, parents(full_name,username,phone)").eq("status", "active").order("full_name"),
    supabase.from("attendance_records").select("*").eq("attendance_date", date),
    supabase.from("off_requests").select("student_id").eq("off_date", date).in("status", ["auto_approved", "approved"]),
    fetchAllAttendanceRecordsInRange(supabase, monthBounds.start, monthBounds.end),
    supabase
      .from("off_requests")
      .select("off_date,student_id")
      .gte("off_date", monthBounds.start)
      .lt("off_date", monthBounds.end)
      .in("status", ["auto_approved", "approved"]),
  ]);

  const activeStudents = (students || []) as AttendanceStudent[];
  const currentRecords = (records || []) as AttendanceRecord[];
  const eligibleStudents = activeStudents.filter((student) => isStudentEligibleForAttendanceDate(student, date));
  const eligibleStudentIds = eligibleStudents.map((student) => student.id);
  const eligibleStudentIdSet = new Set(eligibleStudentIds);
  const activeRecords = currentRecords.filter((record) => eligibleStudentIdSet.has(record.student_id));
  const approvedOffStudentIds = new Set(
    (offRequests || [])
      .filter((request: { student_id: string }) => eligibleStudentIdSet.has(request.student_id))
      .map((request: { student_id: string }) => request.student_id),
  );
  const redirectTo = buildRedirectTo(date);
  const searchTargetId = "manager-attendance-results";

  const registerMonth = date.slice(0, 7);
  const monthVersion = monthRecords.reduce(
    (latest: string, record: { updated_at: string }) => (record.updated_at > latest ? record.updated_at : latest),
    "",
  );

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={errorMessage} />
      <div className="flex justify-end">
        <Link
          href={`/manager/attendance/register?month=${registerMonth}&refresh=${encodeURIComponent(monthVersion)}`}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted/60"
        >
          <BookOpen className="h-4 w-4" />
          Sổ điểm danh tháng
        </Link>
      </div>
      <AttendanceCalendar
        selectedDate={date}
        basePath="/manager/attendance"
        activeStudents={activeStudents}
        records={monthRecords as AttendanceCalendarRecord[]}
        approvedOffRequests={(monthOffRequests || []) as AttendanceCalendarOffRequest[]}
        refreshKey={monthVersion}
        q=""
        status="all"
      />
      <AttendanceFilterCard date={date} searchTargetId={searchTargetId} />
      <AttendanceTable
        date={date}
        students={eligibleStudents}
        records={activeRecords}
        approvedOffStudentIds={approvedOffStudentIds}
        redirectTo={redirectTo}
        searchTargetId={searchTargetId}
        groupMarkedStudents
      />
    </div>
  );
}
