import Link from "next/link";
import { updateParentAction } from "@/lib/actions/admin";
import { ResetPasswordForm } from "@/components/parents/reset-password-form";
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

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ParentDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const { data: parent } = await supabase.from("parents").select("*").eq("id", id).single();
  const { data: students } = await supabase.from("students").select("*").eq("parent_id", id).order("full_name");

  if (!parent) return <PageMessage error="Không tìm thấy phụ huynh" />;

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <PageMessage success={getMessageParam(query, "success")} error={getMessageParam(query, "error")} />
        <Card>
          <CardHeader>
            <CardTitle>Hồ sơ phụ huynh</CardTitle>
            <CardDescription>Email nội bộ chỉ dùng cho Supabase Auth, không hiển thị ở form đăng nhập phụ huynh.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateParentAction} className="grid gap-4">
              <input type="hidden" name="id" value={parent.id} />
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" defaultValue={parent.username} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select id="status" name="status" defaultValue={parent.status}>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Ngưng hoạt động</option>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="full_name">Họ tên</Label>
                <Input id="full_name" name="full_name" defaultValue={parent.full_name || ""} required />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" name="phone" defaultValue={parent.phone || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email liên hệ</Label>
                  <Input id="email" name="email" type="email" defaultValue={parent.email || ""} />
                </div>
              </div>
              <div className="break-all rounded-lg bg-slate-50 p-3 text-sm text-muted-foreground">
                Internal auth email: <span className="font-mono">{parent.internal_auth_email}</span>
              </div>
              <SubmitButton>Lưu phụ huynh</SubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Học sinh của phụ huynh</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <THead>
                <tr>
                  <TH>Học sinh</TH>
                  <TH>Lớp</TH>
                  <TH>Trạng thái</TH>
                  <TH></TH>
                </tr>
              </THead>
              <TBody>
                {(students || []).map((student) => (
                  <tr key={student.id}>
                    <TD>{student.full_name}</TD>
                    <TD>{student.class_name || "Chưa có"}</TD>
                    <TD>
                      <Badge variant={student.status === "active" ? "success" : "muted"}>{student.status}</Badge>
                    </TD>
                    <TD>
                      <Link className="font-medium text-primary" href={`/admin/students/${student.id}`}>
                        Sửa
                      </Link>
                    </TD>
                  </tr>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reset mật khẩu</CardTitle>
          <CardDescription>Mật khẩu mới chỉ hiện một lần sau khi đặt.</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm parentId={parent.id} />
        </CardContent>
      </Card>
    </div>
  );
}
