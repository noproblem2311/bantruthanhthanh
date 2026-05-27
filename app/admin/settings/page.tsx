import { updateAppSettingsAction } from "@/lib/actions/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageMessage } from "@/components/ui/message";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { getMessageParam } from "@/lib/utils";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const oldCenterName = "Bán trú Learning Hub";
const defaultCenterName = "Phát Triển Toàn Diện";

export default async function AdminSettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: settings } = await supabase.from("app_settings").select("*").limit(1).maybeSingle();
  const centerName = settings?.center_name && settings.center_name !== oldCenterName ? settings.center_name : defaultCenterName;

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Thông tin bán trú</CardTitle>
        <CardDescription>Thông tin này hiển thị trên trang chủ public.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <PageMessage success={getMessageParam(params, "success")} error={getMessageParam(params, "error")} />
        </div>
        <form action={updateAppSettingsAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="center_name">Tên bán trú</Label>
            <Input id="center_name" name="center_name" defaultValue={centerName} required />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" name="phone" defaultValue={settings?.phone || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input id="address" name="address" defaultValue={settings?.address || ""} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Mô tả ngắn</Label>
            <Textarea id="description" name="description" defaultValue={settings?.description || ""} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="zalo_url">Zalo</Label>
              <Input id="zalo_url" name="zalo_url" defaultValue={settings?.zalo_url || ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="facebook_url">Facebook</Label>
              <Input id="facebook_url" name="facebook_url" defaultValue={settings?.facebook_url || ""} />
            </div>
          </div>
          <SubmitButton>Lưu cài đặt</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
