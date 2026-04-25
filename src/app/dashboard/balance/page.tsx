import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { getCurrentPlan } from "@/lib/billing/getCurrentPlan";
import { createClient } from "@/lib/supabase/server";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import { formatMoneyByTimezone } from "@/lib/money/currency";
import BalanceClient from "./BalanceClient";

type AppointmentRecord = {
  id: string;
  appointment_at: string;
  status: string;
  notes: string | null;
  source: string | null;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  service: {
    id: string;
    name: string;
    price: number | null;
  } | null;
  staff: {
    id: string;
    display_name: string;
  } | null;
};

type SaleRecord = {
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
  } | null;
};

type SaleItemRecord = {
  id: string;
  sale_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  product: {
    id: string;
    name: string;
    sku: string | null;
  } | null;
};

type AiUsageLogRecord = {
  id: string;
  call_id: string;
  assistant_id: string | null;
  usage_date: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number;
  minutes_used: number;
  overage_minutes: number;
  billing_status: string;
  source: string;
  created_at: string;
};

type AiCallDetailRecord = {
  id: string;
  call_id: string;
  assistant_id: string | null;
  transcript: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

function getDatePartsInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";

  return { year, month, day };
}

function getCurrentMonthKey(timezone: string) {
  const now = new Date();
  const { year, month } = getDatePartsInTimezone(now, timezone);
  return `${year}-${month}`;
}

