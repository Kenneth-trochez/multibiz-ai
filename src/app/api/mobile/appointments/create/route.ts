import { NextResponse } from "next/server";
import { getMobileRequestContext } from "@/lib/mobile/getMobileRequestContext";
import { createAppointmentCore } from "@/lib/appointments/createAppointmentService";

export async function POST(request: Request) {
  try {
    const ctx = await getMobileRequestContext(request);
    const body = await request.json();

    const businessId = String(body.businessId || "").trim();
    const customerId = String(body.customer_id || "").trim();
    const serviceId = String(body.service_id || "").trim();
    const staffId = String(body.staff_id || "").trim();
    const appointmentAt = String(body.appointment_at || "").trim();
    const notes = String(body.notes || "").trim();
    const source = String(body.source || "manual").trim();

    if (!businessId || businessId !== ctx.business.id) {
      return NextResponse.json(
        { ok: false, error: "Business inválido" },
        { status: 403 }
      );
    }

    const result = await createAppointmentCore({
      businessId,
      customerId,
      serviceId,
      staffId: staffId || null,
      appointmentAt,
      notes: notes || null,
      source,
    });

    return NextResponse.json({
      ok: true,
      appointment: result.appointment,
      timezone: result.timezone,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo crear la cita";

    const status =
      message === "Unauthorized"
        ? 401
        : message === "Forbidden"
          ? 403
          : 400;

    return NextResponse.json(
      { ok: false, error: message },
      { status }
    );
  }
}