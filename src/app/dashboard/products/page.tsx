import { createProductAction } from "../../actions/products";
import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { requirePlanFeature } from "@/lib/billing/requirePlanFeature";
import { createClient } from "@/lib/supabase/server";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import Link from "next/link";
import ProductsList from "./ProductsList";
import CategoriesManager from "./CategoriesManager";
import CategoriesFilter from "./CategoriesFilter";

type CategoryRow = {
  id: string;
  name: string;
};

type ProductRow = {
  id: string;
  category_id: string | null;
  category_name: string | null;
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
  searchParams: Promise<{
    error?: string;
    success?: string;
    page?: string;
    category?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const ctx = await requireSectionAccess("products");
  await requirePlanFeature("products");

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");
  const supabase = await createClient();

  const currentPage = Math.max(1, Number(params.page || "1") || 1);
  const selectedCategory = String(params.category || "").trim();
  const searchTerm = String(params.q || "").trim();
  const pageSize = 10;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data: categories, error: categoriesError } = await supabase
    .from("product_categories")
    .select("id, name")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

  let countQuery = supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id);

  let productsQuery = supabase
    .from("products")
    .select(
      `
      id,
      category_id,
      name,
      description,
      sku,
      price,
      stock,
      active,
      created_at,
      product_categories(name)
    `
    )
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  if (selectedCategory) {
    countQuery = countQuery.eq("category_id", selectedCategory);
    productsQuery = productsQuery.eq("category_id", selectedCategory);
  }

  if (searchTerm) {
    const searchFilter = `name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`;
    countQuery = countQuery.or(searchFilter);
    productsQuery = productsQuery.or(searchFilter);
  }

  const { count, error: countError } = await countQuery;
  const { data: rawProducts, error } = await productsQuery.range(from, to);

  const products: ProductRow[] = (rawProducts || []).map((product: any) => ({
    id: product.id,
    category_id: product.category_id,
    category_name: product.product_categories?.name || null,
    name: product.name,
    description: product.description,
    sku: product.sku,
    price: product.price,
    stock: product.stock,
    active: product.active,
    created_at: product.created_at,
  }));

  if (error || countError || categoriesError) {
    return (
      <main className={`min-h-screen p-6 ${theme.pageBg}`}>
        <div className={`rounded-2xl border p-6 ${theme.card}`}>
          Error cargando productos:{" "}
          {error?.message || countError?.message || categoriesError?.message}
        </div>
      </main>
    );
  }

  const totalProducts = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));

  const queryParts = new URLSearchParams();
  if (selectedCategory) queryParts.set("category", selectedCategory);
  if (searchTerm) queryParts.set("q", searchTerm);

  const extraQuery = queryParts.toString() ? `&${queryParts.toString()}` : "";

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

        {params.success === "deactivated" && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Producto desactivado correctamente.
          </p>
        )}

        {params.success === "reactivated" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Producto reactivado correctamente.
          </p>
        )}

        {params.success === "category_created" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Categoría creada correctamente.
          </p>
        )}

        {params.success === "category_updated" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Categoría actualizada correctamente.
          </p>
        )}

        {params.success === "category_deleted" && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Categoría eliminada correctamente.
          </p>
        )}

        <CategoriesManager
          businessId={business.id}
          categories={(categories || []) as CategoryRow[]}
          theme={theme}
        />

        <CategoriesFilter
          categories={(categories || []) as CategoryRow[]}
          selectedCategory={selectedCategory}
          theme={theme}
        />

        <section className={`rounded-2xl border p-4 shadow-sm ${theme.card}`}>
          <form action="/dashboard/products" className="flex flex-col gap-3 md:flex-row">
            <input type="hidden" name="category" value={selectedCategory} />

            <input
              type="text"
              name="q"
              defaultValue={searchTerm}
              placeholder="Buscar por nombre, SKU o descripción..."
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
                href={selectedCategory ? `/dashboard/products?category=${encodeURIComponent(selectedCategory)}` : "/dashboard/products"}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${theme.buttonSecondary}`}
              >
                Limpiar
              </Link>
            </div>
          </form>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-4">
            <ProductsList
              products={products}
              categories={(categories || []) as CategoryRow[]}
              theme={theme}
            />

            <div className="flex items-center justify-between">
              <p className={`text-sm ${theme.textMuted}`}>
                Página {currentPage} de {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/products?page=${currentPage - 1}${extraQuery}`}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    currentPage <= 1
                      ? "pointer-events-none opacity-50"
                      : theme.buttonSecondary
                  }`}
                >
                  ← Anterior
                </Link>

                <Link
                  href={`/dashboard/products?page=${currentPage + 1}${extraQuery}`}
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
              <h2 className="text-xl font-semibold">Nuevo producto</h2>
              <p className={`mt-1 text-sm ${theme.textMuted}`}>
                Registra un producto para el inventario del negocio.
              </p>
            </div>

            <form action={createProductAction} className="mt-5 grid gap-4">
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
                  Categoría
                </label>
                <select
                  name="categoryId"
                  defaultValue=""
                  className={`w-full rounded-xl border px-3 py-2 outline-none ${theme.select}`}
                >
                  <option value="">Sin categoría</option>
                  {(categories || []).map((category: CategoryRow) => (
                    <option key={category.id} value={category.id} className={theme.option}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`mb-1 block text-sm font-medium ${theme.label}`}>
                  SKU
                </label>
                <input
                  name="sku"
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
                    Stock
                  </label>
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
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
                />
              </div>

              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" name="active" defaultChecked />
                <span className={theme.label}>Producto activo</span>
              </label>

              <button
                type="submit"
                className={`rounded-xl px-4 py-2 font-medium transition ${theme.buttonPrimary}`}
              >
                Guardar producto
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}