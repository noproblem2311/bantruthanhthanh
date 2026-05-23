import { z } from "zod";

export const createParentSchema = z.object({
  username: z.string().min(2, "Username tối thiểu 2 ký tự"),
  temporary_password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  full_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const updateParentSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(2),
  full_name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]),
});

export const resetPasswordSchema = z.object({
  parent_id: z.string().uuid(),
  password_reset_request_id: z.string().uuid().optional().or(z.literal("")),
  new_password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
});

export const studentSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  parent_id: z.string().uuid("Vui lòng chọn phụ huynh"),
  full_name: z.string().min(2, "Vui lòng nhập tên học sinh"),
  nickname: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  school_name: z.string().optional(),
  class_name: z.string().optional(),
  health_notes: z.string().optional(),
  allergy_notes: z.string().optional(),
  pickup_notes: z.string().optional(),
  boarding_package_type: z.enum(["weekday", "saturday"]).default("weekday"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const managerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  full_name: z.string().min(2, "Vui lòng nhập họ tên"),
  phone: z.string().optional(),
});

export const updateManagerStatusSchema = z.object({
  profile_id: z.string().uuid(),
  status: z.enum(["active", "inactive"]),
});

export const feeSettingSchema = z.object({
  year_month: z.string().regex(/^\d{4}-\d{2}$/, "Tháng không hợp lệ"),
  saturday_package_amount: z.coerce.number().int().min(0),
  weekday_package_amount: z.coerce.number().int().min(0),
  absence_deduction_amount: z.coerce.number().int().min(0),
  currency: z.string().default("VND"),
  note: z.string().optional(),
});

export const monthlyHistoryCaptureSchema = z.object({
  billing_year_month: z.string().regex(/^\d{4}-\d{2}$/, "Tháng capture không hợp lệ"),
  note: z.string().optional(),
});

export const appSettingsSchema = z.object({
  center_name: z.string().min(2),
  phone: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  zalo_url: z.string().optional(),
  facebook_url: z.string().optional(),
});
