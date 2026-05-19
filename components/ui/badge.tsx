import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const variants = {
  default: "bg-slate-900 text-white",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-sky-100 text-sky-800",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({ className, variant = "default", ...props }: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium leading-none",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
