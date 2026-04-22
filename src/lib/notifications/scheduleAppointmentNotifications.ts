import { createAdminClient } from "@/lib/supabase/admin";

const NOTIFICATION_TYPES = [
  { type: "appointment_reminder_2h", minutesBefore: 120 },
  { type: "appointment_reminder_1h", minutesBefore: 60 },
  { type: "appointment_reminder_30m", minutesBefore: 30 },
] as const;

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

function parseAppointmentDate(value: string, timezone: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("appointmentAt vacío");
  }

  // Si ya trae zona horaria o Z, se respeta.
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }

  // Si viene como datetime-local sin offset, lo interpretamos
  // en la timezone real del negocio.
  const [datePart, timePart] = trimmed.split("T");

  if (!datePart || !timePart) {
    throw new Error(`appointmentAt inválido: ${value}`);
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
  );
}

async function getBusinessTimezone(
  supabase: ReturnType<typeof createAdminClient>,
  businessId: string
) {
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

export async function scheduleAppointmentNotifications(params: {
  businessId: string;
  appointmentId: string;
  appointmentAt: string;
}) {
  const { businessId, appointmentId, appointmentAt } = params;
  const supabase = createAdminClient();

  const timezone = await getBusinessTimezone(supabase, businessId);
  const appointmentDate = parseAppointmentDate(appointmentAt, timezone);

  if (Number.isNaN(appointmentDate.getTime())) {
    throw new Error(`appointmentAt inválido para programar notificaciones: ${appointmentAt}`);
  }

  const jobs = NOTIFICATION_TYPES.map((item) => {
    const scheduled = new Date(
      appointmentDate.getTime() - item.minutesBefore * 60 * 1000
    );

    return {
      business_id: businessId,
      appointment_id: appointmentId,
      notification_type: item.type,
      scheduled_for: scheduled.toISOString(),
      status: "pending",
    };
  }).filter((job) => new Date(job.scheduled_for).getTime() > Date.now());

  if (!jobs.length) {
    console.log("NO APPOINTMENT NOTIFICATION JOBS CREATED", {
      appointmentId,
      appointmentAt,
      timezone,
      parsedAppointmentAt: appointmentDate.toISOString(),
      now: new Date().toISOString(),
    });
    return;
  }

  const { error: deleteError } = await supabase
    .from("appointment_notification_jobs")
    .delete()
    .eq("appointment_id", appointmentId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error: insertError } = await supabase
    .from("appointment_notification_jobs")
    .insert(jobs);

  if (insertError) {
    throw new Error(insertError.message);
  }

  console.log("APPOINTMENT NOTIFICATION JOBS CREATED", {
    appointmentId,
    timezone,
    count: jobs.length,
    jobs,
  });
}