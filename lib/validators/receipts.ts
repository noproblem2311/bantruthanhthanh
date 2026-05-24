import { z } from "zod";

const moneySchema = z.coerce.number().int().default(0);

export const manualReceiptItemSchema = z.object({
  student_name: z.string().trim().min(1, "Vui lòng nhập tên học sinh"),
  class_name: z.string().trim().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày bắt đầu không hợp lệ").optional().or(z.literal("")),
  studies_saturday: z.boolean().default(false),
  boarding_amount: moneySchema.pipe(z.number().min(0)),
  saturday_amount: moneySchema.pipe(z.number().min(0)),
  computer_amount: moneySchema.pipe(z.number().min(0)),
  english_amount: moneySchema.pipe(z.number().min(0)),
  other_label: z.string().trim().optional(),
  other_amount: moneySchema,
  note: z.string().trim().optional(),
});

export const manualReceiptBatchSchema = z.object({
  title: z.string().trim().min(2, "Vui lòng nhập tên batch phiếu thu"),
  billing_year_month: z.string().regex(/^\d{4}-\d{2}$/, "Tháng thu tiền không hợp lệ"),
  note: z.string().trim().optional(),
  items: z.array(manualReceiptItemSchema).min(1, "Vui lòng nhập ít nhất 1 học sinh"),
});
