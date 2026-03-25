"use client";

import { useState, useEffect } from "react";

export default function Sidebar({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // detectar tamaño de pantalla
  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div
        className={`
          fixed z-40 h-full transition-all duration-300
          ${isMobile
            ? `bg-black/50 ${isOpen ? "w-full" : "w-0"}`
            : ""}
        `}
        onClick={() => isMobile && setIsOpen(false)}
      >
        <aside
          onClick={(e) => e.stopPropagation()}
          className={`
            h-full w-64 border-r transition-all duration-300
            ${isMobile
              ? `bg-white ${isOpen ? "translate-x-0" : "-translate-x-full"}`
              : `${isOpen ? "translate-x-0" : "-translate-x-full"} bg-white`
            }
          `}
        >
          {sidebar}
        </aside>
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 border-b p-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-xl border px-3 py-2"
          >
            ☰
          </button>

          <h1 className="font-semibold">Dashboard</h1>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}