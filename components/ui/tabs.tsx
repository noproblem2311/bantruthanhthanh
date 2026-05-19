import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Tabs({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex rounded-md border bg-white p-1", className)} {...props} />;
}

export function TabLink({ className, active, ...props }: HTMLAttributes<HTMLAnchorElement> & { active?: boolean; href: string }) {
  return (
    <a
      className={cn(
        "flex-1 rounded px-3 py-2 text-center text-sm font-medium transition",
        active ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted",
        className,
      )}
      {...props}
    />
  );
}
