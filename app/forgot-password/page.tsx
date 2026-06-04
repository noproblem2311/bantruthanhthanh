import Link from "next/link";
import { getMessageParam } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageMessage } from "@/components/ui/message";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container-page flex min-h-screen items-center justify-center py-10">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Yêu cầu cấp lại mật khẩu</CardTitle>
            <CardDescription>Cổng phụ huynh đang tạm tắt, nên chức năng cấp lại mật khẩu phụ huynh cũng tạm dừng.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
            </div>
            <p className="text-sm text-muted-foreground">Vui lòng liên hệ quản trị viên nếu cần hỗ trợ tài khoản.</p>
            <Link href="/login" className="mt-4 inline-block text-sm font-medium text-primary">
              Quay lại đăng nhập
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
