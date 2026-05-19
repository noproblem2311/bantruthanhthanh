import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const variants = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

export function Alert({ className, variant = "info", ...props }: HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof variants }) {
  return <div className={cn("rounded-lg border p-4 text-sm", variants[variant], className)} {...props} />;
}
