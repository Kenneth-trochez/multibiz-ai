import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/requirePlatformAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminHomePage() {
  await requirePlatformAdmin();

  const supabase = createAdminClient();

  const [
    { count: businessesCount },
    { count: membersCount },
    { count: usersCount },
    { count: subscriptionsCount },
  ] = await Promise.all([
    supabase.from("businesses").select("*", { count: "exact", head: true }),
    supabase.from("business_members").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("business_subscriptions")
      .select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[#e7d8c7] bg-[#fffaf3] p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-[#2f241d]">
          Resumen global del SaaS
        </h2>
        <p className="mt-2 text-sm text-[#6b5b4d]">
          Panel interno para administrar la plataforma completa.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
          <p className="text-sm text-[#6b5b4d]">Negocios</p>
          <p className="mt-2 text-3xl font-bold text-[#2f241d]">
            {businessesCount || 0}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
          <p className="text-sm text-[#6b5b4d]">Vinculaciones</p>
          <p className="mt-2 text-3xl font-bold text-[#2f241d]">
            {membersCount || 0}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
          <p className="text-sm text-[#6b5b4d]">Usuarios</p>
          <p className="mt-2 text-3xl font-bold text-[#2f241d]">
            {usersCount || 0}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm">
          <p className="text-sm text-[#6b5b4d]">Suscripciones</p>
          <p className="mt-2 text-3xl font-bold text-[#2f241d]">
            {subscriptionsCount || 0}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/businesses"
          className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm uppercase tracking-[0.18em] text-[#8d582e]">
            Negocios
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[#2f241d]">
            Administrar negocios
          </h3>
          <p className="mt-2 text-sm text-[#6b5b4d]">
            Revisa branding, owners y suscripciones.
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm uppercase tracking-[0.18em] text-[#8d582e]">
            Usuarios
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[#2f241d]">
            Revisar usuarios
          </h3>
          <p className="mt-2 text-sm text-[#6b5b4d]">
            Consulta perfiles, correos y accesos.
          </p>
        </Link>

        <Link
          href="/admin/memberships"
          className="rounded-[1.5rem] border border-[#e7d8c7] bg-[#fffaf3] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="text-sm uppercase tracking-[0.18em] text-[#8d582e]">
            Vinculaciones
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[#2f241d]">
            Corregir relaciones
          </h3>
          <p className="mt-2 text-sm text-[#6b5b4d]">
            Edita roles y memberships del sistema.
          </p>
        </Link>
      </div>
    </div>
  );
}