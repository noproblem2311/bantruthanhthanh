"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  ClipboardList,
  CreditCard,
  Home,
  KeyRound,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: "home" | "children" | "attendance" | "fees" | "profile" | "settings" | "parents" | "security" | "requests";
};

const icons = {
  home: Home,
  children: UsersRound,
  attendance: CalendarCheck,
  fees: CreditCard,
  profile: UserRound,
  settings: Settings,
  parents: UsersRound,
  security: ShieldCheck,
  requests: ClipboardList,
};

export function DashboardNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 py-2 lg:block lg:space-y-1 lg:overflow-visible lg:p-3">
      {items.map((item) => {
        const Icon = icons[item.icon] || KeyRound;
        const active = pathname === item.href || (item.href !== "/admin" && item.href !== "/parent" && item.href !== "/manager" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-max items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
              active ? "bg-primary text-white" : "text-slate-600 hover:bg-muted",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
