"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { forgotPasswordSchema, parentLoginSchema, staffLoginSchema } from "@/lib/validators/auth";
import { normalizeUsername } from "@/lib/utils";
import { roleDashboard } from "@/lib/permissions";
import { redirectWithMessage } from "./messages";

function formPath(formData: FormData, fallback: string) {
  const value = formData.get("redirect_to");
  return typeof value === "string" && value.startsWith("/") ? value : fallback;
}

export async function loginParentAction(formData: FormData) {
  const parsed = parentLoginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirectWithMessage("/login", "error", parsed.error.issues[0]?.message || "Thông tin đăng nhập không hợp lệ");
  }

  const usernameNormalized = normalizeUsername(parsed.data.username);
  const admin = createAdminClient();
  const { data: parent, error: parentError } = await admin
    .from("parents")
    .select("internal_auth_email,status")
    .eq("username_normalized", usernameNormalized)
    .maybeSingle();

  if (parentError || !parent || parent.status !== "active") {
    redirectWithMessage("/login", "error", "Username hoặc mật khẩu không đúng");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parent.internal_auth_email,
    password: parsed.data.password,
  });

  if (error) {
    redirectWithMessage("/login", "error", "Username hoặc mật khẩu không đúng");
  }

  revalidatePath("/", "layout");
  redirect("/parent");
}

export async function loginStaffAction(formData: FormData) {
  const parsed = staffLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirectWithMessage("/login", "error", parsed.error.issues[0]?.message || "Thông tin đăng nhập không hợp lệ");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirectWithMessage("/login", "error", "Email hoặc mật khẩu không đúng");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirectWithMessage("/login", "error", "Không lấy được thông tin tài khoản");

  const { data: profile } = await supabase.from("profiles").select("role,status").eq("auth_user_id", user.id).single();
  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    redirectWithMessage("/login", "error", "Tài khoản không còn hoạt động");
  }

  revalidatePath("/", "layout");
  redirect(roleDashboard(profile.role));
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    username: formData.get("username"),
    phone: formData.get("phone"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    redirectWithMessage(formPath(formData, "/forgot-password"), "error", parsed.error.issues[0]?.message || "Dữ liệu chưa hợp lệ");
  }

  const admin = createAdminClient();
  const usernameNormalized = normalizeUsername(parsed.data.username);
  const { data: parent } = await admin.from("parents").select("id").eq("username_normalized", usernameNormalized).maybeSingle();

  await admin.from("password_reset_requests").insert({
    parent_id: parent?.id ?? null,
    username: parsed.data.username.trim(),
    phone: parsed.data.phone || null,
    note: parsed.data.note || null,
    status: "pending",
  });

  redirectWithMessage(
    formPath(formData, "/forgot-password"),
    "success",
    "Đã gửi yêu cầu cấp lại mật khẩu. Quản trị viên sẽ liên hệ xác nhận.",
  );
}
