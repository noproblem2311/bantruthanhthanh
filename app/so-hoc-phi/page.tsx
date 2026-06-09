import type { Metadata } from "next";
import { CalendarDays, FileSpreadsheet, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ClientSearch } from "@/components/ui/client-search";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { getMonthLabel, getYearMonth } from "@/lib/date";
import { getMonthlyTuitionRegister } from "@/lib/monthly-tuition-register";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sổ học phí tháng",
  description: "Sổ học phí theo từng tháng",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getMonthParam(value: string | string[] | undefined) {
  return typeof value === "string" && /^\d{4}-\d{2}$/.test(value) ? value : getYearMonth();
}

function StatusBadge({ completed, completedText, pendingText }: {
  completed: boolean;
  completedText: string;
  pendingText: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        completed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
      }`}
    >
      {completed ? completedText : pendingText}
    </span>
  );
}

export default async function PublicMonthlyTuitionRegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const billingYearMonth = getMonthParam(params.month);
  const register = await getMonthlyTuitionRegister(createAdminClient(), billingYearMonth);
  const searchTargetId = "public-monthly-tuition-grid";

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-emerald-900 text-white">
        <div className="container-page py-7">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-white/15">
              <FileSpreadsheet className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">Phát triển toàn diện</p>
              <h1 className="text-2xl font-semibold">Sổ học phí tháng</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container-page space-y-5 py-6">
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-[180px_1fr_auto] sm:items-end">
            <form className="contents" method="get">
              <div className="grid gap-2">
                <Label htmlFor="month">Chọn tháng</Label>
                <Input id="month" name="month" type="month" defaultValue={billingYearMonth} />
              </div>
              <ClientSearch
                targetId={searchTargetId}
                placeholder="Tìm học sinh, lớp, phụ huynh"
                countLabel="học sinh"
              />
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
              >
                <CalendarDays className="h-4 w-4" />
                Xem tháng
              </button>
            </form>
          </CardContent>
        </Card>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-semibold capitalize">{getMonthLabel(billingYearMonth)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Dữ liệu chỉ để xem và được cập nhật trực tiếp từ sổ học phí.</p>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Học sinh", register.rows.length.toLocaleString("vi-VN")],
              ["Đã nộp", `${register.paidCount}/${register.rows.length}`],
              ["Tổng học phí", formatCurrency(register.totalTuition, register.currency)],
              ["Tổng nợ tồn", formatCurrency(register.totalDebt, register.currency)],
            ].map(([label, value]) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="mt-2 text-xl font-semibold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Table className="min-w-[1180px]">
                <THead className="bg-emerald-800 text-white">
                  <tr>
                    <TH className="w-14 text-center text-white">STT</TH>
                    <TH className="text-white">Học sinh</TH>
                    <TH className="text-white">Lớp</TH>
                    <TH className="text-white">Phụ huynh</TH>
                    <TH className="text-white">Số điện thoại</TH>
                    <TH className="text-right text-white">Học phí</TH>
                    <TH className="text-right text-white">Nợ tồn</TH>
                    <TH className="text-center text-white">Tình trạng</TH>
                    <TH className="text-center text-white">Phiếu thu</TH>
                    <TH className="min-w-56 text-white">Ghi chú</TH>
                  </tr>
                </THead>
                <TBody id={searchTargetId}>
                  {register.rows.map((row, index) => {
                    const parentLabel = row.student.parents?.full_name || row.student.parents?.username || "Chưa cập nhật";
                    return (
                      <tr
                        key={row.student.id}
                        className="even:bg-slate-50"
                        data-search-key={row.student.id}
                        data-search-text={`${row.student.full_name} ${row.student.class_name || ""} ${parentLabel} ${row.student.parents?.phone || ""}`}
                      >
                        <TD className="text-center text-muted-foreground">{index + 1}</TD>
                        <TD className="font-medium">{row.student.full_name}</TD>
                        <TD>{row.student.class_name || "Chưa có lớp"}</TD>
                        <TD>{parentLabel}</TD>
                        <TD>{row.student.parents?.phone || "Chưa có SĐT"}</TD>
                        <TD className="text-right font-medium">
                          {row.tuitionAmount === null ? "Chưa tính" : formatCurrency(row.tuitionAmount, register.currency)}
                        </TD>
                        <TD className={`text-right font-semibold ${row.outstandingDebt ? "text-amber-700" : ""}`}>
                          {row.outstandingDebt === null ? "Chưa tính" : formatCurrency(row.outstandingDebt, register.currency)}
                        </TD>
                        <TD className="text-center">
                          <StatusBadge completed={row.isPaid} completedText="Đã nộp" pendingText="Chưa nộp" />
                        </TD>
                        <TD className="text-center">
                          <StatusBadge completed={row.receiptSent} completedText="Đã gửi" pendingText="Chưa gửi" />
                        </TD>
                        <TD className="whitespace-pre-wrap">{row.note || ""}</TD>
                      </tr>
                    );
                  })}
                </TBody>
              </Table>

              {register.rows.length === 0 ? (
                <div className="grid place-items-center gap-2 border-t py-14 text-center text-muted-foreground">
                  <Search className="h-6 w-6" />
                  <p>Chưa có học sinh trong tháng này.</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
