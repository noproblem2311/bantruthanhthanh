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

function getTodayVN() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

const requestedStudents = [
  { fullName: "Tú Quỳnh", className: "1/1", status: "active", parentUsername: "ph-tu-quynh-1-1", boardingPackageType: "weekday" },
  { fullName: "Thuỷ Ngân", className: "1/1", status: "active", parentUsername: "ph-thuy-ngan-1-1", boardingPackageType: "weekday" },
  { fullName: "Hoàng Long", className: "1/1", status: "active", parentUsername: "ph-hoang-long-1-1", boardingPackageType: "weekday" },
  { fullName: "Trung Long", className: "1/2", status: "active", parentUsername: "ph-trung-long-1-2", boardingPackageType: "weekday" },
  { fullName: "Đức Phúc", className: "1/3", status: "active", parentUsername: "ph-duc-phuc-1-3", boardingPackageType: "weekday" },
  { fullName: "Đức Thịnh", className: "1/3", status: "active", parentUsername: "ph-duc-thinh-1-3", boardingPackageType: "weekday" },
  { fullName: "Nhật Thành", className: "1/3", status: "active", parentUsername: "ph-nhat-thanh-1-3", boardingPackageType: "weekday" },
  { fullName: "Thuý Diễm", className: "1/3", status: "active", parentUsername: "ph-thuy-diem-1-3", boardingPackageType: "weekday" },
  { fullName: "an Nhiên", className: "1/3", status: "inactive", parentUsername: "ph-an-nhien-1-3", boardingPackageType: "weekday" },
  { fullName: "Bảo Vy", className: "1/3", status: "active", parentUsername: "ph-bao-vy-1-3", boardingPackageType: "weekday" },
  { fullName: "Khánh Hưng", className: "1/3", status: "active", parentUsername: "ph-khanh-hung-1-3", boardingPackageType: "weekday" },
  { fullName: "Nhã Phương", className: "1/3", status: "active", parentUsername: "ph-nha-phuong-1-3", boardingPackageType: "weekday" },
  { fullName: "Minh Khang", className: "1/4", status: "active", parentUsername: "ph-minh-khang-1-4", boardingPackageType: "weekday" },
  { fullName: "Bảo Châu", className: "2/2", status: "active", parentUsername: "ph-bao-chau-2-2", boardingPackageType: "weekday" },
  { fullName: "Hữu Việt", className: "2/4", status: "active", parentUsername: "ph-huu-viet-2-4", boardingPackageType: "weekday" },
  { fullName: "Tấn Phát", className: "2/4", status: "active", parentUsername: "ph-tan-phat-2-4", boardingPackageType: "weekday" },
  { fullName: "Bảo Châu", className: "2/4", status: "active", parentUsername: "ph-bao-chau-2-4", boardingPackageType: "weekday" },
  { fullName: "Tam An", className: "2/4", status: "active", parentUsername: "ph-tam-an-2-4", boardingPackageType: "weekday" },
  { fullName: "Ánh Tuyêt", className: "3/1", status: "active", parentUsername: "ph-anh-tuyet-3-1", boardingPackageType: "weekday" },
  { fullName: "Trúc Liên", className: "3/1", status: "active", parentUsername: "ph-truc-lien-3-1", boardingPackageType: "weekday" },
  { fullName: "Chí Nhân", className: "3/1", status: "active", parentUsername: "ph-chi-nhan-3-1", boardingPackageType: "weekday" },
  { fullName: "diệu thảo", className: "3/2", status: "active", parentUsername: "ph-dieu-thao-3-2", boardingPackageType: "weekday" },
  { fullName: "Bảo Uyên", className: "3/4", status: "active", parentUsername: "ph-bao-uyen-3-4", boardingPackageType: "weekday" },
  { fullName: "Nguyễn Hữu Tâm", className: "2/4", status: "active", parentUsername: "ph-nguyen-huu-tam-2-4", boardingPackageType: "weekday" },
  { fullName: "Nguyễn Hữu Tài", className: "4/4", status: "active", parentUsername: "ph-nguyen-huu-tai-4-4", boardingPackageType: "weekday" },
];

