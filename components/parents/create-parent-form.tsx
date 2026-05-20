"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createParentWithCredentialsAction, type CredentialActionState } from "@/lib/actions/admin";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: CredentialActionState = {};

export function CreateParentForm() {
  const [state, formAction] = useActionState(createParentWithCredentialsAction, initialState);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Tạo phụ huynh</CardTitle>
          <CardDescription>Chỉ cần username và mật khẩu tạm thời. Email nội bộ sẽ được tạo tự động.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            {state.message && !state.ok ? <Alert variant="error">{state.message}</Alert> : null}
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" required autoComplete="off" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="temporary_password">Mật khẩu tạm thời</Label>
              <Input id="temporary_password" name="temporary_password" type="password" required minLength={8} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Họ tên</Label>
                <Input id="full_name" name="full_name" placeholder="Có thể để trống" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" name="phone" />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Email liên hệ</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select id="status" name="status" defaultValue="active">
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngưng hoạt động</option>
                </Select>
              </div>
            </div>
            <SubmitButton>Tạo phụ huynh</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin gửi phụ huynh</CardTitle>
          <CardDescription>Mật khẩu không được lưu trong database, chỉ hiển thị ngay sau khi tạo/reset.</CardDescription>
        </CardHeader>
        <CardContent>
          {state.ok && state.credentials ? (
            <div className="space-y-4">
              <Alert variant="success">{state.message}</Alert>
              <div className="rounded-lg border bg-slate-50 p-4 font-mono text-sm break-all">
                <p>Username: {state.credentials.username}</p>
                <p>Mật khẩu: {state.credentials.password}</p>
              </div>
              {state.parentId ? (
                <ButtonLink href={`/admin/parents/${state.parentId}`} className="w-full sm:w-auto">
                  Mở hồ sơ phụ huynh
                </ButtonLink>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sau khi tạo thành công, credential sẽ xuất hiện tại đây để admin gửi cho phụ huynh.
            </p>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            Danh sách phụ huynh nằm ở <Link className="font-medium text-primary" href="/admin/parents">/admin/parents</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
