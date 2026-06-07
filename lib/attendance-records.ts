import type { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus } from "@/lib/types";

const ATTENDANCE_PAGE_SIZE = 1000;

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type MonthlyAttendanceRecord = {
  student_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  updated_at: string;
};

export async function fetchAllAttendanceRecordsInRange(
  supabase: ServerSupabaseClient,
  start: string,
  end: string,
) {
  const records: MonthlyAttendanceRecord[] = [];

  for (let from = 0; ; from += ATTENDANCE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("attendance_records")
      .select("student_id,attendance_date,status,updated_at")
      .gte("attendance_date", start)
      .lt("attendance_date", end)
      .order("attendance_date")
      .order("student_id")
      .range(from, from + ATTENDANCE_PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Không tải được dữ liệu điểm danh tháng: ${error.message}`);
    }

    const page = (data || []) as MonthlyAttendanceRecord[];
    records.push(...page);

    if (page.length < ATTENDANCE_PAGE_SIZE) {
      return records;
    }
  }
}
