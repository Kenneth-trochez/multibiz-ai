import { createAdminClient } from "@/lib/supabase/admin";

export async function clearAppointmentNotifications(appointmentId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("appointment_notification_jobs")
    .delete()
    .eq("appointment_id", appointmentId);

  if (error) {
    throw new Error(error.message);
  }
}