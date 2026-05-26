import Link from "next/link";
import { CalendarCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VIETNAM_TIME_ZONE, getDayOfWeek, getVietnamToday } from "@/lib/date";
import { getStudentAttendanceStartDate } from "@/lib/student-attendance";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/lib/types";

export type AttendanceCalendarRecord = {
  student_id: string;
  attendance_date: string;
  status: AttendanceStatus;
};

export type AttendanceCalendarOffRequest = {
  off_date: string;
  student_id: string;
};

export type AttendanceCalendarStudent = {
  id: string;
  created_at: string;
};

type DayStats = {
  touchedStudentIds: Set<string>;
  markedStudentIds: Set<string>;
  notMarkedStudentIds: Set<string>;
  presentStudentIds: Set<string>;
  approvedOffStudentIds: Set<string>;
};

const weekdayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function parseYearMonth(date: string) {
  const [year, month] = date.slice(0, 7).split("-").map(Number);
  return { year, month };
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addMonths(date: string, amount: number) {
  const { year, month } = parseYearMonth(date);
  const value = new Date(Date.UTC(year, month - 1 + amount, 1));
  return formatDate(value.getUTCFullYear(), value.getUTCMonth() + 1, 1);
}

function formatMonthLabel(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VIETNAM_TIME_ZONE,
    month: "long",
    year: "numeric",
  }).format(new Date(`${date.slice(0, 7)}-01T00:00:00+07:00`));
}

function buildHref(basePath: string, date: string, q: string, status: string) {
  const params = new URLSearchParams({ date });
  if (q) params.set("q", q);
  if (status && status !== "all") params.set("status", status);
  return `${basePath}?${params.toString()}`;
}

function getInitialStats(): DayStats {
  return {
    touchedStudentIds: new Set(),
    markedStudentIds: new Set(),
    notMarkedStudentIds: new Set(),
    presentStudentIds: new Set(),
    approvedOffStudentIds: new Set(),
  };
}

function getDayState(stats: DayStats | undefined, eligibleStudentCount: number) {
  if (!stats) return "none";
  const coveredStudentIds = new Set([...stats.markedStudentIds, ...stats.approvedOffStudentIds]);
  if (eligibleStudentCount > 0 && coveredStudentIds.size >= eligibleStudentCount && stats.notMarkedStudentIds.size === 0) return "complete";
  if (stats.touchedStudentIds.size > 0 || stats.approvedOffStudentIds.size > 0) return "partial";
  return "none";
}

