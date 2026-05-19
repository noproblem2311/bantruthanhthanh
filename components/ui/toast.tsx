"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toast({ message, type = "success" }: { message?: string; type?: "success" | "error" }) {
  if (!message) return null;

  const Icon = type === "success" ? CheckCircle2 : XCircle;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-2 rounded-lg border bg-white px-4 py-3 text-sm shadow-xl",
        type === "success" ? "border-emerald-200 text-emerald-800" : "border-red-200 text-red-800",
      )}
    >
      <Icon className="h-4 w-4" />
      {message}
    </div>
  );
}
