import { AttendanceCalendar, type AttendanceCalendarRecord, type AttendanceCalendarOffRequest } from "@/components/attendance/attendance-calendar";
import { AttendanceFilterCard } from "@/components/attendance/attendance-filter-card";
import { AttendanceTable, type AttendanceStudent } from "@/components/attendance/attendance-table";
import { PageMessage } from "@/components/ui/message";
import { createClient } from "@/lib/supabase/server";
import { getDateOrVietnamToday, getMonthBounds } from "@/lib/date";
import { getMessageParam } from "@/lib/utils";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function buildRedirectTo(date: string, status: string) {
  const params = new URLSearchParams();
  params.set("date", date);
  if (status && status !== "all") params.set("status", status);
  return `/manager/attendance?${params.toString()}`;
}

export default async function ManagerAttendancePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const date = getDateOrVietnamToday(params.date);
  const status = typeof params.status === "string" ? params.status : "all";
  const errorMessage = getMessageParam(params, "error");
  const monthBounds = getMonthBounds(date.slice(0, 7));
  const supabase = await createClient();

  const [{ data: students }, { data: records }, { data: offRequests }, { data: monthRecords }, { data: monthOffRequests }] = await Promise.all([
    supabase.from("students").select("*, parents(full_name,username,phone)").eq("status", "active").order("full_name"),
    supabase.from("attendance_records").select("*").eq("attendance_date", date),
    supabase.from("off_requests").select("student_id").eq("off_date", date).in("status", ["auto_approved", "approved"]),
    supabase.from("attendance_records").select("attendance_date,status").gte("attendance_date", monthBounds.start).lt("attendance_date", monthBounds.end),
    supabase
      .from("off_requests")
      .select("off_date,student_id")
      .gte("off_date", monthBounds.start)
      .lt("off_date", monthBounds.end)
      .in("status", ["auto_approved", "approved"]),
  ]);

  const activeStudents = (students || []) as AttendanceStudent[];
  const recordMap = new Map(((records || []) as AttendanceRecord[]).map((record) => [record.student_id, record]));
  const approvedOffStudentIds = new Set((offRequests || []).map((request: { student_id: string }) => request.student_id));
  const filtered = activeStudents.filter((student) => {
    const currentStatus = (recordMap.get(student.id)?.status || "not_marked") as AttendanceStatus;
    return status === "all" || currentStatus === status;
  });
  const redirectTo = buildRedirectTo(date, status);
  const searchTargetId = "manager-attendance-results";

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={errorMessage} />
      <AttendanceCalendar
        selectedDate={date}
        basePath="/manager/attendance"
        activeStudentCount={activeStudents.length}
        records={(monthRecords || []) as AttendanceCalendarRecord[]}
        approvedOffRequests={(monthOffRequests || []) as AttendanceCalendarOffRequest[]}
        q=""
        status={status}
      />
      <AttendanceFilterCard date={date} status={status} searchTargetId={searchTargetId} />
      <AttendanceTable
        date={date}
        students={filtered}
        records={(records || []) as AttendanceRecord[]}
        approvedOffStudentIds={approvedOffStudentIds}
        redirectTo={redirectTo}
        searchTargetId={searchTargetId}
      />
    </div>
  );
}
