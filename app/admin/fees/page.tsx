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
import type { Parent, Student } from "@/lib/types";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminFeesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const yearMonth = typeof params.month === "string" ? params.month : getYearMonth();
  const q = typeof params.q === "string" ? params.q.trim().toLowerCase() : "";
  const supabase = await createClient();
  const feeSetting = await getFeeSetting(supabase, yearMonth);
  const { data: parents } = await supabase.from("parents").select("*, students(*)").order("full_name");

  const rows = (
    await Promise.all(
      ((parents || []) as Array<Parent & { students: Student[] }>).map(async (parent) => {
        const activeStudents = (parent.students || []).filter((student) => student.status === "active");
        const studentFees = await Promise.all(activeStudents.map((student) => calculateMonthlyFee(supabase, student, yearMonth)));
        return {
          parent,
          studentFees,
          totalAbsences: studentFees.reduce((sum, row) => sum + row.absent_days, 0),
          totalAmount: studentFees.reduce((sum, row) => sum + (row.total_amount || 0), 0),
        };
      }),
    )
  ).filter((row) => row.studentFees.length > 0);

  const filtered = rows.filter((row) => {
    const text = `${row.parent.full_name || ""} ${row.parent.username} ${row.parent.phone || ""} ${row.studentFees.map((item) => item.student.full_name).join(" ")}`.toLowerCase();
    return !q || text.includes(q);
  });

  const csvRows = [
    ["Phu huynh", "Username", "So dien thoai", "Hoc sinh", "Goi", "Ngay nghi tinh tru", "Tong tien"],
    ...filtered.map((row) => [
      row.parent.full_name || "",
      row.parent.username,
      row.parent.phone || "",
      row.studentFees.map((item) => item.student.full_name).join("; "),
      row.studentFees.map((item) => `${item.student.full_name}: ${item.package_name}`).join("; "),
      String(row.totalAbsences),
      String(row.totalAmount),
    ]),
  ];
  const csv = csvRows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tổng hợp phí tháng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
          <div className="grid gap-2">
            <Label htmlFor="month">Tháng</Label>
            <Input id="month" name="month" type="month" defaultValue={yearMonth} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="q">Tìm kiếm</Label>
            <Input id="q" name="q" defaultValue={q} placeholder="Phụ huynh, học sinh, SĐT" />
          </div>
          <SubmitButton pendingText="Đang xem...">Xem</SubmitButton>
        </form>
        {!feeSetting ? <Alert variant="warning">Admin chưa cấu hình phí tháng này.</Alert> : null}
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(`\uFEFF${csv}`)}`}
          download={`phi-ban-tru-${yearMonth}.csv`}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-md border bg-white px-4 py-2 text-center text-sm font-medium transition hover:bg-muted/70 sm:w-auto"
        >
          Export CSV
        </a>
        <Table>
          <THead>
            <tr>
              <TH>Phụ huynh</TH>
              <TH>Danh sách con</TH>
              <TH>Nghỉ tính trừ</TH>
              <TH>Tổng tiền</TH>
            </tr>
          </THead>
          <TBody>
            {filtered.map((row) => (
              <tr key={row.parent.id}>
                <TD>
                  <p className="font-medium">{row.parent.full_name || row.parent.username}</p>
                  <p className="text-xs text-muted-foreground">{row.parent.phone || "Chưa có SĐT"}</p>
                </TD>
                <TD>
                  <div className="space-y-1">
                    {row.studentFees.map((item) => (
                      <p key={item.student.id} className="text-sm">
                        {item.student.full_name}: {item.package_name}, nghỉ {item.absent_days} ngày
                      </p>
                    ))}
                  </div>
                </TD>
                <TD>{row.totalAbsences}</TD>
                <TD>{feeSetting ? formatCurrency(row.totalAmount, feeSetting.currency) : "Chưa tính"}</TD>
              </tr>
            ))}
          </TBody>
        </Table>
      </CardContent>
    </Card>
  );
}
