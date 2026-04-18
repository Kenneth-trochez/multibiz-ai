"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { scheduleAppointmentNotifications } from "@/lib/notifications/scheduleAppointmentNotifications";
import { clearAppointmentNotifications } from "@/lib/notifications/clearAppointmentNotifications";
import { sendPushToBusinessMembers } from "@/lib/notifications/sendPushToBusinessMembers";

const VALID_STATUS = ["pending", "confirmed", "completed", "cancelled"] as const;
const VALID_SOURCE = ["manual", "ai_voice"] as const;
const APPOINTMENT_BUFFER_MINUTES = 5;

async function getAppointmentNotificationContext(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  businessId: string;
  customerId: string;
  serviceId: string;
  staffId?: string;
}) {
  const { supabase, businessId, customerId, serviceId, staffId } = params;

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

function formatAppointmentPushDate(value: string) {
  return new Date(value).toLocaleString("es-HN", {
    timeZone: "America/Tegucigalpa",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function normalizeAppointmentAtFromLocal(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return trimmed;

  // Si ya viene con zona horaria o Z, se respeta
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Valor típico de datetime-local: YYYY-MM-DDTHH:mm
  // Lo normalizamos como hora de Honduras (-06:00)
  return `${trimmed}:00-06:00`;
}

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

async function validateStaffAvailability(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  businessId: string;
  staffId: string;
  serviceId: string;
  appointmentAt: string;
  excludeAppointmentId?: string;
}) {
  const {
    supabase,
    businessId,
    staffId,
    serviceId,
    appointmentAt,
    excludeAppointmentId,
  } = params;

  if (!staffId) {
    return;
  }

  const { data: selectedService, error: selectedServiceError } = await supabase
    .from("services")
    .select("id, duration_minutes")
    .eq("id", serviceId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (selectedServiceError || !selectedService) {
    redirect("/dashboard/appointments?error=No+se+pudo+validar+el+servicio");
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
    redirect("/dashboard/appointments?error=No+se+pudo+validar+la+agenda");
  }

  const appointmentsToCheck = (existingAppointments || []).filter((apt) => {
    if (!excludeAppointmentId) return true;
    return apt.id !== excludeAppointmentId;
  });

  if (appointmentsToCheck.length === 0) {
    return;
  }

  const serviceIds = Array.from(
    new Set(appointmentsToCheck.map((apt) => apt.service_id).filter(Boolean))
  );

  const { data: servicesData, error: servicesError } = await supabase
    .from("services")
    .select("id, duration_minutes")
    .in("id", serviceIds);

  if (servicesError) {
    redirect("/dashboard/appointments?error=No+se+pudo+validar+la+duracion+de+las+citas");
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
      redirect(
        "/dashboard/appointments?error=El+staff+ya+tiene+una+cita+en+ese+horario"
      );
    }
  }
}

export async function createAppointmentAction(formData: FormData): Promise<void> {
  const businessId = String(formData.get("businessId") || "").trim();
  const customerId = String(formData.get("customer_id") || "").trim();
  const serviceId = String(formData.get("service_id") || "").trim();
  const staffId = String(formData.get("staff_id") || "").trim();
  const rawAppointmentAt = String(formData.get("appointment_at") || "").trim();
  const appointmentAt = normalizeAppointmentAtFromLocal(rawAppointmentAt);
  const notes = String(formData.get("notes") || "").trim();
  const source = String(formData.get("source") || "manual").trim();

  if (!businessId || !customerId || !serviceId || !appointmentAt) {
    redirect("/dashboard/appointments?error=Faltan+datos+obligatorios");
  }

  if (!VALID_SOURCE.includes(source as (typeof VALID_SOURCE)[number])) {
    redirect("/dashboard/appointments?error=Origen+de+cita+invalido");
  }

  const supabase = await createClient();

  if (staffId) {
    await validateStaffAvailability({
      supabase,
      businessId,
      staffId,
      serviceId,
      appointmentAt,
    });
  }

  const { data: insertedAppointment, error } = await supabase
    .from("appointments")
    .insert({
      business_id: businessId,
      customer_id: customerId,
      service_id: serviceId,
      staff_id: staffId || null,
      appointment_at: appointmentAt,
      status: "confirmed",
      source,
      notes: notes || null,
    })
    .select("id, appointment_at, status, source")
    .single();

  if (error) {
    redirect(
      `/dashboard/appointments?error=${encodeURIComponent(error.message)}`
    );
  }

  try {
    const context = await getAppointmentNotificationContext({
      supabase,
      businessId,
      customerId,
      serviceId,
      staffId,
    });

    await sendPushToBusinessMembers({
      businessId,
      title: "Nueva cita agendada",
      body: `${context.customerName} · ${context.serviceName} · ${formatAppointmentPushDate(
        appointmentAt
      )}`,
      data: {
        type: "appointment_created",
        appointmentId: insertedAppointment?.id,
        source,
        status: "confirmed",
      },
    });
  } catch (pushError) {
    console.error("PUSH CREATE APPOINTMENT ERROR:", pushError);
  }

  try {
    if (insertedAppointment?.id) {
      await scheduleAppointmentNotifications({
        businessId,
        appointmentId: insertedAppointment.id,
        appointmentAt,
      });
    }
  } catch (notificationJobError) {
    console.error(
      "SCHEDULE APPOINTMENT NOTIFICATIONS ERROR:",
      notificationJobError
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/balance");

  redirect("/dashboard/appointments?success=created");
}

export async function updateAppointmentAction(formData: FormData): Promise<void> {
  const appointmentId = String(formData.get("appointmentId") || "").trim();
  const businessId = String(formData.get("businessId") || "").trim();
  const customerId = String(formData.get("customer_id") || "").trim();
  const serviceId = String(formData.get("service_id") || "").trim();
  const staffId = String(formData.get("staff_id") || "").trim();
  const rawAppointmentAt = String(formData.get("appointment_at") || "").trim();
  const appointmentAt = normalizeAppointmentAtFromLocal(rawAppointmentAt);
  const status = String(formData.get("status") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const source = String(formData.get("source") || "manual").trim();

  if (!appointmentId || !businessId || !customerId || !serviceId || !appointmentAt) {
    redirect("/dashboard/appointments?error=Faltan+datos+obligatorios");
  }

  if (!VALID_STATUS.includes(status as (typeof VALID_STATUS)[number])) {
    redirect("/dashboard/appointments?error=Estado+invalido");
  }

  if (!VALID_SOURCE.includes(source as (typeof VALID_SOURCE)[number])) {
    redirect("/dashboard/appointments?error=Origen+de+cita+invalido");
  }

  const supabase = await createClient();

  if (staffId) {
    await validateStaffAvailability({
      supabase,
      businessId,
      staffId,
      serviceId,
      appointmentAt,
      excludeAppointmentId: appointmentId,
    });
  }

  const { data: updatedAppointment, error } = await supabase
    .from("appointments")
    .update({
      customer_id: customerId,
      service_id: serviceId,
      staff_id: staffId || null,
      appointment_at: appointmentAt,
      status,
      source,
      notes: notes || null,
    })
    .eq("id", appointmentId)
    .select("id, appointment_at, status, source")
    .single();

  if (error) {
    redirect(
      `/dashboard/appointments?error=${encodeURIComponent(error.message)}`
    );
  }

  try {
    const context = await getAppointmentNotificationContext({
      supabase,
      businessId,
      customerId,
      serviceId,
      staffId,
    });

    await sendPushToBusinessMembers({
      businessId,
      title: "Cita actualizada",
      body: `${context.customerName} · ${context.serviceName} · ${formatAppointmentPushDate(
        appointmentAt
      )}`,
      data: {
        type: "appointment_updated",
        appointmentId: updatedAppointment?.id,
        source,
        status,
      },
    });
  } catch (pushError) {
    console.error("PUSH UPDATE APPOINTMENT ERROR:", pushError);
  }

  try {
    if (updatedAppointment?.id && status !== "cancelled") {
      await scheduleAppointmentNotifications({
        businessId,
        appointmentId: updatedAppointment.id,
        appointmentAt,
      });
    } else if (updatedAppointment?.id && status === "cancelled") {
      await clearAppointmentNotifications(updatedAppointment.id);
    }
  } catch (notificationJobError) {
    console.error(
      "RESCHEDULE APPOINTMENT NOTIFICATIONS ERROR:",
      notificationJobError
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/balance");

  redirect("/dashboard/appointments?success=updated");
}

export async function updateAppointmentStatusAction(
  formData: FormData
): Promise<void> {
  const appointmentId = String(formData.get("appointmentId") || "").trim();
  const status = String(formData.get("status") || "").trim();

  if (
    !appointmentId ||
    !VALID_STATUS.includes(status as (typeof VALID_STATUS)[number])
  ) {
    redirect("/dashboard/appointments?error=Estado+invalido");
  }

  const supabase = await createClient();

  const { data: existingAppointment, error: existingAppointmentError } =
    await supabase
      .from("appointments")
      .select(`
        id,
        business_id,
        appointment_at,
        customer_id,
        service_id,
        staff_id
      `)
      .eq("id", appointmentId)
      .maybeSingle();

  if (existingAppointmentError || !existingAppointment) {
    redirect("/dashboard/appointments?error=No+se+pudo+encontrar+la+cita");
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId);

  if (error) {
    redirect(
      `/dashboard/appointments?error=${encodeURIComponent(error.message)}`
    );
  }

  try {
    const context = await getAppointmentNotificationContext({
      supabase,
      businessId: existingAppointment.business_id,
      customerId: existingAppointment.customer_id,
      serviceId: existingAppointment.service_id,
      staffId: existingAppointment.staff_id || undefined,
    });

    await sendPushToBusinessMembers({
      businessId: existingAppointment.business_id,
      title: "Estado de cita actualizado",
      body: `${context.customerName} · ${context.serviceName} · Estado: ${status}`,
      data: {
        type: "appointment_status_updated",
        appointmentId,
        status,
      },
    });
  } catch (pushError) {
    console.error("PUSH UPDATE STATUS ERROR:", pushError);
  }

  try {
    if (status === "cancelled") {
      await clearAppointmentNotifications(appointmentId);
    }
  } catch (notificationJobError) {
    console.error(
      "CLEAR APPOINTMENT NOTIFICATIONS ERROR:",
      notificationJobError
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/balance");

  redirect("/dashboard/appointments?success=updated");
}

export async function deleteAppointmentAction(formData: FormData): Promise<void> {
  const appointmentId = String(formData.get("appointmentId") || "").trim();

  if (!appointmentId) {
    redirect("/dashboard/appointments?error=Cita+invalida");
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", appointmentId);

  if (error) {
    redirect(
      `/dashboard/appointments?error=${encodeURIComponent(error.message)}`
    );
  }

  try {
    await clearAppointmentNotifications(appointmentId);
  } catch (notificationJobError) {
    console.error(
      "DELETE APPOINTMENT NOTIFICATIONS ERROR:",
      notificationJobError
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/balance");

  redirect("/dashboard/appointments?success=deleted");
}