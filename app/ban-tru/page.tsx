import { ArrowLeft, Brain, CalendarDays, ChefHat, HeartHandshake, MapPin, Moon, Phone, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const dailyFlow = [
  ["Đưa đón", "Đón con đúng lịch, ổn định đầu giờ."],
  ["Vui chơi", "Khởi động nhẹ, kết nối cùng bạn bè."],
  ["Luyện tập", "Rèn nề nếp và khả năng tự học."],
  ["Ăn uống", "Bữa trưa đủ dinh dưỡng, phù hợp học sinh tiểu học."],
  ["Ngủ nghỉ", "Không gian yên tĩnh để con hồi phục năng lượng."],
  ["Sinh hoạt đọc sách", "Đọc sách, trò chuyện và hình thành thói quen tốt."],
  ["Ôn luyện", "Hoàn thành bài tập, củng cố kiến thức trên lớp."],
  ["Khám phá vui chơi", "Hoạt động nhẹ, kỹ năng sống và tư duy."],
  ["Đón về", "Kết thúc ngày rõ ràng, phụ huynh yên tâm."],
] as const;

const strengths = [
  ["Ăn trưa đủ dinh dưỡng", ChefHat],
  ["Ngủ trưa khoa học", Moon],
  ["Luyện khả năng tư duy", Brain],
  ["Quản lý an toàn", ShieldCheck],
  ["Luyện kỹ năng sống", HeartHandshake],
] as const;

const packages = [
  {
    title: "Gói bán trú thứ 2 đến thứ 6",
    note: "Nghỉ thứ 7",
    price: "720.000đ",
  },
  {
    title: "Gói bán trú thứ 2 đến thứ 7",
    note: "Có thứ 7",
    price: "850.000đ",
  },
] as const;

const googleMapsUrl = "https://maps.app.goo.gl/akrkDTRDutL5MCe87";

export default async function BoardingLandingPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("app_settings").select("*").limit(1).maybeSingle();
  const phone = settings?.phone || "0392333013";

  return (
    <main className="min-h-screen bg-white">
      <section className="relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1800&q=80"
          alt="Học sinh tiểu học vui học bán trú"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-emerald-950/55" />
        <div className="container-page relative flex min-h-[82vh] flex-col justify-between py-6 text-white">
          <header className="flex items-center justify-between gap-3">
            <ButtonLink href="/" variant="outline" size="sm" className="border-white/60 bg-white/10 text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
              Trang chủ
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary" size="sm">
              Đăng nhập
            </ButtonLink>
          </header>

          <div className="max-w-3xl py-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">Học tập và phát triển toàn diện</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-normal sm:text-7xl">Bán trú</h1>
            <p className="mt-5 max-w-2xl text-lg text-emerald-50">
              An tâm gửi gắm, con được chăm sóc bữa trưa, nghỉ ngơi, ôn luyện và vui chơi trong nhịp sinh hoạt rõ ràng mỗi ngày.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#packages" size="lg">
                Xem gói bán trú
              </ButtonLink>
              <a
                href={`tel:${phone.replaceAll(" ", "")}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/60 bg-white/10 px-5 py-2.5 text-base font-medium text-white transition hover:-translate-y-0.5 hover:bg-white/20 hover:shadow-md active:translate-y-0"
              >
                <Phone className="h-5 w-5" />
                {phone}
              </a>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg bg-white/12 p-3 backdrop-blur sm:grid-cols-3">
            <div className="rounded-md bg-white/15 p-4">
              <p className="text-2xl font-semibold">720k</p>
              <p className="text-sm text-emerald-50">Gói thứ 2 đến thứ 6</p>
            </div>
            <div className="rounded-md bg-white/15 p-4">
              <p className="text-2xl font-semibold">850k</p>
              <p className="text-sm text-emerald-50">Gói có thứ 7</p>
            </div>
            <div className="rounded-md bg-white/15 p-4">
              <p className="text-2xl font-semibold">Mỗi ngày</p>
              <p className="text-sm text-emerald-50">Ăn, nghỉ, học và vui chơi</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Một ngày bán trú</p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Nhịp sinh hoạt đầy đủ từ đón đến về</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {dailyFlow.map(([title, text], index) => (
            <div key={title} className="rounded-lg border bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <p className="font-semibold">{title}</p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="container-page">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Nội dung chăm sóc</p>
            <h2 className="mt-2 text-3xl font-semibold">Con được chăm cả thể chất, nề nếp và tư duy</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {strengths.map(([label, Icon]) => (
              <div key={label} className="rounded-lg border bg-white p-5">
                <Icon className="h-7 w-7 text-primary" />
                <p className="mt-4 font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="packages" className="container-page py-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Gói bán trú</p>
          <h2 className="mt-2 text-3xl font-semibold">Linh hoạt theo nhu cầu của gia đình</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {packages.map((item) => (
            <div key={item.title} className="rounded-lg border bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CalendarDays className="h-7 w-7 text-primary" />
                  <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-semibold text-primary">{item.price}</p>
                  <p className="text-sm text-muted-foreground">/tháng</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary py-14 text-white">
        <div className="container-page flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">Liên hệ tư vấn</p>
            <h2 className="mt-2 text-3xl font-semibold">Đăng ký lịch bán trú phù hợp cho con</h2>
          </div>
          <div className="grid gap-2 text-sm">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {phone}
            </p>
            <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline-offset-4 hover:underline">
              <MapPin className="h-4 w-4" />
              {settings?.address || "Điện Bàn Đông"}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
