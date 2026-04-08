import { createClient } from "@/lib/supabase/server";

type AlertFeatureFlags = {
  alerts_basic: boolean;
  alerts_advanced: boolean;
};

type InsertableAlert = {
  business_id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  metadata?: Record<string, unknown>;
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

function getUtcRangeForTegucigalpaDay(ymd: string) {
  return {
    start: `${ymd}T06:00:00.000Z`,
    end: `${addDaysToYmd(ymd, 1)}T06:00:00.000Z`,
  };
}

function pushAlert(alerts: InsertableAlert[], alert: InsertableAlert) {
  alerts.push(alert);
}

export async function generateAlerts(
  businessId: string,
  features: AlertFeatureFlags
) {
  const supabase = await createClient();

  await supabase.from("business_alerts").delete().eq("business_id", businessId);

  const alerts: InsertableAlert[] = [];

  const { ymd: todayYmd } = getDatePartsInTegucigalpa();
  const tomorrowYmd = addDaysToYmd(todayYmd, 1);
  const thirtyDaysAgoYmd = addDaysToYmd(todayYmd, -30);

  const todayRange = getUtcRangeForTegucigalpaDay(todayYmd);
  const tomorrowRange = getUtcRangeForTegucigalpaDay(tomorrowYmd);

  // =========================
  // ALERTAS BÁSICAS
  // =========================
  if (features.alerts_basic) {
    const { data: lowStockProducts } = await supabase
      .from("products")
      .select("id, name, stock")
      .eq("business_id", businessId)
      .eq("active", true)
      .lte("stock", 5)
      .order("stock", { ascending: true })
      .limit(12);

    for (const product of lowStockProducts || []) {
      pushAlert(alerts, {
        business_id: businessId,
        type: "low_stock",
        title: product.stock <= 0 ? "Producto sin stock" : "Stock bajo",
        message:
          product.stock <= 0
            ? `El producto "${product.name}" ya no tiene existencias.`
            : `El producto "${product.name}" tiene solo ${product.stock} unidades.`,
        severity: product.stock <= 0 ? "critical" : "warning",
        metadata: {
          product_id: product.id,
          stock: product.stock,
        },
      });
    }

    const { data: upcomingAppointments } = await supabase
      .from("appointments")
      .select("id, appointment_at, status")
      .eq("business_id", businessId)
      .in("status", ["pending", "confirmed"])
      .gte("appointment_at", tomorrowRange.start)
      .lt("appointment_at", tomorrowRange.end);

    const upcomingCount = (upcomingAppointments || []).length;

    if (upcomingCount > 0) {
      pushAlert(alerts, {
        business_id: businessId,
        type: "upcoming_appointments",
        title: "Citas para mañana",
        message: `Tienes ${upcomingCount} cita(s) programada(s) para mañana.`,
        severity: "info",
        metadata: {
          count: upcomingCount,
          date: tomorrowYmd,
        },
      });
    }
  }

  // =========================
  // ALERTAS AVANZADAS
  // =========================
  if (features.alerts_advanced) {
    const { data: salesToday } = await supabase
      .from("sales")
      .select("id")
      .eq("business_id", businessId)
      .gte("sale_at", todayRange.start)
      .lt("sale_at", todayRange.end)
      .limit(1);

    if (!salesToday || salesToday.length === 0) {
      pushAlert(alerts, {
        business_id: businessId,
        type: "no_sales_today",
        title: "Sin ventas hoy",
        message: "Todavía no se ha registrado ninguna venta en el día de hoy.",
        severity: "warning",
      });
    }

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
    const historicalLastActivity = new Map<
      string,
      { date: string; source: "sale" | "appointment" }
    >();

    for (const row of recentSalesActivity || []) {
      if (row.customer_id) {
        recentActiveCustomerIds.add(row.customer_id);
      }
    }

    for (const row of recentAppointmentsActivity || []) {
      if (row.customer_id) {
        recentActiveCustomerIds.add(row.customer_id);
      }
    }

    for (const row of historicalSalesActivity || []) {
      if (!row.customer_id || !row.sale_at) continue;
      const current = historicalLastActivity.get(row.customer_id);
      if (!current || new Date(row.sale_at) > new Date(current.date)) {
        historicalLastActivity.set(row.customer_id, {
          date: row.sale_at,
          source: "sale",
        });
      }
    }

    for (const row of historicalAppointmentsActivity || []) {
      if (!row.customer_id || !row.appointment_at) continue;
      const current = historicalLastActivity.get(row.customer_id);
      if (!current || new Date(row.appointment_at) > new Date(current.date)) {
        historicalLastActivity.set(row.customer_id, {
          date: row.appointment_at,
          source: "appointment",
        });
      }
    }

    const inactiveCandidates = Array.from(historicalLastActivity.entries())
      .filter(([customerId]) => customerMap.has(customerId))
      .filter(([customerId]) => !recentActiveCustomerIds.has(customerId))
      .sort((a, b) => new Date(a[1].date).getTime() - new Date(b[1].date).getTime())
      .slice(0, 6);

    for (const [customerId, activity] of inactiveCandidates) {
      const customerName = customerMap.get(customerId) || "Cliente";
      const lastDate = new Intl.DateTimeFormat("es-HN", {
        timeZone: "America/Tegucigalpa",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(activity.date));

      pushAlert(alerts, {
        business_id: businessId,
        type: "inactive_customer",
        title: "Cliente inactivo",
        message: `"${customerName}" no registra actividad reciente. Último movimiento: ${lastDate}.`,
        severity: "info",
        metadata: {
          customer_id: customerId,
          last_activity_at: activity.date,
          last_activity_source: activity.source,
        },
      });
    }
  }

  if (alerts.length > 0) {
    await supabase.from("business_alerts").insert(alerts);
  }

  return alerts;
}