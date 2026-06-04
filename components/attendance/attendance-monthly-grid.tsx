import { Save } from "lucide-react";
import { saveMonthlyAttendanceRegisterAction } from "@/lib/actions/attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { getAttendanceGridSymbol, getAttendanceRegisterTitle, isWeekend } from "@/lib/attendance-grid";
import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/lib/types";

export type AttendanceMonthlyGridRow = {
  rowKey: string;
  index: number;
  fullName: string;
  className: string | null;
  searchText: string;
  statusesByDate: Record<string, AttendanceStatus | undefined>;
};

export function AttendanceMonthlyGrid({
  yearMonth,
  dayDates,
  rows,
  searchTargetId,
  redirectTo,
}: {
  yearMonth: string;
  dayDates: string[];
  rows: AttendanceMonthlyGridRow[];
  searchTargetId: string;
  redirectTo: string;
}) {
  return (
    <Card>
      <CardHeader className="space-y-3 border-b pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sổ theo dõi học sinh</p>
            <CardTitle className="text-lg sm:text-xl">{getAttendanceRegisterTitle(yearMonth)}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground">x</strong> = đi học
            </span>
            <span>
              <strong className="text-foreground">P</strong> = nghỉ có phép
            </span>
            <span>
              <strong className="text-foreground">K</strong> = vắng không phép
            </span>
            <span>Trống = chưa tick</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Chọn ký hiệu trong từng ô rồi bấm lưu sổ điểm danh.</p>
      </CardHeader>
      <CardContent className="p-0">
        <form action={saveMonthlyAttendanceRegisterAction}>
          <input type="hidden" name="year_month" value={yearMonth} />
          <input type="hidden" name="redirect_to" value={redirectTo} />
        <div id={searchTargetId} className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="bg-muted/80 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="sticky left-0 z-20 min-w-[2.5rem] border-b border-r bg-muted/95 px-2 py-2 text-center font-semibold">
                  STT
                </th>
                <th className="sticky left-[2.5rem] z-20 min-w-[9rem] border-b border-r bg-muted/95 px-2 py-2 text-left font-semibold sm:min-w-[11rem]">
                  Họ và tên
                </th>
                <th className="sticky left-[11.5rem] z-20 min-w-[3rem] border-b border-r bg-muted/95 px-1 py-2 text-center font-semibold sm:left-[13.5rem] sm:min-w-[3.5rem]">
                  Lớp
                </th>
                {dayDates.map((date) => {
                  const day = Number(date.slice(8, 10));
                  const weekend = isWeekend(date);
                  return (
                    <th
                      key={date}
                      className={cn(
                        "min-w-[1.75rem] border-b px-0.5 py-2 text-center font-semibold sm:min-w-[2rem]",
                        weekend && "bg-slate-200/80 text-slate-500",
                      )}
                      title={date}
                    >
                      {day}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.rowKey}
                  data-search-key={row.rowKey}
                  data-search-text={row.searchText}
                  className="group border-b last:border-b-0 hover:bg-muted/20"
                >
                  <td className="sticky left-0 z-10 border-r bg-white px-2 py-1.5 text-center text-xs text-muted-foreground group-hover:bg-muted/20">
                    {row.index}
                  </td>
                  <td className="sticky left-[2.5rem] z-10 max-w-[9rem] border-r bg-white px-2 py-1.5 font-medium leading-snug group-hover:bg-muted/20 sm:max-w-[11rem]">
                    {row.fullName}
                  </td>
                  <td className="sticky left-[11.5rem] z-10 border-r bg-white px-1 py-1.5 text-center text-xs group-hover:bg-muted/20 sm:left-[13.5rem]">
                    {row.className || "—"}
                  </td>
                  {dayDates.map((date) => {
                    const status = row.statusesByDate[date];
                    const symbol = getAttendanceGridSymbol(status);
                    const weekend = isWeekend(date);
                    const fieldName = `status_${row.rowKey}_${date}`;
                    return (
                      <td
                        key={date}
                        className={cn(
                          "px-0.5 py-1.5 text-center text-sm font-semibold leading-none",
                          weekend && "bg-slate-100/90 text-slate-400",
                          symbol === "x" && "text-primary",
                          symbol === "P" && "text-amber-700",
                        )}
                      >
                        {status === undefined ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <select
                            name={fieldName}
                            defaultValue={status || "not_marked"}
                            aria-label={`${row.fullName} ${date}`}
                            className={cn(
                              "h-7 w-8 rounded border border-transparent bg-transparent text-center text-sm font-semibold outline-none transition hover:border-slate-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15",
                              symbol === "x" && "text-primary",
                              symbol === "P" && "text-amber-700",
                              symbol === "K" && "text-red-700",
                            )}
                          >
                            <option value="not_marked"></option>
                            <option value="present">x</option>
                            <option value="excused_absent">P</option>
                            <option value="unexcused_absent">K</option>
                          </select>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Không có học sinh trong tháng này.</div>
        ) : null}
        {rows.length > 0 ? (
          <div className="sticky bottom-0 border-t bg-white/95 p-4 backdrop-blur-sm">
            <div className="flex justify-end">
              <SubmitButton pendingText="Đang lưu sổ..." className="w-full sm:w-auto">
                <Save className="h-4 w-4" />
                Lưu sổ điểm danh
              </SubmitButton>
            </div>
          </div>
        ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
