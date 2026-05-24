import { Eye, History, ReceiptText } from "lucide-react";
import { ManualReceiptTable } from "@/components/receipts/manual-receipt-table";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { TabLink, Tabs } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { formatVietnamDateTime, getYearMonth } from "@/lib/date";
import { formatCurrency, getMessageParam } from "@/lib/utils";
import type { MonthlyHistorySnapshot, Profile, ReceiptBatch } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type SnapshotRow = MonthlyHistorySnapshot & {
  profiles: Pick<Profile, "full_name" | "email"> | null;
};
type ReceiptBatchRow = ReceiptBatch & {
  profiles: Pick<Profile, "full_name" | "email"> | null;
};

function formatMoney(value: number | null, currency: string | null) {
  return value === null ? "Chưa tính" : formatCurrency(value, currency || "VND");
}

export default async function AdminReceiptsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const mode = params.mode === "manual" ? "manual" : "history";
  const supabase = await createClient();
  const [{ data: snapshots }, { data: manualBatches }] = await Promise.all([
    supabase.from("monthly_history_snapshots").select("*, profiles(full_name,email)").order("captured_at", { ascending: false }).limit(30),
    supabase.from("receipt_batches").select("*, profiles(full_name,email)").order("created_at", { ascending: false }).limit(20),
  ]);
  const historyRows = (snapshots || []) as SnapshotRow[];
  const batchRows = (manualBatches || []) as ReceiptBatchRow[];

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
      <div>
        <h2 className="text-2xl font-semibold">Phiếu thu</h2>
        <p className="mt-1 text-sm text-muted-foreground">Xuất phiếu thu từ history đã capture hoặc nhập tay từng học sinh.</p>
      </div>

      <Tabs className="max-w-md">
        <TabLink href="/admin/receipts?mode=history" active={mode === "history"}>
          Từ history
        </TabLink>
        <TabLink href="/admin/receipts?mode=manual" active={mode === "manual"}>
          Nhập tay
        </TabLink>
      </Tabs>

      {mode === "history" ? (
        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Xuất từ history đã capture</CardTitle>
              <CardDescription>Chọn snapshot tháng đã chốt, hệ thống tạo 1 file in/PDF gồm toàn bộ học sinh trong snapshot.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action="/print/receipts" className="grid gap-4" target="_blank">
                <input type="hidden" name="source" value="history" />
                <div className="grid gap-2">
                  <Label htmlFor="snapshot-id">Snapshot</Label>
                  <Select id="snapshot-id" name="snapshot_id" required>
                    <option value="">Chọn history</option>
                    {historyRows.map((snapshot) => (
                      <option key={snapshot.id} value={snapshot.id}>
                        {snapshot.billing_year_month} · {snapshot.student_count} HS · {formatMoney(snapshot.billing_total, snapshot.currency)}
                      </option>
                    ))}
                  </Select>
                </div>
                <SubmitButton pendingText="Đang mở phiếu...">
                  <ReceiptText className="h-4 w-4" />
                  Mở phiếu / lưu PDF
                </SubmitButton>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History gần đây</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <THead>
                  <tr>
                    <TH>Tháng</TH>
                    <TH>Sĩ số</TH>
                    <TH>Tổng thu</TH>
                    <TH>Capture</TH>
                    <TH></TH>
                  </tr>
                </THead>
                <TBody>
                  {historyRows.map((snapshot) => (
                    <tr key={snapshot.id}>
                      <TD>
                        <p className="font-medium">{snapshot.billing_year_month}</p>
                        <p className="text-xs text-muted-foreground">Trừ nghỉ tháng {snapshot.previous_year_month}</p>
                      </TD>
                      <TD>{snapshot.student_count}</TD>
                      <TD>{formatMoney(snapshot.billing_total, snapshot.currency)}</TD>
                      <TD>{formatVietnamDateTime(snapshot.captured_at)}</TD>
                      <TD>
                        <ButtonLink href={`/print/receipts?source=history&snapshot_id=${snapshot.id}`} target="_blank" variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                          Mở
                        </ButtonLink>
                      </TD>
                    </tr>
                  ))}
                </TBody>
              </Table>
              {historyRows.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Chưa có history đã capture.</div> : null}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Nhập tay dữ liệu phiếu thu</CardTitle>
              <CardDescription>Nhập mỗi học sinh 1 dòng. Tổng tiền trên phiếu được cộng từ các cột tiền.</CardDescription>
            </CardHeader>
            <CardContent>
              <ManualReceiptTable defaultBillingMonth={getYearMonth()} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Batch nhập tay gần đây</CardTitle>
                <CardDescription>Mở lại các batch đã tạo để in hoặc lưu PDF.</CardDescription>
              </div>
              <form className="grid gap-2 md:w-64">
                <input type="hidden" name="mode" value="manual" />
                <Label htmlFor="month-filter">Tháng hiện tại</Label>
                <Input id="month-filter" type="month" defaultValue={getYearMonth()} disabled />
              </form>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <THead>
                  <tr>
                    <TH>Batch</TH>
                    <TH>Tháng</TH>
                    <TH>Người tạo</TH>
                    <TH>Ngày tạo</TH>
                    <TH></TH>
                  </tr>
                </THead>
                <TBody>
                  {batchRows.map((batch) => (
                    <tr key={batch.id}>
                      <TD>
                        <p className="font-medium">{batch.title}</p>
                        <p className="text-xs text-muted-foreground">{batch.note || "Không có ghi chú"}</p>
                      </TD>
                      <TD>{batch.billing_year_month}</TD>
                      <TD>{batch.profiles?.full_name || batch.profiles?.email || "Admin"}</TD>
                      <TD>{formatVietnamDateTime(batch.created_at)}</TD>
                      <TD>
                        <ButtonLink href={`/print/receipts?source=manual&batch_id=${batch.id}`} target="_blank" variant="outline" size="sm">
                          <History className="h-4 w-4" />
                          Mở
                        </ButtonLink>
                      </TD>
                    </tr>
                  ))}
                </TBody>
              </Table>
              {batchRows.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Chưa có batch nhập tay.</div> : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
