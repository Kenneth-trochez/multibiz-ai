import { createAdminClient } from "@/lib/supabase/admin";
import { clearAppointmentNotifications } from "@/lib/notifications/clearAppointmentNotifications";
import { sendPushToBusinessMembers } from "@/lib/notifications/sendPushToBusinessMembers";

export async function deleteAppointmentService(params: {
  businessId: string;
  appointmentId: string;
}) {
  const { businessId, appointmentId } = params;

  if (!businessId || !appointmentId) {
    throw new Error("Faltan datos obligatorios");
  }

  const supabase = createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("appointments")
    .select(`
      id,
      appointment_at,
      status,
      customer_id,
      service_id,
      staff_id,
      customers:customer_id (
        id,
        name
      ),
      services:service_id (
        id,
        name
      )
    `)
    .eq("id", appointmentId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (!existing) {
    throw new Error("Cita no encontrada");
  }

  try {
    await clearAppointmentNotifications(appointmentId);
  } catch (clearError) {
    console.error("CLEAR APPOINTMENT NOTIFICATIONS ERROR:", clearError);
  }

  const { error: deleteError } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId)
    .eq("business_id", businessId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  try {
    const customer = Array.isArray(existing.customers)
      ? existing.customers[0]
      : existing.customers;

    const service = Array.isArray(existing.services)
      ? existing.services[0]
      : existing.services;

    await sendPushToBusinessMembers({
      businessId,
      title: "Cita eliminada",
      body: `${customer?.name || "Cliente"} · ${service?.name || "Servicio"}`,
      data: {
        type: "appointment_deleted",
        appointmentId,
      },
    });
  } catch (pushError) {
    console.error("PUSH DELETE APPOINTMENT ERROR:", pushError);
  }

  return {
    ok: true,
    appointmentId,
  };
}