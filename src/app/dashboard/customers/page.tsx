import { createCustomerAction } from "../../actions/customers";
import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { requirePlanFeature } from "@/lib/billing/requirePlanFeature";
import { createClient } from "@/lib/supabase/server";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import Link from "next/link";
import CustomersList from "./CustomersList";

type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
};

export default async function CustomersPage({
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
  const ctx = await requireSectionAccess("customers");
  await requirePlanFeature("customers");

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");
  const supabase = await createClient();

  const currentPage = Math.max(1, Number(params.page || "1") || 1);
  const searchTerm = String(params.q || "").trim();
  const pageSize = 10;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  let countQuery = supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id);

  let customersQuery = supabase
    .from("customers")
    .select("id, name, phone, email, address, notes, active, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (searchTerm) {
    const searchFilter = `name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`;
    countQuery = countQuery.or(searchFilter);
    customersQuery = customersQuery.or(searchFilter);
  }

  const { count, error: countError } = await countQuery;
  const { data: customers, error } = await customersQuery.range(from, to);

  if (error || countError) {
    return (
      <main className={`min-h-screen p-6 ${theme.pageBg}`}>
        <div className={`rounded-2xl border p-6 ${theme.card}`}>
          Error cargando clientes: {error?.message || countError?.message}
        </div>
      </main>
    );
  }

  const totalCustomers = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCustomers / pageSize));
  const extraQuery = searchTerm ? `&q=${encodeURIComponent(searchTerm)}` : "";

  return (
    <main className={`min-h-screen p-6 ${theme.pageBg}`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>
            Administra la cartera de clientes del negocio actual.
          </p>
        </div>

        {params.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error}
          </p>
        )}

        {params.success === "created" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Cliente creado correctamente.
          </p>
        )}

        {params.success === "updated" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Cliente actualizado correctamente.
          </p>
        )}

        {params.success === "deleted" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Cliente eliminado correctamente.
          </p>
        )}

        {params.success === "deactivated" && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Cliente desactivado correctamente.
          </p>
        )}

        {params.success === "reactivated" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Cliente reactivado correctamente.
          </p>
        )}

        <section className={`rounded-2xl border p-4 shadow-sm ${theme.card}`}>
          <form action="/dashboard/customers" className="flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              name="q"
              defaultValue={searchTerm}
              placeholder="Buscar por nombre, teléfono, correo o dirección..."
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
                href="/dashboard/customers"
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${theme.buttonSecondary}`}
              >
                Limpiar
              </Link>
            </div>
          </form>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            <CustomersList customers={(customers || []) as CustomerRow[]} theme={theme} />

            <div className="flex items-center justify-between">
              <p className={`text-sm ${theme.textMuted}`}>
                Página {currentPage} de {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/customers?page=${currentPage - 1}${extraQuery}`}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    currentPage <= 1
                      ? "pointer-events-none opacity-50"
                      : theme.buttonSecondary
                  }`}
                >
                  ← Anterior
                </Link>

                <Link
                  href={`/dashboard/customers?page=${currentPage + 1}${extraQuery}`}
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
              <h2 className="text-xl font-semibold">Nuevo cliente</h2>
              <p className={`mt-1 text-sm ${theme.textMuted}`}>
                Registra un nuevo cliente para el negocio.
              </p>
            </div>

            <form action={createCustomerAction} className="mt-5 grid gap-4">
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
                  Teléfono
                </label>
                <input
                  name="phone"
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                />
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Correo
                </label>
                <input
                  name="email"
                  type="email"
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                />
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Dirección
                </label>
                <input
                  name="address"
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                />
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Notas
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                />
              </div>

              <button
                type="submit"
                className={`rounded-xl px-4 py-2 font-medium transition ${theme.buttonPrimary}`}
              >
                Guardar cliente
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}