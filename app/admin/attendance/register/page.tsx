import { MonthlyAttendanceRegisterPage } from "@/components/attendance/monthly-attendance-register-page";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function AdminAttendanceRegisterPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <MonthlyAttendanceRegisterPage
      searchParams={searchParams}
      basePath="/admin/attendance/register"
      attendancePath="/admin/attendance"
    />
  );
}
