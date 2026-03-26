import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { requirePlanFeature } from "@/lib/billing/requirePlanFeature";
import { createClient } from "@/lib/supabase/server";
import BalanceClient from "./BalanceClient";

type CompletedAppointment = {
  id: string;
  appointment_at: string;
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

function getThemeClasses(theme: string) {
  switch (theme) {
    case "dark":
      return {
        pageBg: "bg-[#181818] text-white",
        card: "bg-[#222222] border-[#333333]",
        subtle: "bg-[#2a2a2a] border-[#3a3a3a]",
        textMuted: "text-[#bdbdbd]",
        accent: "bg-white text-black",
        buttonSecondary:
          "bg-[#2b2b2b] border-[#444444] text-white hover:bg-[#343434]",
      };

    case "elegant":
      return {
        pageBg: "bg-[#f4efe8] text-[#2b211b]",
        card: "bg-[#fffaf5] border-[#e6d8c8]",
        subtle: "bg-[#f9f2e8] border-[#eadfce]",
        textMuted: "text-[#7a6858]",
        accent: "bg-[#6b4f3a] text-white",
        buttonSecondary:
          "bg-white border-[#d8c7b7] text-[#2b211b] hover:bg-[#f3e8dc]",
      };

    case "minimal":
      return {
        pageBg: "bg-[#f8f8f8] text-[#1f1f1f]",
        card: "bg-white border-[#e5e5e5]",
        subtle: "bg-[#f3f3f3] border-[#e1e1e1]",
        textMuted: "text-[#6f6f6f]",
        accent: "bg-[#111111] text-white",
        buttonSecondary:
          "bg-white border-[#d6d6d6] text-[#1f1f1f] hover:bg-[#f1f1f1]",
      };

    case "warm":
    default:
      return {
        pageBg: "bg-[#f6f1e8] text-[#2f241d]",
        card: "bg-white border-[#eadfce]",
        subtle: "bg-[#f9f2e8] border-[#eadfce]",
        textMuted: "text-[#6b5b4d]",
        accent: "bg-[#a56a3a] text-white",
        buttonSecondary:
          "bg-white border-[#d9c6b2] text-[#2f241d] hover:bg-[#f3e8dc]",
      };
  }
}

function getDatePartsInTegucigalpa(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Tegucigalpa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";

  return { year, month, day };
}

function getCurrentMonthKey() {
  const now = new Date();
  const { year, month } = getDatePartsInTegucigalpa(now);
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

function getMonthRange(monthKey: string) {
  const parsed = parseMonthKey(monthKey) || parseMonthKey(getCurrentMonthKey())!;
  const year = parsed.year;
  const month = parsed.month;

  const start = `${year}-${String(month).padStart(2, "0")}-01T00:00:00`;

  const nextMonthDate =
    month === 12 ? new Date(year + 1, 0, 1) : new Date(year, month, 1);

  const nextParts = getDatePartsInTegucigalpa(nextMonthDate);
  const endExclusive = `${nextParts.year}-${nextParts.month}-${nextParts.day}T00:00:00`;

  const monthLabel = new Intl.DateTimeFormat("es-HN", {
    timeZone: "America/Tegucigalpa",
    month: "long",
    year: "numeric",
  }).format(new Date(`${year}-${String(month).padStart(2, "0")}-01T12:00:00`));

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
    label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
    prevMonth,
    nextMonth,
    parsed,
  };
}

function getDateKey(dateStr: string) {
  const { year, month, day } = getDatePartsInTegucigalpa(new Date(dateStr));
  return `${year}-${month}-${day}`;
}

export default async function BalancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireSectionAccess("balance");
  await requirePlanFeature("balance");

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");
  const supabase = await createClient();

  const selectedMonth = params.month || getCurrentMonthKey();
  const range = getMonthRange(selectedMonth);

  const [
    { data: completedAppointmentsRaw, error: completedError },
    { data: allAppointmentsRaw, error: allAppointmentsError },
    { data: salesRaw, error: salesError },
    { count: customersCount },
    { count: servicesCount },
    { count: staffCount },
    { count: productsCount },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(`
        id,
        appointment_at,
        customer:customers!appointments_customer_id_fkey(id,name,phone),
        service:services!appointments_service_id_fkey(id,name,price),
        staff:staff!appointments_staff_id_fkey(id,display_name)
      `)
      .eq("business_id", business.id)
      .eq("status", "completed")
      .gte("appointment_at", range.start)
      .lt("appointment_at", range.endExclusive)
      .order("appointment_at", { ascending: false }),

    supabase
      .from("appointments")
      .select("id,status,appointment_at")
      .eq("business_id", business.id)
      .gte("appointment_at", range.start)
      .lt("appointment_at", range.endExclusive),

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
  ]);

  if (completedError || allAppointmentsError || salesError) {
    return (
      <main className={`min-h-screen p-6 ${theme.pageBg}`}>
        <div className={`rounded-3xl border p-6 ${theme.card}`}>
          Error cargando balance:{" "}
          {completedError?.message || allAppointmentsError?.message || salesError?.message}
        </div>
      </main>
    );
  }

  const completedAppointments: CompletedAppointment[] = (
    completedAppointmentsRaw || []
  ).map((apt: any) => ({
    id: apt.id,
    appointment_at: apt.appointment_at,
    customer: Array.isArray(apt.customer)
      ? apt.customer[0] || null
      : apt.customer || null,
    service: Array.isArray(apt.service)
      ? apt.service[0] || null
      : apt.service || null,
    staff: Array.isArray(apt.staff) ? apt.staff[0] || null : apt.staff || null,
  }));

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

  const allAppointments = allAppointmentsRaw || [];

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
      .filter((apt) => getDateKey(apt.appointment_at) === key)
      .reduce((sum, apt) => sum + Number(apt.service?.price || 0), 0);

    const salesDayRevenue = sales
      .filter((sale) => getDateKey(sale.sale_at) === key)
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
      value: `L ${totalRevenue.toFixed(2)}`,
      subtitle: `${range.label} · citas + ventas`,
      icon: "money" as const,
    },
    {
      title: "Ingresos por citas",
      value: `L ${appointmentRevenue.toFixed(2)}`,
      subtitle: `${completedCount} cita(s) completada(s)`,
      icon: "calendar" as const,
    },
    {
      title: "Ingresos por ventas",
      value: `L ${salesRevenue.toFixed(2)}`,
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
      value: `L ${averageTicketAppointments.toFixed(2)}`,
      subtitle: "Promedio por cita completada",
      icon: "briefcase" as const,
    },
    {
      title: "Ticket promedio ventas",
      value: `L ${averageTicketSales.toFixed(2)}`,
      subtitle: "Promedio por venta registrada",
      icon: "sales" as const,
    },
  ];

  return (
    <main className={`min-h-screen ${theme.pageBg}`}>
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
          completedAppointments={completedAppointments}
          sales={sales}
          saleItems={saleItems}
          customersCount={customersCount || 0}
          servicesCount={servicesCount || 0}
          staffCount={staffCount || 0}
          productsCount={productsCount || 0}
          appointmentRevenue={appointmentRevenue}
          salesRevenue={salesRevenue}
          totalRevenue={totalRevenue}
        />
      </div>
    </main>
  );
}