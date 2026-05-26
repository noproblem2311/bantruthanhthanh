import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { calculateMonthlyFee, getFeeSetting } from "@/lib/fees";
import { getMonthBounds, getYearMonth } from "@/lib/date";
import { isStudentEligibleBeforeDate } from "@/lib/student-attendance";
import { formatCurrency } from "@/lib/utils";
import type { Student } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function hasMonthlyAttendance(row: Awaited<ReturnType<typeof calculateMonthlyFee>>) {
  return (
    row.attendance_dates.length > 0 ||
    row.excused_absent_dates.length > 0 ||
    row.unexcused_absent_dates.length > 0 ||
    row.not_marked_dates.length > 0
  );
}

export default async function ParentFeesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const yearMonth = typeof params.month === "string" ? params.month : getYearMonth();
  const { end } = getMonthBounds(yearMonth);
  const supabase = await createClient();
  const { data: children } = await supabase.from("students").select("*").eq("status", "active").order("full_name");
  const feeSetting = await getFeeSetting(supabase, yearMonth);
  const calculatedFees = await Promise.all(((children || []) as Student[]).map((child) => calculateMonthlyFee(supabase, child, yearMonth)));
  const feeRows = calculatedFees.filter((row) => isStudentEligibleBeforeDate(row.student, end) || hasMonthlyAttendance(row));
  const total = feeRows.reduce((sum, row) => sum + (row.total_amount || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phí bán trú tháng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid max-w-xs gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="month">Chọn tháng</Label>
            <Input id="month" name="month" type="month" defaultValue={yearMonth} />
          </div>
          <SubmitButton pendingText="Đang xem...">Xem</SubmitButton>
        </form>
        {!feeSetting ? <Alert variant="warning">Admin chưa cấu hình phí tháng này.</Alert> : null}
        <Table>
          <THead>
            <tr>
              <TH>Học sinh</TH>
              <TH>Gói</TH>
              <TH>Giá gói</TH>
              <TH>Nghỉ tính trừ</TH>
              <TH>Tiền trừ</TH>
              <TH>Tổng tiền</TH>
              <TH>Ngày có mặt thứ 7</TH>
            </tr>
          </THead>
          <TBody>
            {feeRows.map((row) => (
              <tr key={row.student.id}>
                <TD>{row.student.full_name}</TD>
                <TD>{row.package_name}</TD>
                <TD>{row.package_amount === null ? "Chưa có" : formatCurrency(row.package_amount)}</TD>
                <TD>
                  <p>{row.absent_days} ngày</p>
                  <p className="text-xs text-muted-foreground">{row.charged_absent_dates.join(", ") || "Không có"}</p>
                </TD>
                <TD>{row.absence_deduction_total === null ? "Chưa có" : formatCurrency(row.absence_deduction_total)}</TD>
                <TD>{row.total_amount === null ? "Chưa tính" : formatCurrency(row.total_amount)}</TD>
                <TD className="max-w-md text-xs text-muted-foreground">{row.saturday_attendance_dates.join(", ") || "Không có"}</TD>
              </tr>
            ))}
          </TBody>
        </Table>
        <div className="rounded-lg bg-primary/10 p-4 text-left sm:text-right">
          <p className="text-sm text-muted-foreground">Tổng phí phụ huynh trong tháng</p>
          <p className="text-2xl font-semibold text-primary">{feeSetting ? formatCurrency(total) : "Chưa tính"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
