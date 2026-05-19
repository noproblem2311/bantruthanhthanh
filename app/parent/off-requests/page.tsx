import { AlertTriangle } from "lucide-react";
import { cancelOffRequestAction, createOffRequestAction } from "@/lib/actions/parent";
import { offRequestBadgeVariant, offRequestLabels } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { canSubmitOffRequest, formatVietnamDate, formatVietnamDateTime, getVietnamToday, isWeekend } from "@/lib/date";
import { getMessageParam } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ParentOffRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const today = getVietnamToday();
  const { data: children } = await supabase.from("students").select("*").eq("status", "active").order("full_name");
  const { data: requests } = await supabase
    .from("off_requests")
    .select("*, students(full_name)")
    .order("off_date", { ascending: false })
    .limit(60);

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Xin nghỉ bán trú</CardTitle>
          <CardDescription>Gửi trước 06:00 sáng của ngày nghỉ theo giờ Việt Nam.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
          </div>
          <Alert variant="info" className="mb-4">
            Nếu chọn cuối tuần, hệ thống vẫn cho gửi nhưng sẽ cảnh báo trong thông báo kết quả.
          </Alert>
          <form action={createOffRequestAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="student_id">Học sinh</Label>
              <Select id="student_id" name="student_id" required>
                <option value="">Chọn học sinh</option>
                {(children || []).map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.full_name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="off_date">Ngày nghỉ</Label>
              <Input id="off_date" name="off_date" type="date" min={today} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Lý do</Label>
              <Textarea id="reason" name="reason" required />
            </div>
            <SubmitButton>Gửi đơn xin nghỉ</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử xin nghỉ</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <tr>
                <TH>Ngày nghỉ</TH>
                <TH>Học sinh</TH>
                <TH>Trạng thái</TH>
                <TH>Lý do</TH>
                <TH>Thao tác</TH>
              </tr>
            </THead>
            <TBody>
              {(requests || []).map((request) => (
                <tr key={request.id}>
                  <TD>
                    <p className="font-medium">{formatVietnamDate(request.off_date)}</p>
                    <p className="text-xs text-muted-foreground">{formatVietnamDateTime(request.submitted_at)}</p>
                    {isWeekend(request.off_date) ? (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700">
                        <AlertTriangle className="h-3 w-3" />
                        Cuối tuần
                      </span>
                    ) : null}
                  </TD>
                  <TD>{request.students?.full_name}</TD>
                  <TD>
                    <Badge variant={offRequestBadgeVariant(request.status)}>{offRequestLabels[request.status]}</Badge>
                  </TD>
                  <TD>{request.reason || "Không có"}</TD>
                  <TD>
                    {canSubmitOffRequest(request.off_date) && request.status !== "cancelled" ? (
                      <form action={cancelOffRequestAction}>
                        <input type="hidden" name="request_id" value={request.id} />
                        <SubmitButton variant="outline" size="sm">
                          Hủy đơn
                        </SubmitButton>
                      </form>
                    ) : (
                      <span className="text-xs text-muted-foreground">Không thể hủy</span>
                    )}
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
          {(requests || []).length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">Chưa có đơn xin nghỉ.</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
