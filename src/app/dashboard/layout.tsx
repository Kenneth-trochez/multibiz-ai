import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/tenant/getCurrentBusiness";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import SidebarShell from "./SidebarShell";
import SidebarNav from "./SidebarNav";
import { signOutAction } from "../actions/auth";
import Link from "next/link";
import {
  hasSectionAccess,
  type AppSection,
} from "@/lib/auth/permissions";

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
  section: AppSection;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getCurrentBusiness();

  if (!ctx?.business) {
    redirect("/onboarding");
  }

  const { business, role } = ctx;
  const theme = getThemeClasses(business.theme || "warm");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allNavItems: NavItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: "dashboard",
      section: "dashboard",
    },
    {
      href: "/dashboard/customers",
      label: "Clientes",
      icon: "customers",
      section: "customers",
    },
    {
      href: "/dashboard/services",
      label: "Servicios",
      icon: "services",
      section: "services",
    },
    {
      href: "/dashboard/staff",
      label: "Staff",
      icon: "staff",
      section: "staff",
    },
    {
      href: "/dashboard/appointments",
      label: "Citas",
      icon: "appointments",
      section: "appointments",
    },
    {
      href: "/dashboard/products",
      label: "Productos",
      icon: "products",
      section: "products",
    },
    {
      href: "/dashboard/sales",
      label: "Ventas",
      icon: "sales",
      section: "sales",
    },
    {
      href: "/dashboard/balance",
      label: "Balance",
      icon: "balance",
      section: "balance",
    },
    {
      href: "/dashboard/insights",
      label: "Alertas",
      icon: "insights",
      section: "dashboard",
    },
    {
      href: "/dashboard/settings",
      label: "Configuración",
      icon: "settings",
      section: "settings",
    },
  ];

  const navItems = allNavItems
    .filter((item) => hasSectionAccess(role, item.section))
    .map(({ href, label, icon }) => ({ href, label, icon }));

  const sidebar = (
    <div className={`flex h-full flex-col ${theme.sidebarBg}`}>
      <div className="border-b px-5 py-5">
        <div className="flex items-center gap-3">
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={business.name}
              className="h-12 w-12 rounded-2xl border object-cover"
            />
          ) : (
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border text-sm font-bold ${theme.sidebarCard}`}
            >
              {getInitials(business.name)}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{business.name}</p>
            <p className={`truncate text-xs ${theme.textMuted}`}>
              {business.business_type || "Negocio"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4">
        <SidebarNav
          navItems={navItems}
          hoverClass={theme.hover}
          activeClass={theme.active}
        />
      </div>

      <div className="space-y-3 border-t px-4 py-4">
        <Link href="/dashboard/profile">
          <div
            className={`cursor-pointer rounded-2xl border p-4 transition ${theme.sidebarCard} ${theme.hover}`}
          >
            <p className="text-sm font-medium">Cuenta</p>
            <p className={`mt-1 truncate text-xs ${theme.textMuted}`}>
              {user?.email || "Usuario"}
            </p>
            <p
              className={`mt-1 text-[11px] uppercase tracking-wide ${theme.textMuted}`}
            >
              Rol: {role}
            </p>
          </div>
        </Link>
        <br />
        <form action={signOutAction}>
          <button
            type="submit"
            className={`w-full rounded-2xl px-4 py-3 text-sm font-medium transition ${theme.logoutButton}`}
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className={theme.pageBg}>
      <SidebarShell
        sidebar={sidebar}
        sidebarClassName={theme.sidebarBg}
        headerClassName={theme.headerBg}
        contentClassName="p-4 md:p-6"
        buttonClassName={theme.buttonSecondary}
        title={business.name}
      >
        {children}
      </SidebarShell>
    </div>
  );
}