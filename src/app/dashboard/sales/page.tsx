import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/tenant/getCurrentBusiness";
import SalesClient from "./Salesclient";

type SaleRow = {
  id: string;
  sale_at: string;
  subtotal: number;
  discount: number;
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
};

type ProductOption = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  active: boolean;
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

function getThemeClasses(theme: string) {
  switch (theme) {
    case "dark":
      return {
        pageBg: "bg-[#181818] text-white",
        card: "bg-[#222222] border-[#333333]",
        input: "bg-[#2b2b2b] border-[#444444] text-white",
        textMuted: "text-[#bdbdbd]",
        label: "text-[#f1f1f1]",
        buttonPrimary: "bg-white text-black hover:bg-[#e8e8e8]",
        buttonSecondary:
          "bg-[#2b2b2b] border-[#444444] text-white hover:bg-[#343434]",
        danger: "bg-red-600 text-white hover:bg-red-700",
      };

    case "elegant":
      return {
        pageBg: "bg-[#f4efe8] text-[#2b211b]",
        card: "bg-[#fffaf5] border-[#e6d8c8]",
        input: "bg-white border-[#d8c7b7] text-[#2b211b]",
        textMuted: "text-[#7a6858]",
        label: "text-[#3e3027]",
        buttonPrimary: "bg-[#6b4f3a] text-white hover:bg-[#5a4331]",
        buttonSecondary:
          "bg-white border-[#d8c7b7] text-[#2b211b] hover:bg-[#f3e8dc]",
        danger: "bg-red-600 text-white hover:bg-red-700",
      };

    case "minimal":
      return {
        pageBg: "bg-[#f8f8f8] text-[#1f1f1f]",
        card: "bg-white border-[#e5e5e5]",
        input: "bg-white border-[#d6d6d6] text-[#1f1f1f]",
        textMuted: "text-[#6f6f6f]",
        label: "text-[#222222]",
        buttonPrimary: "bg-[#111111] text-white hover:bg-[#222222]",
        buttonSecondary:
          "bg-white border-[#d6d6d6] text-[#1f1f1f] hover:bg-[#f1f1f1]",
        danger: "bg-red-600 text-white hover:bg-red-700",
      };

    case "warm":
    default:
      return {
        pageBg: "bg-[#f6f1e8] text-[#2f241d]",
        card: "bg-white border-[#eadfce]",
        input: "bg-white border-[#d9c6b2] text-[#2f241d]",
        textMuted: "text-[#6b5b4d]",
        label: "text-[#3f3128]",
        buttonPrimary: "bg-[#a56a3a] text-white hover:bg-[#8d582e]",
        buttonSecondary:
          "bg-white border-[#d9c6b2] text-[#2f241d] hover:bg-[#f3e8dc]",
        danger: "bg-red-600 text-white hover:bg-red-700",
      };
  }
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const ctx = await getCurrentBusiness();

  if (!ctx?.business) {
    redirect("/onboarding");
  }

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");
  const supabase = await createClient();

  const [
    { data: sales, error: salesError },
    { data: products, error: productsError },
    { data: customers, error: customersError },
    { data: staff, error: staffError },
  ] = await Promise.all([
    supabase
      .from("sales")
      .select(`
        id,
        sale_at,
        subtotal,
        discount,
        total,
        notes,
        customer:customers(id,name,phone),
        staff:staff(id,display_name,specialty)
      `)
      .eq("business_id", business.id)
      .order("sale_at", { ascending: false })
      .limit(20),

    supabase
      .from("products")
      .select("id, name, sku, price, stock, active")
      .eq("business_id", business.id)
      .eq("active", true)
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
  ]);

  if (salesError || productsError || customersError || staffError) {
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

  if (saleIds.length > 0) {
    const { data: saleItems, error: saleItemsError } = await supabase
      .from("sale_items")
      .select("sale_id")
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

    itemsCountMap = saleItems.reduce((map: Map<string, number>, item: any) => {
      map.set(item.sale_id, (map.get(item.sale_id) || 0) + 1);
      return map;
    }, new Map<string, number>());
  }

  const normalizedSales: SaleRow[] = (sales || []).map((sale: any) => ({
    id: sale.id,
    sale_at: sale.sale_at,
    subtotal: Number(sale.subtotal || 0),
    discount: Number(sale.discount || 0),
    total: Number(sale.total || 0),
    notes: sale.notes,
    customer: Array.isArray(sale.customer)
      ? sale.customer[0] || null
      : sale.customer || null,
    staff: Array.isArray(sale.staff) ? sale.staff[0] || null : sale.staff || null,
    items_count: itemsCountMap.get(sale.id) || 0,
  }));

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
      </div>

      <SalesClient
        businessId={business.id}
        sales={normalizedSales}
        products={(products || []) as ProductOption[]}
        customers={(customers || []) as CustomerOption[]}
        staff={(staff || []) as StaffOption[]}
        theme={theme}
      />
    </main>
  );
}