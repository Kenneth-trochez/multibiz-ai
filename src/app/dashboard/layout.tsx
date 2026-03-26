import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/tenant/getCurrentBusiness";
import SidebarShell from "./SidebarShell";
import SidebarNav from "./SidebarNav";
import { signOutAction } from "../actions/auth";
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
  | "settings";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  section: AppSection;
};

function getThemeClasses(theme: string) {
  switch (theme) {
    case "dark":
      return {
        pageBg: "bg-[#181818] text-white",
        sidebarBg: "bg-[#222222] border-[#333333]",
        sidebarCard: "bg-[#2b2b2b] border-[#3a3a3a]",
        textMuted: "text-[#bdbdbd]",
        hover: "hover:bg-[#343434]",
        active: "bg-white text-black",
        buttonSecondary:
          "bg-[#2b2b2b] border-[#444444] text-white hover:bg-[#343434]",
        logoutButton:
          "bg-[#3a2020] border border-[#5a2d2d] text-white hover:bg-[#4a2525]",
        headerBg: "bg-[#181818]/90 border-[#333333]",
      };

    case "elegant":
      return {
        pageBg: "bg-[#f4efe8] text-[#2b211b]",
        sidebarBg: "bg-[#fffaf5] border-[#e6d8c8]",
        sidebarCard: "bg-white border-[#eadfce]",
        textMuted: "text-[#7a6858]",
        hover: "hover:bg-[#f3e8dc]",
        active: "bg-[#6b4f3a] text-white",
        buttonSecondary:
          "bg-white border-[#d8c7b7] text-[#2b211b] hover:bg-[#f3e8dc]",
        logoutButton:
          "bg-[#7c3f3f] border border-[#7c3f3f] text-white hover:bg-[#693434]",
        headerBg: "bg-[#f4efe8]/90 border-[#e6d8c8]",
      };

    case "minimal":
      return {
        pageBg: "bg-[#f8f8f8] text-[#1f1f1f]",
        sidebarBg: "bg-white border-[#e5e5e5]",
        sidebarCard: "bg-[#fafafa] border-[#e5e5e5]",
        textMuted: "text-[#6f6f6f]",
        hover: "hover:bg-[#f1f1f1]",
        active: "bg-[#111111] text-white",
        buttonSecondary:
          "bg-white border-[#d6d6d6] text-[#1f1f1f] hover:bg-[#f1f1f1]",
        logoutButton:
          "bg-[#111111] border border-[#111111] text-white hover:bg-[#222222]",
        headerBg: "bg-[#f8f8f8]/90 border-[#e5e5e5]",
      };

    case "warm":
    default:
      return {
        pageBg: "bg-[#f6f1e8] text-[#2f241d]",
        sidebarBg: "bg-[#fffaf3] border-[#e7d8c7]",
        sidebarCard: "bg-white border-[#eadfce]",
        textMuted: "text-[#6b5b4d]",
        hover: "hover:bg-[#f3e8dc]",
        active: "bg-[#a56a3a] text-white",
        buttonSecondary:
          "bg-white border-[#d9c6b2] text-[#2f241d] hover:bg-[#f3e8dc]",
        logoutButton:
          "bg-[#8e4a3a] border border-[#8e4a3a] text-white hover:bg-[#7b3f31]",
        headerBg: "bg-[#f6f1e8]/90 border-[#eadfce]",
      };
  }
}

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
        <div className={`rounded-2xl border p-4 ${theme.sidebarCard}`}>
          <p className="text-sm font-medium">Cuenta</p>
          <p className={`mt-1 truncate text-xs ${theme.textMuted}`}>
            {user?.email || "Usuario"}
          </p>
          <p className={`mt-1 text-[11px] uppercase tracking-wide ${theme.textMuted}`}>
            Rol: {role}
          </p>
        </div>

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