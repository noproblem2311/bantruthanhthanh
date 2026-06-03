import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}: {
  yearMonth: string;
  dayDates: string[];
  rows: AttendanceMonthlyGridRow[];
  searchTargetId: string;
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
            <span>Trống = chưa tick / vắng không phép</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Chỉ xem — không chỉnh sửa trên sổ này.</p>
      </CardHeader>
      <CardContent className="p-0">
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
                        {symbol}
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
      </CardContent>
    </Card>
  );
}
