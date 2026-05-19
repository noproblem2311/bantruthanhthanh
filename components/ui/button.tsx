import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import Link from "next/link";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  outline: "border bg-white hover:bg-muted/70",
  ghost: "hover:bg-muted/70",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const sizes = {
  sm: "h-9 gap-1.5 px-3 text-sm",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-11 gap-2 px-5 text-base",
  icon: "h-10 w-10 p-0",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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

export function ButtonLink({ className, variant = "primary", size = "md", href, ...props }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
