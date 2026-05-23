import { ArrowLeft, CalendarMinus, CreditCard, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageMessage } from "@/components/ui/message";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatVietnamDate, formatVietnamDateTime } from "@/lib/date";
import { boardingPackageLabels, statusLabels } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, getMessageParam } from "@/lib/utils";
import type { BoardingPackageType, MonthlyHistorySnapshot, MonthlyHistoryStudent, Profile, RecordStatus } from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type SnapshotRow = MonthlyHistorySnapshot & {
  profiles: Pick<Profile, "full_name" | "email"> | null;
};

function formatMoney(value: number | null, currency: string | null) {
  return value === null ? "Chưa tính" : formatCurrency(value, currency || "VND");
}

function toDateArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function formatDateList(value: unknown) {
  const dates = toDateArray(value);
  return dates.length > 0 ? dates.map(formatVietnamDate).join(", ") : "Không có";
}

export default async function MonthlyHistoryDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [{ data: snapshot }, { data: students }] = await Promise.all([
    supabase.from("monthly_history_snapshots").select("*, profiles(full_name,email)").eq("id", id).single(),
    supabase.from("monthly_history_students").select("*").eq("snapshot_id", id).order("student_full_name"),
  ]);

  if (!snapshot) return <PageMessage error="Không tìm thấy lịch sử capture" />;

  const history = snapshot as SnapshotRow;
  const rows = (students || []) as MonthlyHistoryStudent[];
  const csvRows = [
    ["Hoc sinh", "Phu huynh", "Lop", "Goi", "Nghi co phep", "Ngay nghi co phep", "Nghi khong phep", "Ngay nghi khong phep", "So tien"],
    ...rows.map((row) => [
      row.student_full_name,
      row.parent_full_name || row.parent_username || "",
      row.class_name || "",
      boardingPackageLabels[row.boarding_package_type],
      String(row.excused_absent_count),
      toDateArray(row.excused_absent_dates).join("; "),
      String(row.unexcused_absent_count),
      toDateArray(row.unexcused_absent_dates).join("; "),
      row.billing_amount === null ? "" : String(row.billing_amount),
    ]),
  ];
  const csv = csvRows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Chi tiết lịch sử {history.billing_year_month}</h2>
          <p className="text-sm text-muted-foreground">
            Capture lúc {formatVietnamDateTime(history.captured_at)} bởi {history.profiles?.full_name || "Admin"}.
          </p>
        </div>
        <ButtonLink href="/admin/monthly-history" variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </ButtonLink>
      </div>

      <PageMessage success={getMessageParam(query, "success")} error={getMessageParam(query, "error")} />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Sĩ số đã capture" value={history.student_count} icon={UsersRound} />
        <StatCard title={`Nghỉ có phép ${history.previous_year_month}`} value={history.excused_absence_total} icon={CalendarMinus} />
        <StatCard title={`Nghỉ không phép ${history.previous_year_month}`} value={history.unexcused_absence_total} icon={CalendarMinus} />
        <StatCard title="Tổng thu dự kiến" value={formatMoney(history.billing_total, history.currency)} icon={CreditCard} />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Thông tin chốt tháng</CardTitle>
            <CardDescription>
              Phí tháng {history.billing_year_month} trừ số buổi nghỉ có phép của tháng {history.previous_year_month}, không tính Chủ nhật.
            </CardDescription>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${csv}`)}`}
            download={`lich-su-ban-tru-${history.billing_year_month}.csv`}
            className="inline-flex min-h-10 w-full items-center justify-center rounded-md border bg-white px-4 py-2 text-center text-sm font-medium transition hover:bg-muted/70 sm:w-auto"
          >
            Export CSV
          </a>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Gói có thứ 7</p>
            <p className="font-medium">{formatMoney(history.saturday_package_amount, history.currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gói không thứ 7</p>
            <p className="font-medium">{formatMoney(history.weekday_package_amount, history.currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Trừ mỗi buổi có phép</p>
            <p className="font-medium">{formatMoney(history.absence_deduction_amount, history.currency)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tổng tiền đã trừ</p>
            <p className="font-medium">{formatMoney(history.excused_deduction_total, history.currency)}</p>
          </div>
          {history.note ? <div className="md:col-span-2 xl:col-span-4">Ghi chú: {history.note}</div> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách học sinh trong snapshot</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <tr>
                <TH>Học sinh</TH>
                <TH>Phụ huynh</TH>
                <TH>Gói</TH>
                <TH>Nghỉ có phép</TH>
                <TH>Nghỉ không phép</TH>
                <TH>Phí tháng</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <TD>
                    <p className="font-medium">{row.student_full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.school_name || "Chưa có trường"} · {row.class_name || "Chưa có lớp"}
                    </p>
                    <Badge className="mt-2" variant={row.student_status === "active" ? "success" : "muted"}>
                      {statusLabels[row.student_status as RecordStatus]}
                    </Badge>
                  </TD>
                  <TD>
                    <p>{row.parent_full_name || row.parent_username || "Chưa có PH"}</p>
                    <p className="text-xs text-muted-foreground">{row.parent_phone || "Chưa có SĐT"}</p>
                  </TD>
                  <TD>
                    <p>{boardingPackageLabels[row.boarding_package_type as BoardingPackageType]}</p>
                    <p className="text-xs text-muted-foreground">{formatMoney(row.package_amount, history.currency)}</p>
                  </TD>
                  <TD>
                    <p className="font-medium">{row.excused_absent_count}</p>
                    <p className="max-w-xs text-xs text-muted-foreground">{formatDateList(row.excused_absent_dates)}</p>
                  </TD>
                  <TD>
                    <p className="font-medium">{row.unexcused_absent_count}</p>
                    <p className="max-w-xs text-xs text-muted-foreground">{formatDateList(row.unexcused_absent_dates)}</p>
                  </TD>
                  <TD>{formatMoney(row.billing_amount, history.currency)}</TD>
                </tr>
              ))}
            </TBody>
          </Table>
          {rows.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Snapshot này chưa có học sinh.</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
