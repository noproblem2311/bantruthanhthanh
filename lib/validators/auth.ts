import { z } from "zod";

export const parentLoginSchema = z.object({
  username: z.string().min(2, "Vui lòng nhập username"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const staffLoginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const forgotPasswordSchema = z.object({
  username: z.string().min(2, "Vui lòng nhập username"),
  phone: z.string().optional(),
  note: z.string().optional(),
});
