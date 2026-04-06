"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCog,
  CalendarDays,
  Settings as SettingsIcon,
  BarChart3,
  Package,
  ShoppingCart,
  BellRing,
} from "lucide-react";

type IconName =
  | "dashboard"
  | "customers"
  | "services"
  | "staff"
  | "appointments"
  | "products"
  | "sales"
  | "balance"
  | "insights"
  | "settings";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
};

function getIcon(icon: IconName) {
  switch (icon) {
    case "dashboard":
      return LayoutDashboard;
    case "customers":
      return Users;
    case "services":
      return Briefcase;
    case "staff":
      return UserCog;
    case "appointments":
      return CalendarDays;
    case "products":
      return Package;
    case "sales":
      return ShoppingCart;
    case "balance":
      return BarChart3;
    case "insights":
      return BellRing;
    case "settings":
      return SettingsIcon;
    default:
      return LayoutDashboard;
  }
}

export default function SidebarNav({
  navItems,
  hoverClass,
  activeClass,
}: {
  navItems: NavItem[];
  hoverClass: string;
  activeClass: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const Icon = getIcon(item.icon);

        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
              isActive ? activeClass : hoverClass
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}