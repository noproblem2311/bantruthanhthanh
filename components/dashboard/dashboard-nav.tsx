"use client";

import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  ClipboardList,
  CreditCard,
  History,
  Home,
  KeyRound,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  UserRound,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PendingLink } from "@/components/ui/pending-link";

export type NavItem = {
  href: string;
  label: string;
  icon: "home" | "children" | "attendance" | "fees" | "history" | "profile" | "settings" | "parents" | "security" | "requests" | "ingredients";
};

const icons = {
  home: Home,
  children: UsersRound,
  attendance: CalendarCheck,
  fees: CreditCard,
  history: History,
  profile: UserRound,
  settings: Settings,
  parents: UsersRound,
  security: ShieldCheck,
  requests: ClipboardList,
  ingredients: ShoppingBasket,
};

export function DashboardNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex snap-x gap-1 overflow-x-auto px-2 py-2 lg:block lg:space-y-1 lg:overflow-visible lg:p-3">
      {items.map((item) => {
        const Icon = icons[item.icon] || KeyRound;
        const active = pathname === item.href || (item.href !== "/admin" && item.href !== "/parent" && item.href !== "/manager" && pathname.startsWith(item.href));
        return (
          <PendingLink
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-w-max snap-start items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:shadow-sm",
              active ? "bg-primary text-white" : "text-slate-600 hover:bg-muted",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </PendingLink>
        );
      })}
    </nav>
  );
}
