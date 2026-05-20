"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border bg-white hover:bg-muted/70",
  ghost: "hover:bg-muted/70",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const sizes = {
  sm: "min-h-9 gap-1.5 px-3 py-2 text-sm",
  md: "min-h-10 gap-2 px-4 py-2 text-sm",
  lg: "min-h-11 gap-2 px-5 py-2.5 text-base",
  icon: "h-10 w-10 shrink-0 p-0",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "max-w-full text-center leading-snug",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function ButtonLink({ className, variant = "primary", size = "md", href, children, onClick, target, ...props }: ButtonLinkProps) {
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
        "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "max-w-full text-center leading-snug",
        variants[variant],
        sizes[size],
        showPending && "opacity-80",
        className,
      )}
      {...props}
    >
      {showPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </Link>
  );
}
