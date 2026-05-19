import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { AppRole } from "@/lib/types";

const protectedPrefixes: Array<{ prefix: string; role: AppRole }> = [
  { prefix: "/admin", role: "admin" },
  { prefix: "/manager", role: "manager" },
  { prefix: "/parent", role: "parent" },
];

function roleDashboard(role: AppRole) {
  if (role === "admin") return "/admin";
  if (role === "manager") return "/manager";
  return "/parent";
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const matched = protectedPrefixes.find((item) => request.nextUrl.pathname.startsWith(item.prefix));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!matched) return response;

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!profile || profile.status !== "active") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "Tài khoản không còn hoạt động");
    return NextResponse.redirect(url);
  }

  if (profile.role !== matched.role) {
    return NextResponse.redirect(new URL(roleDashboard(profile.role as AppRole), request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
