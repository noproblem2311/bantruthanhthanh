"use client";

import { RefreshCw } from "lucide-react";

export function AttendanceRefreshLink({ href }: { href: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const url = new URL(href, window.location.origin);
        url.searchParams.set("refresh", Date.now().toString());
        window.location.assign(url.toString());
      }}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border bg-white px-4 py-2 text-sm font-medium shadow-sm transition hover:bg-muted/60"
    >
      <RefreshCw className="h-4 w-4" />
      Làm mới dữ liệu
    </button>
  );
}
