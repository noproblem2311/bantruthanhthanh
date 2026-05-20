import { createManagerAction, updateManagerStatusAction } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Table, TBody, TD, TH, THead } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getMessageParam } from "@/lib/utils";
import { statusLabels } from "@/lib/labels";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminManagersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: managers } = await supabase.from("profiles").select("*").eq("role", "manager").order("created_at", { ascending: false });

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Tạo tài khoản quản lý</CardTitle>
          <CardDescription>Manager đăng nhập bằng email/password Supabase Auth.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
          </div>
          <form action={createManagerAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Họ tên</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" name="phone" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Mật khẩu tạm thời</Label>
              <Input id="password" name="password" type="password" minLength={8} required />
            </div>
            <SubmitButton>Tạo manager</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách quản lý</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <THead>
              <tr>
                <TH>Quản lý</TH>
                <TH>Liên hệ</TH>
                <TH>Trạng thái</TH>
                <TH>Cập nhật</TH>
              </tr>
            </THead>
            <TBody>
              {(managers || []).map((manager) => (
                <tr key={manager.id}>
                  <TD>{manager.full_name}</TD>
                  <TD>
                    <p>{manager.email}</p>
                    <p className="text-xs text-muted-foreground">{manager.phone || "Chưa có SĐT"}</p>
                  </TD>
                  <TD>
                    <Badge variant={manager.status === "active" ? "success" : "muted"}>{statusLabels[manager.status]}</Badge>
                  </TD>
                  <TD>
                    <form action={updateManagerStatusAction} className="grid min-w-[220px] gap-2 sm:grid-cols-[1fr_auto]">
                      <input type="hidden" name="profile_id" value={manager.id} />
                      <Select name="status" defaultValue={manager.status}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </Select>
                      <SubmitButton size="sm" variant="outline">
                        Lưu
                      </SubmitButton>
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
