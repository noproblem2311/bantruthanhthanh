import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/lib/types";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("auth_user_id", user.id).single();
  if (error || !data) return null;

  return data as Profile;
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
