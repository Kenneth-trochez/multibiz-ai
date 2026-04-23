import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { hasSectionAccess } from "@/lib/auth/permissions";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import {
  Users,
  Briefcase,
  UserCog,
  CalendarDays,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Building2,
} from "lucide-react";

type UpcomingAppointment = {
  id: string;
  appointment_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  customer: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  service: {
    id: string;
    name: string;
  } | null;
  staff: {
    id: string;
    display_name: string;
  } | null;
};

function getTodayRangeInTimezone(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";

  const base = `${year}-${month}-${day}`;
  return {
    start: `${base}T00:00:00`,
    end: `${base}T23:59:59`,
    label: `${day}/${month}/${year}`,
  };
}

function formatDateTime(dateStr: string, timezone: string) {
  return new Intl.DateTimeFormat("es-HN", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateStr));
}

function getStatusBadge(status: UpcomingAppointment["status"]) {
  switch (status) {
    case "confirmed":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    case "pending":
    default:
      return "bg-yellow-100 text-yellow-700";
  }
}

function getStatusLabel(status: UpcomingAppointment["status"]) {
  switch (status) {
    case "confirmed":
      return "Confirmada";
    case "completed":
      return "Completada";
    case "cancelled":
      return "Cancelada";
    case "pending":
    default:
      return "Pendiente";
  }
}

