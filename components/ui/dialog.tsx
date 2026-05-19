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
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-base font-semibold">{title}</h2>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Đóng">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
