import { ArrowLeft, BadgeCheck, BrainCircuit, Code2, Laptop, MapPin, MonitorPlay, MousePointer2, Phone, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const courses = [
  {
    title: "Tin học cơ bản",
    subtitle: "Làm quen máy tính và thao tác văn phòng",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    icon: Laptop,
    items: ["Sử dụng chuột, bàn phím", "Soạn thảo văn bản", "Vẽ và trình bày ý tưởng", "Lưu file, mở file, quản lý thư mục"],
  },
  {
    title: "Tin học nâng cao",
    subtitle: "Tư duy lập trình và sản phẩm sáng tạo",
    image: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1200&q=80",
    icon: Code2,
    items: ["Tư duy thuật toán", "Lập trình kéo thả", "Thiết kế trò chơi nhỏ", "Thuyết trình sản phẩm cuối khóa"],
  },
] as const;

const outcomes = [
  ["Thao tác tự tin", MousePointer2],
  ["Tư duy logic", BrainCircuit],
  ["Sản phẩm thực hành", MonitorPlay],
  ["Môi trường an toàn", ShieldCheck],
] as const;

const learningPath = [
  ["Khởi động", "Làm quen thiết bị, quy tắc phòng máy và thao tác an toàn."],
  ["Thực hành", "Mỗi buổi học có nhiệm vụ cụ thể để con tự tay hoàn thành."],
  ["Sáng tạo", "Biến kiến thức thành tranh vẽ, bài trình bày hoặc trò chơi nhỏ."],
  ["Chia sẻ", "Con trình bày sản phẩm, luyện sự tự tin và khả năng diễn đạt."],
] as const;

const googleMapsUrl = "https://maps.app.goo.gl/akrkDTRDutL5MCe87";

export default async function ComputerLandingPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("app_settings").select("*").limit(1).maybeSingle();
  const phone = settings?.phone || "0392333013";

  return (
    <main className="min-h-screen bg-white">
      <section className="relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=80"
          alt="Học sinh học tin học trên máy tính"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-sky-950/60" />
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
            <p className="text-sm font-semibold uppercase tracking-wide text-sky-100">Tin học cho học sinh tiểu học</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-normal sm:text-7xl">Tin học</h1>
            <p className="mt-5 max-w-2xl text-lg text-sky-50">
              Giúp con làm chủ máy tính, rèn tư duy logic và tạo ra sản phẩm nhỏ qua từng buổi thực hành.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#courses" size="lg">
                Xem khóa học
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

          <div className="grid gap-3 rounded-lg bg-white/12 p-3 backdrop-blur sm:grid-cols-4">
            {outcomes.map(([label, Icon]) => (
              <div key={label} className="rounded-md bg-white/15 p-4">
                <Icon className="h-6 w-6" />
                <p className="mt-3 text-sm font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="courses" className="container-page py-14">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Hai lộ trình</p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">Chọn khóa phù hợp với nền tảng của con</h2>
          <p className="mt-4 text-muted-foreground">
            Khóa cơ bản tập trung thao tác máy tính và công cụ học tập. Khóa nâng cao đưa con vào tư duy lập trình và sản phẩm sáng tạo.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {courses.map((course) => {
            const Icon = course.icon;

            return (
              <article key={course.title} className="overflow-hidden rounded-lg border bg-white">
                <div className="relative aspect-[16/9]">
                  <Image src={course.image} alt={course.title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-sky-100 text-sky-700">
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="text-2xl font-semibold">{course.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{course.subtitle}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3">
                    {course.items.map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-md border bg-slate-50 p-3">
                        <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />
                        <span className="text-sm font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="container-page">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Cách học</p>
            <h2 className="mt-2 text-3xl font-semibold">Học qua thao tác thật và sản phẩm nhỏ</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {learningPath.map(([title, text], index) => (
              <div key={title} className="rounded-lg border bg-white p-5">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">{index + 1}</span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Thiết bị", "Học sinh được hướng dẫn sử dụng máy đúng tư thế, đúng thao tác và an toàn."],
            ["Tư duy", "Bài học đi từ quan sát, phân tích, thử nghiệm đến sửa lỗi."],
            ["Sản phẩm", "Con có sản phẩm nhìn thấy được sau từng chặng học."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-lg border bg-white p-5">
              <Sparkles className="h-7 w-7 text-primary" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary py-14 text-white">
        <div className="container-page flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-100">Liên hệ tư vấn</p>
            <h2 className="mt-2 text-3xl font-semibold">Xếp lớp tin học theo năng lực của con</h2>
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
