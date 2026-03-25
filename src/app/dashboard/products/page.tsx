import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/tenant/getCurrentBusiness";
import { Package, Boxes, AlertTriangle } from "lucide-react";

function getThemeClasses(theme: string) {
  switch (theme) {
    case "dark":
      return {
        pageBg: "bg-[#181818] text-white",
        card: "bg-[#222222] border-[#333333]",
        textMuted: "text-[#bdbdbd]",
        badge: "bg-[#2b2b2b] text-white border-[#444444]",
        accent: "bg-white text-black",
      };

    case "elegant":
      return {
        pageBg: "bg-[#f4efe8] text-[#2b211b]",
        card: "bg-[#fffaf5] border-[#e6d8c8]",
        textMuted: "text-[#7a6858]",
        badge: "bg-white text-[#2b211b] border-[#d8c7b7]",
        accent: "bg-[#6b4f3a] text-white",
      };

    case "minimal":
      return {
        pageBg: "bg-[#f8f8f8] text-[#1f1f1f]",
        card: "bg-white border-[#e5e5e5]",
        textMuted: "text-[#6f6f6f]",
        badge: "bg-white text-[#1f1f1f] border-[#d6d6d6]",
        accent: "bg-[#111111] text-white",
      };

    case "warm":
    default:
      return {
        pageBg: "bg-[#f6f1e8] text-[#2f241d]",
        card: "bg-white border-[#eadfce]",
        textMuted: "text-[#6b5b4d]",
        badge: "bg-white text-[#2f241d] border-[#d9c6b2]",
        accent: "bg-[#a56a3a] text-white",
      };
  }
}

export default async function ProductsPage() {
  const ctx = await getCurrentBusiness();

  if (!ctx?.business) {
    redirect("/onboarding");
  }

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");
  const supabase = await createClient();

  const [
    { count: totalProducts, error: totalProductsError },
    { count: activeProducts, error: activeProductsError },
    { count: lowStockProducts, error: lowStockProductsError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id),

    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("active", true),

    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id)
      .lte("stock", 5),
  ]);

  if (totalProductsError || activeProductsError || lowStockProductsError) {
    return (
      <main className={`min-h-screen p-6 ${theme.pageBg}`}>
        <div className={`rounded-2xl border p-6 ${theme.card}`}>
          Error cargando productos.
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${theme.pageBg}`}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex flex-col gap-2">
          <div className="inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]">
            Inventario
          </div>

          <h1 className="text-3xl font-bold">Productos</h1>
          <p className={`text-sm ${theme.textMuted}`}>
            Administra el catálogo e inventario de productos del negocio.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
            <div className="mb-3 flex items-center justify-between">
              <p className={`text-sm ${theme.textMuted}`}>Total productos</p>
              <Package className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold">{totalProducts || 0}</p>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
            <div className="mb-3 flex items-center justify-between">
              <p className={`text-sm ${theme.textMuted}`}>Productos activos</p>
              <Boxes className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold">{activeProducts || 0}</p>
          </div>

          <div className={`rounded-2xl border p-5 shadow-sm ${theme.card}`}>
            <div className="mb-3 flex items-center justify-between">
              <p className={`text-sm ${theme.textMuted}`}>Stock bajo</p>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold">{lowStockProducts || 0}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className={`rounded-2xl border p-6 shadow-sm ${theme.card}`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Módulo de productos</h2>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Aquí gestionaremos catálogo, stock, precios, SKU y estado.
                </p>
              </div>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${theme.badge}`}
              >
                Próximo paso
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-dashed p-4">
                <h3 className="font-medium">Crear productos</h3>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Agregar nombre, SKU, precio, stock y descripción.
                </p>
              </div>

              <div className="rounded-2xl border border-dashed p-4">
                <h3 className="font-medium">Editar inventario</h3>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Actualizar stock, activar o desactivar productos.
                </p>
              </div>

              <div className="rounded-2xl border border-dashed p-4">
                <h3 className="font-medium">Control por negocio</h3>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Cada producto se filtra por <code>business_id</code>.
                </p>
              </div>

              <div className="rounded-2xl border border-dashed p-4">
                <h3 className="font-medium">Integración futura</h3>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Se conectará con ventas y luego con balance.
                </p>
              </div>
            </div>
          </section>

          <aside className={`rounded-2xl border p-6 shadow-sm ${theme.card}`}>
            <h2 className="text-xl font-semibold">Resumen</h2>
            <p className={`mt-2 text-sm ${theme.textMuted}`}>
              Este módulo servirá para administrar todos los productos que vende
              el negocio, incluso si no están ligados a citas.
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border p-4">
                <p className="text-sm font-medium">Incluye</p>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Catálogo, stock, SKU, precio y estado del producto.
                </p>
              </div>

              <div className="rounded-2xl border p-4">
                <p className="text-sm font-medium">Preparado para</p>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Ventas manuales, cortes de caja y exportación futura.
                </p>
              </div>

              <div className={`rounded-2xl p-4 ${theme.accent}`}>
                <p className="text-sm font-semibold">
                  Base lista para escalar a inventario real.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}