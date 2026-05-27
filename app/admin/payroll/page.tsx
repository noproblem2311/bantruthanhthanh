import Link from "next/link";
import { Banknote, CalendarDays, Clock3, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { TabLink, Tabs } from "@/components/ui/tabs";
import { StatCard } from "@/components/dashboard/stat-card";
import { createClient } from "@/lib/supabase/server";
import { formatVietnamDate, getDayOfWeek, getMonthBounds, getYearMonth } from "@/lib/date";
import { calculateTeacherPayroll, CLASS_STUDENT_CAP, getPayrollFormulaType } from "@/lib/teacher-payroll";
import { cn, formatCurrency } from "@/lib/utils";
import type { ManagerWorkSession, Profile } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type PayrollTab = "salary" | "work";

type PresentAttendanceRecord = {
  attendance_date: string;
  student_id: string;
};

type PayrollRow = ReturnType<typeof buildPayrollRow>;

type TeacherSummary = {
  profileId: string;
  teacherName: string;
  teacherStatus: string;
  rowCount: number;
  fullDayCount: number;
  morningLunchCount: number;
  afternoonOnlyCount: number;
  dayUnits: number;
  studentCountTotal: number;
  amount: number;
};

type WorkSummary = {
  profile: Profile;
  dayCount: number;
  shiftCount: number;
  fullDayCount: number;
  morningLunchCount: number;
  afternoonOnlyCount: number;
};

const weekdayLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function getMonthParam(value: string | string[] | undefined) {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value) ? value : getYearMonth();
}

function getTabParam(value: string | string[] | undefined): PayrollTab {
  return value === "work" ? "work" : "salary";
}

