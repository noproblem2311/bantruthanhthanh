import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatVietnamDate, formatVietnamDateTime, getVietnamToday } from "@/lib/date";
import { offRequestBadgeVariant, offRequestLabels } from "@/lib/labels";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ManagerOffRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const date = typeof params.date === "string" ? params.date : getVietnamToday();
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("off_requests")
    .select("*, students(full_name,class_name), parents(full_name,phone,username)")
    .eq("off_date", date)
    .order("submitted_at", { ascending: false });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đơn xin nghỉ trong ngày</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="flex max-w-xs items-end gap-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="date">Ngày</Label>
            <Input id="date" name="date" type="date" defaultValue={date} />
          </div>
          <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-white">Xem</button>
        </form>
        <Table>
          <THead>
            <tr>
              <TH>Ngày</TH>
              <TH>Học sinh</TH>
              <TH>Phụ huynh</TH>
              <TH>Trạng thái</TH>
              <TH>Lý do</TH>
            </tr>
          </THead>
          <TBody>
            {(requests || []).map((request) => (
              <tr key={request.id}>
                <TD>
                  <p>{formatVietnamDate(request.off_date)}</p>
                  <p className="text-xs text-muted-foreground">{formatVietnamDateTime(request.submitted_at)}</p>
                </TD>
                <TD>
                  <p className="font-medium">{request.students?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{request.students?.class_name || "Chưa có lớp"}</p>
                </TD>
                <TD>
                  <p>{request.parents?.full_name || request.parents?.username}</p>
                  <p className="text-xs text-muted-foreground">{request.parents?.phone || "Chưa có SĐT"}</p>
                </TD>
                <TD>
                  <Badge variant={offRequestBadgeVariant(request.status)}>{offRequestLabels[request.status]}</Badge>
                </TD>
                <TD>{request.reason || "Không có"}</TD>
              </tr>
            ))}
          </TBody>
        </Table>
        {(requests || []).length === 0 ? <p className="text-sm text-muted-foreground">Không có đơn xin nghỉ trong ngày này.</p> : null}
      </CardContent>
    </Card>
  );
}
