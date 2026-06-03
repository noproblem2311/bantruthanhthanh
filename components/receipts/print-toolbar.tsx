"use client";

import { Printer } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function ReceiptPrintToolbar({ paperSize }: { paperSize: "a4" | "a5" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updatePaperSize(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("paper", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="no-print sticky top-0 z-20 border-b bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Phiếu thu</p>
          <p className="text-xs text-muted-foreground">
            Chọn máy in hoặc “Save as PDF”. {paperSize === "a4" ? "Mỗi trang A4 có 2 phiếu." : "Mỗi trang A5 có 1 phiếu."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={paperSize} onChange={(event) => updatePaperSize(event.target.value)} aria-label="Khổ giấy" className="w-28">
            <option value="a4">A4</option>
            <option value="a5">A5</option>
          </Select>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            In / lưu PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
