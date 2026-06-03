import { rejectPasswordResetRequestAction } from "@/lib/actions/admin";
import { ResetPasswordForm } from "@/components/parents/reset-password-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientListFilters } from "@/components/ui/client-list-filters";
import { PageMessage } from "@/components/ui/message";
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
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("password_reset_requests")
    .select("*, parents(id,full_name,username,phone)")
    .order("requested_at", { ascending: false });

  return (
    <div className="space-y-5">
      <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
      <Card>
        <CardHeader>
          <CardTitle>Yêu cầu cấp lại mật khẩu</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientListFilters
            targetId="password-reset-requests-results"
            searchPlaceholder="Username, phụ huynh, SĐT"
            countLabel="yêu cầu"
            className="max-w-2xl sm:grid-cols-[1fr_220px]"
            filters={[
              {
                key: "status",
                label: "Trạng thái",
                options: [
                  { value: "all", label: "Tất cả" },
                  { value: "pending", label: "Chờ xử lý" },
                  { value: "resolved", label: "Đã xử lý" },
                  { value: "rejected", label: "Từ chối" },
                ],
              },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent id="password-reset-requests-results" className="p-0">
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
                <tr
                  key={request.id}
                  data-search-key={request.id}
                  data-search-text={`${request.username || ""} ${request.note || ""} ${request.phone || ""} ${request.parents?.full_name || ""} ${request.parents?.username || ""} ${request.parents?.phone || ""}`}
                  data-filter-status={request.status}
                >
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
