import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requirePlatformAdmin();

  return (
    <main className="min-h-screen bg-[#f6f1e8] px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:gap-6">
        <aside className="w-full rounded-[2rem] border border-[#e7d8c7] bg-[#fffaf3] p-4 shadow-sm lg:max-w-xs lg:p-5">
          <div className="mb-5 rounded-[1.5rem] bg-[#3b2f2a] p-4 text-[#fffaf3] sm:p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#d8c6b6]">
              Panel interno
            </p>
            <h1 className="mt-2 text-xl font-semibold sm:text-2xl">
              Admin SaaS
            </h1>
            <p className="mt-2 break-all text-sm text-[#e6d8cc]">
              {user.email}
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <Link
              href="/admin"
              className="rounded-xl px-3 py-2 text-center text-sm font-medium text-[#3f3128] transition hover:bg-[#f3e5d8] lg:text-left"
            >
              Resumen
            </Link>

            <Link
              href="/admin/businesses"
              className="rounded-xl px-3 py-2 text-center text-sm font-medium text-[#3f3128] transition hover:bg-[#f3e5d8] lg:text-left"
            >
              Negocios
            </Link>

            <Link
              href="/admin/users"
              className="rounded-xl px-3 py-2 text-center text-sm font-medium text-[#3f3128] transition hover:bg-[#f3e5d8] lg:text-left"
            >
              Usuarios
            </Link>

            <Link
              href="/admin/memberships"
              className="rounded-xl px-3 py-2 text-center text-sm font-medium text-[#3f3128] transition hover:bg-[#f3e5d8] lg:text-left"
            >
              Vinculaciones
            </Link>

            <Link
              href="/choose-access"
              className="col-span-2 rounded-xl px-3 py-2 text-center text-sm font-medium text-[#3f3128] transition hover:bg-[#f3e5d8] sm:col-span-3 lg:col-span-1 lg:text-left"
            >
              Cambiar acceso
            </Link>
          </nav>

          <div className="mt-5 border-t border-[#ead9c8] pt-4">
            <Link
              href="/dashboard"
              className="block rounded-xl px-3 py-2 text-sm font-medium text-[#6b5b4d] transition hover:bg-[#f3e5d8] hover:text-[#2f241d]"
            >
              ← Volver al dashboard
            </Link>
          </div>
        </aside>

        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  );
}