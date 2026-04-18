import { createAdminClient } from "@/lib/supabase/admin";

const NOTIFICATION_TYPES = [
  { type: "appointment_reminder_2h", minutesBefore: 120 },
  { type: "appointment_reminder_1h", minutesBefore: 60 },
  { type: "appointment_reminder_30m", minutesBefore: 30 },
] as const;

function parseAppointmentDate(value: string) {
  const trimmed = value.trim();

  // Si ya trae zona horaria o Z, se respeta.
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }

  // Si viene desde datetime-local sin offset, asumimos Honduras (-06:00)
  return new Date(`${trimmed}:00-06:00`);
}

export async function scheduleAppointmentNotifications(params: {
  businessId: string;
  appointmentId: string;
  appointmentAt: string;
}) {
  const { businessId, appointmentId, appointmentAt } = params;
  const supabase = createAdminClient();

  const appointmentDate = parseAppointmentDate(appointmentAt);

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
    count: jobs.length,
    jobs,
  });
}