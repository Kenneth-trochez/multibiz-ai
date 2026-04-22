import { createAdminClient } from "@/lib/supabase/admin";
import { checkStaffAvailability } from "@/lib/appointments/checkStaffAvailability";
import { scheduleAppointmentNotifications } from "@/lib/notifications/scheduleAppointmentNotifications";
import { clearAppointmentNotifications } from "@/lib/notifications/clearAppointmentNotifications";
import { sendPushToBusinessMembers } from "@/lib/notifications/sendPushToBusinessMembers";

const VALID_SOURCE = ["manual", "ai_voice"] as const;
const VALID_STATUS = ["pending", "confirmed", "completed", "cancelled"] as const;

type TimezoneDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getPartsInTimezone(date: Date, timezone: string): TimezoneDateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value || 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function zonedDateTimeToUtc(
  input: {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
    second?: number;
  },
  timezone: string
) {
  const desired = {
    year: input.year,
    month: input.month,
    day: input.day,
    hour: input.hour ?? 0,
    minute: input.minute ?? 0,
    second: input.second ?? 0,
  };

  let utcGuess = new Date(
    Date.UTC(
      desired.year,
      desired.month - 1,
      desired.day,
      desired.hour,
      desired.minute,
      desired.second
    )
  );

  for (let i = 0; i < 2; i++) {
    const zoned = getPartsInTimezone(utcGuess, timezone);

    const zonedAsUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      zoned.second
    );

    const desiredAsUtc = Date.UTC(
      desired.year,
      desired.month - 1,
      desired.day,
      desired.hour,
      desired.minute,
      desired.second
    );

    const diff = desiredAsUtc - zonedAsUtc;
    utcGuess = new Date(utcGuess.getTime() + diff);
  }

  return utcGuess;
}

function normalizeAppointmentAtFromLocal(value: string, timezone: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed).toISOString();
  }

  const [datePart, timePart] = trimmed.split("T");
  if (!datePart || !timePart) {
    throw new Error("appointment_at inválido");
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, secondRaw] = timePart.split(":").map(Number);

  return zonedDateTimeToUtc(
    {
      year,
      month,
      day,
      hour: hour || 0,
      minute: minute || 0,
      second: secondRaw || 0,
    },
    timezone
  ).toISOString();
}

function formatAppointmentPushDate(value: string, timezone: string) {
  return new Date(value).toLocaleString("es-HN", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function getBusinessTimezone(businessId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("business_settings")
    .select("timezone")
    .eq("business_id", businessId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.timezone || "America/Tegucigalpa";
}

async function getAppointmentNotificationContext(params: {
  businessId: string;
  customerId: string;
  serviceId: string;
  staffId?: string | null;
}) {
  const { businessId, customerId, serviceId, staffId } = params;
  const supabase = createAdminClient();

  const [{ data: customer }, { data: service }, { data: staffMember }] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, name")
        .eq("business_id", businessId)
        .eq("id", customerId)
        .maybeSingle(),

      supabase
        .from("services")
        .select("id, name")
        .eq("business_id", businessId)
        .eq("id", serviceId)
        .maybeSingle(),

      staffId
        ? supabase
            .from("staff")
            .select("id, display_name")
            .eq("business_id", businessId)
            .eq("id", staffId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  return {
    customerName: customer?.name || "Cliente",
    serviceName: service?.name || "Servicio",
    staffName: staffMember?.display_name || "Sin staff",
  };
}

export async function updateAppointmentService(params: {
  businessId: string;
  appointmentId: string;
  customerId: string;
  serviceId: string;
  staffId?: string | null;
  appointmentAt: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string | null;
  source?: string;
}) {
  const {
    businessId,
    appointmentId,
    customerId,
    serviceId,
    staffId,
    appointmentAt: rawAppointmentAt,
    status,
    notes,
    source = "manual",
  } = params;

  if (!businessId || !appointmentId || !customerId || !serviceId || !rawAppointmentAt) {
    throw new Error("Faltan datos obligatorios");
  }

  if (!VALID_STATUS.includes(status)) {
    throw new Error("Estado inválido");
  }

  if (!VALID_SOURCE.includes(source as (typeof VALID_SOURCE)[number])) {
    throw new Error("Origen de cita inválido");
  }

  const timezone = await getBusinessTimezone(businessId);
  const appointmentAt = normalizeAppointmentAtFromLocal(rawAppointmentAt, timezone);
  const supabase = createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("appointments")
    .select("id, business_id, appointment_at, status, customer_id, service_id, staff_id, source")
    .eq("id", appointmentId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (!existing) {
    throw new Error("Cita no encontrada");
  }

  if (staffId) {
    const availability = await checkStaffAvailability({
      businessId,
      staffId,
      serviceId,
      appointmentAt,
      excludeAppointmentId: appointmentId,
    });

    if (!availability.available) {
      throw new Error("El staff ya tiene una cita en ese horario");
    }
  }

  const { data: updatedAppointment, error: updateError } = await supabase
    .from("appointments")
    .update({
      customer_id: customerId,
      service_id: serviceId,
      staff_id: staffId || null,
      appointment_at: appointmentAt,
      status,
      notes: notes?.trim() ? notes.trim() : null,
    })
    .eq("id", appointmentId)
    .eq("business_id", businessId)
    .select("id, appointment_at, status, source")
    .single();

  if (updateError || !updatedAppointment) {
    throw new Error(updateError?.message || "No se pudo actualizar la cita");
  }

  try {
    const context = await getAppointmentNotificationContext({
      businessId,
      customerId,
      serviceId,
      staffId,
    });

    await sendPushToBusinessMembers({
      businessId,
      title: "Cita actualizada",
      body: `${context.customerName} · ${context.serviceName} · ${formatAppointmentPushDate(
        appointmentAt,
        timezone
      )} · Estado: ${status}`,
      data: {
        type: "appointment_updated",
        appointmentId: updatedAppointment.id,
        source,
        status,
      },
    });
  } catch (pushError) {
    console.error("PUSH UPDATE APPOINTMENT ERROR:", pushError);
  }

  try {
    await clearAppointmentNotifications(updatedAppointment.id);

    if (status !== "cancelled" && status !== "completed") {
      await scheduleAppointmentNotifications({
        businessId,
        appointmentId: updatedAppointment.id,
        appointmentAt,
      });
    }
  } catch (notificationJobError) {
    console.error(
      "UPDATE APPOINTMENT NOTIFICATIONS ERROR:",
      notificationJobError
    );
  }

  return {
    appointment: updatedAppointment,
    timezone,
  };
}