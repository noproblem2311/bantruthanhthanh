"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
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
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const hrefPath = href.startsWith("/") ? href.split(/[?#]/)[0] : href;
  const showPending = isPending && hrefPath !== pathname;

  return (
    <Link
      href={href}
      aria-busy={showPending}
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
          !href.startsWith("/") ||
          hrefPath === pathname
        ) {
          return;
        }
        event.preventDefault();
        startTransition(() => router.push(href));
      }}
      target={target}
      className={cn(
        "transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        showPending && "opacity-80",
        className,
      )}
      {...props}
    >
      {showSpinner && showPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </Link>
  );
}
