"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import type { AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function PendingLink({
  href,
  className,
  children,
  showSpinner = true,
  onClick,
  target,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  showSpinner?: boolean;
}) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const hrefPath = href.startsWith("/") ? href.split("?")[0] : href;
  const isPending = pendingHref === href && hrefPath !== pathname;

  return (
    <Link
      href={href}
      aria-busy={isPending}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          target === "_blank" ||
          href.startsWith("#") ||
          href.startsWith("http") ||
          hrefPath === pathname
        ) {
          return;
        }
        setPendingHref(href);
      }}
      target={target}
      className={cn(
        "transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        isPending && "pointer-events-none opacity-80",
        className,
      )}
      {...props}
    >
      {showSpinner && isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </Link>
  );
}
