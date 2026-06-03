"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";

export function Dialog({
  trigger,
  title,
  children,
}: {
  trigger: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[min(90dvh,640px)] sm:max-w-lg sm:rounded-lg">
            <div className="flex shrink-0 items-center justify-between border-b px-4 py-3 sm:p-4">
              <h2 className="pr-2 text-base font-semibold leading-snug">{title}</h2>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Đóng">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="overflow-y-auto px-4 py-4 sm:p-4">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
