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
import { DEFAULT_ABSENCE_DEDUCTION_AMOUNT, DEFAULT_SATURDAY_PACKAGE_AMOUNT, DEFAULT_WEEKDAY_PACKAGE_AMOUNT } from "@/lib/fees";
import { formatCurrency, getMessageParam } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FeeSettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: settings } = await supabase.from("fee_settings").select("*").order("year_month", { ascending: false });
  const yearMonth = getYearMonth();
  const currentSetting = (settings || []).find((setting) => setting.year_month === yearMonth);

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Cấu hình phí tháng</CardTitle>
          <CardDescription>Phí tháng này = giá gói - số buổi vắng có phép tháng trước * tiền trừ/buổi.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
          </div>
          <form action={upsertFeeSettingAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="year_month">Tháng</Label>
              <Input id="year_month" name="year_month" type="month" defaultValue={yearMonth} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="saturday_package_amount">Gói có thứ 7</Label>
              <Input
                id="saturday_package_amount"
                name="saturday_package_amount"
                type="number"
                min={0}
                defaultValue={currentSetting?.saturday_package_amount ?? DEFAULT_SATURDAY_PACKAGE_AMOUNT}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="weekday_package_amount">Gói không thứ 7</Label>
              <Input
                id="weekday_package_amount"
                name="weekday_package_amount"
                type="number"
                min={0}
                defaultValue={currentSetting?.weekday_package_amount ?? DEFAULT_WEEKDAY_PACKAGE_AMOUNT}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="absence_deduction_amount">Tiền trừ/buổi vắng có phép</Label>
              <Input
                id="absence_deduction_amount"
                name="absence_deduction_amount"
                type="number"
                min={0}
                defaultValue={currentSetting?.absence_deduction_amount ?? DEFAULT_ABSENCE_DEDUCTION_AMOUNT}
                required
              />
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
                <TH>Gói có thứ 7</TH>
                <TH>Gói không thứ 7</TH>
                <TH>Trừ/buổi vắng</TH>
                <TH>Ghi chú</TH>
              </tr>
            </THead>
            <TBody>
              {(settings || []).map((setting) => (
                <tr key={setting.id}>
                  <TD>{setting.year_month}</TD>
                  <TD>{formatCurrency(setting.saturday_package_amount, setting.currency)}</TD>
                  <TD>{formatCurrency(setting.weekday_package_amount, setting.currency)}</TD>
                  <TD>{formatCurrency(setting.absence_deduction_amount, setting.currency)}</TD>
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
