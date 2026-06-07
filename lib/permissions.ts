import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/lib/types";

async function waitForAuthRetry() {
  await new Promise((resolve) => setTimeout(resolve, 150));
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  let claimsResult = await supabase.auth.getClaims();
  if (claimsResult.error) {
    await waitForAuthRetry();
    claimsResult = await supabase.auth.getClaims();
  }
  if (claimsResult.error) {
    throw new Error(`Không xác thực được phiên đăng nhập: ${claimsResult.error.message}`);
  }
  const userId = claimsResult.data?.claims.sub;

  if (!userId) return null;

  let profileResult = await supabase.from("profiles").select("*").eq("auth_user_id", userId).maybeSingle();
  if (profileResult.error) {
    await waitForAuthRetry();
    profileResult = await supabase.from("profiles").select("*").eq("auth_user_id", userId).maybeSingle();
  }
  if (profileResult.error) {
    throw new Error(`Không tải được hồ sơ đăng nhập: ${profileResult.error.message}`);
  }
  if (!profileResult.data) return null;

  return profileResult.data as Profile;
}

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "active") redirect("/login?error=Tài khoản đang bị khóa");
  return profile;
}

export async function requireRole(role: AppRole | AppRole[]) {
  const profile = await requireProfile();
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(profile.role)) redirect(roleDashboard(profile.role));
  return profile;
}

export function roleDashboard(role: AppRole) {
  if (role === "admin") return "/admin";
  if (role === "manager") return "/manager";
  return "/parent";
}
