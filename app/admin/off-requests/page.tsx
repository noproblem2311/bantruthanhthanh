import { updateOffRequestStatusAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { formatVietnamDate, formatVietnamDateTime, getVietnamToday } from "@/lib/date";
import { offRequestBadgeVariant, offRequestLabels } from "@/lib/labels";
import { getMessageParam } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pathWith(date: string, status: string) {
  const params = new URLSearchParams();
  params.set("date", date);
  if (status !== "all") params.set("status", status);
  return `/admin/off-requests?${params.toString()}`;
}

export default async function AdminOffRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const date = typeof params.date === "string" ? params.date : getVietnamToday();
  const status = typeof params.status === "string" ? params.status : "all";
  const supabase = await createClient();
  let query = supabase
    .from("off_requests")
    .select("*, students(full_name,class_name), parents(full_name,username,phone)")
    .eq("off_date", date)
    .order("submitted_at", { ascending: false });
  if (status !== "all") query = query.eq("status", status);
  const { data: requests } = await query;
  const redirectTo = pathWith(date, status);

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
      <Card>
        <CardHeader>
          <CardTitle>Lọc đơn xin nghỉ</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[180px_220px_auto] md:items-end">
            <div className="grid gap-2">
              <Label htmlFor="date">Ngày</Label>
              <Input id="date" name="date" type="date" defaultValue={date} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select id="status" name="status" defaultValue={status}>
                <option value="all">Tất cả</option>
                <option value="auto_approved">Tự duyệt</option>
                <option value="pending">Chờ xử lý</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
                <option value="cancelled">Đã hủy</option>
              </Select>
            </div>
            <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-white">Lọc</button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <THead>
              <tr>
                <TH>Ngày/Submit</TH>
                <TH>Học sinh</TH>
                <TH>Phụ huynh</TH>
                <TH>Trạng thái</TH>
                <TH>Xử lý</TH>
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
                  <TD>
                    <form action={updateOffRequestStatusAction} className="grid min-w-[260px] gap-2">
                      <input type="hidden" name="request_id" value={request.id} />
                      <input type="hidden" name="redirect_to" value={redirectTo} />
                      <Select name="status" defaultValue={request.status}>
                        <option value="approved">Duyệt</option>
                        <option value="rejected">Từ chối</option>
                        <option value="cancelled">Hủy</option>
                        <option value="auto_approved">Tự duyệt</option>
                      </Select>
                      <Textarea name="review_note" defaultValue={request.review_note || ""} className="min-h-16" placeholder="Ghi chú xử lý" />
                      <SubmitButton size="sm">Lưu xử lý</SubmitButton>
                    </form>
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
