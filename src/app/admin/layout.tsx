import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requirePlatformAdmin();

  return (
    <main className="min-h-screen bg-[#f6f1e8] px-4 py-6">
      <div className="mx-auto flex max-w-7xl gap-6">
        <aside className="w-full max-w-xs rounded-[2rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
          <div className="mb-6 rounded-[1.5rem] bg-[#3b2f2a] p-5 text-[#fffaf3]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#d8c6b6]">
              Panel interno
            </p>
            <h1 className="mt-2 text-2xl font-semibold">Admin SaaS</h1>
            <p className="mt-2 break-all text-sm text-[#e6d8cc]">{user.email}</p>
          </div>

          <nav className="space-y-2">
            <Link
              href="/admin"
              className="block rounded-xl px-3 py-2 text-sm font-medium text-[#3f3128] transition hover:bg-[#f3e5d8]"
            >
              Resumen
            </Link>

            <Link
              href="/admin/businesses"
              className="block rounded-xl px-3 py-2 text-sm font-medium text-[#3f3128] transition hover:bg-[#f3e5d8]"
            >
              Negocios
            </Link>

            <Link
              href="/admin/users"
              className="block rounded-xl px-3 py-2 text-sm font-medium text-[#3f3128] transition hover:bg-[#f3e5d8]"
            >
              Usuarios
            </Link>

            <Link
              href="/admin/memberships"
              className="block rounded-xl px-3 py-2 text-sm font-medium text-[#3f3128] transition hover:bg-[#f3e5d8]"
            >
              Vinculaciones
            </Link>

            <Link
              href="/choose-access"
              className="block rounded-xl px-3 py-2 text-sm font-medium text-[#3f3128] transition hover:bg-[#f3e5d8]"
            >
              Cambiar acceso
            </Link>
          </nav>

          <div className="mt-6 border-t border-[#ead9c8] pt-4">
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