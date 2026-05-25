"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SelectAllPresentButton({ formId }: { formId: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full sm:w-auto"
      onClick={() => {
        const form = document.getElementById(formId);
        if (!form) return;

        form.querySelectorAll<HTMLInputElement>('input[data-status-value="present"][data-current-status="not_marked"]').forEach((radio) => {
          if (radio.disabled) return;
          radio.checked = true;
        });
        form.dispatchEvent(new Event("change", { bubbles: true }));
      }}
    >
      <Users className="h-4 w-4" />
      Chọn tất cả chưa xử lý: Có mặt
    </Button>
  );
}