function parseYearMonth(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  return { year, month };
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatDayUnits(value: number) {
  return Number.isInteger(value) ? String(value) : value.toLocaleString("vi-VN", { maximumFractionDigits: 1 });
}

function buildPayrollHref(tab: PayrollTab, month: string, managerId?: string) {
  const params = new URLSearchParams({ month, tab });
  if (managerId) params.set("manager", managerId);
  return `/admin/payroll?${params.toString()}`;
}

function buildPresentCounts(records: PresentAttendanceRecord[]) {
  const studentsByDate = new Map<string, Set<string>>();

  records.forEach((record) => {
    const studentIds = studentsByDate.get(record.attendance_date) || new Set<string>();
    studentIds.add(record.student_id);
    studentsByDate.set(record.attendance_date, studentIds);
  });

  return new Map(Array.from(studentsByDate.entries()).map(([date, studentIds]) => [date, studentIds.size]));
}

function buildPayrollRow({
  session,
  profile,
  yearMonth,
  presentCount,
}: {
  session: ManagerWorkSession;
  profile: Profile | undefined;
  yearMonth: string;
  presentCount: number;
}) {
  const payroll = calculateTeacherPayroll({
    yearMonth,
    rawStudentCount: presentCount,
    morningWorked: session.morning_worked,
    afternoonWorked: session.afternoon_worked,
  });

  return {
    key: session.id,
    profileId: session.profile_id,
    teacherName: profile?.full_name || "Không rõ giáo viên",
    teacherStatus: profile?.status || "inactive",
    workDate: session.work_date,
    payroll,
  };
}

function buildSummaries(rows: PayrollRow[]) {
  const summaryMap = new Map<string, TeacherSummary>();

  rows.forEach((row) => {
    const current =
      summaryMap.get(row.profileId) ||
      ({
        profileId: row.profileId,
        teacherName: row.teacherName,
        teacherStatus: row.teacherStatus,
        rowCount: 0,
        fullDayCount: 0,
        morningLunchCount: 0,
        afternoonOnlyCount: 0,
        dayUnits: 0,
        studentCountTotal: 0,
        amount: 0,
      } satisfies TeacherSummary);

    current.rowCount += 1;
    current.dayUnits += row.payroll.dayUnits;
    current.studentCountTotal += row.payroll.studentCount;
    current.amount += row.payroll.amount;
    if (row.payroll.shiftType === "full_day") current.fullDayCount += 1;
    if (row.payroll.shiftType === "morning_lunch") current.morningLunchCount += 1;
    if (row.payroll.shiftType === "afternoon_only") current.afternoonOnlyCount += 1;
    summaryMap.set(row.profileId, current);
  });

  return Array.from(summaryMap.values()).sort((a, b) => b.amount - a.amount || a.teacherName.localeCompare(b.teacherName, "vi"));
}

function buildWorkSummaries(managers: Profile[], sessions: ManagerWorkSession[]) {
  const sessionsByProfile = new Map<string, ManagerWorkSession[]>();
  sessions.forEach((session) => {
    const rows = sessionsByProfile.get(session.profile_id) || [];
    rows.push(session);
    sessionsByProfile.set(session.profile_id, rows);
  });

  return managers.map((profile): WorkSummary => {
    const rows = sessionsByProfile.get(profile.id) || [];
    return {
      profile,
      dayCount: rows.length,
      shiftCount: rows.reduce((sum, row) => sum + (row.morning_worked ? 1 : 0) + (row.afternoon_worked ? 1 : 0), 0),
      fullDayCount: rows.filter((row) => row.morning_worked && row.afternoon_worked).length,
      morningLunchCount: rows.filter((row) => row.morning_worked && !row.afternoon_worked).length,
      afternoonOnlyCount: rows.filter((row) => !row.morning_worked && row.afternoon_worked).length,
    };
  });
}

function ReadonlyWorkCalendar({
  yearMonth,
  selectedManager,
  sessions,
}: {
  yearMonth: string;
  selectedManager: Profile | undefined;
  sessions: ManagerWorkSession[];
}) {
  const { year, month } = parseYearMonth(yearMonth);
  const firstDate = formatDate(year, month, 1);
  const firstDay = getDayOfWeek(firstDate);
  const leadingBlankCount = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = getDaysInMonth(year, month);
  const sessionMap = new Map(sessions.map((session) => [session.work_date, session]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch công {selectedManager?.full_name || "giáo viên"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-7 gap-1.5">
          {weekdayLabels.map((label) => (
            <div key={label} className="py-1 text-center text-xs font-semibold text-muted-foreground">
              {label}
            </div>
          ))}
          {Array.from({ length: leadingBlankCount }).map((_, index) => (
            <div key={`blank-${index}`} className="min-h-24 rounded-md border border-transparent" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const date = formatDate(year, month, day);
            const session = sessionMap.get(date);
            const hasShift = Boolean(session?.morning_worked || session?.afternoon_worked);

            return (
              <div
                key={date}
                className={cn(
                  "min-h-24 rounded-md border bg-white p-2",
                  hasShift ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200",
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-1">
                  <span className="text-sm font-semibold">{day}</span>
                  <span className={cn("h-2.5 w-2.5 rounded-full", hasShift ? "bg-emerald-500" : "bg-slate-300")} />
                </div>
                <div className="grid gap-1">
                  {session?.morning_worked ? <Badge variant="info">Sáng+trưa</Badge> : null}
                  {session?.afternoon_worked ? <Badge variant="warning">Chiều 14-17h</Badge> : null}
                  {!hasShift ? <span className="text-xs text-muted-foreground">Không chấm</span> : null}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">Lịch này chỉ để xem, không có thao tác chỉnh sửa tại trang admin.</p>
      </CardContent>
    </Card>
  );
}

export default async function AdminPayrollPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const yearMonth = getMonthParam(params.month);
  const activeTab = getTabParam(params.tab);
  const { start, end } = getMonthBounds(yearMonth);
  const supabase = await createClient();

  const [{ data: sessions }, { data: managers }, { data: presentAttendance }] = await Promise.all([
    supabase.from("manager_work_sessions").select("*").gte("work_date", start).lt("work_date", end).order("work_date", { ascending: true }),
    supabase.from("profiles").select("*").eq("role", "manager").order("full_name"),
    supabase
      .from("attendance_records")
      .select("attendance_date,student_id")
      .eq("status", "present")
      .gte("attendance_date", start)
      .lt("attendance_date", end),
  ]);

  const managerRows = (managers || []) as Profile[];
  const sessionRows = (sessions || []) as ManagerWorkSession[];
  const managerMap = new Map(managerRows.map((manager) => [manager.id, manager]));
  const presentCounts = buildPresentCounts((presentAttendance || []) as PresentAttendanceRecord[]);
  const rows = sessionRows
    .map((session) =>
      buildPayrollRow({
        session,
        profile: managerMap.get(session.profile_id),
        yearMonth,
        presentCount: presentCounts.get(session.work_date) || 0,
      }),
    )
    .sort((a, b) => a.teacherName.localeCompare(b.teacherName, "vi") || a.workDate.localeCompare(b.workDate));
  const summaries = buildSummaries(rows);
  const workSummaries = buildWorkSummaries(managerRows, sessionRows);
  const requestedManagerId = typeof params.manager === "string" ? params.manager : undefined;
  const selectedManager = managerRows.find((manager) => manager.id === requestedManagerId) || managerRows[0];
  const selectedSessions = selectedManager ? sessionRows.filter((session) => session.profile_id === selectedManager.id) : [];
  const formulaType = getPayrollFormulaType(yearMonth);
  const totalAmount = summaries.reduce((sum, row) => sum + row.amount, 0);
  const totalDayUnits = summaries.reduce((sum, row) => sum + row.dayUnits, 0);
  const workedDateCount = new Set(rows.map((row) => row.workDate)).size;
  const averageStudentCount = rows.length
    ? Math.round(rows.reduce((sum, row) => sum + row.payroll.studentCount, 0) / rows.length)
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Công và Lương</h2>
          <p className="mt-1 text-sm text-muted-foreground">Tính từ chấm công giáo viên và số học sinh có mặt theo ngày.</p>
        </div>
        <form className="grid gap-3 sm:grid-cols-[180px_auto] sm:items-end">
          <input type="hidden" name="tab" value={activeTab} />
          {activeTab === "work" && selectedManager ? <input type="hidden" name="manager" value={selectedManager.id} /> : null}
          <div className="grid gap-2">
            <Label htmlFor="month">Tháng</Label>
            <Input id="month" name="month" type="month" defaultValue={yearMonth} />
          </div>
          <SubmitButton pendingText="Đang xem...">Xem tháng</SubmitButton>
        </form>
      </div>

      <Tabs className="max-w-md">
        <TabLink href={buildPayrollHref("salary", yearMonth)} active={activeTab === "salary"}>
          Lương
        </TabLink>
        <TabLink href={buildPayrollHref("work", yearMonth, selectedManager?.id)} active={activeTab === "work"}>
          Công
        </TabLink>
      </Tabs>

      {activeTab === "salary" ? (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <StatCard title="Tổng lương" value={formatCurrency(totalAmount)} icon={Banknote} />
            <StatCard title="Giáo viên có công" value={summaries.length} icon={UsersRound} />
            <StatCard title="Ngày quy đổi" value={formatDayUnits(totalDayUnits)} description={`${workedDateCount} ngày có chấm công`} icon={Clock3} />
            <StatCard title="Học sinh bình quân" value={averageStudentCount} description={`Khung tối đa ${CLASS_STUDENT_CAP} HS`} icon={CalendarDays} />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-md border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">Tháng 5/2026</p>
                <Badge variant={formulaType === "may_2026" ? "success" : "muted"}>{formulaType === "may_2026" ? "Đang áp dụng" : "Không áp dụng"}</Badge>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <p>Cả ngày: 12.000đ x học sinh có mặt</p>
                <p>Sáng + giữ trưa: 8.000đ x học sinh có mặt</p>
                <p>Chiều 14-17h: 4.000đ x học sinh có mặt</p>
              </div>
            </div>
            <div className="rounded-md border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">Từ tháng 6/2026</p>
                <Badge variant={formulaType === "from_june_2026" ? "success" : "muted"}>{formulaType === "from_june_2026" ? "Đang áp dụng" : "Không áp dụng"}</Badge>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <p>Từ 30 học sinh: 375.000đ/ngày</p>
                <p>Dưới 30 học sinh: 240.000đ/ngày</p>
                <p>Một buổi được tính 0.5 ngày</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tổng hợp lương tháng {yearMonth}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="min-w-[940px]">
                <THead>
                  <tr>
                    <TH>Giáo viên</TH>
                    <TH>Công</TH>
                    <TH>Ca</TH>
                    <TH>HS bình quân</TH>
                    <TH>Tổng lương</TH>
                  </tr>
                </THead>
                <TBody>
                  {summaries.map((summary) => (
                    <tr key={summary.profileId}>
                      <TD>
                        <p className="font-medium">{summary.teacherName}</p>
                        {summary.teacherStatus !== "active" ? <p className="mt-1 text-xs text-muted-foreground">Tài khoản không active</p> : null}
                      </TD>
                      <TD>{formatDayUnits(summary.dayUnits)} ngày</TD>
                      <TD>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="success">Cả ngày {summary.fullDayCount}</Badge>
                          <Badge variant="info">Sáng {summary.morningLunchCount}</Badge>
                          <Badge variant="warning">Chiều {summary.afternoonOnlyCount}</Badge>
                        </div>
                      </TD>
                      <TD>{summary.rowCount ? Math.round(summary.studentCountTotal / summary.rowCount) : 0}</TD>
                      <TD className="font-semibold">{formatCurrency(summary.amount)}</TD>
                    </tr>
                  ))}
                </TBody>
              </Table>
              {summaries.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Chưa có chấm công trong tháng này.</div> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chi tiết theo ngày</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="min-w-[1040px]">
                <THead>
                  <tr>
                    <TH>Ngày</TH>
                    <TH>Giáo viên</TH>
                    <TH>Công</TH>
                    <TH>Học sinh</TH>
                    <TH>Công thức</TH>
                    <TH>Tiền</TH>
                  </tr>
                </THead>
                <TBody>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <TD>{formatVietnamDate(row.workDate)}</TD>
                      <TD>{row.teacherName}</TD>
                      <TD>
                        <Badge variant={row.payroll.shiftType === "full_day" ? "success" : row.payroll.shiftType === "morning_lunch" ? "info" : "warning"}>
                          {row.payroll.shiftLabel}
                        </Badge>
                      </TD>
                      <TD>
                        <p>{row.payroll.studentCount} HS tính lương</p>
                        {row.payroll.rawStudentCount > row.payroll.studentCount ? (
                          <p className="text-xs text-muted-foreground">Thực tế {row.payroll.rawStudentCount} HS, áp khung {CLASS_STUDENT_CAP}</p>
                        ) : null}
                      </TD>
                      <TD>{row.payroll.formulaLabel}</TD>
                      <TD className="font-medium">{formatCurrency(row.payroll.amount)}</TD>
                    </tr>
                  ))}
                </TBody>
              </Table>
              {rows.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Không có dòng chi tiết.</div> : null}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách quản lý</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {workSummaries.map((summary) => {
                const isActive = selectedManager?.id === summary.profile.id;
                return (
                  <Link
                    key={summary.profile.id}
                    href={buildPayrollHref("work", yearMonth, summary.profile.id)}
                    className={cn(
                      "block rounded-md border bg-white p-3 transition hover:bg-muted/70",
                      isActive && "border-primary bg-primary/5 ring-2 ring-primary/10",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{summary.profile.full_name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {summary.dayCount} ngày · {summary.shiftCount} buổi
                        </p>
                      </div>
                      <Badge variant={summary.profile.status === "active" ? "success" : "muted"}>
                        {summary.profile.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <Badge variant="success">Cả ngày {summary.fullDayCount}</Badge>
                      <Badge variant="info">Sáng {summary.morningLunchCount}</Badge>
                      <Badge variant="warning">Chiều {summary.afternoonOnlyCount}</Badge>
                    </div>
                  </Link>
                );
              })}
              {workSummaries.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có tài khoản quản lý.</p> : null}
            </CardContent>
          </Card>

          <ReadonlyWorkCalendar yearMonth={yearMonth} selectedManager={selectedManager} sessions={selectedSessions} />
        </div>
      )}
    </div>
  );
}
