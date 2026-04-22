import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToBusinessMembers } from "@/lib/notifications/sendPushToBusinessMembers";

function formatAppointmentDate(value: string, timezone: string) {
  return new Date(value).toLocaleString("es-HN", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getReminderLabel(type: string) {
  switch (type) {
    case "appointment_reminder_2h":
      return "en 2 horas";
    case "appointment_reminder_1h":
      return "en 1 hora";
    case "appointment_reminder_30m":
      return "en 30 minutos";
    default:
      return "pronto";
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const expected = `Bearer ${process.env.CRON_SECRET || ""}`;

    if (!process.env.CRON_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Missing CRON_SECRET" },
        { status: 500 }
      );
    }

    if (authHeader !== expected) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const { data: jobs, error: jobsError } = await supabase
      .from("appointment_notification_jobs")
      .select(`
        id,
        business_id,
        appointment_id,
        notification_type,
        scheduled_for,
        appointments (
          id,
          appointment_at,
          status,
          customers (
            id,
            name
          ),
          services (
            id,
            name
          )
        ),
        businesses:business_id (
          id,
          business_settings (
            timezone
          )
        )
      `)
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true })
      .limit(50);

    if (jobsError) {
      throw new Error(jobsError.message);
    }

    let sent = 0;
    let failed = 0;

    for (const job of jobs || []) {
      try {
        const appointment = Array.isArray(job.appointments)
          ? job.appointments[0]
          : job.appointments;

        const business = Array.isArray(job.businesses)
          ? job.businesses[0]
          : job.businesses;

        const settings = Array.isArray(business?.business_settings)
          ? business?.business_settings[0]
          : business?.business_settings;

        const timezone = settings?.timezone || "America/Tegucigalpa";

        if (!appointment || appointment.status === "cancelled") {
          await supabase
            .from("appointment_notification_jobs")
            .update({
              status: "cancelled",
              error_message: "Appointment cancelled or missing",
            })
            .eq("id", job.id);

          continue;
        }

        const customer = Array.isArray(appointment.customers)
          ? appointment.customers[0]
          : appointment.customers;

        const service = Array.isArray(appointment.services)
          ? appointment.services[0]
          : appointment.services;

        await sendPushToBusinessMembers({
          businessId: job.business_id,
          title: "Recordatorio de cita",
          body: `${customer?.name || "Cliente"} · ${service?.name || "Servicio"} · ${getReminderLabel(
            job.notification_type
          )} (${formatAppointmentDate(appointment.appointment_at, timezone)})`,
          data: {
            type: job.notification_type,
            appointmentId: appointment.id,
          },
        });

        await supabase
          .from("appointment_notification_jobs")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            error_message: null,
          })
          .eq("id", job.id);

        sent++;
      } catch (jobError) {
        await supabase
          .from("appointment_notification_jobs")
          .update({
            status: "failed",
            error_message:
              jobError instanceof Error ? jobError.message : "Unknown error",
          })
          .eq("id", job.id);

        failed++;
      }
    }

    return NextResponse.json({
      ok: true,
      sent,
      failed,
      total: (jobs || []).length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}