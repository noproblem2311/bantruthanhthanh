import { rejectPasswordResetRequestAction } from "@/lib/actions/admin";
import { ResetPasswordForm } from "@/components/parents/reset-password-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { formatVietnamDateTime } from "@/lib/date";
import { getMessageParam } from "@/lib/utils";
import { passwordResetLabels } from "@/lib/labels";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PasswordResetRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "pending";
  const supabase = await createClient();
  let query = supabase
    .from("password_reset_requests")
    .select("*, parents(id,full_name,username,phone)")
    .order("requested_at", { ascending: false });
  if (status !== "all") query = query.eq("status", status);
  const { data: requests } = await query;

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
      <Card>
        <CardHeader>
          <CardTitle>Yêu cầu cấp lại mật khẩu</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex max-w-xs items-end gap-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select id="status" name="status" defaultValue={status}>
                <option value="pending">Chờ xử lý</option>
                <option value="resolved">Đã xử lý</option>
                <option value="rejected">Từ chối</option>
                <option value="all">Tất cả</option>
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
                <TH>Yêu cầu</TH>
                <TH>Phụ huynh khớp</TH>
                <TH>Trạng thái</TH>
                <TH>Xử lý</TH>
              </tr>
            </THead>
            <TBody>
              {(requests || []).map((request) => (
                <tr key={request.id}>
                  <TD>
                    <p className="font-medium">{request.username}</p>
                    <p className="text-xs text-muted-foreground">{formatVietnamDateTime(request.requested_at)}</p>
                    <p className="mt-1 text-sm">{request.note || "Không có ghi chú"}</p>
                  </TD>
                  <TD>
                    <p>{request.parents?.full_name || "Chưa khớp hồ sơ"}</p>
                    <p className="text-xs text-muted-foreground">{request.phone || request.parents?.phone || "Chưa có SĐT"}</p>
                  </TD>
                  <TD>
                    <Badge variant={request.status === "pending" ? "warning" : request.status === "resolved" ? "success" : "danger"}>
                      {passwordResetLabels[request.status]}
                    </Badge>
                  </TD>
                  <TD className="min-w-[300px]">
                    {request.parents?.id && request.status === "pending" ? (
                      <div className="space-y-4">
                        <ResetPasswordForm parentId={request.parents.id} requestId={request.id} />
                        <form action={rejectPasswordResetRequestAction} className="grid gap-2 border-t pt-3">
                          <input type="hidden" name="request_id" value={request.id} />
                          <Textarea name="admin_note" className="min-h-16" placeholder="Lý do từ chối" />
                          <SubmitButton variant="destructive" size="sm">
                            Từ chối
                          </SubmitButton>
                        </form>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Không có thao tác</span>
                    )}
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
