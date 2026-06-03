import { CalendarDays, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { saveIngredientDayNoteAction } from "@/lib/actions/ingredients";
import { getDateOrVietnamToday, getDayOfWeek, getMonthBounds, getVietnamToday, VIETNAM_TIME_ZONE } from "@/lib/date";
import { getMessageParam, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type { IngredientExpense } from "@/lib/types";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageMessage } from "@/components/ui/message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

type SearchParams = Record<string, string | string[] | undefined>;
type CalendarExpenseRow = Pick<IngredientExpense, "id" | "expense_date" | "ingredient_name" | "description" | "created_at">;

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

function buildHref(basePath: string, date: string) {
  return `${basePath}?date=${encodeURIComponent(date)}`;
}

function buildRedirectTo(basePath: string, date: string) {
  return buildHref(basePath, date);
}

function buildCalendarNotes(rows: CalendarExpenseRow[]) {
  const notes = new Map<string, string>();
  for (const row of rows) {
    const text = row.description?.trim() || (row.ingredient_name === "Nguyên liệu" ? "" : row.ingredient_name.trim());
    if (!text) continue;
    const current = notes.get(row.expense_date);
    notes.set(row.expense_date, current ? `${current}\n${text}` : text);
  }
  return notes;
}

function IngredientCalendar({
  selectedDate,
  basePath,
  rows,
}: {
  selectedDate: string;
  basePath: string;
  rows: CalendarExpenseRow[];
}) {
  const { year, month } = parseYearMonth(selectedDate);
  const daysInMonth = getDaysInMonth(year, month);
  const firstDate = formatDate(year, month, 1);
  const firstDay = getDayOfWeek(firstDate);
  const leadingBlankCount = firstDay === 0 ? 6 : firstDay - 1;
  const today = getVietnamToday();
  const notes = buildCalendarNotes(rows);
  const previousMonthDate = addMonths(selectedDate, -1);
  const nextMonthDate = addMonths(selectedDate, 1);
  const filledDayCount = notes.size;
  const redirectTo = buildRedirectTo(basePath, selectedDate);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <CardTitle className="truncate">Nguyên liệu</CardTitle>
            <p className="mt-1 text-sm font-medium capitalize text-muted-foreground">
              {formatMonthLabel(selectedDate)} · {filledDayCount} ngày đã ghi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink href={buildHref(basePath, previousMonthDate)} variant="outline" size="icon" aria-label="Tháng trước">
            <ChevronLeft className="h-5 w-5" />
          </ButtonLink>
          <ButtonLink href={buildHref(basePath, today)} variant="outline" size="sm">
            Hôm nay
          </ButtonLink>
          <ButtonLink href={buildHref(basePath, nextMonthDate)} variant="outline" size="icon" aria-label="Tháng sau">
            <ChevronRight className="h-5 w-5" />
          </ButtonLink>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-3 sm:p-4">
        <div className="grid min-w-[980px] grid-cols-7 gap-2">
          {weekdayLabels.map((label) => (
            <div key={label} className="rounded-md bg-muted/70 py-2 text-center text-xs font-semibold text-muted-foreground">
              {label}
            </div>
          ))}
          {Array.from({ length: leadingBlankCount }).map((_, index) => (
            <div key={`blank-${index}`} className="min-h-40 rounded-md border border-transparent lg:min-h-48" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const date = formatDate(year, month, day);
            const note = notes.get(date) || "";
            const isSelected = date === selectedDate;
            const isToday = date === today;

            return (
              <form
                key={date}
                action={saveIngredientDayNoteAction}
                className={cn(
                  "flex min-h-40 flex-col rounded-md border bg-white p-2 text-left lg:min-h-48",
                  isSelected && "border-primary ring-2 ring-primary/20",
                  !isSelected && note && "border-emerald-200 bg-emerald-50/70",
                  !isSelected && !note && "border-slate-200",
                )}
              >
                <input type="hidden" name="expense_date" value={date} />
                <input type="hidden" name="redirect_to" value={redirectTo} />
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={cn("text-sm font-semibold", isToday && "text-primary")}>{day}</span>
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", note ? "bg-emerald-500" : "bg-slate-300")} />
                </div>
                <Textarea
                  name="note"
                  defaultValue={note}
                  placeholder="Nguyên liệu..."
                  className="min-h-24 flex-1 resize-none bg-white/90 text-xs leading-snug lg:min-h-32"
                />
                <SubmitButton pendingText="Lưu..." size="sm" variant="outline" className="mt-2 w-full">
                  <Save className="h-3.5 w-3.5" />
                  Lưu
                </SubmitButton>
              </form>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export async function IngredientExpensesPage({ basePath, params }: { basePath: string; params: SearchParams }) {
  const selectedDate = getDateOrVietnamToday(params.date);
  const monthBounds = getMonthBounds(selectedDate.slice(0, 7));
  const supabase = await createClient();
  const { data: monthRows } = await supabase
    .from("ingredient_expenses")
    .select("id,expense_date,ingredient_name,description,created_at")
    .gte("expense_date", monthBounds.start)
    .lt("expense_date", monthBounds.end)
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
      <IngredientCalendar selectedDate={selectedDate} basePath={basePath} rows={(monthRows || []) as CalendarExpenseRow[]} />
    </div>
  );
}