function parseMonthKey(monthKey: string) {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (
    !yearStr ||
    !monthStr ||
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return { year, month };
}

function getMonthRange(monthKey: string, timezone: string) {
  const parsed =
    parseMonthKey(monthKey) || parseMonthKey(getCurrentMonthKey(timezone))!;
  const year = parsed.year;
  const month = parsed.month;

  const start = `${year}-${String(month).padStart(2, "0")}-01T00:00:00`;

  const nextMonthDate =
    month === 12 ? new Date(year + 1, 0, 1) : new Date(year, month, 1);

  const nextParts = getDatePartsInTimezone(nextMonthDate, timezone);
  const endExclusive = `${nextParts.year}-${nextParts.month}-${nextParts.day}T00:00:00`;

  const monthLabel = new Intl.DateTimeFormat("es-HN", {
    timeZone: timezone,
    month: "long",
    year: "numeric",
  }).format(
    new Date(`${year}-${String(month).padStart(2, "0")}-01T12:00:00`)
  );

  const prevMonth =
    month === 1
      ? `${year - 1}-12`
      : `${year}-${String(month - 1).padStart(2, "0")}`;

  const nextMonth =
    month === 12
      ? `${year + 1}-01`
      : `${year}-${String(month + 1).padStart(2, "0")}`;

  return {
    key: `${year}-${String(month).padStart(2, "0")}`,
    start,
    endExclusive,
    startDate: start.slice(0, 10),
    endDate: endExclusive.slice(0, 10),
    label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
    prevMonth,
    nextMonth,
    parsed,
  };
}

function getDateKey(dateStr: string, timezone: string) {
  const { year, month, day } = getDatePartsInTimezone(new Date(dateStr), timezone);
  return `${year}-${month}-${day}`;
}

export default async function BalancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireSectionAccess("balance");

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");
  const supabase = await createClient();
  const plan = await getCurrentPlan();

  const { data: settings } = await supabase
    .from("business_settings")
    .select("timezone")
    .eq("business_id", business.id)
    .maybeSingle();

  const timezone = settings?.timezone || "America/Tegucigalpa";

  const selectedMonth = params.month || getCurrentMonthKey(timezone);
  const range = getMonthRange(selectedMonth, timezone);

  const planCode = String(plan?.code || "").toLowerCase();
  const canSeeAdvancedBalance = planCode !== "basic";
  const canExportBalance = planCode !== "basic";

  const [
    { data: allAppointmentsRaw, error: allAppointmentsError },
    { data: salesRaw, error: salesError },
    { count: customersCount },
    { count: servicesCount },
    { count: staffCount },
    { count: productsCount },
    { data: aiUsageLogsRaw, error: aiUsageLogsError },
    { data: aiCallDetailsRaw, error: aiCallDetailsError },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(`
        id,
        appointment_at,
        status,
        notes,
        source,
        customer:customers!appointments_customer_id_fkey(id,name,phone),
        service:services!appointments_service_id_fkey(id,name,price),
        staff:staff!appointments_staff_id_fkey(id,display_name)
      `)
      .eq("business_id", business.id)
      .gte("appointment_at", range.start)
      .lt("appointment_at", range.endExclusive)
      .order("appointment_at", { ascending: false }),

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
        staff:staff(id,display_name)
      `)
      .eq("business_id", business.id)
      .gte("sale_at", range.start)
      .lt("sale_at", range.endExclusive)
      .order("sale_at", { ascending: false }),

    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id),

    supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id),

    supabase
      .from("staff")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id),

    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id),

    supabase
      .from("ai_usage_logs")
      .select(`
        id,
        call_id,
        assistant_id,
        usage_date,
        started_at,
        ended_at,
        duration_seconds,
        minutes_used,
        overage_minutes,
        billing_status,
        source,
        created_at
      `)
      .eq("business_id", business.id)
      .gte("usage_date", range.startDate)
      .lt("usage_date", range.endDate)
      .order("usage_date", { ascending: false }),

    supabase
      .from("ai_call_details")
      .select(`
        id,
        call_id,
        assistant_id,
        transcript,
        summary,
        created_at,
        updated_at
      `)
      .eq("business_id", business.id)
      .gte("created_at", range.start)
      .lt("created_at", range.endExclusive)
      .order("created_at", { ascending: false }),
  ]);

  if (allAppointmentsError || salesError || aiUsageLogsError || aiCallDetailsError) {
    return (
      <main className={`min-h-screen p-6 ${theme.pageBg}`}>
        <div className={`rounded-3xl border p-6 ${theme.card}`}>
          Error cargando balance:{" "}
          {allAppointmentsError?.message ||
            salesError?.message ||
            aiUsageLogsError?.message ||
            aiCallDetailsError?.message}
        </div>
      </main>
    );
  }

  const allAppointments: AppointmentRecord[] = (allAppointmentsRaw || []).map(
    (apt: any) => ({
      id: apt.id,
      appointment_at: apt.appointment_at,
      status: apt.status,
      notes: apt.notes,
      source: apt.source,
      customer: Array.isArray(apt.customer)
        ? apt.customer[0] || null
        : apt.customer || null,
      service: Array.isArray(apt.service)
        ? apt.service[0] || null
        : apt.service || null,
      staff: Array.isArray(apt.staff) ? apt.staff[0] || null : apt.staff || null,
    })
  );

  const completedAppointments = allAppointments.filter(
    (apt) => apt.status === "completed"
  );

  const sales: SaleRecord[] = (salesRaw || []).map((sale: any) => ({
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
  }));

  const saleIds = sales.map((sale) => sale.id);

  let saleItems: SaleItemRecord[] = [];

  if (saleIds.length > 0) {
    const { data: saleItemsRaw, error: saleItemsError } = await supabase
      .from("sale_items")
      .select(`
        id,
        sale_id,
        quantity,
        unit_price,
        line_total,
        product:products(id,name,sku)
      `)
      .in("sale_id", saleIds);

    if (saleItemsError) {
      return (
        <main className={`min-h-screen p-6 ${theme.pageBg}`}>
          <div className={`rounded-3xl border p-6 ${theme.card}`}>
            Error cargando items de ventas: {saleItemsError.message}
          </div>
        </main>
      );
    }

    saleItems = (saleItemsRaw || []).map((item: any) => ({
      id: item.id,
      sale_id: item.sale_id,
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.unit_price || 0),
      line_total: Number(item.line_total || 0),
      product: Array.isArray(item.product)
        ? item.product[0] || null
        : item.product || null,
    }));
  }

  const aiUsageLogs: AiUsageLogRecord[] = (aiUsageLogsRaw || []).map((log: any) => ({
    id: log.id,
    call_id: log.call_id,
    assistant_id: log.assistant_id,
    usage_date: log.usage_date,
    started_at: log.started_at,
    ended_at: log.ended_at,
    duration_seconds: Number(log.duration_seconds || 0),
    minutes_used: Number(log.minutes_used || 0),
    overage_minutes: Number(log.overage_minutes || 0),
    billing_status: log.billing_status,
    source: log.source,
    created_at: log.created_at,
  }));

  const aiCallDetails: AiCallDetailRecord[] = (aiCallDetailsRaw || []).map(
    (call: any) => ({
      id: call.id,
      call_id: call.call_id,
      assistant_id: call.assistant_id,
      transcript: call.transcript,
      summary: call.summary,
      created_at: call.created_at,
      updated_at: call.updated_at,
    })
  );

  const appointmentRevenue = completedAppointments.reduce(
    (sum, apt) => sum + Number(apt.service?.price || 0),
    0
  );

  const salesRevenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const totalRevenue = appointmentRevenue + salesRevenue;

  const completedCount = completedAppointments.length;
  const salesCount = sales.length;

  const averageTicketAppointments =
    completedCount > 0 ? appointmentRevenue / completedCount : 0;

  const averageTicketSales = salesCount > 0 ? salesRevenue / salesCount : 0;

  const uniqueClients = new Set(
    completedAppointments.map((apt) => apt.customer?.id).filter(Boolean)
  ).size;

  const uniqueSaleClients = new Set(
    sales.map((sale) => sale.customer?.id).filter(Boolean)
  ).size;

  const totalUniqueClients = new Set([
    ...completedAppointments.map((apt) => apt.customer?.id).filter(Boolean),
    ...sales.map((sale) => sale.customer?.id).filter(Boolean),
  ]).size;

  const statusCounts = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };

  for (const apt of allAppointments) {
    const status = apt.status as keyof typeof statusCounts;
    if (statusCounts[status] !== undefined) {
      statusCounts[status] += 1;
    }
  }

  const serviceMap = new Map<
    string,
    { name: string; count: number; revenue: number }
  >();

  for (const apt of completedAppointments) {
    const key = apt.service?.id || "unknown";
    const current = serviceMap.get(key) || {
      name: apt.service?.name || "Sin servicio",
      count: 0,
      revenue: 0,
    };

    current.count += 1;
    current.revenue += Number(apt.service?.price || 0);
    serviceMap.set(key, current);
  }

  const topServices = [...serviceMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const staffMap = new Map<
    string,
    { name: string; count: number; revenue: number }
  >();

  for (const apt of completedAppointments) {
    const key = apt.staff?.id || "unassigned";
    const current = staffMap.get(key) || {
      name: apt.staff?.display_name || "Sin asignar",
      count: 0,
      revenue: 0,
    };

    current.count += 1;
    current.revenue += Number(apt.service?.price || 0);
    staffMap.set(key, current);
  }

  const topStaff = [...staffMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const productMap = new Map<
    string,
    { name: string; count: number; revenue: number }
  >();

  for (const item of saleItems) {
    const key = item.product?.id || "unknown";
    const current = productMap.get(key) || {
      name: item.product?.name || "Sin producto",
      count: 0,
      revenue: 0,
    };

    current.count += Number(item.quantity || 0);
    current.revenue += Number(item.line_total || 0);
    productMap.set(key, current);
  }

  const topProducts = [...productMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const dailyRevenue: {
    key: string;
    label: string;
    appointmentsRevenue: number;
    salesRevenue: number;
    totalRevenue: number;
  }[] = [];

  const daysInMonth = new Date(range.parsed.year, range.parsed.month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${range.parsed.year}-${String(range.parsed.month).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    const appointmentsRevenue = completedAppointments
      .filter((apt) => getDateKey(apt.appointment_at, timezone) === key)
      .reduce((sum, apt) => sum + Number(apt.service?.price || 0), 0);

    const salesDayRevenue = sales
      .filter((sale) => getDateKey(sale.sale_at, timezone) === key)
      .reduce((sum, sale) => sum + Number(sale.total || 0), 0);

    dailyRevenue.push({
      key,
      label: String(day).padStart(2, "0"),
      appointmentsRevenue,
      salesRevenue: salesDayRevenue,
      totalRevenue: appointmentsRevenue + salesDayRevenue,
    });
  }

  const maxDailyRevenue = Math.max(...dailyRevenue.map((d) => d.totalRevenue), 1);
  const maxServiceRevenue = Math.max(...topServices.map((s) => s.revenue), 1);
  const maxStaffRevenue = Math.max(...topStaff.map((s) => s.revenue), 1);
  const maxProductRevenue = Math.max(...topProducts.map((p) => p.revenue), 1);
  const maxStatus = Math.max(...Object.values(statusCounts), 1);

  const metricCards = [
    {
      title: "Ingresos totales",
      value: formatMoneyByTimezone(totalRevenue, timezone),
      subtitle: `${range.label} · citas + ventas`,
      icon: "money" as const,
    },
    {
      title: "Ingresos por citas",
      value: formatMoneyByTimezone(appointmentRevenue, timezone),
      subtitle: `${completedCount} cita(s) completada(s)`,
      icon: "calendar" as const,
    },
    {
      title: "Ingresos por ventas",
      value: formatMoneyByTimezone(salesRevenue, timezone),
      subtitle: `${salesCount} venta(s) registrada(s)`,
      icon: "sales" as const,
    },
    {
      title: "Clientes únicos",
      value: String(totalUniqueClients),
      subtitle: `${uniqueClients} por citas · ${uniqueSaleClients} por ventas`,
      icon: "users" as const,
    },
    {
      title: "Ticket promedio citas",
      value: formatMoneyByTimezone(averageTicketAppointments, timezone),
      subtitle: "Promedio por cita completada",
      icon: "briefcase" as const,
    },
    {
      title: "Ticket promedio ventas",
      value: formatMoneyByTimezone(averageTicketSales, timezone),
      subtitle: "Promedio por venta registrada",
      icon: "sales" as const,
    },
  ];

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <BalanceClient
          theme={theme}
          rangeLabel={range.label}
          currentMonthKey={range.key}
          prevMonth={range.prevMonth}
          nextMonth={range.nextMonth}
          metricCards={metricCards}
          dailyRevenue={dailyRevenue}
          maxDailyRevenue={maxDailyRevenue}
          statusCounts={statusCounts}
          maxStatus={maxStatus}
          topServices={topServices}
          maxServiceRevenue={maxServiceRevenue}
          topStaff={topStaff}
          maxStaffRevenue={maxStaffRevenue}
          topProducts={topProducts}
          maxProductRevenue={maxProductRevenue}
          allAppointments={allAppointments}
          completedAppointments={completedAppointments}
          sales={sales}
          saleItems={saleItems}
          aiUsageLogs={aiUsageLogs}
          aiCallDetails={aiCallDetails}
          customersCount={customersCount || 0}
          servicesCount={servicesCount || 0}
          staffCount={staffCount || 0}
          productsCount={productsCount || 0}
          appointmentRevenue={appointmentRevenue}
          salesRevenue={salesRevenue}
          totalRevenue={totalRevenue}
          canSeeAdvancedBalance={canSeeAdvancedBalance}
          canExportBalance={canExportBalance}
          timezone={timezone}
        />
      </div>
    </main>
  );
}