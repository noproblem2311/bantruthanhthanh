import { ArrowRight, BookOpenCheck, ChefHat, Code2, GraduationCap, Headphones, Laptop, MapPin, Phone, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleDashboard } from "@/lib/permissions";
import type { AppRole } from "@/lib/types";
import { HomeAuthRedirect } from "@/components/auth/home-auth-redirect";
import { ButtonLink } from "@/components/ui/button";

const englishUrl = "https://ms-duyen-english.vercel.app/";
const googleMapsUrl = "https://maps.app.goo.gl/akrkDTRDutL5MCe87";
const oldCenterName = "Bán trú Learning Hub";
const defaultCenterName = "Phát Triển Toàn Diện";

const programs = [
  {
    title: "Bán trú",
    href: "/ban-tru",
    tone: "from-emerald-600 to-lime-500",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    icon: ChefHat,
    front: "An tâm gửi gắm, con học tập và phát triển mỗi ngày.",
    back: ["Ăn trưa đủ dinh dưỡng", "Ngủ trưa khoa học", "Ôn luyện và đọc sách"],
    external: false,
  },
  {
    title: "Tin học",
    href: "/tin-hoc",
    tone: "from-sky-600 to-blue-500",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    icon: Laptop,
    front: "Học công nghệ, rèn tư duy và làm chủ tương lai.",
    back: ["Khóa cơ bản", "Khóa nâng cao", "Thực hành trên máy tính"],
    external: false,
  },
  {
    title: "Tiếng Anh",
    href: englishUrl,
    tone: "from-rose-600 to-pink-500",
    image: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80",
    icon: Headphones,
    front: "Tự tin giao tiếp, mở rộng tương lai.",
    back: ["Phát âm chuẩn", "Từ vựng thực tế", "Học qua trò chơi"],
    external: true,
  },
] as const;

const strengths = [
  ["Bán trú an toàn", ShieldCheck],
  ["Tư duy công nghệ", Code2],
  ["Ngôn ngữ giao tiếp", GraduationCap],
  ["Theo dõi sát sao", UsersRound],
] as const;

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role,status").eq("auth_user_id", user.id).maybeSingle();
    if (profile?.status === "active") redirect(roleDashboard(profile.role as AppRole));
  }

  const { data: settings } = await supabase.from("app_settings").select("*").limit(1).maybeSingle();
  const centerName = settings?.center_name && settings.center_name !== oldCenterName ? settings.center_name : defaultCenterName;

  return (
    <main className="min-h-screen bg-white">
      <HomeAuthRedirect />
      <section className="relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1800&q=80"
          alt="Học sinh tiểu học trong lớp"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="container-page relative flex min-h-[86vh] flex-col justify-between py-6 text-white">
          <header className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 font-semibold">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-white text-primary">
                <BookOpenCheck className="h-5 w-5" />
              </span>
              <span className="truncate">{centerName}</span>
            </div>
            <ButtonLink href="/login" variant="secondary" size="sm" className="shrink-0 sm:min-h-10 sm:px-4">
              Đăng nhập
            </ButtonLink>
          </header>

          <div className="max-w-3xl py-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">Bán trú · Tin học · Tiếng Anh</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal sm:text-6xl">{centerName}</h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-100">
              Một hệ sinh thái học tập cho học sinh tiểu học: chăm sóc sau giờ học, rèn tư duy công nghệ và mở rộng giao tiếp tiếng Anh.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#programs" size="lg">
                Xem chương trình
                <ArrowRight className="h-5 w-5" />
              </ButtonLink>
              <ButtonLink href="/login" size="lg" variant="outline" className="border-white/60 bg-white/10 text-white hover:bg-white/20">
                Theo dõi học sinh
              </ButtonLink>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg bg-white/12 p-3 backdrop-blur sm:grid-cols-4">
            {strengths.map(([label, Icon]) => (
              <div key={label} className="rounded-md bg-white/15 p-4">
                <Icon className="h-6 w-6" />
                <p className="mt-3 text-sm font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="programs" className="container-page py-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Ba mảng học tập</p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Chọn đúng nhu cầu của gia đình</h2>
          <p className="mt-4 text-muted-foreground">
            Bán trú chăm nhịp sinh hoạt mỗi ngày, Tin học phát triển tư duy và Tiếng Anh mở rộng khả năng giao tiếp.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {programs.map((program) => {
            const Icon = program.icon;
            const card = (
              <div className="group relative min-h-[360px] rounded-lg [perspective:1200px]">
                <div className="absolute inset-0 rounded-lg transition duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus-within:[transform:rotateY(180deg)]">
                  <div className="absolute inset-0 overflow-hidden rounded-lg border bg-white shadow-sm [backface-visibility:hidden]">
                    <Image src={program.image} alt={program.title} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                    <div className={`absolute inset-0 bg-gradient-to-t ${program.tone} opacity-75`} />
                    <div className="relative flex h-full flex-col justify-between p-5 text-white">
                      <span className="grid h-12 w-12 place-items-center rounded-md bg-white/20 backdrop-blur">
                        <Icon className="h-6 w-6" />
                      </span>
                      <div>
                        <h3 className="text-3xl font-semibold">{program.title}</h3>
                        <p className="mt-3 text-sm text-white/90">{program.front}</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-lg border bg-white p-5 shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-md bg-gradient-to-br ${program.tone} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold">{program.title}</h3>
                    <div className="mt-5 grid gap-3">
                      {program.back.map((item) => (
                        <div key={item} className="flex items-center gap-3 rounded-md border bg-slate-50 p-3">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                    <ButtonLink
                      href={program.href}
                      target={program.external ? "_blank" : undefined}
                      rel={program.external ? "noreferrer" : undefined}
                      className="mt-6 w-full"
                    >
                      Mở chương trình
                      <ArrowRight className="h-4 w-4" />
                    </ButtonLink>
                  </div>
                </div>
              </div>
            );

            return <div key={program.title}>{card}</div>;
          })}
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="container-page grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Một điểm đến</p>
            <h2 className="mt-2 text-3xl font-semibold">Học sinh được chăm, học và phát triển theo từng nhịp tuổi</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Nề nếp", "Bán trú giữ nhịp ăn, ngủ, học và vui chơi ổn định."],
              ["Tư duy", "Tin học giúp con làm quen máy tính, logic và sản phẩm nhỏ."],
              ["Giao tiếp", "Tiếng Anh tạo môi trường nghe, nói và phản xạ tự nhiên."],
              ["Kết nối", "Phụ huynh có hệ thống theo dõi điểm danh, ngày nghỉ và học phí."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg border bg-white p-4">
                <p className="font-semibold">{title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-14 text-white">
        <div className="container-page flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">Liên hệ tư vấn</p>
            <h2 className="mt-2 text-3xl font-semibold">Trao đổi lịch học phù hợp cho con</h2>
          </div>
          <div className="grid gap-2 text-sm">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {settings?.phone || "0392333013"}
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
