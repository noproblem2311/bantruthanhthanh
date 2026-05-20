"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SelectAllPresentButton({ formId }: { formId: string }) {
  return (
    <Button
      type="button"
      variant="secondary"
      onClick={() => {
        const form = document.getElementById(formId);
        if (!form) return;

        form.querySelectorAll<HTMLInputElement>('input[data-status-value="present"][data-current-status="not_marked"]').forEach((radio) => {
          radio.checked = true;
        });
      }}
    >
      <Users className="h-4 w-4" />
      Chọn tất cả chưa xử lý: Có mặt
    </Button>
  );
}
