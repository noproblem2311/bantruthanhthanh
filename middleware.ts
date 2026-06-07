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

function redirectWithSession(url: URL, sessionResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  sessionResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") redirectResponse.headers.set(key, value);
  });
  return redirectResponse;
}

async function waitForAuthRetry() {
  await new Promise((resolve) => setTimeout(resolve, 150));
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
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  let claimsResult = await supabase.auth.getClaims();
  if (claimsResult.error) {
    await waitForAuthRetry();
    claimsResult = await supabase.auth.getClaims();
  }
  if (claimsResult.error) return response;
  const userId = claimsResult.data?.claims.sub;

  if (!matched) return response;

  if (!userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return redirectWithSession(url, response);
  }

  let profileResult = await supabase
    .from("profiles")
    .select("role,status")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (profileResult.error) {
    await waitForAuthRetry();
    profileResult = await supabase
      .from("profiles")
      .select("role,status")
      .eq("auth_user_id", userId)
      .maybeSingle();
  }
  if (profileResult.error) return response;
  const profile = profileResult.data;

  if (!profile || profile.status !== "active") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", "Tài khoản không còn hoạt động");
    return redirectWithSession(url, response);
  }

  if (profile.role !== matched.role) {
    return redirectWithSession(new URL(roleDashboard(profile.role as AppRole), request.url), response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
