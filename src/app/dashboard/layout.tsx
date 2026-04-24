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
  | "settings"
  | "ai_assistant";

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

function getThemeGlow(theme: string) {
  switch (theme) {
    case "dark":
      return {
        primary: "bg-[#ff7a1a]/18",
        secondary: "bg-white/8",
        tertiary: "bg-[#9f7aea]/10",
      };
    case "elegant":
      return {
        primary: "bg-[#b98a63]/18",
        secondary: "bg-[#f6e7d8]/20",
        tertiary: "bg-white/18",
      };
    case "rose_glam":
      return {
        primary: "bg-[#ff4fa3]/24",
        secondary: "bg-[#a855f7]/18",
        tertiary: "bg-white/10",
      };
    case "sunset_pop":
      return {
        primary: "bg-[#ff7a00]/24",
        secondary: "bg-[#ff5a36]/18",
        tertiary: "bg-white/8",
      };
    case "violet_neon":
      return {
        primary: "bg-[#d66bff]/24",
        secondary: "bg-[#4f9cff]/20",
        tertiary: "bg-white/10",
      };
    case "aqua_lux":
      return {
        primary: "bg-[#00cfd5]/20",
        secondary: "bg-[#28c493]/18",
        tertiary: "bg-white/10",
      };
    case "ruby_night":
      return {
        primary: "bg-[#e11d48]/20",
        secondary: "bg-[#be185d]/16",
        tertiary: "bg-white/8",
      };
    case "blush_pop":
      return {
        primary: "bg-[#ec5f95]/14",
        secondary: "bg-[#f7bfd5]/18",
        tertiary: "bg-white/16",
      };
    case "cotton_candy":
      return {
        primary: "bg-[#d66bff]/14",
        secondary: "bg-[#f1d8ff]/18",
        tertiary: "bg-white/16",
      };
    case "pearl_rose":
      return {
        primary: "bg-[#cc7f95]/14",
        secondary: "bg-[#f5dde4]/18",
        tertiary: "bg-white/16",
      };
    case "mint_day":
      return {
        primary: "bg-[#28c493]/14",
        secondary: "bg-[#cff4e6]/18",
        tertiary: "bg-white/16",
      };
    case "sky_breeze":
      return {
        primary: "bg-[#4f9cff]/14",
        secondary: "bg-[#d8eaff]/18",
        tertiary: "bg-white/16",
      };
    case "minimal":
      return {
        primary: "bg-black/6",
        secondary: "bg-black/4",
        tertiary: "bg-white/20",
      };
    case "warm":
    default:
      return {
        primary: "bg-[#a56a3a]/18",
        secondary: "bg-[#f1e5d7]/20",
        tertiary: "bg-white/18",
      };
  }
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
  const themeKey = business.theme || "warm";
  const theme = getThemeClasses(themeKey);
  const glow = getThemeGlow(themeKey);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allNavItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard", section: "dashboard" },
    { href: "/dashboard/customers", label: "Clientes", icon: "customers", section: "customers" },
    { href: "/dashboard/services", label: "Servicios", icon: "services", section: "services" },
    { href: "/dashboard/staff", label: "Staff", icon: "staff", section: "staff" },
    { href: "/dashboard/appointments", label: "Citas", icon: "appointments", section: "appointments" },
    { href: "/dashboard/products", label: "Productos", icon: "products", section: "products" },
    { href: "/dashboard/sales", label: "Ventas", icon: "sales", section: "sales" },
    { href: "/dashboard/balance", label: "Balance", icon: "balance", section: "balance" },
    { href: "/dashboard/ai-assistant", label: "IA Asistente", icon: "ai_assistant", section: "ai_assistant" },
    { href: "/dashboard/insights", label: "Alertas", icon: "insights", section: "dashboard" },
    { href: "/dashboard/settings", label: "Configuración", icon: "settings", section: "settings" },
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
            <p className={`mt-1 text-[11px] uppercase tracking-wide ${theme.textMuted}`}>
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
    <div className={`${theme.pageBg} relative overflow-hidden`}>
      <style>{`
        @keyframes blob-1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes blob-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-50px, 30px) scale(1.08); }
          66% { transform: translate(35px, -25px) scale(1.05); }
        }
        @keyframes blob-3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, 40px) scale(0.95); }
          66% { transform: translate(-40px, -20px) scale(1.1); }
        }
        .blob-1 { animation: blob-1 9s ease-in-out infinite; }
        .blob-2 { animation: blob-2 13s ease-in-out infinite; }
        .blob-3 { animation: blob-3 11s ease-in-out infinite; }
      `}</style>

      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className={`blob-1 absolute -left-24 top-[-50px] h-[340px] w-[340px] rounded-full blur-3xl ${glow.primary}`}
        />
        <div
          className={`blob-2 absolute right-[8%] top-[10%] h-[420px] w-[420px] rounded-full blur-3xl ${glow.secondary}`}
        />
        <div
          className={`blob-3 absolute bottom-[-70px] left-[30%] h-[360px] w-[360px] rounded-full blur-3xl ${glow.tertiary}`}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_58%,rgba(0,0,0,0.16)_100%)]" />
      </div>

      <div className="relative z-10">
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
    </div>
  );
}