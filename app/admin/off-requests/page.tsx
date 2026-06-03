import { updateOffRequestStatusAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientListFilters } from "@/components/ui/client-list-filters";
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

function pathWith(date: string) {
  const params = new URLSearchParams();
  params.set("date", date);
  return `/admin/off-requests?${params.toString()}`;
}

export default async function AdminOffRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const date = typeof params.date === "string" ? params.date : getVietnamToday();
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("off_requests")
    .select("*, students(full_name,class_name), parents(full_name,username,phone)")
    .eq("off_date", date)
    .order("submitted_at", { ascending: false });
  const redirectTo = pathWith(date);

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
      <Card>
        <CardHeader>
          <CardTitle>Lọc đơn xin nghỉ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-[180px_1fr] md:items-start">
          <form>
            <div className="grid gap-2">
              <Label htmlFor="date">Ngày</Label>
              <Input id="date" name="date" type="date" defaultValue={date} />
            </div>
          </form>
          <ClientListFilters
            targetId="admin-off-requests-results"
            searchPlaceholder="Học sinh, phụ huynh, SĐT"
            countLabel="đơn"
            className="md:grid-cols-[1fr_220px]"
            filters={[
              {
                key: "status",
                label: "Trạng thái",
                options: [
                  { value: "all", label: "Tất cả" },
                  { value: "auto_approved", label: "Tự duyệt" },
                  { value: "pending", label: "Chờ xử lý" },
                  { value: "approved", label: "Đã duyệt" },
                  { value: "rejected", label: "Từ chối" },
                  { value: "cancelled", label: "Đã hủy" },
                ],
              },
            ]}
          />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent id="admin-off-requests-results" className="p-0">
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
                <tr
                  key={request.id}
                  data-search-key={request.id}
                  data-search-text={`${request.students?.full_name || ""} ${request.students?.class_name || ""} ${request.parents?.full_name || ""} ${request.parents?.username || ""} ${request.parents?.phone || ""}`}
                  data-filter-status={request.status}
                >
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
