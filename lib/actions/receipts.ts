"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { redirectWithMessage } from "@/lib/auth/messages";
import { requireRole } from "@/lib/permissions";
import { manualReceiptBatchSchema } from "@/lib/validators/receipts";

function parseItemsJson(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return [];
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return [];
  }
}

export async function createManualReceiptBatchAction(formData: FormData) {
  const profile = await requireRole("admin");
  const parsed = manualReceiptBatchSchema.safeParse({
    title: formData.get("title"),
    billing_year_month: formData.get("billing_year_month"),
    note: formData.get("note"),
    items: parseItemsJson(formData.get("items_json")),
  });

  if (!parsed.success) {
    redirectWithMessage("/admin/receipts?mode=manual", "error", parsed.error.issues[0]?.message || "Dữ liệu phiếu thu chưa hợp lệ");
  }

  const supabase = await createClient();
  const { data: batch, error: batchError } = await supabase
    .from("receipt_batches")
    .insert({
      source_type: "manual",
      title: parsed.data.title,
      billing_year_month: parsed.data.billing_year_month,
      note: parsed.data.note || null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    redirectWithMessage("/admin/receipts?mode=manual", "error", "Không tạo được batch phiếu thu");
  }

  const rows = parsed.data.items.map((item, index) => ({
    batch_id: batch.id,
    sort_order: index + 1,
    student_name: item.student_name,
    class_name: item.class_name || null,
    start_date: item.start_date || null,
    studies_saturday: item.studies_saturday,
    boarding_amount: item.boarding_amount,
    saturday_amount: item.saturday_amount,
    computer_amount: item.computer_amount,
    english_amount: item.english_amount,
    other_label: item.other_label || null,
    other_amount: item.other_amount,
    note: item.note || null,
  }));

  const { error: rowsError } = await supabase.from("receipt_items").insert(rows);
  if (rowsError) {
    await supabase.from("receipt_batches").delete().eq("id", batch.id);
    redirectWithMessage("/admin/receipts?mode=manual", "error", "Không lưu được chi tiết phiếu thu");
  }

  redirect(`/print/receipts?source=manual&batch_id=${batch.id}`);
}
