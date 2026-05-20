import { attendanceBadgeVariant, attendanceLabels } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatVietnamDate, getMonthBounds, getYearMonth } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ParentAttendancePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const yearMonth = typeof params.month === "string" ? params.month : getYearMonth();
  const { start, end } = getMonthBounds(yearMonth);
  const supabase = await createClient();
  const { data: children } = await supabase.from("students").select("*").order("full_name");
  const childIds = (children || []).map((child) => child.id);
  const { data: records } = childIds.length
    ? await supabase
        .from("attendance_records")
        .select("*, students(full_name)")
        .gte("attendance_date", start)
        .lt("attendance_date", end)
        .in("student_id", childIds)
        .order("attendance_date", { ascending: false })
    : { data: [] };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử điểm danh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid max-w-xs gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="month">Chọn tháng</Label>
            <Input id="month" name="month" type="month" defaultValue={yearMonth} />
          </div>
          <SubmitButton pendingText="Đang xem...">Xem</SubmitButton>
        </form>
        <Table>
          <THead>
            <tr>
              <TH>Ngày</TH>
              <TH>Học sinh</TH>
              <TH>Trạng thái</TH>
              <TH>Ghi chú</TH>
            </tr>
          </THead>
          <TBody>
            {(records || []).map((record) => (
              <tr key={record.id}>
                <TD>{formatVietnamDate(record.attendance_date)}</TD>
                <TD>{record.students?.full_name}</TD>
                <TD>
                  <Badge variant={attendanceBadgeVariant(record.status)}>{attendanceLabels[record.status]}</Badge>
                </TD>
                <TD>{record.note || "Không có"}</TD>
              </tr>
            ))}
          </TBody>
        </Table>
        {(records || []).length === 0 ? <p className="text-sm text-muted-foreground">Chưa có dữ liệu điểm danh trong tháng này.</p> : null}
      </CardContent>
    </Card>
  );
}