const placeholderParent = {
  fullName: "(chưa cập nhật)",
  username: "ph-chua-cap-nhat",
  internalAuthEmail: "parent_ph-chua-cap-nhat@internal.bantru.local",
};

const extraManagerAccount = {
  email: "quanly@example.com",
  password: "quanly123",
  fullName: "Quản lý",
};

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
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !serverKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY");
  }

  const supabase = createClient(url, serverKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const todayVN = getTodayVN();

  const { data: currentSettings } = await supabase.from("app_settings").select("id").limit(1).maybeSingle();
  if (currentSettings) {
    await supabase
      .from("app_settings")
      .update({
        center_name: "Phát Triển Toàn Diện",
        description: "Bán trú học tập cho học sinh tiểu học",
      })
      .eq("id", currentSettings.id);
  } else {
    await supabase.from("app_settings").insert({
      center_name: "Phát Triển Toàn Diện",
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
  const extraManagerUser = await ensureAuthUser(supabase, {
    email: extraManagerAccount.email,
    password: extraManagerAccount.password,
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

  await supabase.from("profiles").upsert(
    {
      auth_user_id: extraManagerUser.id,
      role: "manager",
      full_name: extraManagerAccount.fullName,
      email: extraManagerAccount.email,
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
        enrollment_date: todayVN,
        status: "active",
      });
    }
  }

  await supabase.from("parents").upsert(
    {
      full_name: placeholderParent.fullName,
      username: placeholderParent.username,
      username_normalized: normalizeUsername(placeholderParent.username),
      phone: null,
      email: null,
      internal_auth_email: placeholderParent.internalAuthEmail,
      status: "active",
      profile_completed: false,
    },
    { onConflict: "username_normalized" },
  );

  await supabase.from("fee_settings").upsert(
    {
      year_month: getYearMonthVN(),
      fee_per_attendance_day: 18000,
      saturday_package_amount: 850000,
      weekday_package_amount: 720000,
      absence_deduction_amount: 18000,
      currency: "VND",
      note: "Seed tháng hiện tại",
      created_by: adminProfile.id,
    },
    { onConflict: "year_month" },
  );

  for (const student of requestedStudents) {
    const usernameNormalized = normalizeUsername(student.parentUsername);
    const { data: existingParent, error: existingParentError } = await supabase
      .from("parents")
      .select("id")
      .eq("username_normalized", usernameNormalized)
      .maybeSingle();
    if (existingParentError) throw existingParentError;

    const { data: requestedParent, error: requestedParentError } = existingParent
      ? await supabase.from("parents").update({ status: student.status }).eq("id", existingParent.id).select("id").single()
      : await supabase
          .from("parents")
          .insert({
            full_name: null,
            username: student.parentUsername,
            username_normalized: usernameNormalized,
            phone: null,
            email: null,
            internal_auth_email: `parent_${usernameNormalized}@internal.bantru.local`,
            status: student.status,
            profile_completed: false,
          })
          .select("id")
          .single();
    if (requestedParentError) throw requestedParentError;

    const { data: existingStudent } = await supabase
      .from("students")
      .select("id")
      .eq("parent_id", requestedParent.id)
      .eq("full_name", student.fullName)
      .eq("class_name", student.className)
      .maybeSingle();

    if (existingStudent) {
      await supabase
        .from("students")
        .update({
          status: student.status,
          boarding_package_type: student.boardingPackageType,
          class_name: student.className,
          enrollment_date: todayVN,
        })
        .eq("id", existingStudent.id);
    } else {
      await supabase.from("students").insert({
        parent_id: requestedParent.id,
        full_name: student.fullName,
        class_name: student.className,
        enrollment_date: todayVN,
        status: student.status,
        boarding_package_type: student.boardingPackageType,
      });
    }
  }

  console.log("Seed completed");
  console.log("Admin: admin@example.com / Admin123456!");
  console.log("Manager: manager@example.com / Manager123456!");
  console.log(`Manager: ${extraManagerAccount.email} / ${extraManagerAccount.password}`);
  console.log("Parent: phuhuynh01 / Parent123456!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
