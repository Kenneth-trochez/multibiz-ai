"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type SidebarShellProps = {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  sidebarClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  buttonClassName?: string;
  title?: string;
};

export default function SidebarShell({
  children,
  sidebar,
  sidebarClassName = "",
  headerClassName = "",
  contentClassName = "",
  buttonClassName = "",
  title = "Dashboard",
}: SidebarShellProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = window.localStorage.getItem("dashboard-sidebar-collapsed");
    if (saved === "true") setIsDesktopCollapsed(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(
      "dashboard-sidebar-collapsed",
      String(isDesktopCollapsed)
    );
  }, [isDesktopCollapsed, mounted]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen">

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-72 border-r transition-transform duration-300 lg:z-30",
          "isolate",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isDesktopCollapsed ? "lg:hidden" : "lg:block",
          sidebarClassName,
        ].join(" ")}
      >
        <div className="flex h-full flex-col overflow-hidden overscroll-contain">
          <div className="flex justify-end p-3 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className={[
                "rounded-xl border px-3 py-2 text-sm font-medium transition",
                buttonClassName,
              ].join(" ")}
            >
              Cerrar
            </button>
          </div>

          {sidebar}
        </div>
      </aside>

      <div
        className={[
          "min-h-screen transition-all duration-300",
          isDesktopCollapsed ? "lg:ml-0" : "lg:ml-72",
        ].join(" ")}
      >
        <header
          className={[
            "fixed top-0 left-0 right-0 z-20 flex items-center justify-between border-b px-4 py-4 backdrop-blur transition-all duration-300",
            isDesktopCollapsed ? "lg:left-0" : "lg:left-72",
            headerClassName,
          ].join(" ")}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className={[
                "rounded-xl border px-3 py-2 text-sm font-medium transition lg:hidden",
                buttonClassName,
              ].join(" ")}
              aria-label="Abrir menú"
            >
              ☰
            </button>

            <button
              type="button"
              onClick={() => setIsDesktopCollapsed((prev) => !prev)}
              className={[
                "hidden rounded-xl border px-3 py-2 text-sm font-medium transition lg:inline-flex",
                buttonClassName,
              ].join(" ")}
              aria-label="Ocultar o mostrar menú"
            >
              {isDesktopCollapsed ? "☰" : "✕"}
            </button>

            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        </header>

        <main className={`pt-[73px] ${contentClassName}`}>{children}</main>
      </div>
    </div>
  );
}