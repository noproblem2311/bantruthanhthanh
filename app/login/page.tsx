import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { loginStaffAction } from "@/lib/auth/actions";
import { getMessageParam } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container-page flex min-h-screen flex-col justify-center py-10">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link href="/" className="min-w-0 truncate text-lg font-semibold text-primary">
            Phát Triển Toàn Diện
          </Link>
          <ButtonLink href="/" variant="outline" size="sm" className="shrink-0 sm:min-h-10 sm:px-4">
            Trang chủ
          </ButtonLink>
        </div>

        <div className="mx-auto grid w-full max-w-2xl gap-5">
          <div>
            <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Nội bộ đăng nhập</CardTitle>
              <CardDescription>Tạm tắt cổng phụ huynh. Admin và quản lý đăng nhập bằng email Supabase Auth.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={loginStaffAction} className="grid gap-4">
                <input type="hidden" name="redirect_to" value="/login" />
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="staff_password">Mật khẩu</Label>
                  <PasswordInput id="staff_password" name="password" autoComplete="current-password" required />
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
