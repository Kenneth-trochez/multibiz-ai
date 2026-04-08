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

function getUtcRangeForTegucigalpaDay(ymd: string) {
  return {
    start: `${ymd}T06:00:00.000Z`,
    end: `${addDaysToYmd(ymd, 1)}T06:00:00.000Z`,
  };
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
  const monthStartYmd = startOfMonthYmd(todayYmd);
  const thirtyDaysAgoYmd = addDaysToYmd(todayYmd, -30);

  const todayRange = getUtcRangeForTegucigalpaDay(todayYmd);
  const tomorrowRange = getUtcRangeForTegucigalpaDay(tomorrowYmd);

  const [
    salesTodayResult,
    salesMonthResult,
    allSalesResult,
    lowStockResult,
    appointmentsTomorrowResult,
    customersResult,
    recentSalesActivityResult,
    recentAppointmentsActivityResult,
    historicalSalesActivityResult,
    historicalAppointmentsActivityResult,
    staffSalesResult,
    productsCountResult,
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("id, total, sale_at")
      .eq("business_id", businessId)
      .gte("sale_at", todayRange.start)
      .lt("sale_at", todayRange.end),

    supabase
      .from("sales")
      .select("id, total, sale_at")
      .eq("business_id", businessId)
      .gte("sale_at", `${monthStartYmd}T06:00:00.000Z`)
      .lt("sale_at", todayRange.end),

    supabase
      .from("sales")
      .select("id, total, sale_at")
      .eq("business_id", businessId)
      .limit(3000),

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
      .gte("appointment_at", tomorrowRange.start)
      .lt("appointment_at", tomorrowRange.end),

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
  const allSales = allSalesResult.data || [];
  const lowStockProducts = lowStockResult.data || [];
  const appointmentsTomorrow = appointmentsTomorrowResult.data || [];
  const customers = customersResult.data || [];
  const recentSalesActivity = recentSalesActivityResult.data || [];
  const recentAppointmentsActivity = recentAppointmentsActivityResult.data || [];
  const historicalSalesActivity = historicalSalesActivityResult.data || [];
  const historicalAppointmentsActivity =
    historicalAppointmentsActivityResult.data || [];
  const staffSales = staffSalesResult.data || [];
  const totalActiveProducts = productsCountResult.count || 0;

  const saleIds = allSales.map((sale) => sale.id);

  let saleItems: any[] = [];

  if (saleIds.length > 0) {
    const { data } = await supabase
      .from("sale_items")
      .select(`
        product_id,
        quantity,
        line_total,
        sale_id,
        product:products(
          id,
          name,
          business_id
        )
      `)
      .in("sale_id", saleIds)
      .limit(3000);

    saleItems = data || [];
  }

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
    if (product.business_id !== businessId) continue;

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
  })[0] || null;

  const staffMap = new Map<
    string,
    { name: string; salesCount: number; revenue: number }
  >();

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
  )[0] || null;

  const dailySalesGoal = Number(settings?.daily_sales_goal || 0);
  const monthlySalesGoal = Number(settings?.monthly_sales_goal || 0);
  const dailyAppointmentsGoal = Number(settings?.daily_appointments_goal || 0);

  const metrics: SummaryMetric[] = [
    {
      label: "Ventas hoy",
      value: formatMoney(salesTodayTotal),
      helper: `${salesTodayCount} venta(s) registradas hoy`,
      progress: clampProgress(salesTodayTotal, dailySalesGoal),
    },
    {
      label: "Ventas del mes",
      value: formatMoney(monthlySalesTotal),
      helper: `${monthlySalesCount} venta(s) acumuladas en el mes`,
      progress: clampProgress(monthlySalesTotal, monthlySalesGoal),
    },
    {
      label: "Citas de mañana",
      value: String(upcomingAppointmentsCount),
      helper: "Pendientes o confirmadas",
      progress: clampProgress(upcomingAppointmentsCount, dailyAppointmentsGoal),
    },
    {
      label: "Productos activos",
      value: String(totalActiveProducts),
      helper: `${lowStockCount} con stock bajo`,
      progress: totalActiveProducts > 0
        ? Math.max(0, Math.min(100, ((totalActiveProducts - lowStockCount) / totalActiveProducts) * 100))
        : 0,
    },
  ];

  const highlights: string[] = [];
  const risks: string[] = [];
  const opportunities: string[] = [];

  if (salesTodayCount > 0) {
    highlights.push(`Ya registraste ${salesTodayCount} venta(s) hoy por ${formatMoney(salesTodayTotal)}.`);
  } else {
    risks.push("Todavía no se han registrado ventas hoy.");
  }

  if (topProduct) {
    highlights.push(`El producto con mayor rotación actual es "${topProduct.name}" con ${topProduct.quantity} unidad(es) vendidas.`);
  } else {
    opportunities.push("Aún no hay suficiente historial de ventas para detectar productos líderes.");
  }

  if (topStaff) {
    highlights.push(`"${topStaff.name}" lidera en ingresos registrados con ${formatMoney(topStaff.revenue)}.`);
  } else {
    opportunities.push("Asocia ventas al staff para medir mejor el rendimiento del equipo.");
  }

  if (lowStockCount > 0) {
    risks.push(`Tienes ${lowStockCount} producto(s) con stock bajo que requieren reposición.`);
  } else {
    highlights.push("No se detectan productos con stock bajo en este momento.");
  }

  if (inactiveCustomersCount > 0) {
    risks.push(`Se detectaron ${inactiveCustomersCount} cliente(s) con historial previo y sin actividad reciente.`);
    opportunities.push("Puedes reactivar clientes inactivos con promociones, recordatorios o seguimiento.");
  } else {
    highlights.push("No se detectan clientes inactivos relevantes por ahora.");
  }

  if (upcomingAppointmentsCount > 0) {
    opportunities.push(`Tienes ${upcomingAppointmentsCount} cita(s) mañana: prepárate para convertirlas en ventas o fidelización.`);
  }

  if (highlights.length === 0) {
    highlights.push("Aún no hay suficientes datos para destacar fortalezas claras del negocio.");
  }

  if (risks.length === 0) {
    risks.push("No se detectan riesgos críticos inmediatos con los datos actuales.");
  }

  if (opportunities.length === 0) {
    opportunities.push("Mantén el ritmo actual y sigue registrando datos para detectar oportunidades más precisas.");
  }

  return {
    title: "Resumen ejecutivo del negocio",
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