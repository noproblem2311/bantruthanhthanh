import { BookOpenCheck, CalendarDays, CheckCircle2, ChefHat, Laptop, MapPin, Moon, Phone, ShieldCheck, UsersRound } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("app_settings").select("*").limit(1).maybeSingle();
  const centerName = settings?.center_name || "Bán trú Learning Hub";
  const description = settings?.description || "Bán trú học tập cho học sinh tiểu học";

  const services = [
    ["Ăn trưa", ChefHat],
    ["Ngủ trưa", Moon],
    ["Hoàn thành bài tập", BookOpenCheck],
    ["Tin học/kỹ năng số", Laptop],
    ["Báo cáo phụ huynh", CalendarDays],
  ] as const;

  const reasons = ["An toàn", "Cơ sở rộng rãi", "Có đầu bếp", "Có giáo viên hỗ trợ", "Theo dõi học sinh mỗi ngày"];
  const dayFlow = ["Đón học sinh", "Ăn trưa", "Ngủ trưa", "Hoàn thành bài tập", "Tin học/kỹ năng số", "Phụ huynh đón"];

  return (
    <main className="min-h-screen bg-white">
      <section className="relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1800&q=80"
          alt="Lớp học tiểu học"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/50" />
        <div className="container-page relative flex min-h-[82vh] flex-col justify-between py-6 text-white">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-semibold">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-white text-primary">
                <BookOpenCheck className="h-5 w-5" />
              </span>
              {centerName}
            </div>
            <ButtonLink href="/login" variant="secondary">
              Đăng nhập
            </ButtonLink>
          </header>
          <div className="max-w-3xl py-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">Bán trú học tập cho học sinh tiểu học</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal sm:text-6xl">{centerName}</h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-100">{description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#contact" size="lg">
                <Phone className="h-5 w-5" />
                Liên hệ tư vấn
              </ButtonLink>
              <ButtonLink href="/login" size="lg" variant="outline" className="border-white/60 bg-white/10 text-white hover:bg-white/20">
                Theo dõi bán trú
              </ButtonLink>
            </div>
          </div>
          <div className="grid gap-3 rounded-lg bg-white/12 p-3 backdrop-blur sm:grid-cols-3">
            <div className="rounded-md bg-white/15 p-4">
              <p className="text-2xl font-semibold">06:00</p>
              <p className="text-sm text-slate-100">Deadline xin nghỉ trong ngày</p>
            </div>
            <div className="rounded-md bg-white/15 p-4">
              <p className="text-2xl font-semibold">Mỗi ngày</p>
              <p className="text-sm text-slate-100">Theo dõi điểm danh và ghi chú</p>
            </div>
            <div className="rounded-md bg-white/15 p-4">
              <p className="text-2xl font-semibold">Rõ ràng</p>
              <p className="text-sm text-slate-100">Phí tính theo số buổi có mặt</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Dịch vụ</p>
            <h2 className="mt-2 text-3xl font-semibold">Một ngày bán trú đủ nhịp học và nghỉ</h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {services.map(([label, Icon]) => (
            <Card key={label}>
              <CardContent className="p-5">
                <Icon className="h-7 w-7 text-primary" />
                <p className="mt-4 font-semibold">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="container-page grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Lý do chọn bán trú</p>
            <h2 className="mt-2 text-3xl font-semibold">Phụ huynh yên tâm, học sinh có nề nếp</h2>
            <p className="mt-4 text-muted-foreground">Admin, quản lý và phụ huynh cùng dùng một hệ thống để theo dõi ngày nghỉ, điểm danh và phí tháng.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {reasons.map((reason) => (
              <div key={reason} className="flex items-center gap-3 rounded-lg border bg-white p-4">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="font-medium">{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Quy trình một ngày</p>
        <div className="mt-6 grid gap-3 md:grid-cols-6">
          {dayFlow.map((item, index) => (
            <div key={item} className="rounded-lg border bg-white p-4">
              <p className="text-sm font-semibold text-primary">Bước {index + 1}</p>
              <p className="mt-2 font-medium">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-primary py-14 text-white">
        <div className="container-page grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">Liên hệ</p>
            <h2 className="mt-2 text-3xl font-semibold">Tư vấn lịch bán trú phù hợp cho gia đình</h2>
          </div>
          <div className="space-y-3 rounded-lg bg-white/12 p-5">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {settings?.phone || "Cập nhật trong Admin Settings"}
            </p>
            <p className="flex items-center gap-2">
              <UsersRound className="h-4 w-4" />
              {settings?.zalo_url || "Zalo: cập nhật sau"}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {settings?.address || "Địa chỉ: cập nhật sau"}
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Theo dõi học sinh mỗi ngày
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
