import { CalendarClock, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { saveManagerTimekeepingAction } from "@/lib/actions/timekeeping";
import { formatVietnamDate, getDateOrVietnamToday, getDayOfWeek, getMonthBounds, getVietnamToday, VIETNAM_TIME_ZONE } from "@/lib/date";
import { requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { cn, getMessageParam } from "@/lib/utils";
import type { ManagerWorkSession } from "@/lib/types";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageMessage } from "@/components/ui/message";
import { SubmitButton } from "@/components/ui/submit-button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

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

function buildHref(date: string) {
  return `/manager/timekeeping?date=${encodeURIComponent(date)}`;
}

function ShiftCheckbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex min-h-8 cursor-pointer items-center justify-between gap-1 rounded-md border bg-white px-1.5 text-[10px] font-medium transition hover:bg-muted/70 sm:px-2 sm:text-xs">
      <span className="truncate">{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 shrink-0 accent-primary" />
    </label>
  );
}

export default async function ManagerTimekeepingPage({ searchParams }: { searchParams: SearchParams }) {
  const [profile, params] = await Promise.all([requireRole("manager"), searchParams]);
  const selectedDate = getDateOrVietnamToday(params.date);
  const { year, month } = parseYearMonth(selectedDate);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDate = formatDate(year, month, 1);
  const firstDay = getDayOfWeek(firstDate);
  const leadingBlankCount = firstDay === 0 ? 6 : firstDay - 1;
  const monthBounds = getMonthBounds(selectedDate.slice(0, 7));
  const today = getVietnamToday();
  const supabase = await createClient();
  const { data } = await supabase
    .from("manager_work_sessions")
    .select("*")
    .eq("profile_id", profile.id)
    .gte("work_date", monthBounds.start)
    .lt("work_date", monthBounds.end);
  const sessionMap = new Map(((data || []) as ManagerWorkSession[]).map((session) => [session.work_date, session]));
  const workedDayCount = sessionMap.size;
  const workedShiftCount = Array.from(sessionMap.values()).reduce(
    (sum, session) => sum + (session.morning_worked ? 1 : 0) + (session.afternoon_worked ? 1 : 0),
    0,
  );
  const previousMonthDate = addMonths(selectedDate, -1);
  const nextMonthDate = addMonths(selectedDate, 1);
  const yearMonth = selectedDate.slice(0, 7);

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <CalendarClock className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <CardTitle className="truncate">Chấm công giáo viên</CardTitle>
              <p className="mt-1 text-sm font-medium capitalize text-muted-foreground">
                {formatMonthLabel(selectedDate)} · {workedDayCount} ngày · {workedShiftCount} buổi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ButtonLink href={buildHref(previousMonthDate)} variant="outline" size="icon" aria-label="Tháng trước">
              <ChevronLeft className="h-5 w-5" />
            </ButtonLink>
            <ButtonLink href={buildHref(today)} variant="outline" size="sm">
              Hôm nay
            </ButtonLink>
            <ButtonLink href={buildHref(nextMonthDate)} variant="outline" size="icon" aria-label="Tháng sau">
              <ChevronRight className="h-5 w-5" />
            </ButtonLink>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="info">
            Chỉ tick vào buổi mình làm. Buổi không làm thì để trống, không cần chọn gì.
          </Alert>

          <form action={saveManagerTimekeepingAction} className="space-y-4">
            <input type="hidden" name="year_month" value={yearMonth} />
            <input type="hidden" name="redirect_to" value={buildHref(selectedDate)} />

            <div className="grid grid-cols-7 gap-1.5">
              {weekdayLabels.map((label) => (
                <div key={label} className="py-1 text-center text-xs font-semibold text-muted-foreground">
                  {label}
                </div>
              ))}
              {Array.from({ length: leadingBlankCount }).map((_, index) => (
                <div key={`blank-${index}`} className="min-h-28 rounded-md border border-transparent" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const date = formatDate(year, month, day);
                const session = sessionMap.get(date);
                const isToday = date === today;
                const hasShift = Boolean(session?.morning_worked || session?.afternoon_worked);

                return (
                  <div
                    key={date}
                    className={cn(
                      "min-h-28 rounded-md border bg-white p-1.5 sm:p-2",
                      hasShift && "border-emerald-200 bg-emerald-50/70",
                      isToday && "ring-2 ring-primary/20",
                    )}
                  >
                    <input type="hidden" name="work_date" value={date} />
                    <div className="mb-2 flex items-start justify-between gap-1">
                      <span className={cn("text-sm font-semibold", isToday && "text-primary")}>{day}</span>
                      {isToday ? <span className="rounded bg-primary/10 px-1 text-[9px] font-semibold text-primary sm:text-[10px]">Nay</span> : null}
                    </div>
                    <div className="grid gap-1.5">
                      <ShiftCheckbox name={`morning_${date}`} label="Sáng+trưa" defaultChecked={Boolean(session?.morning_worked)} />
                      <ShiftCheckbox name={`afternoon_${date}`} label="Chiều 14-17h" defaultChecked={Boolean(session?.afternoon_worked)} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 rounded-md border bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Đang chấm công tháng {yearMonth}. Dữ liệu hiện có: {workedDayCount} ngày, {workedShiftCount} buổi.
              </p>
              <SubmitButton pendingText="Đang lưu..." className="sm:w-auto">
                <Save className="h-4 w-4" />
                Lưu chấm công
              </SubmitButton>
            </div>
          </form>

          <p className="text-xs text-muted-foreground">Hôm nay: {formatVietnamDate(today)}.</p>
        </CardContent>
      </Card>
    </div>
  );
}