export function AttendanceCalendar({
  selectedDate,
  basePath,
  activeStudents,
  records,
  approvedOffRequests,
  q = "",
  status = "all",
}: {
  selectedDate: string;
  basePath: string;
  activeStudents: AttendanceCalendarStudent[];
  records: AttendanceCalendarRecord[];
  approvedOffRequests: AttendanceCalendarOffRequest[];
  q?: string;
  status?: string;
}) {
  const { year, month } = parseYearMonth(selectedDate);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDate = formatDate(year, month, 1);
  const firstDay = getDayOfWeek(firstDate);
  const leadingBlankCount = firstDay === 0 ? 6 : firstDay - 1;
  const today = getVietnamToday();
  const activeStudentStartDates = new Map(activeStudents.map((student) => [student.id, getStudentAttendanceStartDate(student)]));
  const activeStudentIdSet = new Set(activeStudents.map((student) => student.id));
  const statsByDate = new Map<string, DayStats>();

  function getEligibleStudentCount(date: string, stats: DayStats | undefined) {
    const eligibleStudentIds = new Set<string>();
    activeStudentStartDates.forEach((startDate, studentId) => {
      if (startDate <= date) eligibleStudentIds.add(studentId);
    });
    stats?.touchedStudentIds.forEach((studentId) => eligibleStudentIds.add(studentId));
    stats?.approvedOffStudentIds.forEach((studentId) => eligibleStudentIds.add(studentId));
    return eligibleStudentIds.size;
  }

  records.forEach((record) => {
    if (!activeStudentIdSet.has(record.student_id)) return;

    const stats = statsByDate.get(record.attendance_date) || getInitialStats();
    stats.touchedStudentIds.add(record.student_id);
    if (record.status === "not_marked") {
      stats.notMarkedStudentIds.add(record.student_id);
    } else {
      stats.markedStudentIds.add(record.student_id);
    }
    if (record.status === "present") {
      stats.presentStudentIds.add(record.student_id);
    }
    statsByDate.set(record.attendance_date, stats);
  });

  approvedOffRequests.forEach((request) => {
    if (!activeStudentIdSet.has(request.student_id)) return;

    const stats = statsByDate.get(request.off_date) || getInitialStats();
    stats.approvedOffStudentIds.add(request.student_id);
    statsByDate.set(request.off_date, stats);
  });

  const previousMonthDate = addMonths(selectedDate, -1);
  const nextMonthDate = addMonths(selectedDate, 1);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <CalendarCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <CardTitle className="truncate">Lịch điểm danh</CardTitle>
            <p className="mt-1 text-sm font-medium capitalize text-muted-foreground">{formatMonthLabel(selectedDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={buildHref(basePath, previousMonthDate, q, status)}
            aria-label="Tháng trước"
            className="grid h-10 w-10 place-items-center rounded-md border bg-white transition hover:-translate-y-0.5 hover:bg-muted/70 hover:shadow-sm active:translate-y-0"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <Link
            href={buildHref(basePath, today, q, status)}
            className="inline-flex min-h-10 items-center justify-center rounded-md border bg-white px-3 text-sm font-medium transition hover:-translate-y-0.5 hover:bg-muted/70 hover:shadow-sm active:translate-y-0"
          >
            Hôm nay
          </Link>
          <Link
            href={buildHref(basePath, nextMonthDate, q, status)}
            aria-label="Tháng sau"
            className="grid h-10 w-10 place-items-center rounded-md border bg-white transition hover:-translate-y-0.5 hover:bg-muted/70 hover:shadow-sm active:translate-y-0"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-xs font-medium text-muted-foreground sm:flex sm:flex-wrap sm:items-center">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Đã điểm danh
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Đang điểm danh
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            Chưa điểm danh
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {weekdayLabels.map((label) => (
            <div key={label} className="py-1 text-center text-xs font-semibold text-muted-foreground">
              {label}
            </div>
          ))}
          {Array.from({ length: leadingBlankCount }).map((_, index) => (
            <div key={`blank-${index}`} className="min-h-20 rounded-md border border-transparent" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const date = formatDate(year, month, day);
            const stats = statsByDate.get(date);
            const state = getDayState(stats, getEligibleStudentCount(date, stats));
            const isSelected = date === selectedDate;
            const isToday = date === today;
            const stateLabel = state === "complete" ? "Đã" : state === "partial" ? "Đang" : "Chưa";

            return (
              <Link
                key={date}
                href={buildHref(basePath, date, q, status)}
                aria-label={`${date}: ${stateLabel} điểm danh, ${stats?.presentStudentIds.size || 0} học sinh có mặt`}
                className={cn(
                  "min-h-20 rounded-md border bg-white p-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0",
                  isSelected && "border-primary ring-2 ring-primary/20",
                  !isSelected && state === "complete" && "border-emerald-200 bg-emerald-50",
                  !isSelected && state === "partial" && "border-amber-200 bg-amber-50",
                  !isSelected && state === "none" && "border-slate-200",
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className={cn("text-sm font-semibold", isToday && "text-primary")}>{day}</span>
                  <span
                    className={cn(
                      "h-2.5 w-2.5 shrink-0 rounded-full",
                      state === "complete" && "bg-emerald-500",
                      state === "partial" && "bg-amber-500",
                      state === "none" && "bg-slate-300",
                    )}
                  />
                </div>
                <div className="mt-3 space-y-1 text-[11px] leading-tight">
                  <p className="font-medium text-slate-700">{stateLabel}</p>
                  {state !== "none" ? (
                    <p className="text-muted-foreground">
                      {stats?.presentStudentIds.size || 0}
                      <span className="hidden sm:inline"> có mặt</span>
                      <span className="sm:hidden"> HS</span>
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
