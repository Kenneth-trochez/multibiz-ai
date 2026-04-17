import { createAdminClient } from "@/lib/supabase/admin";

const NOTIFICATION_TYPES = [
  { type: "appointment_reminder_2h", minutesBefore: 120 },
  { type: "appointment_reminder_1h", minutesBefore: 60 },
  { type: "appointment_reminder_30m", minutesBefore: 30 },
] as const;

export async function scheduleAppointmentNotifications(params: {
  businessId: string;
  appointmentId: string;
  appointmentAt: string;
}) {
  const { businessId, appointmentId, appointmentAt } = params;
  const supabase = createAdminClient();

  const appointmentDate = new Date(appointmentAt);

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
    return;
  }

  await supabase
    .from("appointment_notification_jobs")
    .delete()
    .eq("appointment_id", appointmentId);

  const { error } = await supabase
    .from("appointment_notification_jobs")
    .insert(jobs);

  if (error) {
    throw new Error(error.message);
  }
}