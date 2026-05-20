import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { calculateMonthlyFee, getFeeSetting } from "@/lib/fees";
import { getYearMonth } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";
import type { Student } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ParentFeesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const yearMonth = typeof params.month === "string" ? params.month : getYearMonth();
  const supabase = await createClient();
  const { data: children } = await supabase.from("students").select("*").order("full_name");
  const feeSetting = await getFeeSetting(supabase, yearMonth);
  const feeRows = await Promise.all(((children || []) as Student[]).map((child) => calculateMonthlyFee(supabase, child, yearMonth)));
  const total = feeRows.reduce((sum, row) => sum + (row.total_amount || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phí bán trú tháng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="flex max-w-xs items-end gap-2">
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
              <TH>Số buổi có mặt</TH>
              <TH>Đơn giá</TH>
              <TH>Tổng tiền</TH>
              <TH>Ngày có mặt</TH>
            </tr>
          </THead>
          <TBody>
            {feeRows.map((row) => (
              <tr key={row.student.id}>
                <TD>{row.student.full_name}</TD>
                <TD>{row.present_days}</TD>
                <TD>{row.fee_per_attendance_day === null ? "Chưa có" : formatCurrency(row.fee_per_attendance_day)}</TD>
                <TD>{row.total_amount === null ? "Chưa tính" : formatCurrency(row.total_amount)}</TD>
                <TD className="max-w-md text-xs text-muted-foreground">{row.attendance_dates.join(", ") || "Không có"}</TD>
              </tr>
            ))}
          </TBody>
        </Table>
        <div className="rounded-lg bg-primary/10 p-4 text-right">
          <p className="text-sm text-muted-foreground">Tổng phí phụ huynh trong tháng</p>
          <p className="text-2xl font-semibold text-primary">{feeSetting ? formatCurrency(total) : "Chưa tính"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
