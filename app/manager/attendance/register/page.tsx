import { MonthlyAttendanceRegisterPage } from "@/components/attendance/monthly-attendance-register-page";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ManagerAttendanceRegisterPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <MonthlyAttendanceRegisterPage
      searchParams={searchParams}
      basePath="/manager/attendance/register"
      attendancePath="/manager/attendance"
    />
  );
}
