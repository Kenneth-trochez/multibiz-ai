import { createServiceAction } from "../../actions/services";
import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { requirePlanFeature } from "@/lib/billing/requirePlanFeature";
import { createClient } from "@/lib/supabase/server";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import Link from "next/link";
import ServicesList from "./ServicesList";

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  active: boolean;
  created_at: string;
};

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    success?: string;
    page?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const ctx = await requireSectionAccess("services");
  await requirePlanFeature("services");

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");
  const supabase = await createClient();

  const currentPage = Math.max(1, Number(params.page || "1") || 1);
  const searchTerm = String(params.q || "").trim();
  const pageSize = 10;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  let countQuery = supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id);

  let servicesQuery = supabase
    .from("services")
    .select("id, name, description, price, duration_minutes, active, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (searchTerm) {
    const searchFilter = `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`;
    countQuery = countQuery.or(searchFilter);
    servicesQuery = servicesQuery.or(searchFilter);
  }

  const { count, error: countError } = await countQuery;
  const { data: services, error } = await servicesQuery.range(from, to);

  if (error || countError) {
    return (
      <main className={`min-h-screen p-6 ${theme.pageBg}`}>
        <div className={`rounded-2xl border p-6 ${theme.card}`}>
          Error cargando servicios: {error?.message || countError?.message}
        </div>
      </main>
    );
  }

  const totalServices = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalServices / pageSize));
  const extraQuery = searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : "";

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Servicios</h1>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>
            Administra los servicios ofrecidos por el negocio.
          </p>
        </div>

        {params.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error}
          </p>
        )}

        {params.success === "created" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Servicio creado correctamente.
          </p>
        )}

        {params.success === "updated" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Servicio actualizado correctamente.
          </p>
        )}

        {params.success === "deleted" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Servicio eliminado correctamente.
          </p>
        )}

        {params.success === "deactivated" && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Servicio desactivado correctamente.
          </p>
        )}

        {params.success === "reactivated" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Servicio reactivado correctamente.
          </p>
        )}

        <section className={`rounded-2xl border p-4 shadow-sm ${theme.card}`}>
          <form action="/dashboard/services" className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              name="q"
              defaultValue={searchTerm}
              placeholder="Buscar por nombre o descripción..."
              className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
            />

            <div className="flex gap-2">
              <button
                type="submit"
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${theme.buttonPrimary}`}
              >
                Buscar
              </button>

              <Link
                href="/dashboard/services"
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${theme.buttonSecondary}`}
              >
                Limpiar
              </Link>
            </div>
          </form>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            <ServicesList services={(services || []) as ServiceRow[]} theme={theme} />

            <div className="flex items-center justify-between">
              <p className={`text-sm ${theme.textMuted}`}>
                Página {currentPage} de {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/services?page=${currentPage - 1}${extraQuery}`}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    currentPage <= 1
                      ? "pointer-events-none opacity-50"
                      : theme.buttonSecondary
                  }`}
                >
                  ← Anterior
                </Link>

                <Link
                  href={`/dashboard/services?page=${currentPage + 1}${extraQuery}`}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : theme.buttonSecondary
                  }`}
                >
                  Siguiente →
                </Link>
              </div>
            </div>
          </section>

          <section className={`rounded-2xl border p-6 shadow-sm ${theme.card}`}>
            <div>
              <h2 className="text-xl font-semibold">Nuevo servicio</h2>
              <p className={`mt-1 text-sm ${theme.textMuted}`}>
                Registra un servicio nuevo para el negocio.
              </p>
            </div>

            <form action={createServiceAction} className="mt-5 grid gap-4">
              <input type="hidden" name="businessId" value={business.id} />

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Nombre
                </label>
                <input
                  name="name"
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  required
                />
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Descripción
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                    Precio
                  </label>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                    required
                  />
                </div>

                <div>
                  <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                    Duración (minutos)
                  </label>
                  <input
                    name="duration"
                    type="number"
                    min="1"
                    step="1"
                    className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" name="active" defaultChecked />
                <span className={theme.label}>Servicio activo</span>
              </label>

              <button
                type="submit"
                className={`rounded-xl px-4 py-2 font-medium transition ${theme.buttonPrimary}`}
              >
                Guardar servicio
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}