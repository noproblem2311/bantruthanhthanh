import { upsertFeeSettingAction } from "@/lib/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { getYearMonth } from "@/lib/date";
import { formatCurrency, getMessageParam } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FeeSettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: settings } = await supabase.from("fee_settings").select("*").order("year_month", { ascending: false });

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình phí tháng</CardTitle>
          <CardDescription>Phí = số buổi có mặt * đơn giá tháng.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
          </div>
          <form action={upsertFeeSettingAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="year_month">Tháng</Label>
              <Input id="year_month" name="year_month" type="month" defaultValue={getYearMonth()} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fee_per_attendance_day">Đơn giá/buổi</Label>
              <Input id="fee_per_attendance_day" name="fee_per_attendance_day" type="number" min={0} defaultValue={80000} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Tiền tệ</Label>
              <Input id="currency" name="currency" defaultValue="VND" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Textarea id="note" name="note" />
            </div>
            <SubmitButton>Lưu cấu hình</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách tháng đã cấu hình</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <tr>
                <TH>Tháng</TH>
                <TH>Đơn giá</TH>
                <TH>Ghi chú</TH>
              </tr>
            </THead>
            <TBody>
              {(settings || []).map((setting) => (
                <tr key={setting.id}>
                  <TD>{setting.year_month}</TD>
                  <TD>{formatCurrency(setting.fee_per_attendance_day, setting.currency)}</TD>
                  <TD>{setting.note || "Không có"}</TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
