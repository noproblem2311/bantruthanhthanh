import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = rest.join("=").replace(/^"|"$/g, "");
  }
}

function normalizeUsername(value) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/\s+/g, "");
}

function getYearMonthVN() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}`;
}

async function ensureAuthUser(supabase, { email, password, role }) {
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;

  const existing = usersData.users.find((user) => user.email === email);
  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { role },
    });
    return existing;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  });
  if (error) throw error;
  return data.user;
}

async function main() {
  loadEnvFile(".env.local");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: currentSettings } = await supabase.from("app_settings").select("id").limit(1).maybeSingle();
  if (currentSettings) {
    await supabase
      .from("app_settings")
      .update({
        center_name: "Bán trú Learning Hub",
        description: "Bán trú học tập cho học sinh tiểu học",
      })
      .eq("id", currentSettings.id);
  } else {
    await supabase.from("app_settings").insert({
      center_name: "Bán trú Learning Hub",
      description: "Bán trú học tập cho học sinh tiểu học",
    });
  }

  const adminUser = await ensureAuthUser(supabase, {
    email: "admin@example.com",
    password: "Admin123456!",
    role: "admin",
  });
  const managerUser = await ensureAuthUser(supabase, {
    email: "manager@example.com",
    password: "Manager123456!",
    role: "manager",
  });
  const parentUser = await ensureAuthUser(supabase, {
    email: "parent_phuhuynh01_seed@internal.bantru.local",
    password: "Parent123456!",
    role: "parent",
  });

  const { data: adminProfile, error: adminProfileError } = await supabase
    .from("profiles")
    .upsert(
      {
        auth_user_id: adminUser.id,
        role: "admin",
        full_name: "Admin Demo",
        email: "admin@example.com",
        status: "active",
      },
      { onConflict: "auth_user_id" },
    )
    .select("id")
    .single();
  if (adminProfileError) throw adminProfileError;

  await supabase.from("profiles").upsert(
    {
      auth_user_id: managerUser.id,
      role: "manager",
      full_name: "Quản lý Demo",
      email: "manager@example.com",
      status: "active",
    },
    { onConflict: "auth_user_id" },
  );

  const { data: parentProfile, error: parentProfileError } = await supabase
    .from("profiles")
    .upsert(
      {
        auth_user_id: parentUser.id,
        role: "parent",
        full_name: "Phụ huynh 01",
        email: null,
        phone: null,
        status: "active",
      },
      { onConflict: "auth_user_id" },
    )
    .select("id")
    .single();
  if (parentProfileError) throw parentProfileError;

  const username = "phuhuynh01";
  const { data: parent, error: parentError } = await supabase
    .from("parents")
    .upsert(
      {
        profile_id: parentProfile.id,
        auth_user_id: parentUser.id,
        full_name: "Phụ huynh 01",
        username,
        username_normalized: normalizeUsername(username),
        phone: null,
        email: null,
        internal_auth_email: "parent_phuhuynh01_seed@internal.bantru.local",
        status: "active",
        profile_completed: false,
      },
      { onConflict: "username_normalized" },
    )
    .select("id")
    .single();
  if (parentError) throw parentError;

  for (const fullName of ["Nguyễn Văn Minh", "Nguyễn Ngọc An"]) {
    const { data: existing } = await supabase.from("students").select("id").eq("parent_id", parent.id).eq("full_name", fullName).maybeSingle();
    if (!existing) {
      await supabase.from("students").insert({
        parent_id: parent.id,
        full_name: fullName,
        school_name: "Tiểu học Demo",
        class_name: fullName.endsWith("Minh") ? "3A" : "1B",
        status: "active",
      });
    }
  }

  await supabase.from("fee_settings").upsert(
    {
      year_month: getYearMonthVN(),
      fee_per_attendance_day: 80000,
      currency: "VND",
      note: "Seed tháng hiện tại",
      created_by: adminProfile.id,
    },
    { onConflict: "year_month" },
  );

  console.log("Seed completed");
  console.log("Admin: admin@example.com / Admin123456!");
  console.log("Manager: manager@example.com / Manager123456!");
  console.log("Parent: phuhuynh01 / Parent123456!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
