import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/tenant/getCurrentBusiness";
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
  const ctx = await getCurrentBusiness();

  if (!ctx?.business) {
    redirect("/onboarding");
  }

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");
  const supabase = await createClient();

  const selectedMonth = params.month || getCurrentMonthKey();
  const range = getMonthRange(selectedMonth);

  const [
    { data: completedAppointmentsRaw, error: completedError },
    { data: allAppointmentsRaw, error: allAppointmentsError },
    { count: customersCount },
    { count: servicesCount },
    { count: staffCount },
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
  ]);

  if (completedError || allAppointmentsError) {
    return (
      <main className={`min-h-screen p-6 ${theme.pageBg}`}>
        <div className={`rounded-3xl border p-6 ${theme.card}`}>
          Error cargando balance:{" "}
          {completedError?.message || allAppointmentsError?.message}
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

  const allAppointments = allAppointmentsRaw || [];

  const totalRevenue = completedAppointments.reduce(
    (sum, apt) => sum + Number(apt.service?.price || 0),
    0
  );

  const completedCount = completedAppointments.length;
  const averageTicket = completedCount > 0 ? totalRevenue / completedCount : 0;

  const uniqueClients = new Set(
    completedAppointments
      .map((apt) => apt.customer?.id)
      .filter(Boolean)
  ).size;

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

  const dailyRevenue: { key: string; label: string; revenue: number }[] = [];
  const daysInMonth = new Date(range.parsed.year, range.parsed.month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${range.parsed.year}-${String(range.parsed.month).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;

    const revenue = completedAppointments
      .filter((apt) => getDateKey(apt.appointment_at) === key)
      .reduce((sum, apt) => sum + Number(apt.service?.price || 0), 0);

    dailyRevenue.push({
      key,
      label: String(day).padStart(2, "0"),
      revenue,
    });
  }

  const maxDailyRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);
  const maxServiceRevenue = Math.max(...topServices.map((s) => s.revenue), 1);
  const maxStaffRevenue = Math.max(...topStaff.map((s) => s.revenue), 1);
  const maxStatus = Math.max(...Object.values(statusCounts), 1);

  const metricCards = [
    {
      title: "Ingresos del período",
      value: `L ${totalRevenue.toFixed(2)}`,
      subtitle: range.label,
      icon: "money" as const,
    },
    {
      title: "Citas completadas",
      value: String(completedCount),
      subtitle: "Dentro del filtro actual",
      icon: "calendar" as const,
    },
    {
      title: "Clientes atendidos",
      value: String(uniqueClients),
      subtitle: "Clientes únicos del período",
      icon: "users" as const,
    },
    {
      title: "Ticket promedio",
      value: `L ${averageTicket.toFixed(2)}`,
      subtitle: "Promedio por cita completada",
      icon: "briefcase" as const,
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
          completedAppointments={completedAppointments}
          customersCount={customersCount || 0}
          servicesCount={servicesCount || 0}
          staffCount={staffCount || 0}
          totalRevenue={totalRevenue}
        />
      </div>
    </main>
  );
}