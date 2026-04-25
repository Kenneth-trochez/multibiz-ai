import { createClient } from "@/lib/supabase/server";
import { formatMoneyByTimezone } from "@/lib/money/currency";

export type AssistantAnswer = {
  matched: boolean;
  title: string;
  answer: string;
  suggestions: string[];
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

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

function formatMoney(value: number, timezone?: string | null) {
  return formatMoneyByTimezone(value, timezone);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("es-HN", {
    timeZone: "America/Tegucigalpa",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

function defaultSuggestions() {
  return [
    "¿Cuánto vendí esta semana?",
    "¿Cuál es mi producto más vendido?",
    "¿Qué clientes están inactivos?",
    "¿Qué staff genera más ingresos?",
    "¿Qué productos tienen stock bajo?",
  ];
}

function detectIntent(question: string) {
  const q = normalizeText(question);

  if (
    (q.includes("cuanto vendi") || q.includes("cuanto he vendido") || q.includes("ventas")) &&
    (q.includes("semana") || q.includes("hoy") || q.includes("mes"))
  ) {
    return "sales_summary";
  }

  if (
    q.includes("producto mas vendido") ||
    q.includes("producto se vende mas") ||
    q.includes("top productos") ||
    q.includes("mejor producto")
  ) {
    return "top_products";
  }

  if (
    q.includes("clientes inactivos") ||
    q.includes("cliente inactivo") ||
    q.includes("clientes que no han vuelto") ||
    q.includes("clientes sin actividad")
  ) {
    return "inactive_customers";
  }

  if (
    q.includes("staff genera mas") ||
    q.includes("quien vende mas") ||
    q.includes("mejor staff") ||
    q.includes("staff con mas ingresos")
  ) {
    return "top_staff";
  }

  if (
    q.includes("stock bajo") ||
    q.includes("poco stock") ||
    q.includes("sin stock") ||
    q.includes("inventario bajo")
  ) {
    return "low_stock";
  }

  if (
    q.includes("citas manana") ||
    q.includes("citas de manana") ||
    q.includes("proximas citas") ||
    q.includes("cuantas citas tengo manana")
  ) {
    return "upcoming_appointments";
  }

  return "unknown";
}

export async function getBusinessAssistantAnswer(
  businessId: string,
  question: string
): Promise<AssistantAnswer> {
  const supabase = await createClient();
  const { data: businessSettings } = await supabase
    .from("business_settings")
    .select("timezone")
    .eq("business_id", businessId)
    .maybeSingle();
  const timezone = businessSettings?.timezone || "America/Tegucigalpa";

  const intent = detectIntent(question);
  const { ymd: todayYmd } = getDatePartsInTegucigalpa();

  if (intent === "unknown") {
    return {
      matched: false,
      title: "Pregunta no soportada todavía",
      answer:
        "Por ahora el asistente responde preguntas concretas sobre ventas, productos, clientes, staff, stock y citas próximas.",
      suggestions: defaultSuggestions(),
    };
  }

  if (intent === "sales_summary") {
    let startYmd = todayYmd;
    let label = "hoy";

    if (normalizeText(question).includes("semana")) {
      startYmd = addDaysToYmd(todayYmd, -6);
      label = "esta semana";
    } else if (normalizeText(question).includes("mes")) {
      startYmd = startOfMonthYmd(todayYmd);
      label = "este mes";
    }

    const startUtc =
      label === "hoy"
        ? getUtcRangeForTegucigalpaDay(todayYmd).start
        : `${startYmd}T06:00:00.000Z`;

    const endUtc = getUtcRangeForTegucigalpaDay(todayYmd).end;

    const { data: sales } = await supabase
      .from("sales")
      .select("id, total, sale_at")
      .eq("business_id", businessId)
      .gte("sale_at", startUtc)
      .lt("sale_at", endUtc);

    const totalSales = (sales || []).reduce(
      (acc, row) => acc + Number(row.total || 0),
      0
    );

    return {
      matched: true,
      title: "Resumen de ventas",
      answer: `Has registrado ${(sales || []).length} venta(s) ${label}, con un total de ${formatMoney(totalSales, timezone)}.`,
      suggestions: [
        "¿Cuál es mi producto más vendido?",
        "¿Qué staff genera más ingresos?",
        "¿Qué productos tienen stock bajo?",
      ],
    };
  }

  if (intent === "top_products") {
    const { data: salesRows } = await supabase
      .from("sales")
      .select("id")
      .eq("business_id", businessId)
      .limit(3000);

    const saleIds = (salesRows || []).map((row) => row.id);

    if (saleIds.length === 0) {
      return {
        matched: true,
        title: "Top productos",
        answer: "Todavía no hay ventas suficientes para calcular el producto más vendido.",
        suggestions: defaultSuggestions(),
      };
    }

    const { data: items } = await supabase
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

    const map = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    for (const item of items || []) {
      const product = Array.isArray(item.product) ? item.product[0] : item.product;
      if (!item.product_id || !product?.name) continue;
      if (product.business_id !== businessId) continue;

      const current = map.get(item.product_id) || {
        name: product.name,
        quantity: 0,
        revenue: 0,
      };

      current.quantity += Number(item.quantity || 0);
      current.revenue += Number(item.line_total || 0);

      map.set(item.product_id, current);
    }

    const top = Array.from(map.values()).sort((a, b) => {
      if (b.quantity !== a.quantity) return b.quantity - a.quantity;
      return b.revenue - a.revenue;
    })[0];

    if (!top) {
      return {
        matched: true,
        title: "Top productos",
        answer: "Todavía no hay ventas suficientes para calcular el producto más vendido.",
        suggestions: defaultSuggestions(),
      };
    }

    return {
      matched: true,
      title: "Producto más vendido",
      answer: `Tu producto más vendido es "${top.name}", con ${top.quantity} unidad(es) vendidas y ${formatMoney(top.revenue, timezone)} en ingresos.`,
      suggestions: [
        "¿Cuánto vendí esta semana?",
        "¿Qué productos tienen stock bajo?",
        "¿Qué staff genera más ingresos?",
      ],
    };
  }

  if (intent === "top_staff") {
    const { data: sales } = await supabase
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
      .limit(3000);

    const map = new Map<
      string,
      { name: string; salesCount: number; revenue: number }
    >();

    for (const row of sales || []) {
      const staff = Array.isArray(row.staff) ? row.staff[0] : row.staff;
      if (!row.staff_id || !staff?.display_name) continue;

      const current = map.get(row.staff_id) || {
        name: staff.display_name,
        salesCount: 0,
        revenue: 0,
      };

      current.salesCount += 1;
      current.revenue += Number(row.total || 0);

      map.set(row.staff_id, current);
    }

    const top = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)[0];

    if (!top) {
      return {
        matched: true,
        title: "Top staff",
        answer: "Todavía no hay ventas asociadas a staff para calcular este indicador.",
        suggestions: defaultSuggestions(),
      };
    }

    return {
      matched: true,
      title: "Staff con más ingresos",
      answer: `"${top.name}" es el staff con más ingresos registrados, con ${top.salesCount} venta(s) y ${formatMoney(top.revenue, timezone)} acumulados.`,
      suggestions: [
        "¿Cuánto vendí este mes?",
        "¿Cuál es mi producto más vendido?",
        "¿Qué clientes están inactivos?",
      ],
    };
  }

  if (intent === "low_stock") {
    const { data: products } = await supabase
      .from("products")
      .select("id, name, stock")
      .eq("business_id", businessId)
      .eq("active", true)
      .lte("stock", 5)
      .order("stock", { ascending: true })
      .limit(5);

    if (!products || products.length === 0) {
      return {
        matched: true,
        title: "Stock bajo",
        answer: "No tienes productos activos con stock bajo en este momento.",
        suggestions: [
          "¿Cuál es mi producto más vendido?",
          "¿Cuánto vendí esta semana?",
          "¿Qué clientes están inactivos?",
        ],
      };
    }

    const details = products
      .map((product) => `"${product.name}" (${product.stock} unidad(es))`)
      .join(", ");

    return {
      matched: true,
      title: "Productos con stock bajo",
      answer: `Actualmente tienes ${products.length} producto(s) con stock bajo: ${details}.`,
      suggestions: [
        "¿Cuál es mi producto más vendido?",
        "¿Cuánto vendí hoy?",
        "¿Qué staff genera más ingresos?",
      ],
    };
  }

  if (intent === "upcoming_appointments") {
    const tomorrowYmd = addDaysToYmd(todayYmd, 1);
    const tomorrowRange = getUtcRangeForTegucigalpaDay(tomorrowYmd);

    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, appointment_at, status")
      .eq("business_id", businessId)
      .in("status", ["pending", "confirmed"])
      .gte("appointment_at", tomorrowRange.start)
      .lt("appointment_at", tomorrowRange.end)
      .order("appointment_at", { ascending: true });

    if (!appointments || appointments.length === 0) {
      return {
        matched: true,
        title: "Citas próximas",
        answer: "No tienes citas pendientes o confirmadas para mañana.",
        suggestions: defaultSuggestions(),
      };
    }

    const firstDate = formatDate(appointments[0].appointment_at);

    return {
      matched: true,
      title: "Citas de mañana",
      answer: `Tienes ${appointments.length} cita(s) programada(s) para mañana. La primera registrada cae el ${firstDate}.`,
      suggestions: [
        "¿Cuánto vendí hoy?",
        "¿Qué productos tienen stock bajo?",
        "¿Qué clientes están inactivos?",
      ],
    };
  }

  if (intent === "inactive_customers") {
    const thirtyDaysAgoYmd = addDaysToYmd(todayYmd, -30);

    const { data: customers } = await supabase
      .from("customers")
      .select("id, name")
      .eq("business_id", businessId)
      .limit(500);

    const customerMap = new Map<string, string>();
    for (const customer of customers || []) {
      customerMap.set(customer.id, customer.name);
    }

    const { data: recentSalesActivity } = await supabase
      .from("sales")
      .select("customer_id, sale_at")
      .eq("business_id", businessId)
      .not("customer_id", "is", null)
      .gte("sale_at", `${thirtyDaysAgoYmd}T00:00:00`)
      .limit(1000);

    const { data: recentAppointmentsActivity } = await supabase
      .from("appointments")
      .select("customer_id, appointment_at")
      .eq("business_id", businessId)
      .not("customer_id", "is", null)
      .gte("appointment_at", `${thirtyDaysAgoYmd}T00:00:00`)
      .limit(1000);

    const { data: historicalSalesActivity } = await supabase
      .from("sales")
      .select("customer_id, sale_at")
      .eq("business_id", businessId)
      .not("customer_id", "is", null)
      .limit(3000);

    const { data: historicalAppointmentsActivity } = await supabase
      .from("appointments")
      .select("customer_id, appointment_at")
      .eq("business_id", businessId)
      .not("customer_id", "is", null)
      .limit(3000);

    const recentActiveCustomerIds = new Set<string>();
    const historicalLastActivity = new Map<string, string>();

    for (const row of recentSalesActivity || []) {
      if (row.customer_id) recentActiveCustomerIds.add(row.customer_id);
    }

    for (const row of recentAppointmentsActivity || []) {
      if (row.customer_id) recentActiveCustomerIds.add(row.customer_id);
    }

    for (const row of historicalSalesActivity || []) {
      if (!row.customer_id || !row.sale_at) continue;
      const current = historicalLastActivity.get(row.customer_id);
      if (!current || new Date(row.sale_at) > new Date(current)) {
        historicalLastActivity.set(row.customer_id, row.sale_at);
      }
    }

    for (const row of historicalAppointmentsActivity || []) {
      if (!row.customer_id || !row.appointment_at) continue;
      const current = historicalLastActivity.get(row.customer_id);
      if (!current || new Date(row.appointment_at) > new Date(current)) {
        historicalLastActivity.set(row.customer_id, row.appointment_at);
      }
    }

    const inactive = Array.from(historicalLastActivity.entries())
      .filter(([customerId]) => customerMap.has(customerId))
      .filter(([customerId]) => !recentActiveCustomerIds.has(customerId))
      .sort((a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime())
      .slice(0, 5);

    if (inactive.length === 0) {
      return {
        matched: true,
        title: "Clientes inactivos",
        answer: "No detecté clientes con historial previo y sin actividad reciente en este momento.",
        suggestions: [
          "¿Cuánto vendí esta semana?",
          "¿Cuál es mi producto más vendido?",
          "¿Qué staff genera más ingresos?",
        ],
      };
    }

    const details = inactive
      .map(([customerId, lastActivity]) => {
        const name = customerMap.get(customerId) || "Cliente";
        return `${name} (${formatDate(lastActivity)})`;
      })
      .join(", ");

    return {
      matched: true,
      title: "Clientes inactivos",
      answer: `Detecté ${inactive.length} cliente(s) con historial previo y sin actividad reciente: ${details}.`,
      suggestions: [
        "¿Qué productos tienen stock bajo?",
        "¿Cuánto vendí este mes?",
        "¿Cuál es mi producto más vendido?",
      ],
    };
  }

  return {
    matched: false,
    title: "Pregunta no soportada",
    answer: "No pude interpretar esa pregunta todavía.",
    suggestions: defaultSuggestions(),
  };
}