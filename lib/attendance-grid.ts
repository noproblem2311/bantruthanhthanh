import { getMonthBounds, isWeekend } from "@/lib/date";
import type { AttendanceStatus } from "@/lib/types";

export function getDaysInMonth(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

export function getMonthDayDates(yearMonth: string) {
  const daysInMonth = getDaysInMonth(yearMonth);
  const [year, month] = yearMonth.split("-");
  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
}

export function getAttendanceRegisterTitle(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  return `THÁNG: ${month} - ${year}`;
}

/** Sổ điểm danh: có mặt = x, nghỉ có phép = P, còn lại = trống */
export function getAttendanceGridSymbol(status: AttendanceStatus | null | undefined) {
  if (status === "present") return "x";
  if (status === "excused_absent") return "P";
  if (status === "unexcused_absent") return "K";
  return "";
}

export function buildAttendanceStatusMap(
  records: Array<{ student_id: string; attendance_date: string; status: AttendanceStatus }>,
) {
  const map = new Map<string, Map<string, AttendanceStatus>>();

  for (const record of records) {
    const byDate = map.get(record.student_id) || new Map<string, AttendanceStatus>();
    byDate.set(record.attendance_date, record.status);
    map.set(record.student_id, byDate);
  }

  return map;
}

export function getMonthDateRange(yearMonth: string) {
  return getMonthBounds(yearMonth);
}

export { isWeekend };
