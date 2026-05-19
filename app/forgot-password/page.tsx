import Link from "next/link";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { getMessageParam } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container-page flex min-h-screen items-center justify-center py-10">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Yêu cầu cấp lại mật khẩu</CardTitle>
            <CardDescription>Phụ huynh gửi username và số điện thoại nếu có. Admin sẽ xác nhận thủ công.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
            </div>
            <form action={forgotPasswordAction} className="grid gap-4">
              <input type="hidden" name="redirect_to" value="/forgot-password" />
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="note">Ghi chú</Label>
                <Textarea id="note" name="note" placeholder="Ví dụ: Tôi là phụ huynh của bé Minh..." />
              </div>
              <SubmitButton>Gửi yêu cầu</SubmitButton>
            </form>
            <Link href="/login" className="mt-4 inline-block text-sm font-medium text-primary">
              Quay lại đăng nhập
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
