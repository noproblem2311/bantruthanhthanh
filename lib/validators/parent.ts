import { z } from "zod";

export const parentProfileSchema = z.object({
  full_name: z.string().min(2, "Vui lòng nhập họ tên"),
  phone: z.string().min(8, "Vui lòng nhập số điện thoại"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
});

export const offRequestSchema = z.object({
  student_id: z.string().uuid("Vui lòng chọn học sinh"),
  off_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày nghỉ không hợp lệ"),
  reason: z.string().min(2, "Vui lòng nhập lý do"),
});

export const cancelOffRequestSchema = z.object({
  request_id: z.string().uuid(),
});
