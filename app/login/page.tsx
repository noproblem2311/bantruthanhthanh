import Link from "next/link";
import { LockKeyhole, Mail, UserRound } from "lucide-react";
import { loginParentAction, loginStaffAction } from "@/lib/auth/actions";
import { cn, getMessageParam } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { SubmitButton } from "@/components/ui/submit-button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type LoginMode = "parent" | "internal";

const loginOptions: Array<{
  mode: LoginMode;
  title: string;
  description: string;
  icon: typeof UserRound;
}> = [
  {
    mode: "parent",
    title: "Phụ huynh",
    description: "Đăng nhập bằng username được cấp",
    icon: UserRound,
  },
  {
    mode: "internal",
    title: "Nội bộ",
    description: "Admin và quản lý đăng nhập bằng email",
    icon: Mail,
  },
];

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const mode: LoginMode = params.mode === "internal" ? "internal" : "parent";

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

        <div className="mx-auto grid w-full max-w-2xl gap-5">
          <div>
            <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {loginOptions.map((option) => {
              const Icon = option.icon;
              const active = mode === option.mode;
              return (
                <Link
                  key={option.mode}
                  href={`/login?mode=${option.mode}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-28 items-start gap-3 rounded-lg border bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-md",
                    active ? "border-primary ring-2 ring-primary/15" : "hover:border-primary/40",
                  )}
                >
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-md", active ? "bg-primary text-white" : "bg-muted text-slate-700")}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold">{option.title}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{option.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>

          {mode === "parent" ? (
            <Card>
              <CardHeader>
                <CardTitle>Phụ huynh đăng nhập</CardTitle>
                <CardDescription>Chỉ dùng username và mật khẩu do admin cấp. Không cần email.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={loginParentAction} className="grid gap-4">
                  <input type="hidden" name="redirect_to" value="/login?mode=parent" />
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
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Nội bộ đăng nhập</CardTitle>
                <CardDescription>Tài khoản admin và quản lý dùng email Supabase Auth.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={loginStaffAction} className="grid gap-4">
                  <input type="hidden" name="redirect_to" value="/login?mode=internal" />
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
          )}
        </div>
      </div>
    </main>
  );
}