export default async function DashboardPage() {
  const ctx = await requireSectionAccess("dashboard");

  const { business, role } = ctx;
  const theme = getThemeClasses(business.theme || "warm");
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("business_settings")
    .select("timezone")
    .eq("business_id", business.id)
    .maybeSingle();

  const timezone = settings?.timezone || "America/Tegucigalpa";
  const today = getTodayRangeInTimezone(timezone);

  const [
    { count: customersCount },
    { count: servicesCount },
    { count: activeServicesCount },
    { count: staffCount },
    { count: activeStaffCount },
    { count: todayAppointmentsCount },
    { count: pendingAppointmentsCount },
    { data: upcomingAppointmentsRaw, error: appointmentsError },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id),

    supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id),

    supabase
      .from("services")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("active", true),

    supabase
      .from("staff")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id),

    supabase
      .from("staff")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("active", true),

    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("appointment_at", today.start)
      .lte("appointment_at", today.end),

    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "pending"),

    supabase
      .from("appointments")
      .select(`
        id,
        appointment_at,
        status,
        customer:customers!appointments_customer_id_fkey(id,name,phone),
        service:services!appointments_service_id_fkey(id,name),
        staff:staff!appointments_staff_id_fkey(id,display_name)
      `)
      .eq("business_id", business.id)
      .order("appointment_at", { ascending: true })
      .limit(6),
  ]);

  const upcomingAppointments: UpcomingAppointment[] = (
    upcomingAppointmentsRaw || []
  ).map((apt: any) => ({
    id: apt.id,
    appointment_at: apt.appointment_at,
    status: apt.status,
    customer: Array.isArray(apt.customer)
      ? apt.customer[0] || null
      : apt.customer || null,
    service: Array.isArray(apt.service)
      ? apt.service[0] || null
      : apt.service || null,
    staff: Array.isArray(apt.staff) ? apt.staff[0] || null : apt.staff || null,
  }));

  const metrics = [
    {
      title: "Clientes",
      value: customersCount || 0,
      subtitle: "Registrados en el negocio",
      icon: Users,
      href: "/dashboard/customers",
      visible: hasSectionAccess(role, "customers"),
    },
    {
      title: "Servicios",
      value: servicesCount || 0,
      subtitle: `${activeServicesCount || 0} activos`,
      icon: Briefcase,
      href: "/dashboard/services",
      visible: hasSectionAccess(role, "services"),
    },
    {
      title: "Staff",
      value: staffCount || 0,
      subtitle: `${activeStaffCount || 0} activos`,
      icon: UserCog,
      href: "/dashboard/staff",
      visible: hasSectionAccess(role, "staff"),
    },
    {
      title: "Citas hoy",
      value: todayAppointmentsCount || 0,
      subtitle: today.label,
      icon: CalendarDays,
      href: "/dashboard/appointments",
      visible: hasSectionAccess(role, "appointments"),
    },
  ].filter((item) => item.visible);

  const quickLinks = [
    {
      href: "/dashboard/customers",
      label: "Ir a clientes",
      visible: hasSectionAccess(role, "customers"),
    },
    {
      href: "/dashboard/services",
      label: "Ir a servicios",
      visible: hasSectionAccess(role, "services"),
    },
    {
      href: "/dashboard/staff",
      label: "Ir a staff",
      visible: hasSectionAccess(role, "staff"),
    },
    {
      href: "/dashboard/appointments",
      label: "Ir a citas",
      visible: hasSectionAccess(role, "appointments"),
    },
    {
      href: "/dashboard/settings",
      label: "Ir a configuración",
      visible: hasSectionAccess(role, "settings"),
    },
  ].filter((item) => item.visible);

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <section className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className={`text-sm ${theme.textMuted}`}>Resumen general</p>
              <h1 className="mt-1 text-3xl font-bold">{business.name}</h1>
              <p className={`mt-2 max-w-2xl text-sm ${theme.textMuted}`}>
                Aquí puedes ver el estado actual del negocio, el movimiento de
                citas y accesos rápidos a los módulos principales.
              </p>
            </div>

            <div className={`rounded-2xl border px-5 py-4 ${theme.softAccent}`}>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">
                    {business.business_type || "Negocio"}
                  </p>
                  <p className="text-xs opacity-80">
                    Tema: {business.theme || "warm"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                href={item.href}
                className={`rounded-3xl border p-5 shadow-sm transition ${theme.card} ${theme.hover}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-sm ${theme.textMuted}`}>{item.title}</p>
                    <p className="mt-2 text-3xl font-bold">{item.value}</p>
                    <p className={`mt-1 text-xs ${theme.textMuted}`}>
                      {item.subtitle}
                    </p>
                  </div>

                  <div className={`rounded-2xl p-3 ${theme.softAccent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Próximas citas</h2>
                <p className={`mt-1 text-sm ${theme.textMuted}`}>
                  Vista rápida de las siguientes citas registradas.
                </p>
              </div>

              {hasSectionAccess(role, "appointments") && (
                <Link
                  href="/dashboard/appointments"
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${theme.softAccent}`}
                >
                  Ver todas
                </Link>
              )}
            </div>

            {appointmentsError ? (
              <div className={`rounded-2xl border p-4 ${theme.subtle}`}>
                <p className="text-sm text-red-600">
                  Error cargando citas: {appointmentsError.message}
                </p>
              </div>
            ) : upcomingAppointments.length === 0 ? (
              <div
                className={`rounded-2xl border border-dashed p-8 text-center ${theme.subtle}`}
              >
                <p className="font-medium">No hay citas registradas aún.</p>
                <p className={`mt-2 text-sm ${theme.textMuted}`}>
                  Cuando agregues citas, aparecerán aquí como resumen.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className={`rounded-2xl border p-4 ${theme.subtle}`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {apt.customer?.name || "Cliente no disponible"}
                        </p>
                        <div
                          className={`mt-1 flex flex-wrap gap-3 text-sm ${theme.textMuted}`}
                        >
                          <span>{apt.service?.name || "Sin servicio"}</span>
                          <span>
                            {apt.staff?.display_name || "Sin staff asignado"}
                          </span>
                          <span>{formatDateTime(apt.appointment_at, timezone)}</span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(
                          apt.status
                        )}`}
                      >
                        {getStatusLabel(apt.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
              <div className="flex items-center gap-3">
                <div className={`rounded-2xl p-3 ${theme.softAccent}`}>
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Pendientes</h2>
                  <p className={`text-sm ${theme.textMuted}`}>
                    Citas que aún requieren atención.
                  </p>
                </div>
              </div>

              <p className="mt-5 text-4xl font-bold">
                {pendingAppointmentsCount || 0}
              </p>
            </div>

            <div className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
              <h2 className="text-lg font-semibold">Accesos rápidos</h2>
              <p className={`mt-1 text-sm ${theme.textMuted}`}>
                Atajos a las acciones más frecuentes.
              </p>

              <div className="mt-5 grid gap-3">
                {quickLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${theme.subtle} ${theme.hover}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className={`rounded-3xl border p-6 shadow-sm ${theme.card}`}>
              <h2 className="text-lg font-semibold">Estado general</h2>
              <div className="mt-4 space-y-3">
                {hasSectionAccess(role, "services") && (
                  <div
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${theme.subtle}`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Servicios activos</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {activeServicesCount || 0}
                    </span>
                  </div>
                )}

                {hasSectionAccess(role, "staff") && (
                  <div
                    className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${theme.subtle}`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Staff activo</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {activeStaffCount || 0}
                    </span>
                  </div>
                )}

                <div
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${theme.subtle}`}
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Citas pendientes</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {pendingAppointmentsCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}