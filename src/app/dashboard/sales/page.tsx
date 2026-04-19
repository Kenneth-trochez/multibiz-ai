import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { requirePlanFeature } from "@/lib/billing/requirePlanFeature";
import { createClient } from "@/lib/supabase/server";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import SalesClient from "./SalesClient";

type SaleItemRow = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  product: {
    id: string;
    name: string;
    sku: string | null;
    category_id: string | null;
    product_categories:
      | {
          id: string;
          name: string;
        }
      | {
          id: string;
          name: string;
        }[]
      | null;
  } | null;
};

type SaleRow = {
  id: string;
  sale_at: string;
  subtotal: number;
  discount: number;
  discount_type: "fixed" | "percent";
  discount_value: number;
  tax_percent: number;
  tax_amount: number;
  total: number;
  notes: string | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  staff: {
    id: string;
    display_name: string;
    specialty: string | null;
  } | null;
  items_count: number;
  items: SaleItemRow[];
};

type ProductOption = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  active: boolean;
  category_id: string | null;
  category_name: string | null;
};

type ProductCategoryOption = {
  id: string;
  name: string;
};

type CustomerOption = {
  id: string;
  name: string;
  phone: string | null;
};

type StaffOption = {
  id: string;
  display_name: string;
  specialty: string | null;
};

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireSectionAccess("sales");
  await requirePlanFeature("sales");

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");
  const supabase = await createClient();

  const [
    { data: sales, error: salesError },
    { data: products, error: productsError },
    { data: categories, error: categoriesError },
    { data: customers, error: customersError },
    { data: staff, error: staffError },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from("sales")
      .select(`
        id,
        sale_at,
        subtotal,
        discount,
        discount_type,
        discount_value,
        tax_percent,
        tax_amount,
        total,
        notes,
        customer:customers(id,name,phone),
        staff:staff(id,display_name,specialty)
      `)
      .eq("business_id", business.id)
      .order("sale_at", { ascending: false })
      .limit(50),

    supabase
      .from("products")
      .select(`
        id,
        name,
        sku,
        price,
        stock,
        active,
        category_id,
        product_categories(id,name)
      `)
      .eq("business_id", business.id)
      .eq("active", true)
      .order("name", { ascending: true }),

    supabase
      .from("product_categories")
      .select("id, name")
      .eq("business_id", business.id)
      .order("name", { ascending: true }),

    supabase
      .from("customers")
      .select("id, name, phone")
      .eq("business_id", business.id)
      .order("name", { ascending: true }),

    supabase
      .from("staff")
      .select("id, display_name, specialty")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("display_name", { ascending: true }),

    supabase
      .from("business_settings")
      .select("timezone")
      .eq("business_id", business.id)
      .maybeSingle(),
  ]);

  if (salesError || productsError || categoriesError || customersError || staffError) {
    return (
      <main className={`min-h-screen p-6 ${theme.pageBg}`}>
        <div className={`rounded-2xl border p-6 ${theme.card}`}>
          Error cargando ventas.
        </div>
      </main>
    );
  }

  const saleIds = (sales || []).map((sale: any) => sale.id);

  let itemsCountMap = new Map<string, number>();
  let itemsBySaleMap = new Map<string, SaleItemRow[]>();

  if (saleIds.length > 0) {
    const { data: saleItems, error: saleItemsError } = await supabase
      .from("sale_items")
      .select(`
        id,
        sale_id,
        product_id,
        quantity,
        unit_price,
        line_total,
        product:products(
          id,
          name,
          sku,
          category_id,
          product_categories(id,name)
        )
      `)
      .in("sale_id", saleIds);

    if (saleItemsError) {
      return (
        <main className={`min-h-screen p-6 ${theme.pageBg}`}>
          <div className={`rounded-2xl border p-6 ${theme.card}`}>
            Error cargando items de ventas.
          </div>
        </main>
      );
    }

    for (const item of saleItems || []) {
      const normalizedProduct = Array.isArray(item.product)
        ? item.product[0] || null
        : item.product || null;

      const normalizedItem: SaleItemRow = {
        id: item.id,
        sale_id: item.sale_id,
        product_id: item.product_id,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        line_total: Number(item.line_total || 0),
        product: normalizedProduct,
      };

      itemsCountMap.set(item.sale_id, (itemsCountMap.get(item.sale_id) || 0) + 1);

      const current = itemsBySaleMap.get(item.sale_id) || [];
      current.push(normalizedItem);
      itemsBySaleMap.set(item.sale_id, current);
    }
  }

  const normalizedSales: SaleRow[] = (sales || []).map((sale: any) => ({
    id: sale.id,
    sale_at: sale.sale_at,
    subtotal: Number(sale.subtotal || 0),
    discount: Number(sale.discount || 0),
    discount_type: sale.discount_type === "percent" ? "percent" : "fixed",
    discount_value: Number(sale.discount_value || 0),
    tax_percent: Number(sale.tax_percent || 0),
    tax_amount: Number(sale.tax_amount || 0),
    total: Number(sale.total || 0),
    notes: sale.notes,
    customer: Array.isArray(sale.customer)
      ? sale.customer[0] || null
      : sale.customer || null,
    staff: Array.isArray(sale.staff) ? sale.staff[0] || null : sale.staff || null,
    items_count: itemsCountMap.get(sale.id) || 0,
    items: itemsBySaleMap.get(sale.id) || [],
  }));

  const normalizedProducts: ProductOption[] = (products || []).map((product: any) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    price: Number(product.price || 0),
    stock: Number(product.stock || 0),
    active: Boolean(product.active),
    category_id: product.category_id || null,
    category_name: Array.isArray(product.product_categories)
      ? product.product_categories[0]?.name || null
      : product.product_categories?.name || null,
  }));

  const timezone = settings?.timezone || "America/Tegucigalpa";

  return (
    <main className={`min-h-screen ${theme.pageBg}`}>
      <div className="mx-auto max-w-7xl px-6 pt-6">
        {params.error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error}
          </p>
        )}

        {params.success === "created" && (
          <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Venta creada correctamente.
          </p>
        )}

        {params.success === "updated" && (
          <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Venta actualizada correctamente.
          </p>
        )}

        {params.success === "deleted" && (
          <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Venta eliminada correctamente.
          </p>
        )}
      </div>

      <SalesClient
        businessId={business.id}
        sales={normalizedSales}
        products={normalizedProducts}
        categories={(categories || []) as ProductCategoryOption[]}
        customers={(customers || []) as CustomerOption[]}
        staff={(staff || []) as StaffOption[]}
        theme={theme}
        timezone={timezone}
      />
    </main>
  );
}