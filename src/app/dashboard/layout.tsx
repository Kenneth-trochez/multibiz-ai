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
      return { primary: "bg-[#ff7a1a]/35", secondary: "bg-white/14", tertiary: "bg-[#9f7aea]/20" };
    case "elegant":
      return { primary: "bg-[#b98a63]/32", secondary: "bg-[#f6e7d8]/30", tertiary: "bg-white/22" };
    case "rose_glam":
      return { primary: "bg-[#ff4fa3]/40", secondary: "bg-[#a855f7]/32", tertiary: "bg-white/16" };
    case "sunset_pop":
      return { primary: "bg-[#ff7a00]/40", secondary: "bg-[#ff5a36]/30", tertiary: "bg-white/14" };
    case "violet_neon":
      return { primary: "bg-[#d66bff]/40", secondary: "bg-[#4f9cff]/32", tertiary: "bg-white/16" };
    case "aqua_lux":
      return { primary: "bg-[#00cfd5]/36", secondary: "bg-[#28c493]/30", tertiary: "bg-white/16" };
    case "ruby_night":
      return { primary: "bg-[#e11d48]/36", secondary: "bg-[#be185d]/28", tertiary: "bg-white/12" };
    case "blush_pop":
      return { primary: "bg-[#ec5f95]/28", secondary: "bg-[#f7bfd5]/30", tertiary: "bg-white/22" };
    case "cotton_candy":
      return { primary: "bg-[#d66bff]/28", secondary: "bg-[#f1d8ff]/30", tertiary: "bg-white/22" };
    case "pearl_rose":
      return { primary: "bg-[#cc7f95]/28", secondary: "bg-[#f5dde4]/30", tertiary: "bg-white/22" };
    case "mint_day":
      return { primary: "bg-[#28c493]/28", secondary: "bg-[#cff4e6]/30", tertiary: "bg-white/22" };
    case "sky_breeze":
      return { primary: "bg-[#4f9cff]/28", secondary: "bg-[#d8eaff]/30", tertiary: "bg-white/22" };
    case "minimal":
      return { primary: "bg-black/10", secondary: "bg-black/8", tertiary: "bg-white/26" };
    case "warm":
    default:
      return { primary: "bg-[#a56a3a]/32", secondary: "bg-[#f1e5d7]/30", tertiary: "bg-white/22" };
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

  const { data: { user } } = await supabase.auth.getUser();

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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <SidebarNav
          navItems={navItems}
          hoverClass={theme.hover}
          activeClass={theme.active}
        />
      </div>

      <div
        className="shrink-0 border-t px-4 py-4 flex flex-col gap-3"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <Link href="/dashboard/profile">
          <div className={`cursor-pointer rounded-2xl border p-4 transition ${theme.sidebarCard} ${theme.hover}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${theme.sidebarCard}`}>
                {(user?.email?.[0] || "U").toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">Cuenta</p>
                <p className={`mt-1 truncate text-xs ${theme.textMuted}`}>
                  {user?.email || "Usuario"}
                </p>
                <p className={`mt-1 text-[11px] uppercase tracking-wide ${theme.textMuted}`}>
                  Rol: {role}
                </p>
              </div>
            </div>
          </div>
        </Link>

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
          33% { transform: translate(60px, -45px) scale(1.15); }
          66% { transform: translate(-35px, 30px) scale(0.92); }
        }
        @keyframes blob-2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(-70px, 45px) scale(1.12); }
          66% { transform: translate(50px, -40px) scale(1.08); }
        }
        @keyframes blob-3 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(45px, 60px) scale(0.92); }
          66% { transform: translate(-55px, -30px) scale(1.15); }
        }
        .blob-1 { animation: blob-1 9s ease-in-out infinite; }
        .blob-2 { animation: blob-2 13s ease-in-out infinite; }
        .blob-3 { animation: blob-3 11s ease-in-out infinite; }
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.22); }
      `}</style>

      <div className="pointer-events-none absolute inset-0 z-0">
        <div className={`blob-1 absolute -left-32 top-[-80px] h-[500px] w-[500px] rounded-full blur-3xl ${glow.primary}`} />
        <div className={`blob-2 absolute right-[4%] top-[8%] h-[580px] w-[580px] rounded-full blur-3xl ${glow.secondary}`} />
        <div className={`blob-3 absolute bottom-[-100px] left-[25%] h-[520px] w-[520px] rounded-full blur-3xl ${glow.tertiary}`} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_58%,rgba(0,0,0,0.16)_100%)]" />
      </div>

      <div className="relative z-10">
        <SidebarShell
          sidebar={sidebar}
          businessName={business.name}
          businessType={business.business_type || "Negocio"}
          businessLogoUrl={business.logo_url || null}
          businessInitials={getInitials(business.name)}
          sidebarClassName={theme.sidebarBg}
          sidebarCardClassName={theme.sidebarCard}
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