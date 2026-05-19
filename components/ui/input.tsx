import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted",
        className,
      )}
      {...props}
    />
  );
}
