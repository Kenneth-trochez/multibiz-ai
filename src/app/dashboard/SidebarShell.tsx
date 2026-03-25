"use client";

import { useEffect, useState } from "react";

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
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const saved = window.localStorage.getItem("dashboard-sidebar-collapsed");
    if (saved === "true") {
      setIsDesktopCollapsed(true);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.localStorage.setItem(
      "dashboard-sidebar-collapsed",
      String(isDesktopCollapsed)
    );
  }, [isDesktopCollapsed, mounted]);

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
          "fixed inset-y-0 left-0 z-50 w-72 transform border-r transition-transform duration-300 lg:z-30",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          isDesktopCollapsed ? "lg:hidden" : "lg:block",
          sidebarClassName,
        ].join(" ")}
      >
        <div className="h-full overflow-y-auto">
          <div className="lg:hidden flex justify-end p-3">
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
            "sticky top-0 z-20 flex items-center justify-between border-b px-4 py-4 backdrop-blur",
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

            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
            </div>
          </div>
        </header>

        <main className={contentClassName}>{children}</main>
      </div>
    </div>
  );
}