import { updateParentProfileAction } from "@/lib/actions/parent";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/permissions";
import { getMessageParam } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { SubmitButton } from "@/components/ui/submit-button";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ParentProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const profile = await requireRole("parent");
  const supabase = await createClient();
  const { data: parent } = await supabase.from("parents").select("*").eq("auth_user_id", profile.auth_user_id).single();

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Hồ sơ phụ huynh</CardTitle>
        <CardDescription>Cập nhật thông tin liên hệ thật để bán trú tiện liên lạc khi cần.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
        </div>
        <form action={updateParentProfileAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Username</Label>
            <Input value={parent?.username || ""} disabled />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="full_name">Họ tên</Label>
            <Input id="full_name" name="full_name" defaultValue={parent?.full_name || profile.full_name} required />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" name="phone" defaultValue={parent?.phone || ""} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email liên hệ</Label>
              <Input id="email" name="email" type="email" defaultValue={parent?.email || ""} />
            </div>
          </div>
          <SubmitButton>Lưu hồ sơ</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
