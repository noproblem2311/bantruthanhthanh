import Link from "next/link";
import { LockKeyhole, Mail, UserRound } from "lucide-react";
import { loginParentAction, loginStaffAction } from "@/lib/auth/actions";
import { getMessageParam } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { SubmitButton } from "@/components/ui/submit-button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container-page flex min-h-screen flex-col justify-center py-10">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link href="/" className="min-w-0 truncate text-lg font-semibold text-primary">
            Bán trú Learning Hub
          </Link>
          <ButtonLink href="/" variant="outline" size="sm" className="shrink-0 sm:min-h-10 sm:px-4">
            Trang chủ
          </ButtonLink>
        </div>

        <div className="mx-auto grid w-full max-w-5xl gap-5 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
          </div>

          <Card>
            <CardHeader>
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" />
              </div>
              <CardTitle>Phụ huynh đăng nhập</CardTitle>
              <CardDescription>Chỉ dùng username và mật khẩu do admin cấp. Không cần email.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={loginParentAction} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" autoComplete="username" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="parent_password">Mật khẩu</Label>
                  <Input id="parent_password" name="password" type="password" autoComplete="current-password" required />
                </div>
                <SubmitButton className="w-full">
                  <LockKeyhole className="h-4 w-4" />
                  Đăng nhập phụ huynh
                </SubmitButton>
                <Link href="/forgot-password" className="text-sm font-medium text-primary">
                  Quên mật khẩu phụ huynh?
                </Link>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-md bg-sky-100 text-sky-700">
                <Mail className="h-5 w-5" />
              </div>
              <CardTitle>Admin / Quản lý đăng nhập</CardTitle>
              <CardDescription>Tài khoản nội bộ dùng email Supabase Auth.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={loginStaffAction} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staff_password">Mật khẩu</Label>
                  <Input id="staff_password" name="password" type="password" autoComplete="current-password" required />
                </div>
                <SubmitButton variant="secondary" className="w-full">
                  <LockKeyhole className="h-4 w-4" />
                  Đăng nhập nội bộ
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
