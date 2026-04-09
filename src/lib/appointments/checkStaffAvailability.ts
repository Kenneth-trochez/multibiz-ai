import { createAdminClient } from "@/lib/supabase/admin";

export const APPOINTMENT_BUFFER_MINUTES = 5;

function getEndDate(start: Date, durationMinutes: number) {
  return new Date(
    start.getTime() + (durationMinutes + APPOINTMENT_BUFFER_MINUTES) * 60 * 1000
  );
}

function rangesOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
) {
  return startA < endB && endA > startB;
}

export async function checkStaffAvailability(params: {
  businessId: string;
  staffId: string;
  serviceId: string;
  appointmentAt: string;
  excludeAppointmentId?: string;
}) {
  const {
    businessId,
    staffId,
    serviceId,
    appointmentAt,
    excludeAppointmentId,
  } = params;

  if (!staffId) {
    return {
      available: true,
      conflict: null,
    };
  }

  const supabase = createAdminClient();

  const { data: selectedService, error: selectedServiceError } = await supabase
    .from("services")
    .select("id, duration_minutes")
    .eq("id", serviceId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (selectedServiceError || !selectedService) {
    throw new Error("No se pudo validar el servicio");
  }

  const newStart = new Date(appointmentAt);
  const newDuration = Number(selectedService.duration_minutes || 0);
  const newEnd = getEndDate(newStart, newDuration);

  const { data: existingAppointments, error: existingAppointmentsError } =
    await supabase
      .from("appointments")
      .select("id, appointment_at, service_id, status")
      .eq("business_id", businessId)
      .eq("staff_id", staffId)
      .neq("status", "cancelled");

  if (existingAppointmentsError) {
    throw new Error("No se pudo validar la agenda del staff");
  }

  const appointmentsToCheck = (existingAppointments || []).filter((apt) => {
    if (!excludeAppointmentId) return true;
    return apt.id !== excludeAppointmentId;
  });

  if (appointmentsToCheck.length === 0) {
    return {
      available: true,
      conflict: null,
    };
  }

  const serviceIds = Array.from(
    new Set(appointmentsToCheck.map((apt) => apt.service_id).filter(Boolean))
  );

  const { data: servicesData, error: servicesError } = await supabase
    .from("services")
    .select("id, duration_minutes")
    .in("id", serviceIds);

  if (servicesError) {
    throw new Error("No se pudo validar la duración de citas existentes");
  }

  const durationMap = new Map<string, number>();
  for (const service of servicesData || []) {
    durationMap.set(service.id, Number(service.duration_minutes || 0));
  }

  for (const apt of appointmentsToCheck) {
    const existingStart = new Date(apt.appointment_at);
    const existingDuration = durationMap.get(apt.service_id) || 0;
    const existingEnd = getEndDate(existingStart, existingDuration);

    if (rangesOverlap(newStart, newEnd, existingStart, existingEnd)) {
      return {
        available: false,
        conflict: {
          appointmentId: apt.id,
          appointmentAt: apt.appointment_at,
        },
      };
    }
  }

  return {
    available: true,
    conflict: null,
  };
}