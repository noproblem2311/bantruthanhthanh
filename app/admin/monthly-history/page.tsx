import Link from "next/link";
import { Camera, Eye } from "lucide-react";
import { captureMonthlyHistoryAction } from "@/lib/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { formatVietnamDateTime, getYearMonth } from "@/lib/date";
import { formatCurrency, getMessageParam } from "@/lib/utils";
import type { MonthlyHistorySnapshot, Profile } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type SnapshotRow = MonthlyHistorySnapshot & {
  profiles: Pick<Profile, "full_name" | "email"> | null;
};

function formatMoney(value: number | null, currency: string | null) {
  return value === null ? "Chưa tính" : formatCurrency(value, currency || "VND");
}

export default async function MonthlyHistoryPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const billingYearMonth = getYearMonth();
  const { data: snapshots } = await supabase
    .from("monthly_history_snapshots")
    .select("*, profiles(full_name,email)")
    .order("captured_at", { ascending: false });

  const rows = (snapshots || []) as SnapshotRow[];

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Capture lịch sử tháng</CardTitle>
            <CardDescription>Lưu roster học sinh active hiện tại và số buổi nghỉ của tháng trước, không tính Chủ nhật.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={captureMonthlyHistoryAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="billing_year_month">Tháng thu phí</Label>
                <Input id="billing_year_month" name="billing_year_month" type="month" defaultValue={billingYearMonth} required />
                <p className="text-xs text-muted-foreground">Hệ thống tự lấy nghỉ có phép/không phép của tháng liền trước tháng đã chọn.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea id="note" name="note" placeholder="Ví dụ: chốt đầu tháng sau khi kiểm tra điểm danh" />
              </div>
              <SubmitButton pendingText="Đang capture...">
                <Camera className="h-4 w-4" />
                Capture
              </SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lịch sử đã capture</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <tr>
                  <TH>Tháng thu phí</TH>
                  <TH>Tháng nghỉ được trừ</TH>
                  <TH>Sĩ số</TH>
                  <TH>Nghỉ tháng trước</TH>
                  <TH>Tổng thu</TH>
                  <TH>Capture lúc</TH>
                  <TH></TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((snapshot) => (
                  <tr key={snapshot.id}>
                    <TD>
                      <p className="font-medium">{snapshot.billing_year_month}</p>
                      <p className="text-xs text-muted-foreground">{snapshot.profiles?.full_name || "Admin"}</p>
                    </TD>
                    <TD>{snapshot.previous_year_month}</TD>
                    <TD>{snapshot.student_count}</TD>
                    <TD>
                      <p>Có phép: {snapshot.excused_absence_total}</p>
                      <p className="text-xs text-muted-foreground">Không phép: {snapshot.unexcused_absence_total}</p>
                    </TD>
                    <TD>{formatMoney(snapshot.billing_total, snapshot.currency)}</TD>
                    <TD>{formatVietnamDateTime(snapshot.captured_at)}</TD>
                    <TD>
                      <Link className="inline-flex items-center gap-1 font-medium text-primary" href={`/admin/monthly-history/${snapshot.id}`}>
                        <Eye className="h-4 w-4" />
                        Chi tiết
                      </Link>
                    </TD>
                  </tr>
                ))}
              </TBody>
            </Table>
            {rows.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Chưa có lịch sử capture.</div> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
