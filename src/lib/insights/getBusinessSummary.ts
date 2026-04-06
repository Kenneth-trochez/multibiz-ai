import { createClient } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/lib/business/getBusinessSettings";

export type SummaryMetric = {
  label: string;
  value: string;
  helper: string;
  progress: number;
};

export type BusinessSummary = {
  title: string;
  overview: string;
  highlights: string[];
  risks: string[];
  opportunities: string[];
  metrics: SummaryMetric[];
};

function getDatePartsInTegucigalpa(baseDate = new Date()) {
  const ymd = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Tegucigalpa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(baseDate);

  return { ymd };
}

function addDaysToYmd(ymd: string, days: number) {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);

  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function startOfMonthYmd(ymd: string) {
  const [year, month] = ymd.split("-").map(Number);
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function formatMoney(value: number) {
  return `L ${Number(value || 0).toFixed(2)}`;
}

function clampProgress(current: number, goal: number) {
  if (!goal || goal <= 0) return 0;
  return Math.max(0, Math.min(100, (current / goal) * 100));
}

function buildOverview(params: {
  salesTodayCount: number;
  salesTodayTotal: number;
  monthlySalesCount: number;
  monthlySalesTotal: number;
  upcomingAppointmentsCount: number;
  lowStockCount: number;
  inactiveCustomersCount: number;
}) {
  const {
    salesTodayCount,
    salesTodayTotal,
    monthlySalesCount,
    monthlySalesTotal,
    upcomingAppointmentsCount,
    lowStockCount,
    inactiveCustomersCount,
  } = params;

  return `Hoy llevas ${salesTodayCount} venta(s) por ${formatMoney(
    salesTodayTotal
  )}. En el mes actual acumulas ${monthlySalesCount} venta(s) y ${formatMoney(
    monthlySalesTotal
  )}. Además, tienes ${upcomingAppointmentsCount} cita(s) para mañana, ${lowStockCount} producto(s) con stock bajo y ${inactiveCustomersCount} cliente(s) inactivo(s) detectado(s).`;
}

export async function getBusinessSummary(
  businessId: string
): Promise<BusinessSummary> {
  const supabase = await createClient();
  const settings = await getBusinessSettings(businessId);

  const { ymd: todayYmd } = getDatePartsInTegucigalpa();
  const tomorrowYmd = addDaysToYmd(todayYmd, 1);
  const nextTomorrowYmd = addDaysToYmd(todayYmd, 2);
  const monthStartYmd = startOfMonthYmd(todayYmd);
  const thirtyDaysAgoYmd = addDaysToYmd(todayYmd, -30);

  const [
    salesTodayResult,
    salesMonthResult,
    lowStockResult,
    appointmentsTomorrowResult,
    customersResult,
    recentSalesActivityResult,
    recentAppointmentsActivityResult,
    historicalSalesActivityResult,
    historicalAppointmentsActivityResult,
    saleItemsResult,
    staffSalesResult,
    productsCountResult,
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("id, total, sale_at")
      .eq("business_id", businessId)
      .gte("sale_at", `${todayYmd}T00:00:00`)
      .lt("sale_at", `${addDaysToYmd(todayYmd, 1)}T00:00:00`),

    supabase
      .from("sales")
      .select("id, total, sale_at")
      .eq("business_id", businessId)
      .gte("sale_at", `${monthStartYmd}T00:00:00`)
      .lt("sale_at", `${addDaysToYmd(todayYmd, 1)}T00:00:00`),

    supabase
      .from("products")
      .select("id, name, stock")
      .eq("business_id", businessId)
      .eq("active", true)
      .lte("stock", 5)
      .order("stock", { ascending: true })
      .limit(5),

    supabase
      .from("appointments")
      .select("id, appointment_at, status")
      .eq("business_id", businessId)
      .in("status", ["pending", "confirmed"])
      .gte("appointment_at", `${tomorrowYmd}T00:00:00`)
      .lt("appointment_at", `${nextTomorrowYmd}T00:00:00`),

    supabase
      .from("customers")
      .select("id, name")
      .eq("business_id", businessId)
      .limit(500),

    supabase
      .from("sales")
      .select("customer_id, sale_at")
      .eq("business_id", businessId)
      .not("customer_id", "is", null)
      .gte("sale_at", `${thirtyDaysAgoYmd}T00:00:00`)
      .limit(1000),

    supabase
      .from("appointments")
      .select("customer_id, appointment_at")
      .eq("business_id", businessId)
      .not("customer_id", "is", null)
      .gte("appointment_at", `${thirtyDaysAgoYmd}T00:00:00`)
      .limit(1000),

    supabase
      .from("sales")
      .select("customer_id, sale_at")
      .eq("business_id", businessId)
      .not("customer_id", "is", null)
      .limit(3000),

    supabase
      .from("appointments")
      .select("customer_id, appointment_at")
      .eq("business_id", businessId)
      .not("customer_id", "is", null)
      .limit(3000),

    supabase
      .from("sale_items")
      .select(`
        product_id,
        quantity,
        line_total,
        product:products(
          id,
          name
        )
      `)
      .limit(3000),

    supabase
      .from("sales")
      .select(`
        staff_id,
        total,
        staff:staff(
          id,
          display_name
        )
      `)
      .eq("business_id", businessId)
      .not("staff_id", "is", null)
      .limit(3000),

    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("active", true),
  ]);

  const salesToday = salesTodayResult.data || [];
  const salesMonth = salesMonthResult.data || [];
  const lowStockProducts = lowStockResult.data || [];
  const appointmentsTomorrow = appointmentsTomorrowResult.data || [];
  const customers = customersResult.data || [];
  const recentSalesActivity = recentSalesActivityResult.data || [];
  const recentAppointmentsActivity = recentAppointmentsActivityResult.data || [];
  const historicalSalesActivity = historicalSalesActivityResult.data || [];
  const historicalAppointmentsActivity =
    historicalAppointmentsActivityResult.data || [];
  const saleItems = saleItemsResult.data || [];
  const staffSales = staffSalesResult.data || [];
  const totalActiveProducts = productsCountResult.count || 0;

  const salesTodayCount = salesToday.length;
  const salesTodayTotal = salesToday.reduce(
    (acc, row) => acc + Number(row.total || 0),
    0
  );

  const monthlySalesCount = salesMonth.length;
  const monthlySalesTotal = salesMonth.reduce(
    (acc, row) => acc + Number(row.total || 0),
    0
  );

  const upcomingAppointmentsCount = appointmentsTomorrow.length;
  const lowStockCount = lowStockProducts.length;

  const customerMap = new Map<string, string>();
  for (const customer of customers) {
    customerMap.set(customer.id, customer.name);
  }

  const recentActiveCustomerIds = new Set<string>();
  for (const row of recentSalesActivity) {
    if (row.customer_id) recentActiveCustomerIds.add(row.customer_id);
  }
  for (const row of recentAppointmentsActivity) {
    if (row.customer_id) recentActiveCustomerIds.add(row.customer_id);
  }

  const historicalLastActivity = new Map<string, string>();

  for (const row of historicalSalesActivity) {
    if (!row.customer_id || !row.sale_at) continue;
    const current = historicalLastActivity.get(row.customer_id);
    if (!current || new Date(row.sale_at) > new Date(current)) {
      historicalLastActivity.set(row.customer_id, row.sale_at);
    }
  }

  for (const row of historicalAppointmentsActivity) {
    if (!row.customer_id || !row.appointment_at) continue;
    const current = historicalLastActivity.get(row.customer_id);
    if (!current || new Date(row.appointment_at) > new Date(current)) {
      historicalLastActivity.set(row.customer_id, row.appointment_at);
    }
  }

  const inactiveCustomers = Array.from(historicalLastActivity.entries())
    .filter(([customerId]) => customerMap.has(customerId))
    .filter(([customerId]) => !recentActiveCustomerIds.has(customerId))
    .sort((a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime());

  const inactiveCustomersCount = inactiveCustomers.length;

  const productMap = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();

  for (const item of saleItems) {
    const product = Array.isArray(item.product) ? item.product[0] : item.product;
    if (!item.product_id || !product?.name) continue;

    const current = productMap.get(item.product_id) || {
      name: product.name,
      quantity: 0,
      revenue: 0,
    };

    current.quantity += Number(item.quantity || 0);
    current.revenue += Number(item.line_total || 0);

    productMap.set(item.product_id, current);
  }

  const topProduct = Array.from(productMap.values()).sort((a, b) => {
    if (b.quantity !== a.quantity) return b.quantity - a.quantity;
    return b.revenue - a.revenue;
  })[0];

  const staffMap = new Map<string, { name: string; salesCount: number; revenue: number }>();

  for (const row of staffSales) {
    const staff = Array.isArray(row.staff) ? row.staff[0] : row.staff;
    if (!row.staff_id || !staff?.display_name) continue;

    const current = staffMap.get(row.staff_id) || {
      name: staff.display_name,
      salesCount: 0,
      revenue: 0,
    };

    current.salesCount += 1;
    current.revenue += Number(row.total || 0);

    staffMap.set(row.staff_id, current);
  }

  const topStaff = Array.from(staffMap.values()).sort(
    (a, b) => b.revenue - a.revenue
  )[0];

  const highlights: string[] = [];
  const risks: string[] = [];
  const opportunities: string[] = [];

  if (monthlySalesCount > 0) {
    highlights.push(
      `Este mes llevas ${monthlySalesCount} venta(s) por ${formatMoney(monthlySalesTotal)}.`
    );
  } else {
    risks.push("Aún no se registran ventas en el mes actual.");
  }

  if (topProduct) {
    highlights.push(
      `El producto con mejor rotación es "${topProduct.name}" con ${topProduct.quantity} unidad(es) vendidas.`
    );
  }

  if (topStaff) {
    highlights.push(
      `"${topStaff.name}" lidera en ingresos con ${formatMoney(topStaff.revenue)}.`
    );
  }

  if (lowStockProducts.length > 0) {
    risks.push(
      `Tienes ${lowStockProducts.length} producto(s) con stock bajo. El más urgente es "${
        lowStockProducts[0].name
      }" con ${lowStockProducts[0].stock} unidad(es).`
    );
  }

  if (salesTodayCount === 0) {
    risks.push("Hoy todavía no se ha registrado ninguna venta.");
  }

  if (inactiveCustomersCount > 0) {
    const firstInactiveCustomerName =
      customerMap.get(inactiveCustomers[0][0]) || "Un cliente";
    opportunities.push(
      `${firstInactiveCustomerName} y otros ${Math.max(
        inactiveCustomersCount - 1,
        0
      )} cliente(s) podrían reactivarse con seguimiento o promoción.`
    );
  }

  if (upcomingAppointmentsCount > 0) {
    opportunities.push(
      `Hay ${upcomingAppointmentsCount} cita(s) programada(s) para mañana, lo que ayuda a prever carga operativa.`
    );
  }

  if (highlights.length === 0) {
    highlights.push("Todavía no hay suficiente actividad para destacar indicadores fuertes.");
  }

  if (risks.length === 0) {
    risks.push("No se detectan riesgos operativos importantes en este momento.");
  }

  if (opportunities.length === 0) {
    opportunities.push("Todavía no se detectan oportunidades destacadas con la actividad actual.");
  }

  const healthyStockPercent =
    totalActiveProducts > 0
      ? ((totalActiveProducts - lowStockCount) / totalActiveProducts) * 100
      : 100;

  const metrics: SummaryMetric[] = [
    {
      label: "Ventas hoy",
      value: formatMoney(salesTodayTotal),
      helper: `Meta diaria: ${formatMoney(settings.daily_sales_goal)}`,
      progress: clampProgress(salesTodayTotal, settings.daily_sales_goal),
    },
    {
      label: "Ventas del mes",
      value: formatMoney(monthlySalesTotal),
      helper: `Meta mensual: ${formatMoney(settings.monthly_sales_goal)}`,
      progress: clampProgress(monthlySalesTotal, settings.monthly_sales_goal),
    },
    {
      label: "Citas mañana",
      value: String(upcomingAppointmentsCount),
      helper: `Meta diaria: ${settings.daily_appointments_goal} cita(s)`,
      progress: clampProgress(
        upcomingAppointmentsCount,
        settings.daily_appointments_goal
      ),
    },
    {
      label: "Inventario saludable",
      value: `${Math.max(0, totalActiveProducts - lowStockCount)}/${totalActiveProducts}`,
      helper: `${lowStockCount} producto(s) en riesgo`,
      progress: Math.max(0, Math.min(100, healthyStockPercent)),
    },
  ];

  return {
    title: "Resumen inteligente del negocio",
    overview: buildOverview({
      salesTodayCount,
      salesTodayTotal,
      monthlySalesCount,
      monthlySalesTotal,
      upcomingAppointmentsCount,
      lowStockCount,
      inactiveCustomersCount,
    }),
    highlights,
    risks,
    opportunities,
    metrics,
  };
}