import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Save, Trash2 } from "lucide-react";
import { deleteIngredientExpenseAction, saveIngredientExpenseAction } from "@/lib/actions/ingredients";
import { formatVietnamDate, getDateOrVietnamToday, getDayOfWeek, getMonthBounds, getVietnamToday, VIETNAM_TIME_ZONE } from "@/lib/date";
import { formatCurrency, getMessageParam, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import type { IngredientExpense, Profile } from "@/lib/types";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

type SearchParams = Record<string, string | string[] | undefined>;
type IngredientExpenseRow = IngredientExpense & {
  profiles: Pick<Profile, "full_name" | "email"> | null;
};
type CalendarExpenseRow = Pick<IngredientExpense, "id" | "expense_date" | "price">;

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

function buildCalendarStats(rows: CalendarExpenseRow[]) {
  const stats = new Map<string, { count: number; total: number }>();
  for (const row of rows) {
    const current = stats.get(row.expense_date) || { count: 0, total: 0 };
    current.count += 1;
    current.total += row.price;
    stats.set(row.expense_date, current);
  }
  return stats;
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
  const stats = buildCalendarStats(rows);
  const previousMonthDate = addMonths(selectedDate, -1);
  const nextMonthDate = addMonths(selectedDate, 1);
  const monthTotal = rows.reduce((sum, row) => sum + row.price, 0);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <CardTitle className="truncate">Nguyên liệu</CardTitle>
            <p className="mt-1 text-sm font-medium capitalize text-muted-foreground">
              {formatMonthLabel(selectedDate)} · {formatCurrency(monthTotal)}
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
      <CardContent>
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
            const dayStats = stats.get(date);
            const isSelected = date === selectedDate;
            const isToday = date === today;

            return (
              <Link
                key={date}
                href={buildHref(basePath, date)}
                className={cn(
                  "min-h-20 rounded-md border bg-white p-2 text-left transition hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0",
                  isSelected && "border-primary ring-2 ring-primary/20",
                  !isSelected && dayStats && "border-emerald-200 bg-emerald-50",
                  !isSelected && !dayStats && "border-slate-200",
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className={cn("text-sm font-semibold", isToday && "text-primary")}>{day}</span>
                  <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", dayStats ? "bg-emerald-500" : "bg-slate-300")} />
                </div>
                {dayStats ? (
                  <div className="mt-3 space-y-1 text-[11px] leading-tight">
                    <p className="font-medium text-slate-700">{formatCurrency(dayStats.total)}</p>
                    <p className="text-muted-foreground">{dayStats.count} dòng</p>
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ExpenseRowForm({
  row,
  selectedDate,
  redirectTo,
}: {
  row: IngredientExpenseRow;
  selectedDate: string;
  redirectTo: string;
}) {
  const saveFormId = `ingredient-save-${row.id}`;
  const deleteFormId = `ingredient-delete-${row.id}`;

  return (
    <div className="grid gap-3 border-t p-4 md:grid-cols-[1fr_1.35fr_160px_auto_auto] md:items-start">
      <form id={saveFormId} action={saveIngredientExpenseAction} className="contents">
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="expense_date" value={selectedDate} />
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <div className="grid gap-2">
          <Label htmlFor={`ingredient-name-${row.id}`}>Tên nguyên liệu</Label>
          <Input id={`ingredient-name-${row.id}`} name="ingredient_name" defaultValue={row.ingredient_name} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`ingredient-description-${row.id}`}>Mô tả</Label>
          <Textarea
            id={`ingredient-description-${row.id}`}
            name="description"
            defaultValue={row.description || ""}
            className="min-h-10 md:min-h-10"
          />
          <p className="text-xs text-muted-foreground">{row.profiles?.full_name || row.profiles?.email || "Người ghi chưa rõ"}</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`ingredient-price-${row.id}`}>Giá</Label>
          <Input id={`ingredient-price-${row.id}`} name="price" type="number" min={0} step={1000} defaultValue={row.price} required />
        </div>
        <div className="md:pt-7">
          <SubmitButton form={saveFormId} pendingText="Đang lưu..." variant="outline" className="w-full">
            <Save className="h-4 w-4" />
            Lưu
          </SubmitButton>
        </div>
      </form>
      <form id={deleteFormId} action={deleteIngredientExpenseAction} className="md:pt-7">
        <input type="hidden" name="id" value={row.id} />
        <input type="hidden" name="redirect_to" value={redirectTo} />
        <SubmitButton form={deleteFormId} pendingText="Đang xoá..." variant="destructive" className="w-full">
          <Trash2 className="h-4 w-4" />
          Xoá
        </SubmitButton>
      </form>
    </div>
  );
}

function NewExpenseForm({ selectedDate, redirectTo }: { selectedDate: string; redirectTo: string }) {
  return (
    <form action={saveIngredientExpenseAction} className="grid gap-3 border-t bg-slate-50/70 p-4 md:grid-cols-[1fr_1.35fr_160px_auto] md:items-start">
      <input type="hidden" name="expense_date" value={selectedDate} />
      <input type="hidden" name="redirect_to" value={redirectTo} />
      <div className="grid gap-2">
        <Label htmlFor="new-ingredient-name">Tên nguyên liệu</Label>
        <Input id="new-ingredient-name" name="ingredient_name" placeholder="Gạo, thịt, rau..." required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="new-ingredient-description">Mô tả</Label>
        <Textarea id="new-ingredient-description" name="description" placeholder="Số lượng, nơi mua, ghi chú..." className="min-h-10 md:min-h-10" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="new-ingredient-price">Giá</Label>
        <Input id="new-ingredient-price" name="price" type="number" min={0} step={1000} placeholder="0" required />
      </div>
      <div className="md:pt-7">
        <SubmitButton pendingText="Đang thêm..." className="w-full">
          <Plus className="h-4 w-4" />
          Thêm dòng
        </SubmitButton>
      </div>
    </form>
  );
}

function IngredientDayDetail({
  selectedDate,
  rows,
  redirectTo,
}: {
  selectedDate: string;
  rows: IngredientExpenseRow[];
  redirectTo: string;
}) {
  const dayTotal = rows.reduce((sum, row) => sum + row.price, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {formatVietnamDate(selectedDate)} · {formatCurrency(dayTotal)}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <NewExpenseForm selectedDate={selectedDate} redirectTo={redirectTo} />
        <div className="hidden grid-cols-[1fr_1.35fr_160px_auto_auto] gap-3 border-t bg-muted/70 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
          <span>Tên nguyên liệu</span>
          <span>Mô tả</span>
          <span>Giá</span>
          <span></span>
          <span></span>
        </div>
        {rows.map((row) => (
          <ExpenseRowForm key={row.id} row={row} selectedDate={selectedDate} redirectTo={redirectTo} />
        ))}
        {rows.length === 0 ? <div className="border-t p-8 text-center text-sm text-muted-foreground">Chưa có dòng nguyên liệu trong ngày này.</div> : null}
      </CardContent>
    </Card>
  );
}

export async function IngredientExpensesPage({ basePath, params }: { basePath: string; params: SearchParams }) {
  const selectedDate = getDateOrVietnamToday(params.date);
  const monthBounds = getMonthBounds(selectedDate.slice(0, 7));
  const redirectTo = buildRedirectTo(basePath, selectedDate);
  const supabase = await createClient();
  const [{ data: monthRows }, { data: dayRows }] = await Promise.all([
    supabase.from("ingredient_expenses").select("id,expense_date,price").gte("expense_date", monthBounds.start).lt("expense_date", monthBounds.end),
    supabase
      .from("ingredient_expenses")
      .select("*, profiles(full_name,email)")
      .eq("expense_date", selectedDate)
      .order("created_at", { ascending: true }),
  ]);

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
      <IngredientCalendar selectedDate={selectedDate} basePath={basePath} rows={(monthRows || []) as CalendarExpenseRow[]} />
      <IngredientDayDetail selectedDate={selectedDate} rows={(dayRows || []) as IngredientExpenseRow[]} redirectTo={redirectTo} />
    </div>
  );
}
