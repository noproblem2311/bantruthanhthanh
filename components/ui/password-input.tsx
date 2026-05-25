"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function PasswordInput({ className, id, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={inputId}
        type={visible ? "text" : "password"}
        className={cn(
          "h-10 w-full min-w-0 rounded-md border bg-white px-3 py-2 pr-11 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-muted sm:text-sm",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-controls={inputId}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
