import { createProductAction } from "../../actions/products";
import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { requirePlanFeature } from "@/lib/billing/requirePlanFeature";
import { createClient } from "@/lib/supabase/server";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import Link from "next/link";
import ProductsList from "./ProductsList";

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  stock: number;
  active: boolean;
  created_at: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; page?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireSectionAccess("products");
  await requirePlanFeature("products");

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");
  const supabase = await createClient();

  const currentPage = Math.max(1, Number(params.page || "1") || 1);
  const pageSize = 10;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { count, error: countError } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id);

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, description, sku, price, stock, active, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error || countError) {
    return (
      <main className={`min-h-screen p-6 ${theme.pageBg}`}>
        <div className={`rounded-2xl border p-6 ${theme.card}`}>
          Error cargando productos: {error?.message || countError?.message}
        </div>
      </main>
    );
  }

  const totalProducts = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));

  return (
    <main className={`min-h-screen p-6 ${theme.pageBg}`}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className={`mt-1 text-sm ${theme.textMuted}`}>
            Administra el catálogo e inventario del negocio actual.
          </p>
        </div>

        {params.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error}
          </p>
        )}

        {params.success === "created" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Producto creado correctamente.
          </p>
        )}

        {params.success === "updated" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Producto actualizado correctamente.
          </p>
        )}

        {params.success === "deleted" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Producto eliminado correctamente.
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            <ProductsList
              products={(products || []) as ProductRow[]}
              theme={theme}
            />

            <div className="flex items-center justify-between">
              <p className={`text-sm ${theme.textMuted}`}>
                Página {currentPage} de {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/products?page=${currentPage - 1}`}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    currentPage <= 1
                      ? "pointer-events-none opacity-50"
                      : theme.buttonSecondary
                  }`}
                >
                  ← Anterior
                </Link>

                <Link
                  href={`/dashboard/products?page=${currentPage + 1}`}
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

          <section className={`h-fit rounded-2xl border p-6 shadow-sm ${theme.card}`}>
            <h2 className="mb-4 text-xl font-semibold">Nuevo producto</h2>

            <form action={createProductAction} className="grid gap-4">
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
                  SKU Codigo interno unico
                </label>
                <input
                  name="sku"
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  placeholder="Opcional"
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
                    defaultValue="0"
                    className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                    required
                  />
                </div>

                <div>
                  <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                    Stock
                  </label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue="0"
                    className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  Descripción
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.input}`}
                  placeholder="Opcional"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="active_new_product"
                  type="checkbox"
                  name="active"
                  defaultChecked
                />
                <label
                  htmlFor="active_new_product"
                  className={`text-sm font-medium ${theme.label}`}
                >
                  Producto activo
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  className={`rounded-xl px-4 py-2 font-medium transition ${theme.buttonPrimary}`}
                >
                  Guardar producto
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}