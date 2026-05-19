# Bán trú Learning Hub

Web app quản lý bán trú học sinh tiểu học bằng Next.js App Router, TypeScript, Supabase Auth/PostgreSQL/RLS và Tailwind UI.

## Tính năng MVP

- Trang chủ public giới thiệu bán trú.
- Parent login bằng `username + password`, không dùng email ở màn đăng nhập.
- Admin/manager login bằng email/password Supabase Auth.
- Supabase SSR auth cookie bằng `@supabase/ssr`.
- Middleware phân quyền `/admin`, `/manager`, `/parent`.
- Admin quản lý phụ huynh, học sinh, manager, điểm danh, đơn xin nghỉ, reset mật khẩu, cấu hình phí, tổng hợp phí CSV, settings.
- Manager xem học sinh active, đơn xin nghỉ, điểm danh theo ngày, search/filter, bulk mark present.
- Parent xem con, cập nhật profile, xin nghỉ trước 06:00 giờ Việt Nam, xem điểm danh và phí tháng.
- RLS bật cho tất cả bảng app trong `public`.

## 1. Tạo Supabase project

Có thể dùng project hiện có:

```env
NEXT_PUBLIC_SUPABASE_URL=https://aljycybkwxjywzaipmjw.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Q7hJe-L-LZ-BmAVsCxDyDA_L-YHA9MK
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Q7hJe-L-LZ-BmAVsCxDyDA_L-YHA9MK
```

Lấy `SUPABASE_SECRET_KEY` hoặc `SUPABASE_SERVICE_ROLE_KEY` trong Supabase Dashboard > Project Settings > API. Key này chỉ dùng server-side, không prefix `NEXT_PUBLIC_`.

## 2. Environment variables

Tạo `.env.local` từ `.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://aljycybkwxjywzaipmjw.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Q7hJe-L-LZ-BmAVsCxDyDA_L-YHA9MK
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Q7hJe-L-LZ-BmAVsCxDyDA_L-YHA9MK
SUPABASE_SECRET_KEY=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Không import `lib/supabase/admin.ts` trong Client Components.

## 3. Chạy migrations

Chạy SQL trong Supabase SQL Editor hoặc Supabase CLI:

```bash
supabase db push
```

Migration chính nằm ở:

```text
supabase/migrations/001_initial_schema.sql
```

File này tạo schema, indexes, helper functions `get_current_role()`, `is_admin()`, `is_manager()`, `is_parent()` và RLS policies.

## 4. Cài đặt và chạy local

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## 5. Seed user test

Sau khi migrations đã chạy và `.env.local` có service role key:

```bash
npm run seed
```

Tài khoản test:

- Admin: `admin@example.com` / `Admin123456!`
- Manager: `manager@example.com` / `Manager123456!`
- Parent: `phuhuynh01` / `Parent123456!`

`supabase/seed.sql` chỉ seed app settings và fee setting. Auth users cần tạo bằng `npm run seed` vì Supabase Auth không nên seed bằng SQL migration trực tiếp.

## 6. Deploy Vercel

1. Push repo lên GitHub.
2. Import project vào Vercel.
3. Thêm env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app`
4. Deploy.
5. Trong Supabase Auth settings, thêm domain Vercel vào Site URL/Redirect URLs nếu dùng OAuth/callback.

## 7. Ghi chú security

- Password không lưu plaintext.
- Parent username được normalize bỏ dấu/lowercase để login ổn định.
- Email nội bộ dạng `parent_<username>_<random>@internal.bantru.local` chỉ để tương thích Supabase Auth.
- `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng trong Server Actions, seed script và server-only utilities.
- RLS bảo vệ parent chỉ query được dữ liệu của con mình.
- Manager không có policy xem password reset requests hoặc cập nhật fee settings.

## 8. Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run seed
```
