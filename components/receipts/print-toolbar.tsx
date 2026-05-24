"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReceiptPrintToolbar() {
  return (
    <div className="no-print sticky top-0 z-20 border-b bg-white/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[210mm] items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Phiếu thu</p>
          <p className="text-xs text-muted-foreground">Chọn máy in hoặc “Save as PDF”. Mỗi trang A4 có 2 phiếu.</p>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          In / lưu PDF
        </Button>
      </div>
    </div>
  );
}
