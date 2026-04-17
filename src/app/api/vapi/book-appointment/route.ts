import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enforceAiUsagePolicy } from "@/lib/billing/enforceAiUsagePolicy";
import { sendPushToBusinessMembers } from "@/lib/notifications/sendPushToBusinessMembers";
import { checkStaffAvailability } from "@/lib/appointments/checkStaffAvailability";
import {
  ensureAiBookingEnabled,
  extractVapiContext,
  resolveBusinessFromCall,
} from "@/lib/vapi/resolveBusinessFromCall";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireVapiKey(request: Request) {
  const key = request.headers.get("x-vapi-key") || "";
  const expected = process.env.VAPI_INTERNAL_KEY || "";

  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "Server misconfigured: missing VAPI_INTERNAL_KEY" },
      { status: 500 }
    );
  }

  if (key !== expected) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

function normalizeHondurasPhone(raw: string): string {
  const value = raw.trim();
  if (!value) throw new Error("El teléfono es obligatorio");

  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("504")) digits = digits.slice(3);

  if (digits.length !== 8) {
    throw new Error("El teléfono debe tener 8 dígitos de Honduras");
  }

  return `+504 ${digits.slice(0, 4)}-${digits.slice(4)}`;
}

function normalizeEmail(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;

  if (!EMAIL_REGEX.test(value)) {
    throw new Error("El correo ingresado no es válido");
  }

  return value;
}

function validateAppointmentAt(appointmentAt: string) {
  const value = appointmentAt.trim();
  if (!value) throw new Error("appointmentAt es obligatorio");

  if (!/[-+]\d{2}:\d{2}$/.test(value)) {
    throw new Error("appointmentAt debe incluir offset, ej: 2026-04-09T14:00:00-06:00");
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("appointmentAt inválido");
  }

  return value;
}

async function findExistingCustomer(params: {
  businessId: string;
  phone: string;
  email: string | null;
}) {
  const { businessId, phone, email } = params;
  const supabase = createAdminClient();

  const { data: byPhone } = await supabase
    .from("customers")
    .select("id, name, phone, email")
    .eq("business_id", businessId)
    .eq("phone", phone)
    .limit(1)
    .maybeSingle();

  if (byPhone) return byPhone;

  if (email) {
    const { data: byEmail } = await supabase
      .from("customers")
      .select("id, name, phone, email")
      .eq("business_id", businessId)
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (byEmail) return byEmail;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const unauthorized = requireVapiKey(request);
    if (unauthorized) return unauthorized;

    const payload = await request.json().catch(() => ({}));
    const { assistantId, phoneNumberId, callId } = extractVapiContext(payload);

    const customerName = String(payload?.customerName || "").trim();
    const rawPhone = String(payload?.phone || "").trim();
    const rawEmail = String(payload?.email || "").trim();
    const serviceId = String(payload?.serviceId || "").trim();
    const staffId = String(payload?.staffId || "").trim();
    const appointmentAtRaw = String(payload?.appointmentAt || "").trim();
    const notes = String(payload?.notes || "").trim();

    if (!customerName || !serviceId || !appointmentAtRaw) {
      throw new Error("customerName, serviceId y appointmentAt son obligatorios");
    }

    const appointmentAt = validateAppointmentAt(appointmentAtRaw);

    const ctx = await resolveBusinessFromCall({
      assistantId,
      phoneNumberId,
      callId,
    });

    const plan = await ensureAiBookingEnabled(ctx.businessId);
    const usagePolicy = await enforceAiUsagePolicy(ctx.businessId);

    if (!usagePolicy.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: usagePolicy.warning,
          usage: usagePolicy,
        },
        { status: 402 }
      );
    }

    const supabase = createAdminClient();

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id, name, duration_minutes, active")
      .eq("business_id", ctx.businessId)
      .eq("id", serviceId)
      .eq("active", true)
      .maybeSingle();

    if (serviceError || !service) {
      throw new Error("No se encontró el servicio solicitado");
    }

    if (staffId) {
      const { data: staffRow, error: staffError } = await supabase
        .from("staff")
        .select("id, display_name, active")
        .eq("business_id", ctx.businessId)
        .eq("id", staffId)
        .eq("active", true)
        .maybeSingle();

      if (staffError || !staffRow) {
        throw new Error("El staff seleccionado no existe o no está activo");
      }

      const availability = await checkStaffAvailability({
        businessId: ctx.businessId,
        staffId,
        serviceId,
        appointmentAt,
      });

      if (!availability.available) {
        throw new Error("El staff ya tiene una cita en ese horario");
      }
    }

    const phone = normalizeHondurasPhone(rawPhone);

    let email: string | null = null;
    try {
      email = normalizeEmail(rawEmail);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Datos del cliente inválidos";
      throw new Error(message);
    }

    let customer = await findExistingCustomer({
      businessId: ctx.businessId,
      phone,
      email,
    });

    if (!customer) {
      const { data: insertedCustomer, error: insertCustomerError } = await supabase
        .from("customers")
        .insert({
          business_id: ctx.businessId,
          name: customerName,
          phone,
          email,
          notes: notes || null,
        })
        .select("id, name, phone, email")
        .single();

      if (insertCustomerError || !insertedCustomer) {
        throw new Error(insertCustomerError?.message || "No se pudo crear el cliente");
      }

      customer = insertedCustomer;
    }

    const finalNotes = [notes, callId ? `Vapi callId: ${callId}` : null]
      .filter(Boolean)
      .join(" | ");

    const { data: insertedAppointment, error: insertAppointmentError } = await supabase
      .from("appointments")
      .insert({
        business_id: ctx.businessId,
        customer_id: customer.id,
        service_id: serviceId,
        staff_id: staffId || null,
        appointment_at: appointmentAt,
        status: "confirmed",
        source: "ai_voice",
        notes: finalNotes || null,
      })
      .select("id, appointment_at, status, source")
      .single();

    if (insertAppointmentError || !insertedAppointment) {
      throw new Error(insertAppointmentError?.message || "No se pudo crear la cita");
    } try {
      await sendPushToBusinessMembers({
        businessId: ctx.businessId,
        title: "Nueva cita por IA",
        body: `${customer.name} · ${service.name} · ${new Date(
          appointmentAt
        ).toLocaleString("es-HN", {
          timeZone: "America/Tegucigalpa",
          dateStyle: "medium",
          timeStyle: "short",
        })}`,
        data: {
          type: "appointment_created_ai",
          appointmentId: insertedAppointment.id,
          source: "ai_voice",
          status: insertedAppointment.status,
          callId: callId || null,
        },
      });
    } catch (pushError) {
      console.error("PUSH VAPI APPOINTMENT ERROR:", pushError);
    }

    return NextResponse.json({
      ok: true,
      message: "Cita creada correctamente",
      business: {
        id: ctx.business.id,
        name: ctx.business.name,
        slug: ctx.business.slug,
      },
      usage: usagePolicy,
      plan: {
        code: plan.code,
        ai_monthly_minutes: plan.limits?.ai_monthly_minutes ?? 0,
        ai_max_call_minutes: plan.limits?.ai_max_call_minutes ?? 0,
      },
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
      },
      appointment: {
        id: insertedAppointment.id,
        appointment_at: insertedAppointment.appointment_at,
        status: insertedAppointment.status,
        source: insertedAppointment.source,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo crear la cita";

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}