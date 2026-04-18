import { requireSectionAccess } from "@/lib/auth/requireSectionAccess";
import { createClient } from "@/lib/supabase/server";
import { getThemeClasses } from "@/lib/theme/getThemeClasses";
import AppointmentsClient from "./AppointmentsClient";

type AppointmentRow = {
  id: string;
  appointment_at: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  source: "manual" | "ai_voice";
  notes: string | null;
  created_at: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  service: {
    id: string;
    name: string;
    price: number | null;
    duration_minutes: number | null;
  } | null;
  staff: {
    id: string;
    display_name: string;
    specialty: string | null;
  } | null;
};

type CustomerOption = {
  id: string;
  name: string;
  phone: string | null;
};

type ServiceOption = {
  id: string;
  name: string;
  price: number | null;
  duration_minutes: number | null;
};

type StaffOption = {
  id: string;
  display_name: string;
  specialty: string | null;
};

function getTodayInTimezone(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireSectionAccess("appointments");

  const { business } = ctx;
  const theme = getThemeClasses(business.theme || "warm");
  const supabase = await createClient();

  const [
    { data: appointments, error: appointmentsError },
    { data: customers },
    { data: services },
    { data: staff },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(`
        id,
        appointment_at,
        status,
        source,
        notes,
        created_at,
        customer:customers!appointments_customer_id_fkey(id,name,phone),
        service:services!appointments_service_id_fkey(id,name,price,duration_minutes),
        staff:staff!appointments_staff_id_fkey(id,display_name,specialty)
      `)
      .eq("business_id", business.id)
      .order("appointment_at", { ascending: true }),

    supabase
      .from("customers")
      .select("id, name, phone")
      .eq("business_id", business.id)
      .order("name", { ascending: true }),

    supabase
      .from("services")
      .select("id, name, price, duration_minutes")
      .eq("business_id", business.id)
      .eq("active", true)
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

  if (appointmentsError) {
    return (
      <main className={`min-h-screen p-6 ${theme.pageBg}`}>
        <div className={`rounded-2xl border p-6 ${theme.card}`}>
          Error cargando citas: {appointmentsError.message}
        </div>
      </main>
    );
  }

  const timezone = settings?.timezone || "America/Tegucigalpa";

  const normalizedAppointments: AppointmentRow[] = (appointments || []).map(
    (apt: any) => ({
      id: apt.id,
      appointment_at: apt.appointment_at,
      status: apt.status,
      source: apt.source ?? "manual",
      notes: apt.notes,
      created_at: apt.created_at,
      customer: Array.isArray(apt.customer)
        ? apt.customer[0] || null
        : apt.customer || null,
      service: Array.isArray(apt.service)
        ? apt.service[0] || null
        : apt.service || null,
      staff: Array.isArray(apt.staff) ? apt.staff[0] || null : apt.staff || null,
    })
  );

  return (
    <main className={theme.pageBg}>
      <div className="mx-auto max-w-7xl px-6 pt-6">
        {params.error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error}
          </p>
        )}

        {params.success === "created" && (
          <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Cita creada correctamente.
          </p>
        )}

        {params.success === "updated" && (
          <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Estado de la cita actualizado correctamente.
          </p>
        )}

        {params.success === "deleted" && (
          <p className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Cita eliminada correctamente.
          </p>
        )}
      </div>

      <AppointmentsClient
        businessId={business.id}
        initialAppointments={normalizedAppointments}
        customers={(customers || []) as CustomerOption[]}
        services={(services || []) as ServiceOption[]}
        staff={(staff || []) as StaffOption[]}
        theme={theme}
        today={getTodayInTimezone(timezone)}
        timezone={timezone}
      />
    </main>
  );
}